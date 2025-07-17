import os
import re
import argparse
import logging
from typing import List, Optional, Union

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
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)


# ───────────────────────────────────────────────────────────────────────────────
# Constants / Defaults
# ───────────────────────────────────────────────────────────────────────────────
DEFAULT_MODEL_ID = "pszemraj/led-large-book-summary"
DEFAULT_ALT_MODEL_ID = "google/pegasus-large"
DEFAULT_MAX_INPUT_TOKENS = 16384      # LED supports ~16k tokens
DEFAULT_CHUNK_OVERLAP = 512           # tokens overlap between chunks
DEFAULT_SUMMARY_MAX_LENGTH = 1024
DEFAULT_SUMMARY_MIN_LENGTH = 128
DEFAULT_NO_REPEAT_NGRAM = 4
DEFAULT_REPETITION_PENALTY = 1.5


# ───────────────────────────────────────────────────────────────────────────────
# Text‐processing Utilities
# ───────────────────────────────────────────────────────────────────────────────
def remove_author_asides(text: str) -> str:
    """
    Drop lines that look like author asides or FAQs (e.g., “Brain Snack: …”, “What is …”).
    """
    lines = text.splitlines()
    filtered = []
    for ln in lines:
        stripped = ln.strip()
        if stripped.startswith("Brain Snack:") or stripped.startswith("What is "):
            continue
        filtered.append(ln)
    return "\n".join(filtered)


def collapse_repeated_headings(text: str) -> str:
    """
    Remove duplicate lines that start with “Chapter X:” if they appear multiple times.
    """
    seen = set()
    output_lines = []
    for ln in text.splitlines():
        if ln.startswith("Chapter") and ln in seen:
            continue
        seen.add(ln)
        output_lines.append(ln)
    return "\n".join(output_lines)


def clean_whitespace(text: str) -> str:
    """
    Collapse multiple whitespace or newline sequences into a single space,
    then strip leading/trailing spaces.
    """
    return re.sub(r"\s+", " ", text).strip()


def remove_unlikely_facts(summary: str, banned_terms: List[str]) -> str:
    """
    Filter out any sentence from 'summary' that contains one of the banned terms.
    """
    sentences = re.split(r"(?<=[.!?])\s+", summary)
    filtered = [
        sentence for sentence in sentences
        if not any(term.lower() in sentence.lower() for term in banned_terms)
    ]
    return " ".join(filtered)


