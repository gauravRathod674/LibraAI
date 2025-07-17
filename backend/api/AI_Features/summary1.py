import os
import re
import argparse
import logging
from typing import Union, List, Optional

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    PegasusForConditionalGeneration,
    PegasusTokenizer,
)
from accelerate import Accelerator
import fitz  # PyMuPDF

# ───────────────────────────────────────────────────────────────────────────────
# Logger Configuration
# ───────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────────────────────────────────────
# Constants and Defaults
# ───────────────────────────────────────────────────────────────────────────────
DEFAULT_MODEL_ID = "pszemraj/led-large-book-summary"
DEFAULT_ALT_MODEL_ID = "google/pegasus-large"
DEFAULT_MAX_INPUT_TOKENS = 16384  # LED supports ~16k tokens
DEFAULT_CHUNK_OVERLAP = 512  # tokens overlap between chunks
DEFAULT_SUMMARY_MAX_LENGTH = 1024
DEFAULT_SUMMARY_MIN_LENGTH = 128
DEFAULT_NO_REPEAT_NGRAM = 4
DEFAULT_REPETITION_PENALTY = 1.5


# ───────────────────────────────────────────────────────────────────────────────
# Utility Functions
# ───────────────────────────────────────────────────────────────────────────────
def remove_author_asides(text: str) -> str:
    """
    Remove lines or sentences that look like digressions (e.g., “Brain Snack:…”, FAQ‐style questions).
    Customize patterns as needed.
    """
    lines = text.splitlines()
    filtered = []
    for ln in lines:
        stripped = ln.strip()
        # Drop lines beginning with “Brain Snack:” or “What is ” or other common asides
        if stripped.startswith("Brain Snack:") or stripped.startswith("What is "):
            continue
        filtered.append(ln)
    return "\n".join(filtered)


def collapse_repeated_headings(text: str) -> str:
    """
    Remove repeated “Chapter X:” lines if they appear verbatim multiple times.
    """
    seen = set()
    out_lines = []
    for ln in text.splitlines():
        if ln.startswith("Chapter") and ln in seen:
            continue
        seen.add(ln)
        out_lines.append(ln)
    return "\n".join(out_lines)


def clean_text(text: str) -> str:
    """
    Perform basic cleaning on input text: remove extra whitespace, ensure proper spacing.
    """
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned


def remove_unlikely_facts(summary: str, banned_terms: List[str]) -> str:
    """
    Remove sentences from summary that contain any banned term.
    """
    sentences = re.split(r"(?<=[.!?])\s+", summary)
    filtered = [
        s
        for s in sentences
        if not any(term.lower() in s.lower() for term in banned_terms)
    ]
    return " ".join(filtered)


# Optional: For advanced entity-based filtering (requires spaCy)
# import spacy
# nlp = spacy.load("en_core_web_sm")
# def filter_summary_by_entities(orig: str, summ: str) -> str:
#     orig_ents = {ent.text for ent in nlp(orig).ents}
#     out_sentences = []
#     for sent in re.split(r"(?<=[.!?])\s+", summ):
#         sent_ents = {ent.text for ent in nlp(sent).ents}
#         if sent_ents.issubset(orig_ents):
#             out_sentences.append(sent)
#     return " ".join(out_sentences)


