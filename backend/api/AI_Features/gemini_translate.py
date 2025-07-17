import os
from google import genai
from google.genai import types
import fitz  # PyMuPDF

API_KEY_ENV = "GEMINI_API_KEY"
MODEL_NAME = "gemini-2.0-flash"
PDF_PATH = "ikigai.pdf"
TARGET_LANGUAGE = "Hindi"
MAX_PAGES = 5  # <-- Translate only first 5 pages

# Initialize Gemini client
def get_client():
    key = os.getenv(API_KEY_ENV)
    if not key:
        raise RuntimeError(f"Set your API key in ${API_KEY_ENV}")
    return genai.Client(api_key=key)

# Extract text from the first N pages
def extract_pdf_text(path, max_pages):
    doc = fitz.open(path)
    pages = [page.get_text() for page in doc[:max_pages]]
    return pages

# Translate a single page
def translate_chunk(client, chunk, language):
    prompt = f"Translate the following text into {language}:\n\n{chunk}"
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[prompt]
    )
    return response.text.strip()

# Main translation function
def translate_pdf(client, path, target_lang, max_pages):
    chunks = extract_pdf_text(path, max_pages)
    translated = []

    print(f"📄 Translating first {len(chunks)} pages...")
    for i, chunk in enumerate(chunks, 1):
        if not chunk.strip():
            continue
        print(f"🔁 Translating page {i}...")
        translated_text = translate_chunk(client, chunk, target_lang)
        translated.append(f"--- Page {i} ---\n{translated_text}\n")

    return "\n".join(translated)

# Save the translation
def save_translated_text(text, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)

def main():
    client = get_client()
    translated = translate_pdf(client, PDF_PATH, TARGET_LANGUAGE, MAX_PAGES)
    save_translated_text(translated, f"translated_{TARGET_LANGUAGE}_5pages.txt")
    print("✅ Translation saved to translated_Hindi_5pages.txt")

if __name__ == "__main__":
    main()