# ───────────────────────────────────────────────────────────────────────────────
# Chunking for Long Inputs (Sentence‑Aware)
# ───────────────────────────────────────────────────────────────────────────────
def chunk_text_by_sentence(
    text: str,
    tokenizer: AutoTokenizer,
    max_tokens: int,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[str]:
    """
    Split 'text' into chunks that fit within 'max_tokens'. We generate
    token_ids for the entire text, then slice off pieces of up to max_tokens,
    decoding to find the nearest sentence boundary near the end of each chunk.
    We overlap by 'chunk_overlap' tokens to maintain context between chunks.
    """
    # Tokenize entire text once
    encoding = tokenizer(text, return_tensors="pt", truncation=False)
    all_token_ids = encoding["input_ids"][0]
    total_tokens = all_token_ids.size(0)

    if total_tokens <= max_tokens:
        return [text]

    chunks = []
    start_idx = 0

    while start_idx < total_tokens:
        end_idx = min(start_idx + max_tokens, total_tokens)
        # Decode candidate chunk
        candidate_tokens = all_token_ids[start_idx:end_idx]
        candidate_text = tokenizer.decode(candidate_tokens, skip_special_tokens=True)

        # Try to cut at the last full sentence (period or newline)
        cut_point = max(candidate_text.rfind("."), candidate_text.rfind("\n"))
        if cut_point > int(len(candidate_text) * 0.75):
            # Keep up to that punctuation (inclusive)
            prefix = candidate_text[:cut_point + 1]
        else:
            # If no suitable boundary found, take entire span
            prefix = candidate_text

        chunks.append(prefix)

        # Calculate how many tokens that prefix actually took
        prefix_token_ids = tokenizer(prefix, return_tensors="pt")["input_ids"][0]
        prefix_token_count = prefix_token_ids.size(0)

        if end_idx >= total_tokens:
            break

        # Advance start by (prefix_token_count - overlap), but not before original end
        start_idx = start_idx + prefix_token_count - chunk_overlap

    return chunks


# ───────────────────────────────────────────────────────────────────────────────
# Summarizer Class
# ───────────────────────────────────────────────────────────────────────────────
class LEDSummarizer:
    def __init__(
        self,
        model_id: str = DEFAULT_MODEL_ID,
        alt_model_id: str = DEFAULT_ALT_MODEL_ID,
        max_input_tokens: int = DEFAULT_MAX_INPUT_TOKENS,
        mixed_precision: str = "fp16",
    ):
        """
        Initialize an LED-based summarizer with an optional Pegasus fallback.
        Loads tokenizers and models, sets up Accelerate, and places to GPU if possible.
        """
        self.model_id = model_id
        self.alt_model_id = alt_model_id
        self.max_input_tokens = max_input_tokens

        # Initialize Accelerator
        self.accelerator = Accelerator(split_batches=True, mixed_precision=mixed_precision)
        self.device = self.accelerator.device
        logger.info(f"Using device: {self.device} (mixed_precision={self.accelerator.state.mixed_precision})")

        # Load LED model & tokenizer
        logger.info(f"Loading LED model/tokenizer '{model_id}'")
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        dtype = torch.float16 if self.device.type == "cuda" else torch.float32
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_id, torch_dtype=dtype)

        # Attempt torch.compile on CUDA
        if self.device.type == "cuda":
            try:
                self.model = torch.compile(self.model)
                logger.info("Compiled LED model with torch.compile()")
            except Exception as e:
                logger.warning(f"torch.compile failed for LED: {e}. Proceeding without compilation.")

        # Prepare model for Accelerate
        self.model = self.accelerator.prepare(self.model)

        # Load Pegasus fallback (no accelerate compilation)
        logger.info(f"Loading Pegasus model/tokenizer '{alt_model_id}' for fallback")
        self.alt_tokenizer = PegasusTokenizer.from_pretrained(alt_model_id)
        self.alt_model = PegasusForConditionalGeneration.from_pretrained(alt_model_id).to(self.device)

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
        Summarize a long 'text' by:
          1) Filtering boilerplate/asides
          2) Cleaning whitespace
          3) Splitting into sentence-aware chunks
          4) Generating summary for each chunk with LED
          5) Hierarchical second-pass if multiple chunks
          6) Filtering out sentences with 'banned_terms'
          7) (Optional) Returning Pegasus summary instead
        """
        # 1) Pre-filter
        filtered = remove_author_asides(text)
        filtered = collapse_repeated_headings(filtered)

        # 2) Clean whitespace
        cleaned = clean_whitespace(filtered)

        # 3) Chunk into manageable pieces
        chunks = chunk_text_by_sentence(cleaned, self.tokenizer, self.max_input_tokens, chunk_overlap)

        partial_summaries: List[str] = []
        for idx, chunk in enumerate(chunks):
            token_count = len(self.tokenizer(chunk)["input_ids"])
            logger.info(f"[Chunk {idx + 1}/{len(chunks)}] ≈ {token_count} tokens → generating summary")

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
            chunk_summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True).strip()
            partial_summaries.append(chunk_summary)

        # 4) Hierarchical second‑pass if multiple chunks
        if len(partial_summaries) > 1:
            combined_text = " ".join(partial_summaries)
            logger.info(f"Performing hierarchical summarization on {len(partial_summaries)} chunk summaries")

            inputs = self.tokenizer(
                combined_text,
                return_tensors="pt",
                truncation=True,
                padding="longest",
            ).to(self.device)

            summary_ids = self.accelerator.unwrap_model(self.model).generate(
                inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=max_length // 2,
                min_length=min_length // 2,
                num_beams=num_beams,
                length_penalty=length_penalty,
                no_repeat_ngram_size=no_repeat_ngram_size,
                repetition_penalty=repetition_penalty,
                early_stopping=early_stopping,
            )
            final_summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True).strip()
        else:
            final_summary = partial_summaries[0]

        # 5) Filter out sentences containing banned terms
        if banned_terms:
            final_summary = remove_unlikely_facts(final_summary, banned_terms)

        # 6) Pegasus fallback
        if use_alt_model:
            logger.info("Using Pegasus fallback for final summary")
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
            alt_summary = self.alt_tokenizer.decode(alt_ids[0], skip_special_tokens=True).strip()
            return alt_summary

        return final_summary

    def summarize_chapter(
        self,
        text: str,
        max_length: int = DEFAULT_SUMMARY_MAX_LENGTH,
        min_length: int = DEFAULT_SUMMARY_MIN_LENGTH,
        **kwargs,
    ) -> str:
        """
        Shorthand for summarizing a full chapter.
        """
        return self.summarize_text(text, max_length=max_length, min_length=min_length, **kwargs)

    def summarize_page(
        self,
        text: str,
        max_length: int = DEFAULT_SUMMARY_MAX_LENGTH // 2,
        min_length: int = DEFAULT_SUMMARY_MIN_LENGTH // 2,
        **kwargs,
    ) -> str:
        """
        Shorthand for summarizing a single page (shorter summary).
        """
        return self.summarize_text(text, max_length=max_length, min_length=min_length, **kwargs)

    def extract_text_from_pdf(
        self,
        path: str,
        pages: Union[int, range, List[int]]
    ) -> str:
        """
        Extract and clean text from 'pages' of a PDF at 'path'.
        'pages' can be an int, a range, or a list of ints.
        """
        if not os.path.isfile(path):
            raise FileNotFoundError(f"PDF not found: {path}")

        doc = fitz.open(path)
        total_pages = doc.page_count

        if isinstance(pages, int):
            page_indices = [pages]
        elif isinstance(pages, range):
            page_indices = list(pages)
        elif isinstance(pages, list):
            page_indices = pages
        else:
            raise ValueError("pages must be int, range, or list of ints")

        extracted_chunks = []
        for idx in page_indices:
            if idx < 0 or idx >= total_pages:
                raise IndexError(f"Page index out of range: {idx}")
            page = doc.load_page(idx)
            raw_text = page.get_text("text")
            cleaned_text = clean_whitespace(raw_text)
            extracted_chunks.append(cleaned_text)

        return "\n".join(extracted_chunks)

    def summarize_pdf(
        self,
        path: str,
        pages: Union[int, range, List[int]],
        **generate_kwargs
    ) -> str:
        """
        Extracts text from a PDF (or subset of pages), then generates a summary.
        """
        extracted = self.extract_text_from_pdf(path, pages)
        return self.summarize_text(extracted, **generate_kwargs)


# ───────────────────────────────────────────────────────────────────────────────
# Command‑Line Interface
# ───────────────────────────────────────────────────────────────────────────────
def parse_pages_arg(pages_str: str) -> Union[int, range, List[int]]:
    """
    Convert a string like '0', '0-5', or '0,2,5' into an int, range, or list of ints.
    """
    if "-" in pages_str:
        start, end = pages_str.split("-")
        return range(int(start), int(end) + 1)
    if "," in pages_str:
        return [int(p.strip()) for p in pages_str.split(",") if p.strip().isdigit()]
    if pages_str.isdigit():
        return int(pages_str)
    raise argparse.ArgumentTypeError("Invalid format for --pages. Use 'n', 'n-m', or 'n,m,…'.")


def main():
    parser = argparse.ArgumentParser(
        description="Advanced LED/Pegasus Summarization CLI"
    )
    parser.add_argument(
        "--input",
        type=str,
        required=False,
        help="Path to a text file or PDF to summarize"
    )
    parser.add_argument(
        "--pages",
        type=parse_pages_arg,
        default=None,
        help="For PDFs: single page ('0'), range ('0-5'), or comma-separated ('0,2,5')"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="File to save the summary (if omitted, prints to stdout)"
    )
    parser.add_argument(
        "--model_id",
        type=str,
        default=DEFAULT_MODEL_ID,
        help="Hugging Face LED model ID"
    )
    parser.add_argument(
        "--alt_model_id",
        type=str,
        default=DEFAULT_ALT_MODEL_ID,
        help="Hugging Face Pegasus model ID (fallback)"
    )
    parser.add_argument(
        "--max_length",
        type=int,
        default=DEFAULT_SUMMARY_MAX_LENGTH,
        help="Maximum length of final summary"
    )
    parser.add_argument(
        "--min_length",
        type=int,
        default=DEFAULT_SUMMARY_MIN_LENGTH,
        help="Minimum length of final summary"
    )
    parser.add_argument(
        "--chunk_overlap",
        type=int,
        default=DEFAULT_CHUNK_OVERLAP,
        help="Number of tokens to overlap between chunks"
    )
    parser.add_argument(
        "--num_beams",
        type=int,
        default=4,
        help="Beam search width"
    )
    parser.add_argument(
        "--length_penalty",
        type=float,
        default=1.0,
        help="Length penalty for beam search"
    )
    parser.add_argument(
        "--no_repeat_ngram_size",
        type=int,
        default=DEFAULT_NO_REPEAT_NGRAM,
        help="Prevent repetition of n-grams of this size"
    )
    parser.add_argument(
        "--repetition_penalty",
        type=float,
        default=DEFAULT_REPETITION_PENALTY,
        help="Penalty to discourage repeated tokens"
    )
    parser.add_argument(
        "--early_stopping",
        action="store_true",
        help="Enable early stopping in beam search"
    )
    parser.add_argument(
        "--banned_terms",
        type=lambda s: [term.strip() for term in s.split(",") if term.strip()],
        default=None,
        help="Comma-separated list of terms to filter out from final summary"
    )
    parser.add_argument(
        "--use_alt_model",
        action="store_true",
        help="Use Pegasus fallback instead of LED for the final summary"
    )
    parser.add_argument(
        "--test_dummy",
        action="store_true",
        help="Run built-in dummy tests (page and chapter) instead of file input"
    )

    args = parser.parse_args()

    # Initialize summarizer
    summarizer = LEDSummarizer(
        model_id=args.model_id,
        alt_model_id=args.alt_model_id
    )

    # Dummy‐data tests
    if args.test_dummy:
        dummy_page = """
