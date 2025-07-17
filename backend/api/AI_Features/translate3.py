import re
import logging
import time
from functools import lru_cache
from typing import List, Dict, Optional, Union, Callable

import torch
from transformers import MBartForConditionalGeneration, MBart50TokenizerFast
from tqdm.auto import tqdm

# Optional: mapping Western to Devanagari digits
deva_digits = str.maketrans('0123456789', '०१२३४५६७८९')

def convert_digits_to_deva(text: str) -> str:
    # Convert all ASCII digits to Devanagari
    return text.translate(deva_digits)

# Configure logging
torch.backends.cudnn.benchmark = True
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class MBartTranslator:
    """
    High-performance multilingual translator using facebook/mbart-large-50.
    Enhancements:
      - Auto device & dtype selection (fp16 support)
      - Paragraph & sentence splitting
      - Adaptive batching & retry logic
      - LRU caching for glossary fixes & name normalization
      - Convert numbers to Devanagari
      - Robust cleaning: strip stray Latin, collapse whitespace, fix punctuation
      - Detailed logging and optional progress bars
    """
    MODEL_NAME = "facebook/mbart-large-50-many-to-many-mmt"

    # Default glossary: common fixes + proper names
    DEFAULT_GLOSSARY: Dict[str, str] = {
        "सैचैल": "झोला",
        "पथ": "रास्ता",
        "शिखर": "चोटी",
        "गायब": "गायब हो गया",
        "गल गया": "गया",
        "Aarav": "आराव",
        "Aarav":"आराव",
        "Kalrith":"कलरिथ",
    }

    def __init__(
        self,
        device: Optional[Union[str, torch.device]] = None,
        max_length: int = 1024,
        num_beams: int = 5,
        no_repeat_ngram_size: int = 3,
        use_fp16: bool = True,
        glossary: Optional[Dict[str, str]] = None,
        sentence_splitter: Optional[Callable[[str], List[str]]] = None,
    ):
        # Device and dtype
        self.device = (
            torch.device(device) if device else torch.device(
                "cuda" if torch.cuda.is_available() else "cpu"
            )
        )
        self.dtype = (
            torch.float16 if use_fp16 and self.device.type == "cuda" else torch.float32
        )
        self.max_length = max_length
        self.num_beams = num_beams
        self.no_repeat_ngram_size = no_repeat_ngram_size
        self.glossary = {**self.DEFAULT_GLOSSARY, **(glossary or {})}
        self.split_sentences = sentence_splitter or self._default_splitter

        # Load model & tokenizer
        logger.info("Loading model %s on %s", self.MODEL_NAME, self.device)
        self.tokenizer = MBart50TokenizerFast.from_pretrained(self.MODEL_NAME)
        self.model = MBartForConditionalGeneration.from_pretrained(
            self.MODEL_NAME,
            device_map="auto" if self.device.type == "cuda" else None,
            torch_dtype=self.dtype,
        )
        self.model.to(self.device)
        self.model.eval()

    def _default_splitter(self, text: str) -> List[str]:
        # Split by sentence-end punctuation with lookahead
        parts = re.split(r'(?<=[\.!?।])\s+', text.strip())
        return [p for p in parts if p]

    @lru_cache(maxsize=2048)
    def _apply_glossary(self, segment: str) -> str:
        # Apply repeated glossary regex replacements
        for wrong, correct in self.glossary.items():
            segment = re.sub(rf"\b{re.escape(wrong)}\b", correct, segment)
        return segment

    def _clean(self, segment: str) -> str:
        # 1) Remove special tokens
        seg = re.sub(r"<.*?>", "", segment)
        # 2) Normalize whitespace
        seg = re.sub(r"[ \t\u00A0]{2,}", " ", seg)
        # 3) Remove stray Latin letters and garbled words
        seg = re.sub(r"[A-Za-z]{2,}", "", seg)
        # 4) Fix spaces before punctuation
        seg = re.sub(r"\s+([।,!?—–-])", r"\1", seg)
        # 5) Collapse multiple newlines
        seg = re.sub(r"\n{3,}", "\n\n", seg)
        # 6) Remove repeated words
        seg = re.sub(r"\b(\w+)( \1\b)+", r"\1", seg)
        # 7) Apply glossary & name normalization
        seg = self._apply_glossary(seg)
        # 8) Convert digits to Devanagari
        seg = convert_digits_to_deva(seg)
        # 9) Trim spaces
        return seg.strip()

    def translate(
        self,
        text: str,
        source_lang: str = "en_XX",
        target_lang: str = "hi_IN",
        batch_size: int = 4,
        show_progress: bool = False,
    ) -> str:
        # Setup tokenizer
        self.tokenizer.src_lang = source_lang
        self.tokenizer.tgt_lang = target_lang

        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        translations = []
        start = time.time()

        for para in tqdm(paragraphs, disable=not show_progress, desc="Paragraphs"):
            sentences = self.split_sentences(para)
            translated_sentences = []
            for i in range(0, len(sentences), batch_size):
                batch = sentences[i : i + batch_size]
                try:
                    translated_sentences.extend(self._translate_batch(batch))
                except RuntimeError as e:
                    logger.warning("Batch error %s, retrying individually", e)
                    for s in batch:
                        translated_sentences.extend(self._translate_batch([s]))
            translations.append(" ".join(translated_sentences))

        logger.info(
            "Translation done in %.1fs for %d paragraphs", time.time()-start, len(paragraphs)
        )
        return "\n\n".join(translations)

    def _translate_batch(self, batch: List[str]) -> List[str]:
        enc = self.tokenizer(
            batch,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=self.max_length,
        ).to(self.device)
        with torch.no_grad():
            out = self.model.generate(
                **enc,
                forced_bos_token_id=self.tokenizer.lang_code_to_id[self.tokenizer.tgt_lang],
                max_length=self.max_length,
                num_beams=self.num_beams,
                no_repeat_ngram_size=self.no_repeat_ngram_size,
                early_stopping=True,
            )
        decoded = [self.tokenizer.decode(o, skip_special_tokens=True) for o in out]
        return [self._clean(d) for d in decoded]

# Example usage
if __name__ == "__main__":
    sample = """
    The sun dipped low behind the western ridge, casting long shadows across the winding trail. Aarav paused at the crest of the hill, breathing in the crisp evening air. Below him, the valley shimmered under the golden light, dotted with small huts and fields ready for harvest.

    He had walked nearly twelve miles since morning, the worn leather strap of his satchel digging into his shoulder. Yet the ache in his legs felt distant compared to the fire burning in his heart — a stubborn flame fueled by curiosity, by the questions he could no longer ignore.

    “They say the temple at Kalrith was built by a forgotten civilization,” he recalled Mira telling him last winter, her voice wrapped in both wonder and warning. “But no one goes there now. The path is cursed.”

    He looked ahead. The forest loomed like a wall — dark, dense, and quiet. No birds chirped. Even the wind seemed afraid to speak. Yet, somewhere in that silence, he felt the pull of something ancient, something waiting.

    Aarav reached into his pocket and pulled out the stone the old woman had given him — smooth, black, and faintly warm to the touch. He didn’t know why he trusted her. He only knew he had to keep going.

    With a final glance at the valley behind, he stepped forward. The trail vanished beneath the trees, swallowed by mist and mystery.
    """
    translator = MBartTranslator()
    print(translator.translate(sample, show_progress=True))
