# hybrid_translate.py
import re
import os
import html
import requests
import fitz  # PyMuPDF
from google import genai
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
G_TRANSLATE_API_KEY_ENV = "GOOGLE_TRANSLATE_API_KEY"
GEMINI_API_KEY_ENV = "GEMINI_API_KEY"
G_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"
GEMINI_MODEL_NAME = "gemini-2.0-flash"

# List of ISO language codes supported by Gemini for enhancement
GEMINI_LANGUAGES = {
    # Core Languages (often among the first supported and most robustly featured)
    "en",  # English
    "hi",  # Hindi
    "es",  # Spanish
    "fr",  # French
    "de",  # German
    "ja",  # Japanese
    "ko",  # Korean
    "zh",  # Chinese (often refers to Simplified Chinese, though Traditional is also supported)
    "ar",  # Arabic
    "ru",  # Russian
    "pt",  # Portuguese (includes both pt-BR for Brazilian Portuguese and pt-PT for European Portuguese)
    "it",  # Italian
    "id",  # Indonesian
    "tr",  # Turkish
    "vi",  # Vietnamese
    "th",  # Thai
    "pl",  # Polish
    "uk",  # Ukrainian
    "ro",  # Romanian
    # Languages often listed for broader Gemini support (web app, Workspace, etc.)
    "bn",  # Bengali
    "bg",  # Bulgarian
    "hr",  # Croatian
    "cs",  # Czech
    "da",  # Danish
    "nl",  # Dutch
    "et",  # Estonian
    "fa",  # Farsi (Persian)
    "fi",  # Finnish
    "el",  # Greek
    "gu",  # Gujarati
    "he",  # Hebrew
    "hu",  # Hungarian
    "kn",  # Kannada
    "lv",  # Latvian
    "lt",  # Lithuanian
    "ml",  # Malayalam
    "mr",  # Marathi
    "no",  # Norwegian
    "pa",  # Punjabi
    "sr",  # Serbian
    "sk",  # Slovak
    "sl",  # Slovenian
    "sw",  # Swahili
    "sv",  # Swedish
    "ta",  # Tamil
    "te",  # Telugu
    "ur",  # Urdu
    "cy",  # Welsh
    # Additional Languages (demonstrating wide, though perhaps varying, levels of support)
    "af",  # Afrikaans
    "sq",  # Albanian
    "am",  # Amharic
    "az",  # Azerbaijani
    "eu",  # Basque
    "be",  # Belarusian
    "bs",  # Bosnian
    "ca",  # Catalan
    "ceb",  # Cebuano
    "co",  # Corsican
    "dv",  # Divehi
    "eo",  # Esperanto
    "fo",  # Faroese
    "gl",  # Galician
    "ka",  # Georgian
    "ht",  # Haitian Creole
    "ha",  # Hausa
    "is",  # Icelandic
    "ig",  # Igbo
    "ga",  # Irish
    "jw",  # Javanese
    "kk",  # Kazakh
    "km",  # Khmer
    "ku",  # Kurdish
    "ky",  # Kyrgyz
    "lo",  # Lao
    "la",  # Latin
    "lb",  # Luxembourgish
    "mk",  # Macedonian
    "mg",  # Malagasy
    "ms",  # Malay
    "mt",  # Maltese
    "mi",  # Maori
    "mn",  # Mongolian
    "my",  # Myanmar (Burmese)
    "ne",  # Nepali
    "oc",  # Occitan
    "or",  # Odia (Oriya)
    "om",  # Oromo
    "ps",  # Pashto
    "qu",  # Quechua
    "sm",  # Samoan
    "gd",  # Scots Gaelic
    "sn",  # Shona
    "sd",  # Sindhi
    "si",  # Sinhala
    "so",  # Somali
    "su",  # Sundanese
    "tg",  # Tajik
    "tt",  # Tatar
    "ti",  # Tigrinya
    "ts",  # Tsonga
    "tk",  # Turkmen
    "ug",  # Uyghur
    "uz",  # Uzbek
    "xh",  # Xhosa
    "yi",  # Yiddish
    "yo",  # Yoruba
    "zu",  # Zulu
    # And more! Given that Gemini aims for 100+ languages, this list will continue to grow.
}
# --- Utility Functions ---


# --- Utility Base Classes ---
class EnvironmentConfig:
    """Handles retrieval of environment-based API keys."""

    @staticmethod
    def get_env_key(env_name: str) -> str:
        key = os.getenv(env_name)
        if not key:
            raise RuntimeError(f"Environment variable {env_name} not set")
        return key