Page 71 – Embracing Deep Work

In a world full of distractions, the ability to concentrate without interruption on cognitively demanding tasks is becoming increasingly rare—and increasingly valuable. Most people spend their days in a state of fragmented attention, jumping from email to social media to meetings, barely scratching the surface of meaningful work. But deep work—long periods of focused effort without distraction—creates lasting value and pushes your abilities to the limit.

Deep work is the opposite of shallow work. Shallow tasks might feel urgent, but they’re often low-impact—things like replying to Slack messages, sitting in unnecessary meetings, or casually browsing the web. These are easy to repeat but rarely move the needle in terms of real progress or innovation.

To succeed in an economy that rewards depth, you must build habits and routines that protect your time. That means eliminating distractions at the source—turning off notifications, setting clear time blocks for focused work, and learning to say no to things that don’t align with your priorities.

True mastery comes not from multitasking, but from consistent, deliberate focus. Every hour you spend in deep work strengthens your skillset, sharpens your mind, and brings you closer to the kind of success that can’t be outsourced or automated.

But deep work doesn’t happen by accident. It requires intention. You must treat it like a professional skill—schedule it, protect it, and practice it. Over time, you’ll find yourself producing higher-quality work in less time and feeling more fulfilled by the work itself.

Shallow work is seductive—it’s easy, fast, and feels productive. But it’s the deep work that truly defines your potential.
"""
        logger.info("────── Dummy Test: Single Page (~300 words) ──────")
        page_summary = summarizer.summarize_page(
            dummy_page,
            max_length=args.max_length // 2,
            min_length=args.min_length // 2,
            chunk_overlap=args.chunk_overlap,
            num_beams=args.num_beams,
            length_penalty=args.length_penalty,
            no_repeat_ngram_size=args.no_repeat_ngram_size,
            repetition_penalty=args.repetition_penalty,
            early_stopping=args.early_stopping,
            banned_terms=args.banned_terms,
            use_alt_model=args.use_alt_model,
        )
        print("\n---- Page Summary ----\n")
        print(page_summary)
        print("\n")

        dummy_chapter = """
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
        logger.info("────── Dummy Test: Full Chapter (~1,000 words) ──────")
        chapter_summary = summarizer.summarize_chapter(
            dummy_chapter,
            max_length=args.max_length,
            min_length=args.min_length,
            chunk_overlap=args.chunk_overlap,
            num_beams=args.num_beams,
            length_penalty=args.length_penalty,
            no_repeat_ngram_size=args.no_repeat_ngram_size,
            repetition_penalty=args.repetition_penalty,
            early_stopping=args.early_stopping,
            banned_terms=args.banned_terms,
            use_alt_model=args.use_alt_model,
        )
        print("\n---- Chapter Summary ----\n")
        print(chapter_summary)
        return

    # Validate input when not running dummy tests
    if not args.input:
        parser.error("--input is required when not using --test_dummy")

    summarizer_kwargs = {
        "max_length": args.max_length,
        "min_length": args.min_length,
        "chunk_overlap": args.chunk_overlap,
        "num_beams": args.num_beams,
        "length_penalty": args.length_penalty,
        "no_repeat_ngram_size": args.no_repeat_ngram_size,
        "repetition_penalty": args.repetition_penalty,
        "early_stopping": args.early_stopping,
        "banned_terms": args.banned_terms,
        "use_alt_model": args.use_alt_model,
    }

    # Summarize PDF
    if args.input.lower().endswith(".pdf"):
        if args.pages is None:
            parser.error("For PDF input, --pages must be provided (e.g., '0-2' or '5').")
        summary = summarizer.summarize_pdf(
            args.input,
            args.pages,
            **summarizer_kwargs,
        )

    # Summarize plain text file
    else:
        if not os.path.isfile(args.input):
            parser.error(f"Input file not found: {args.input}")
        with open(args.input, "r", encoding="utf-8") as f:
            raw_text = f.read()
        summary = summarizer.summarize_text(raw_text, **summarizer_kwargs)

    # Output results
    if args.output:
        with open(args.output, "w", encoding="utf-8") as out_f:
            out_f.write(summary)
        logger.info(f"Summary successfully written to: {args.output}")
    else:
        print(summary)


if __name__ == "__main__":
    main()
