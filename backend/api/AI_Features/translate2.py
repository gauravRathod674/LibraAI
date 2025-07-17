from transformers import MBartForConditionalGeneration, MBart50TokenizerFast
import torch
import re

MODEL_NAME = "facebook/mbart-large-50-many-to-many-mmt"

# Load model and tokenizer once at module load for efficiency
tokenizer = MBart50TokenizerFast.from_pretrained(MODEL_NAME)
model = MBartForConditionalGeneration.from_pretrained(MODEL_NAME)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Optional glossary to fix common awkward translations or domain-specific terms
GLOSSARY = {
    "सैचैल": "झोला",
    "पथ": "रास्ता",
    "शिखर": "चोटी",
    "गायब": "गायब हो गया",
    "गल गया": "गया",
    # Extend as needed...
}

def apply_glossary(text: str, glossary: dict) -> str:
    """Replace glossary keys with corresponding values in the translated text."""
    for wrong_word, correct_word in glossary.items():
        text = re.sub(rf'\b{re.escape(wrong_word)}\b', correct_word, text)
    return text

def remove_immediate_repeats(text: str) -> str:
    """
    Remove immediate repeated words, e.g. "हो गया हो गया" -> "हो गया"
    """
    return re.sub(r'\b(\w+)( \1\b)+', r'\1', text)

def clean_translation(text: str) -> str:
    """
    Clean up translated text by normalizing spaces, newlines, punctuation, 
    removing special tokens and repeated words, and applying glossary fixes.
    """
    # Normalize spaces around newlines
    text = re.sub(r'\s+\n', '\n', text)
    text = re.sub(r'\n\s+', '\n', text)

    # Convert multiple spaces or tabs into a single space
    text = re.sub(r'[ \t]{2,}', ' ', text)

    # Limit multiple newlines to a maximum of two
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Fix spacing before Hindi punctuation marks like । , ! ?
    text = re.sub(r'\s+([।,!?])', r'\1', text)

    # Remove any leftover special tokens like <s>, <pad>, <unk>, </s> etc.
    text = re.sub(r'<.*?>', '', text)

    # Remove immediate repeated words
    text = remove_immediate_repeats(text)

    # Apply glossary replacements
    text = apply_glossary(text, GLOSSARY)

    # Final whitespace normalization (collapse multiple spaces)
    text = re.sub(r'\s{2,}', ' ', text)

    return text.strip()

def translate_text(
    text: str,
    source_lang: str = "en_XX",
    target_lang: str = "hi_IN",
    max_length: int = 1024,
    num_beams: int = 5
) -> str:
    """
    Translate input text from source language to target language using MBART50.

    Args:
        text (str): Text to translate.
        source_lang (str): Source language code (default English).
        target_lang (str): Target language code (default Hindi).
        max_length (int): Maximum tokens to generate.
        num_beams (int): Beam search width for generation.

    Returns:
        str: Cleaned translated text.
    """
    tokenizer.src_lang = source_lang

    # Tokenize input text with truncation to avoid overflow
    encoded_input = tokenizer(
        text,
        return_tensors="pt",
        max_length=max_length,
        truncation=True,
        padding="longest"
    )
    encoded_input = {k: v.to(device) for k, v in encoded_input.items()}

    # Generate translation tokens
    generated_tokens = model.generate(
        **encoded_input,
        forced_bos_token_id=tokenizer.lang_code_to_id[target_lang],
        max_length=max_length,
        num_beams=num_beams,
        early_stopping=True,
        no_repeat_ngram_size=3  # Avoid repeating same phrases
    )

    # Decode tokens and clean output
    translated = tokenizer.decode(generated_tokens[0], skip_special_tokens=True)
    return clean_translation(translated)

def translate_paragraphs(
    text: str,
    source_lang: str = "en_XX",
    target_lang: str = "hi_IN",
    max_length: int = 1024,
    num_beams: int = 5
) -> str:
    """
    Translate multi-paragraph text by splitting into paragraphs and
    translating each separately. Helps with long text and truncation.

    Args:
        text (str): Multi-paragraph text.
        source_lang (str): Source language code.
        target_lang (str): Target language code.
        max_length (int): Max tokens per paragraph.
        num_beams (int): Beam search width.

    Returns:
        str: Combined translated paragraphs.
    """
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    translated_paragraphs = [
        translate_text(para, source_lang, target_lang, max_length, num_beams)
        for para in paragraphs
    ]
    return "\n\n".join(translated_paragraphs)

if __name__ == "__main__":
    sample_text = """
    The sun dipped low behind the western ridge, casting long shadows across the winding trail. Aarav paused at the crest of the hill, breathing in the crisp evening air. Below him, the valley shimmered under the golden light, dotted with small huts and fields ready for harvest.

    He had walked nearly twelve miles since morning, the worn leather strap of his satchel digging into his shoulder. Yet the ache in his legs felt distant compared to the fire burning in his heart — a stubborn flame fueled by curiosity, by the questions he could no longer ignore.

    “They say the temple at Kalrith was built by a forgotten civilization,” he recalled Mira telling him last winter, her voice wrapped in both wonder and warning. “But no one goes there now. The path is cursed.”

    He looked ahead. The forest loomed like a wall — dark, dense, and quiet. No birds chirped. Even the wind seemed afraid to speak. Yet, somewhere in that silence, he felt the pull of something ancient, something waiting.

    Aarav reached into his pocket and pulled out the stone the old woman had given him — smooth, black, and faintly warm to the touch. He didn’t know why he trusted her. He only knew he had to keep going.

    With a final glance at the valley behind, he stepped forward. The trail vanished beneath the trees, swallowed by mist and mystery.
    """

    translated_text = translate_paragraphs(sample_text, source_lang="en_XX", target_lang="hi_IN")
    print("Original Text:\n", sample_text.strip())
    print("\nTranslated Text:\n", translated_text.strip())
