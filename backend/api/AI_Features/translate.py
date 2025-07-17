# translate_marian.py

import torch
from transformers import MarianMTModel, MarianTokenizer

# -----------------------------
# 1. Configuration
# -----------------------------
# Use MarianMT English→Hindi and English→Gujarati (“guw”)
MODEL_HI = "Helsinki-NLP/opus-mt-en-hi"
MODEL_GU = "Helsinki-NLP/opus-mt-en-guw"

DEVICE        = "cuda" if torch.cuda.is_available() else "cpu"

# We will split paragraphs into ≤512‐token chunks; each chunk can expand by +256 tokens
CHUNK_SIZE    = 512
HEADROOM      = 256

print(f"Using device: {DEVICE}")
print("Loading MarianMT models (may take ~30s)…")

tokenizer_hi = MarianTokenizer.from_pretrained(MODEL_HI)
model_hi     = MarianMTModel.from_pretrained(MODEL_HI).half().to(DEVICE)

tokenizer_gu = MarianTokenizer.from_pretrained(MODEL_GU)
model_gu     = MarianMTModel.from_pretrained(MODEL_GU).half().to(DEVICE)


# -----------------------------
# 2. Dummy Texts (Public Domain)
# -----------------------------
page_text = """
It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. 
However little known the feelings or views of such a man may be on his first entering a neighbourhood, 
this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property 
of some one or other of their daughters. “My dear Mr. Bennet,” said his lady to him one day, 
“have you heard that Netherfield Park is let at last?” Mr. Bennet replied that he had not. 
“But it is,” returned she; “for Mrs. Long has just been here, and she told me all about it.” 
Mr. Bennet made no answer. “Do not you want to know who has taken it?” cried his wife impatiently. 
“_You_ want to tell me, and I have no objection to hearing it.” This was invitation enough. 
“Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune 
from the north of England; that he came down on Monday in a chaise and four to see the place, 
and was so much delighted with it that he agreed with Mr. Morris immediately; 
that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week.” 
“What is his name?” “Bingley.” “Is he married or single?” “Oh! Single, my dear, to be sure! 
A single man of large fortune; four or five thousand a year. What a fine thing for our girls!”
"""

chapter_text = """
CHAPTER XX

The remainder of Mr. Darcy’s visit was marked by the same unconquerable reserve. Mrs. 
Gardiner, who felt interested in the dispute among her favourite girls and their neighbour, 
was much troubled about Lizzy. She could scarcely conceive how that young lady 
could have been so misled as to fancy the honourable Mr. Darcy to have been encouraged 
by such an engagement. But Mrs. Gardiner, though she could receive no immediate explanation, 
knew her nephew, and she could not but suppose that, wherever the real fault might lie, it 
was not on his side.

Meanwhile, Mrs. Bennet began to be rather fearful that her own daughter was come to something 
to be considered by every one for being at least as ride as—but enough. The rest of the 
visit passed and was forgotten by Mrs. Bennet in the joviality of the other topics and the 
diversions of London.

On their arrival in Hertfordshire, they were gratified by hearing that Mr. Bingley had dined 
at an assembly given by Mrs. Hurst, and that they had desired to take him abroad. The report 
was unbroken until the next day; and in order to be entirely safe from what might have been 
expected from a more intimate acquaintance, her ladyship avoided her daughter’s solicitations 
and, at the end of two days, informed her that her son’s inclination for Bingley still continued. 
Mr. Bingley was then dubious as to his future determination, whether to remain in Hertfordshire 
or to go down to London. But he was afterwards definitely fixed by a letter from his friend, 
Mr. Darcy, who gave him a strong recommendation to return to London. “I will. I will,” he 
said, with all the spirit of truth and sense.

Elizabeth and the whole family were now in a state of anxious distress. They could not 
account for his leaving them without any previous notice, and from what a visit had been 
to the gentleman’s feelings, it was altogether inexcusable. Her father, who saw the rest of 
the family overpowered by their distress, endeavoured to amuse them by the hope that Mr. Bingley 
might return again, and that long may be the time.

An evening or two after this event, Mr. Collins made his appearance at the parsonage. 
No one could recollect that he had ever before seen Mr. Bennet; but the name of Bennet was 
not new to him—his friend and patron was the living he held by the same tenure. He was from 
the very first presented by Sir William Lucas to his acquaintance with gratitude.

He was a very obsequious young man, and thanked Elizabeth for her politeness. 
Miss Bennet participated in the latter acknowledgment, and observed, with a commendation of dignity, 
that Darcy was very disagreeable; but perhaps it was because he frowned so often in their interviews.
"""