class PDFExtractor:
    """Extracts text content from PDF pages, with optional page-range support."""

    def __init__(self, path: str, max_pages: Optional[int] = None, start_page: int = 1):
        self.path = path
        self.max_pages = max_pages
        self.start_page = max(1, start_page)

    def extract_pages(self) -> List[str]:
        doc = fitz.open(self.path)
        total = len(doc)
        start = self.start_page - 1
        end = start + self.max_pages if self.max_pages else total
        end = min(end, total)

        pages: List[str] = []
        for i in range(start, end):
            text = doc[i].get_text().strip()
            pages.append(text)
        return pages


class GoogleTranslator:
    """Translates text via Google Translate REST API."""

    def __init__(self, source_lang: str = "en"):
        self.source_lang = source_lang
        self.url = G_TRANSLATE_URL
        self.api_key = EnvironmentConfig.get_env_key(G_TRANSLATE_API_KEY_ENV)

    def translate(self, text: str, target_lang: str) -> str:
        params = {
            "q": text,
            "target": target_lang,
            "source": self.source_lang,
            "format": "text",
            "key": self.api_key,
        }
        resp = requests.post(self.url, data=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        raw = (
            data.get("data", {}).get("translations", [{}])[0].get("translatedText", "")
        )
        return html.unescape(raw)


class GeminiRefiner:
    """Enhances translations using Gemini API if supported."""

    def __init__(self, style: str = "narrative"):
        self.client = self._init_client()
        self.model = GEMINI_MODEL_NAME
        self.style = style

    def _init_client(self):
        api_key = EnvironmentConfig.get_env_key(GEMINI_API_KEY_ENV)
        return genai.Client(api_key=api_key)

    def refine(self, raw_translation: str, original_text: str, target_lang: str) -> str:
        tone_instruction = {
            "narrative": "Maintain a warm, story-like tone, as found in books or personal development texts.",
            "formal": "Use precise, professional, and grammatically strict language. Avoid contractions.",
            "casual": "Use simple, friendly, and approachable tone, like a conversation.",
        }.get(self.style, "")

        # --- NEW, IMPROVED PROMPT ---
        prompt = (
            "You are an expert translator and document formatter. Your task is to refine a machine translation to precisely match the style and structure of the original text.\n\n"
            "**Key Instructions:**\n"
            "1.  **Replicate Structure:** Mirror the exact line breaks and paragraph spacing of the original text. If the original has a single newline, the translation must also have a single newline. If it has a double newline to separate paragraphs, the translation must do the same.\n"
            "2.  **Maintain Layout:** The goal is an 'in-place' translation. The final text should have the same indentation, word spacing, and overall layout as the original.\n"
            "3.  **Enhance Translation Quality:** While preserving the structure, improve the initial Google Translation. Correct grammatical errors, fix awkward phrasing, and ensure the meaning is accurate and fluent in the target language.\n"
            f"4.  **Adopt Tone:** {tone_instruction}\n"
            "5.  **Clean Output:** Provide ONLY the final, refined translation. Do not include any titles, explanations, or introductory phrases.\n\n"
            "---\n\n"
            "**Original English Text (Reference for Structure):**\n"
            f"'''\n{original_text}\n'''\n\n"
            f"**Initial Google Translation ({target_lang}):**\n"
            f"'''\n{raw_translation}\n'''\n\n"
            f"**Refined Translation ({target_lang}):**"
        )
        # --- END OF NEW PROMPT ---

        response = self.client.models.generate_content(
            model=self.model, contents=[prompt]
        )
        return response.text.strip()


# --- Text Cleaning Utility ---
def post_process(text: str) -> str:
    """
    Gently cleans the translated text from the AI.
    This function assumes the AI was prompted to preserve the original document's
    structure (newlines, indentation) and acts as a final, light-touch safety net.
    """
    # 1. Normalize newline characters (safe and standard)
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # 2. Collapse multiple horizontal spaces into one, preserving line indentation (safer)
    text = re.sub(r'(?<=\S)\s{2,}', ' ', text)

    # 3. Fix punctuation spacing (good for typography)
    text = re.sub(r"\s+([?!.,;])", r"\1", text)
    text = re.sub(r"([?!.,;])(?=\w)", r"\1 ", text)

    # 4. Normalize ellipses and common abbreviations (harmless and improves consistency)
    text = re.sub(r"\.\s*\.\s*\.", "…", text)
    text = re.sub(r"\.{4,}", "...", text)
    text = re.sub(r"(\.\w{2,4})(\w)", r"\1 \2", text)  # Fixes "file.txtWord"
    text = re.sub(r"\b(ISBN|ISSN|LCSH)(\d+)", r"\1 \2", text, flags=re.IGNORECASE)
    text = re.sub(r"(?<=\w)_(?=\w)", " ", text) # a_b -> a b

    # 5. Remove common markdown artifacts that the AI might add by mistake (good safety net)
    text = re.sub(r"^\*\*(.*?)\*\*$", r"\1", text, flags=re.MULTILINE)
    text = re.sub(r"^\* (.*?)$", r"\1", text, flags=re.MULTILINE)

    # 6. Finally, strip any leading/trailing whitespace from the entire text block
    return text.strip()


# --- Main Hybrid Translator Class ---
class HybridPDFTranslator:
    def __init__(
        self,
        pdf_path: str,
        target_lang: str,
        max_pages: Optional[int] = None,
        start_page: int = 1,
        tone_style: str = "narrative",
    ):
        self.pdf_path = pdf_path
        self.target_lang = target_lang
        self.extractor = PDFExtractor(pdf_path, max_pages, start_page)
        self.google_translator = GoogleTranslator()
        self.gemini_refiner = GeminiRefiner(style=tone_style)

    def translate(self) -> List[str]:
        pages = self.extractor.extract_pages()
        results: List[str] = []

        for page_text in pages:
            if not page_text:
                results.append("")
                continue

            try:
                google_out = self.google_translator.translate(
                    page_text, self.target_lang
                )
            except Exception:
                results.append("")
                continue

            if self.target_lang in GEMINI_LANGUAGES:
                try:
                    enhanced = self.gemini_refiner.refine(
                        raw_translation=google_out,
                        original_text=page_text,
                        target_lang=self.target_lang,
                    )
                    output = enhanced
                except Exception:
                    output = google_out
            else:
                output = google_out

            cleaned = post_process(output)
            results.append(cleaned)

        return results


# --- CLI Entry Point ---
def translate_pdf_cli():
    import argparse

    parser = argparse.ArgumentParser(description="Hybrid PDF Translator CLI")
    parser.add_argument("pdf_path", help="Path to the PDF file to translate")
    parser.add_argument(
        "target_lang", help="ISO code of target language (e.g., hi, fr, es)"
    )
    parser.add_argument(
        "--max-pages", type=int, default=None, help="Max pages to translate"
    )
    parser.add_argument(
        "--start-page", type=int, default=1, help="Page to start from (default=1)"
    )
    parser.add_argument(
        "--tone-style",
        choices=["narrative", "formal", "casual"],
        default="narrative",
        help="Tone style for translation refinement (default: narrative)",
    )
    args = parser.parse_args()

    translator = HybridPDFTranslator(
        pdf_path=args.pdf_path,
        target_lang=args.target_lang,
        max_pages=args.max_pages,
        start_page=args.start_page,
        tone_style=args.tone_style,
    )
    results = translator.translate()
    for page in results:
        print(page)


# --- Frontend Integration Function ---
def translate_pdf_frontend(
    pdf_path: str,
    target_lang: str,
    max_pages: Optional[int] = None,
    start_page: int = 1,
    tone_style: str = "narrative",
) -> List[str]:
    translator = HybridPDFTranslator(
        pdf_path=pdf_path,
        target_lang=target_lang,
        max_pages=max_pages,
        start_page=start_page,
        tone_style=tone_style,
    )
    return translator.translate()

def hybrid_translate_single_text(text: str, target_lang: str, tone_style: str = "narrative") -> str:
    """
    Translates a single block of plain text using Google Translate and optionally Gemini for refinement.
    This is intended for frontend use where text is extracted client-side.
    """
    google_translator = GoogleTranslator()
    gemini_refiner = GeminiRefiner(style=tone_style)

    # Translate via Google first
    try:
        raw_translation = google_translator.translate(text, target_lang)
    except Exception as e:
        return f"[Google Translate failed: {e}]"

    # Refine using Gemini if supported
    if target_lang in GEMINI_LANGUAGES:
        try:
            refined = gemini_refiner.refine(
                raw_translation=raw_translation,
                original_text=text,
                target_lang=target_lang
            )
            result = refined
        except Exception as e:
            result = f"[Gemini failed, falling back to Google]\n{raw_translation}"
    else:
        result = raw_translation

    return post_process(result)

def google_translate_single_text(text: str, target_lang: str) -> str:
    """
    Translates a single block of text using only Google Translate (no Gemini refinement).
    """
    google_translator = GoogleTranslator()
    try:
        return google_translator.translate(text, target_lang)
    except Exception as e:
        return f"[Google Translate failed: {e}]"


if __name__ == "__main__":
    translate_pdf_cli()