# ───────────────────────────────────────────────────────────────────────────────
# Chunking for Long Inputs (Sentence-Aware)
# ───────────────────────────────────────────────────────────────────────────────
def chunk_text_by_sentence(
    text: str,
    tokenizer: AutoTokenizer,
    max_tokens: int,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[str]:
    """
    Split text into chunks that fit within max_tokens, using token-based splitting
    with overlap and adjusting to end at the nearest sentence boundary.
    """
    tokens = tokenizer(text, return_tensors="pt", truncation=False)["input_ids"][0]
    total_tokens = tokens.size(0)
    if total_tokens <= max_tokens:
        return [text]

    chunks: List[str] = []
    start = 0
    while start < total_tokens:
        end = min(start + max_tokens, total_tokens)
        # Decode candidate chunk to find sentence boundary
        candidate = tokenizer.decode(tokens[start:end], skip_special_tokens=True)
        # Find the last period or newline near the end
        cut_index = max(candidate.rfind("."), candidate.rfind("\n"))
        if cut_index > int(len(candidate) * 0.8):
            prefix = candidate[: cut_index + 1]
        else:
            prefix = candidate
        chunks.append(prefix)
        real_token_count = len(tokenizer(prefix)["input_ids"])
        if end == total_tokens:
            break
        start = start + real_token_count - chunk_overlap
    return chunks


# ───────────────────────────────────────────────────────────────────────────────
# Summarization Class
# ───────────────────────────────────────────────────────────────────────────────
class LEDSummarizer:
    def __init__(
        self,
        model_id: str = DEFAULT_MODEL_ID,
        alt_model_id: str = DEFAULT_ALT_MODEL_ID,
        max_input_tokens: int = DEFAULT_MAX_INPUT_TOKENS,
        device: Optional[torch.device] = None,
        mixed_precision: str = "fp16",
    ):
        self.model_id = model_id
        self.alt_model_id = alt_model_id
        self.max_input_tokens = max_input_tokens

        # Initialize Accelerator
        self.accelerator = Accelerator(
            split_batches=True, mixed_precision=mixed_precision
        )
        self.device = device or self.accelerator.device
        logger.info(
            f"Using device: {self.device} (mixed_precision={self.accelerator.state.mixed_precision})"
        )

        # Load LED tokenizer & model
        logger.info(f"Loading LED tokenizer and model: {model_id}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        model_dtype = torch.float16 if self.device.type == "cuda" else torch.float32
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            model_id, torch_dtype=model_dtype
        )

        # Compile LED model if CUDA
        if self.device.type == "cuda":
            try:
                self.model = torch.compile(self.model)
                logger.info("LED model successfully compiled with torch.compile")
            except Exception as e:
                logger.warning(
                    f"LED torch.compile failed: {e}. Continuing without compilation."
                )

        # Prepare LED model for accelerator
        self.model = self.accelerator.prepare(self.model)

        # Load alt model (Pegasus) for optional fallback
        logger.info(f"Loading alt (Pegasus) tokenizer and model: {alt_model_id}")
        self.alt_tokenizer = PegasusTokenizer.from_pretrained(alt_model_id)
        self.alt_model = PegasusForConditionalGeneration.from_pretrained(
            alt_model_id
        ).to(self.device)
        # No compilation for Pegasus to avoid inside accelerate complexities

    def summarize_text(
        self,
        text: str,
        max_length: int = DEFAULT_SUMMARY_MAX_LENGTH,
        min_length: int = DEFAULT_SUMMARY_MIN_LENGTH,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
        num_beams: int = 4,
        length_penalty: float = 1.0,
        no_repeat_ngram_size: int = DEFAULT_NO_REPEAT_NGRAM,
        repetition_penalty: float = DEFAULT_REPETITION_PENALTY,
        early_stopping: bool = True,
        banned_terms: Optional[List[str]] = None,
        use_alt_model: bool = False,
    ) -> str:
        """
        Summarize input text with LED, applying:
          1. Pre‐filtering of noisy lines/boilerplate
          2. Cleaning whitespace
          3. Sentence‐aware chunking
          4. Chunk‐level summary generation (with tuned parameters)
          5. Second‐pass hierarchical summary (if multiple chunks)
          6. Post‐filtering for banned terms
          7. Optional Pegasus fallback if flagged
        """
        # 1) Pre-filter noisy lines (author asides, repeated headings)
        raw = text
        raw = remove_author_asides(raw)
        raw = collapse_repeated_headings(raw)

        # 2) Clean whitespace/newlines
        cleaned = clean_text(raw)

        # 3) Token-based, sentence-aware chunking
        chunks = chunk_text_by_sentence(
            cleaned, self.tokenizer, self.max_input_tokens, chunk_overlap=chunk_overlap
        )

        summaries: List[str] = []
        for idx, chunk in enumerate(chunks):
            token_count = len(self.tokenizer(chunk)["input_ids"])
            logger.info(
                f"Summarizing chunk {idx + 1}/{len(chunks)} (≈{token_count} tokens)"
            )

            inputs = self.tokenizer(
                chunk,
                return_tensors="pt",
                truncation=True,
                padding="longest",
            ).to(self.device)

            summary_ids = self.accelerator.unwrap_model(self.model).generate(
                inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=max_length,
                min_length=min_length,
                num_beams=num_beams,
                length_penalty=length_penalty,
                no_repeat_ngram_size=no_repeat_ngram_size,
                repetition_penalty=repetition_penalty,
                early_stopping=early_stopping,
            )

            chunk_summary = self.tokenizer.decode(
                summary_ids[0], skip_special_tokens=True
            ).strip()
            summaries.append(chunk_summary)

        # 4) If multiple chunks, perform second-pass hierarchical summarization
        if len(summaries) > 1:
            combined = " ".join(summaries)
            logger.info(f"Combining {len(summaries)} chunk summaries for final pass")

            inputs = self.tokenizer(
                combined,
                return_tensors="pt",
                truncation=True,
                padding="longest",
            ).to(self.device)

            summary_ids = self.accelerator.unwrap_model(self.model).generate(
                inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=max_length // 2,  # force shorter final summary
                min_length=min_length // 2,
                num_beams=num_beams,
                length_penalty=length_penalty,
                no_repeat_ngram_size=no_repeat_ngram_size,
                repetition_penalty=repetition_penalty,
                early_stopping=early_stopping,
            )

            final_summary = self.tokenizer.decode(
                summary_ids[0], skip_special_tokens=True
            ).strip()
        else:
            final_summary = summaries[0]

        # 5) Post-filter hallucinations by banned keyword removal
        if banned_terms:
            final_summary = remove_unlikely_facts(final_summary, banned_terms)

        # 6) Optional: Pegasus fallback if LED output is too conversational or flagged
        if use_alt_model:
            logger.info("Using Pegasus fallback on cleaned text")
            alt_inputs = self.alt_tokenizer(
                cleaned,
                return_tensors="pt",
                truncation=True,
                padding="longest",
            ).to(self.device)

            alt_ids = self.alt_model.generate(
                alt_inputs["input_ids"],
                attention_mask=alt_inputs["attention_mask"],
                max_length=max_length,
                min_length=min_length,
                num_beams=num_beams,
                length_penalty=length_penalty,
                no_repeat_ngram_size=no_repeat_ngram_size,
                repetition_penalty=repetition_penalty,
                early_stopping=early_stopping,
            )
            alt_summary = self.alt_tokenizer.decode(
                alt_ids[0], skip_special_tokens=True
            ).strip()

            # Decide which summary to return: here we simply return Pegasus output
            # but you can add heuristics (ROUGE‐compare, banned term counts) to pick one.
            return alt_summary

        return final_summary

    def summarize_chapter(
        self,
        text: str,
        max_length: int = DEFAULT_SUMMARY_MAX_LENGTH,
        min_length: int = DEFAULT_SUMMARY_MIN_LENGTH,
        **kwargs,
    ) -> str:
        return self.summarize_text(
            text, max_length=max_length, min_length=min_length, **kwargs
        )

    def summarize_page(
        self,
        text: str,
        max_length: int = DEFAULT_SUMMARY_MAX_LENGTH // 2,
        min_length: int = DEFAULT_SUMMARY_MIN_LENGTH // 2,
        **kwargs,
    ) -> str:
        return self.summarize_text(
            text, max_length=max_length, min_length=min_length, **kwargs
        )

    def extract_text_from_pdf(
        self, path: str, pages: Union[int, range, List[int]]
    ) -> str:
        """
        Extract and clean text from specified pages of a PDF.
        """
        if not os.path.isfile(path):
            raise FileNotFoundError(f"PDF not found: {path}")

        doc = fitz.open(path)
        text_list: List[str] = []

        if isinstance(pages, int):
            page_indices = [pages]
        elif isinstance(pages, range):
            page_indices = list(pages)
        elif isinstance(pages, list):
            page_indices = pages
        else:
            raise ValueError("pages must be int, range, or list of ints")

        total_pages = doc.page_count
        for idx in page_indices:
            if idx < 0 or idx >= total_pages:
                raise IndexError(f"Page index out of range: {idx}")
            page = doc.load_page(idx)
            text = page.get_text("text")
            cleaned = clean_text(text)
            text_list.append(cleaned)

        return "\n".join(text_list)

    def summarize_pdf(
        self,
        path: str,
        pages: Union[int, range, List[int]],
        **generate_kwargs,
    ) -> str:
        """
        Summarize a PDF (or subset of pages). Automatically extracts text and then summarizes.
        """
        extracted = self.extract_text_from_pdf(path, pages)
        return self.summarize_text(extracted, **generate_kwargs)


# ───────────────────────────────────────────────────────────────────────────────
# Command-line Interface (CLI)
# ───────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Advanced LED-based Summarization CLI")
    parser.add_argument(
        "--input",
        type=str,
        required=False,
        help="Path to a text file or PDF to summarize",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="For PDFs: single page (e.g., '0'), range (e.g., '0-5'), or comma-separated list (e.g., '0,2,5')",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="File to save the summary (if omitted, prints to stdout)",
    )
    parser.add_argument(
        "--model_id",
        type=str,
        default=DEFAULT_MODEL_ID,
        help="Hugging Face LED model ID for summarization",
    )
    parser.add_argument(
        "--alt_model_id",
        type=str,
        default=DEFAULT_ALT_MODEL_ID,
        help="Hugging Face Pegasus model ID for optional fallback",
    )
    parser.add_argument(
        "--max_length",
        type=int,
        default=DEFAULT_SUMMARY_MAX_LENGTH,
        help="Maximum length of summary",
    )
    parser.add_argument(
        "--min_length",
        type=int,
        default=DEFAULT_SUMMARY_MIN_LENGTH,
        help="Minimum length of summary",
    )
    parser.add_argument(
        "--chunk_overlap",
        type=int,
        default=DEFAULT_CHUNK_OVERLAP,
        help="Number of tokens to overlap between chunks",
    )
    parser.add_argument("--num_beams", type=int, default=4, help="Beam search width")
    parser.add_argument(
        "--length_penalty",
        type=float,
        default=1.0,
        help="Length penalty for beam search",
    )
    parser.add_argument(
        "--no_repeat_ngram_size",
        type=int,
        default=DEFAULT_NO_REPEAT_NGRAM,
        help="Prevent repetition of n-grams of this size",
    )
    parser.add_argument(
        "--repetition_penalty",
        type=float,
        default=DEFAULT_REPETITION_PENALTY,
        help="Repetition penalty to discourage repeated tokens",
    )
    parser.add_argument(
        "--early_stopping",
        action="store_true",
        help="Enable early stopping in beam search",
    )
    parser.add_argument(
        "--banned_terms",
        type=str,
        default="",
        help="Comma-separated list of terms to filter out from the final summary",
    )
    parser.add_argument(
        "--use_alt_model",
        action="store_true",
        help="Use Pegasus fallback instead of LED for final summary",
    )
    parser.add_argument(
        "--test_dummy",
        action="store_true",
        help="Run dummy data tests for a single page (~2,500 words) and a single chapter (~15,000 words)",
    )
    args = parser.parse_args()

    # Initialize summarizer
    summarizer = LEDSummarizer(model_id=args.model_id, alt_model_id=args.alt_model_id)

    # If --test_dummy, ignore file input and run built-in dummy tests
    if args.test_dummy:
        # ----------------------------------------------------------------------------
        # 1) Dummy “page” simulation: ~2,500 words (~long single page)
        # ----------------------------------------------------------------------------
        base_page = """
Page 71 – Embracing Deep Work

In a world full of distractions, the ability to concentrate without interruption on cognitively demanding tasks is becoming increasingly rare—and increasingly valuable. Most people spend their days in a state of fragmented attention, jumping from email to social media to meetings, barely scratching the surface of meaningful work. But deep work—long periods of focused effort without distraction—creates lasting value and pushes your abilities to the limit.

Deep work is the opposite of shallow work. Shallow tasks might feel urgent, but they’re often low-impact—things like replying to Slack messages, sitting in unnecessary meetings, or casually browsing the web. These are easy to repeat but rarely move the needle in terms of real progress or innovation.

To succeed in an economy that rewards depth, you must build habits and routines that protect your time. That means eliminating distractions at the source—turning off notifications, setting clear time blocks for focused work, and learning to say no to things that don’t align with your priorities.

True mastery comes not from multitasking, but from consistent, deliberate focus. Every hour you spend in deep work strengthens your skillset, sharpens your mind, and brings you closer to the kind of success that can’t be outsourced or automated.

But deep work doesn’t happen by accident. It requires intention. You must treat it like a professional skill—schedule it, protect it, and practice it. Over time, you’ll find yourself producing higher-quality work in less time and feeling more fulfilled by the work itself.

Shallow work is seductive—it’s easy, fast, and feels productive. But it’s the deep work that truly defines your potential.
"""
        dummy_page_text = base_page

        # ----------------------------------------------------------------------------
        # 2) Dummy “chapter” simulation: ~15,000 words (~very large chapter)
        # ----------------------------------------------------------------------------
        base_chapter = """
Chapter 3: Reclaiming Focus in a Distracted World
It’s 8:00 a.m. You sit at your desk, coffee steaming, determined to make progress on your most important task. But before you even open your work document, a notification flashes on your phone. It’s a news update. You glance at it—just for a second. Then a message arrives. Then a thought about something you forgot to do yesterday. You check your inbox quickly, and by the time you return to your task, it’s already been twenty minutes.

Sound familiar?

This is the modern state of work: constant partial attention, scattered focus, and an invisible fog that prevents us from ever truly entering the zone. We call it “busy,” but in truth, much of what we call productivity is just motion without depth. In a world that values speed and stimulation, we’ve slowly forgotten what deep work feels like.

The High Cost of Shallow Living
Shallow work is seductive. It feels fast. You check tasks off your to-do list and respond to every ping like a productivity hero. But while shallow work is often necessary, it rarely leads to anything remarkable. Answering emails, scheduling meetings, and scrolling through endless updates consume the hours of our day—but they rarely move the needle.

Deep work, on the other hand, is cognitively demanding. It’s the time spent writing, designing, solving, building, or thinking at the edge of your abilities. It’s when you’re immersed so deeply that time seems to disappear. This kind of focus doesn’t just yield better results—it creates work of lasting value.

Why Deep Work Matters More Than Ever
We live in an attention economy. Those who can maintain focus while others are distracted will rise above. Whether you’re a student, a developer, a writer, or an entrepreneur, your ability to produce high-quality results quickly is your greatest asset. And that ability is driven not by talent alone, but by your capacity to work deeply.

Artificial intelligence and automation can replace many forms of shallow labor. But deep work—the ability to solve hard problems, to write with clarity, to think originally—cannot be outsourced. It is a skill, and like any skill, it can be cultivated.

Designing for Depth
Deep work doesn’t happen by accident. It must be designed into your life.

Here are a few practices that help:

Time Blocking: Set aside dedicated hours for focused, uninterrupted work. No notifications, no multitasking. Just you and your task.

Environment Control: Find or create a distraction-free space. This might be a quiet room, a library, or even just putting on noise-canceling headphones.

Work Rituals: Begin your deep work with the same routine—perhaps a cup of tea, a clear desk, and five minutes of silence. Rituals signal your brain that it’s time to focus.

Digital Declutter: Audit your digital life. Unsubscribe from unnecessary notifications. Schedule time to check email or messages rather than reacting instantly.

Training the Mind
Most people have lost the ability to focus for extended periods. We’ve trained our brains to crave stimulation, to reach for the phone at the slightest hint of boredom. Rebuilding focus takes time.

Start small: Try focusing on a single task for 30 minutes. When your attention drifts, gently bring it back. Over time, stretch that window longer. Like physical exercise, mental focus strengthens with repetition.

Meditation, reading long-form content, or journaling can all support your focus muscle. What matters is not perfection, but persistence.

Saying No with Purpose
To work deeply, you must say no. No to distractions. No to urgent-but-unimportant tasks. No to meetings without agendas or outcomes.

This isn’t about being rude—it’s about protecting your most valuable resource: your time and attention.

You don’t need to be available 24/7 to be valuable. In fact, the opposite is often true. Those who protect their time produce more and deliver better.

Measuring What Matters
Deep work may not produce immediate results, but it creates cumulative progress. You won’t always “feel” productive during it, because deep focus is slow, and breakthroughs happen beneath the surface.

But measure your progress weekly. Ask:

Did I spend meaningful time in deep work?

What did I accomplish that mattered?

What distracted me—and how can I improve?

Small improvements in your focus each week compound just like habits. You’ll find that your output improves—not just in quantity, but in quality.

Redefining Productivity
True productivity isn’t how many hours you sit at your desk. It’s not how fast you reply to emails. It’s what you create, what problems you solve, and what impact you deliver.

Deep work is where this value is born.

You can live your entire professional life in a haze of shallow activity. Or you can choose depth. You can train your attention like a craftsman sharpens his tools—not for speed, but for excellence.

And excellence doesn’t come from working more. It comes from working better—with purpose, clarity, and depth.

"""
        dummy_chapter_text = base_chapter

        print("━━━━━ TEST: DUMMY PAGE SUMMARY (approx. 2,500 words) ━━━━━\n")
        page_summary = summarizer.summarize_page(
            dummy_page_text,
            max_length=args.max_length // 2,
            min_length=args.min_length // 2,
            chunk_overlap=args.chunk_overlap,
            num_beams=args.num_beams,
            length_penalty=args.length_penalty,
            no_repeat_ngram_size=args.no_repeat_ngram_size,
            repetition_penalty=args.repetition_penalty,
            early_stopping=args.early_stopping,
            banned_terms=args.banned_terms.split(",") if args.banned_terms else None,
            use_alt_model=args.use_alt_model,
        )
        print(page_summary)
        print("\n\n")

        print("━━━━━ TEST: DUMMY CHAPTER SUMMARY (approx. 15,000 words) ━━━━━\n")
        chapter_summary = summarizer.summarize_chapter(
            dummy_chapter_text,
            max_length=args.max_length,
            min_length=args.min_length,
            chunk_overlap=args.chunk_overlap,
            num_beams=args.num_beams,
            length_penalty=args.length_penalty,
            no_repeat_ngram_size=args.no_repeat_ngram_size,
            repetition_penalty=args.repetition_penalty,
            early_stopping=args.early_stopping,
            banned_terms=args.banned_terms.split(",") if args.banned_terms else None,
            use_alt_model=args.use_alt_model,
        )
        print(chapter_summary)
        return

    # Determine input type (if not testing dummy)
    if args.input is None:
        raise ValueError("--input is required when not running --test_dummy")

    if args.input.lower().endswith(".pdf"):
        if args.pages is None:
            raise ValueError("Must specify --pages for PDF input")
        # Parse pages argument
        if "-" in args.pages:
            start, end = args.pages.split("-")
            pages = range(int(start), int(end) + 1)
        elif "," in args.pages:
            pages = [int(p) for p in args.pages.split(",")]
        else:
            pages = int(args.pages)

        summary = summarizer.summarize_pdf(
            args.input,
            pages,
            max_length=args.max_length,
            min_length=args.min_length,
            chunk_overlap=args.chunk_overlap,
            num_beams=args.num_beams,
            length_penalty=args.length_penalty,
            no_repeat_ngram_size=args.no_repeat_ngram_size,
            repetition_penalty=args.repetition_penalty,
            early_stopping=args.early_stopping,
            banned_terms=args.banned_terms.split(",") if args.banned_terms else None,
            use_alt_model=args.use_alt_model,
        )
    else:
        # Read text file
        with open(args.input, "r", encoding="utf-8") as f:
            text = f.read()

        summary = summarizer.summarize_text(
            text,
            max_length=args.max_length,
            min_length=args.min_length,
            chunk_overlap=args.chunk_overlap,
            num_beams=args.num_beams,
            length_penalty=args.length_penalty,
            no_repeat_ngram_size=args.no_repeat_ngram_size,
            repetition_penalty=args.repetition_penalty,
            early_stopping=args.early_stopping,
            banned_terms=args.banned_terms.split(",") if args.banned_terms else None,
            use_alt_model=args.use_alt_model,
        )

    # Output
    if args.output:
        with open(args.output, "w", encoding="utf-8") as out_f:
            out_f.write(summary)
        logger.info(f"Summary written to {args.output}")
    else:
        print(summary)


if __name__ == "__main__":
    main()