# -----------------------------
# 3. Translation Helper
# -----------------------------
def translate_marian(text: str, tokenizer, model) -> str:
    """
    Splits `text` into paragraphs. For each paragraph:
      1) Tokenize WITHOUT truncation to measure length L.
      2) If L <= CHUNK_SIZE, translate in one shot with max_length = L + HEADROOM.
      3) Otherwise, split into non-overlapping chunks of size CHUNK_SIZE:
         – For each sub-chunk of length l, set max_length = l + HEADROOM.
         – Translate that chunk and collect.
      4) Reassemble all chunk-translations (in order), preserving blank lines.
    """
    output_paragraphs = []

    for para in text.strip().split("\n\n"):
        para = para.strip()
        if not para:
            continue

        # 1) Tokenize WITHOUT truncation to get token count
        enc_full = tokenizer(para, return_tensors="pt", truncation=False)
        length   = enc_full["input_ids"].shape[-1]

        def _translate_chunk(input_ids_tensor: torch.Tensor) -> str:
            """
            Given a 1D tensor of input_ids (length = l), 
            produce the full translation string.
            """
            l = input_ids_tensor.shape[-1]
            max_length = l + HEADROOM

            enc_chunk = {
                "input_ids":      input_ids_tensor.unsqueeze(0).to(DEVICE),
                "attention_mask": torch.ones_like(input_ids_tensor, dtype=torch.long).unsqueeze(0).to(DEVICE),
            }

            generated = model.generate(
                **enc_chunk,
                max_length=max_length,
                no_repeat_ngram_size=2,  # prevent tiny loops
                early_stopping=True,
            )
            return tokenizer.batch_decode(generated, skip_special_tokens=True)[0]

        # 2) If paragraph is ≤ CHUNK_SIZE, do single-shot
        if length <= CHUNK_SIZE:
            translated = _translate_chunk(enc_full["input_ids"][0])
            output_paragraphs.append(translated)

        else:
            # 3) Otherwise, split into non-overlapping CHUNK_SIZE tokens
            token_ids = enc_full["input_ids"][0]  # shape: (length,)
            idx = 0
            while idx < length:
                end = min(idx + CHUNK_SIZE, length)
                chunk_ids = token_ids[idx:end]
                translated_chunk = _translate_chunk(chunk_ids)
                output_paragraphs.append(translated_chunk)
                idx += CHUNK_SIZE

    # 4) Join all translated paragraphs/chunks with a blank line
    return "\n\n".join(output_paragraphs)


# -----------------------------
# 4. Run & Print Translations
# -----------------------------
if __name__ == "__main__":
    # 4.1 SINGLE PAGE → Hindi
    print("\n--- Translating SINGLE PAGE → Hindi (MarianMT) ---\n")
    page_hi = translate_marian(page_text, tokenizer_hi, model_hi)
    print(page_hi)

    # 4.2 SINGLE PAGE → Gujarati
    print("\n--- Translating SINGLE PAGE → Gujarati (MarianMT) ---\n")
    page_gu = translate_marian(page_text, tokenizer_gu, model_gu)
    print(page_gu)

    # 4.3 FULL CHAPTER → Hindi
    print("\n--- Translating FULL CHAPTER → Hindi (MarianMT) ---\n")
    chapter_hi = translate_marian(chapter_text, tokenizer_hi, model_hi)
    print(chapter_hi)

    # 4.4 FULL CHAPTER → Gujarati
    print("\n--- Translating FULL CHAPTER → Gujarati (MarianMT) ---\n")
    chapter_gu = translate_marian(chapter_text, tokenizer_gu, model_gu)
    print(chapter_gu)
