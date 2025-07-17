import os

# 🔐 Set credentials first
GOOGLE_CREDENTIAL_PATH = os.path.join(
    os.getcwd(),
    "Google Text to Speech",
    "nexus-text-to-speech-50d75f778774.json"
)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_CREDENTIAL_PATH
assert os.path.exists(GOOGLE_CREDENTIAL_PATH), "❌ Credentials file not found!"

import fitz  # PyMuPDF
from google.cloud import texttospeech
from google.cloud import translate_v2 as translate
import io
import re
import tempfile
import subprocess

# --- Configuration ---
pdf_path = "ikigai.pdf"
translate_client = translate.Client()

lang_map = {
    "en": "en-US",        # English (United States)
    "hi": "hi-IN",        # Hindi (India)
    "gu": "gu-IN",        # Gujarati (India)
    "bn": "bn-IN",        # Bengali (India)
    "ta": "ta-IN",        # Tamil (India)
    "te": "te-IN",        # Telugu (India)
    "ml": "ml-IN",        # Malayalam (India)
    "mr": "mr-IN",        # Marathi (India)
    "kn": "kn-IN",        # Kannada (India)
    "ur": "ur-IN",        # Urdu (India)
    "pa": "pa-IN",        # Punjabi (India)
    "or": "or-IN",        # Odia (India)
    "sa": "sa-IN",        # Sanskrit (India)
    "ne": "ne-NP",        # Nepali (Nepal)

    "fr": "fr-FR",        # French (France)
    "de": "de-DE",        # German (Germany)
    "es": "es-ES",        # Spanish (Spain)
    "it": "it-IT",        # Italian (Italy)
    "pt": "pt-PT",        # Portuguese (Portugal)
    "ru": "ru-RU",        # Russian (Russia)
    "ja": "ja-JP",        # Japanese (Japan)
    "ko": "ko-KR",        # Korean (South Korea)
    "zh-CN": "cmn-CN",    # Chinese (Simplified, Mandarin, China)
    "zh-TW": "cmn-TW",    # Chinese (Traditional, Mandarin, Taiwan)
    "vi": "vi-VN",        # Vietnamese (Vietnam)
    "th": "th-TH",        # Thai (Thailand)
    "id": "id-ID",        # Indonesian (Indonesia)
    "tr": "tr-TR",        # Turkish (Turkey)
    "pl": "pl-PL",        # Polish (Poland)
    "nl": "nl-NL",        # Dutch (Netherlands)
    "sv": "sv-SE",        # Swedish (Sweden)
    "fi": "fi-FI",        # Finnish (Finland)
    "da": "da-DK",        # Danish (Denmark)
    "no": "nb-NO",        # Norwegian (Norway)
    "cs": "cs-CZ",        # Czech (Czech Republic)
    "sk": "sk-SK",        # Slovak (Slovakia)
    "hu": "hu-HU",        # Hungarian (Hungary)
    "ro": "ro-RO",        # Romanian (Romania)
    "el": "el-GR",        # Greek (Greece)
    "ar": "ar-XA",        # Arabic (Generic Arabic)
    "sw": "sw-KE",        # Swahili (Kenya)
    "am": "am-ET",        # Amharic (Ethiopia)
    "jw": "jv-ID",        # Javanese (Indonesia)
    "is": "is-IS",        # Icelandic (Iceland)
    "cy": "cy-GB",        # Welsh (United Kingdom)
    "lv": "lv-LV",        # Latvian (Latvia)
    "lt": "lt-LT",        # Lithuanian (Lithuania)
    "et": "et-EE",        # Estonian (Estonia)
    "bg": "bg-BG",        # Bulgarian (Bulgaria)
    "uk": "uk-UA",        # Ukrainian (Ukraine)
    "hr": "hr-HR",        # Croatian (Croatia)
    "sl": "sl-SI",        # Slovenian (Slovenia)
    "sr": "sr-RS",        # Serbian (Serbia)
    "he": "he-IL",        # Hebrew (Israel)
    "lo": "lo-LA",        # Lao (Laos)
    "km": "km-KH",        # Khmer (Cambodia)
    "mn": "mn-MN",        # Mongolian (Mongolia)
    "si": "si-LK",        # Sinhala (Sri Lanka)
    "my": "my-MM",        # Burmese (Myanmar)
    "ka": "ka-GE",        # Georgian (Georgia)
    "fa": "fa-IR",        # Persian/Farsi (Iran)
    "ps": "ps-AF",        # Pashto (Afghanistan)
    "uz": "uz-UZ",        # Uzbek (Uzbekistan)
    "kk": "kk-KZ",        # Kazakh (Kazakhstan)
    "ky": "ky-KG",        # Kyrgyz (Kyrgyzstan)
    "tg": "tg-TJ",        # Tajik (Tajikistan)
    "az": "az-AZ",        # Azerbaijani (Azerbaijan)
    "hy": "hy-AM",        # Armenian (Armenia)
    "ur": "ur-PK",        # Urdu (Pakistan)
}


# --- Initialize Text-to-Speech Client ---
try:
    client = texttospeech.TextToSpeechClient()
    print("✅ Google Cloud TTS client initialized successfully.")
except Exception as e:
    print(f"❌ Error initializing client: {e}")
    print("Check if the credentials path is correct.")
    exit()

# --- Extract Text from PDF ---
def extract_text_from_pdf(file_path):
    try:
        pdf_document = fitz.open(file_path)
        extracted_text = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            extracted_text += page.get_text() + "\n\n"
        pdf_document.close()
        return extracted_text
    except FileNotFoundError:
        print(f"❌ PDF not found at '{file_path}'")
        return None
    except Exception as e:
        print(f"❌ Error extracting text: {e}")
        return None

# --- Chunk Text for TTS ---
def chunk_text(text, max_bytes=4900):
    chunks = []
    current_chunk_elements = []
    current_chunk_byte_length = 0

    paragraphs = text.split('\n\n')

    for paragraph in paragraphs:
        if not paragraph.strip():
            continue

        sentences = re.split(r'(?<=[.!?])\s+', paragraph.strip())
        for sentence in sentences:
            estimated_bytes = len(f"<speak><p><s>{sentence}</s></p></speak>".encode('utf-8'))

            if current_chunk_byte_length + estimated_bytes > max_bytes:
                if current_chunk_elements:
                    chunks.append(" ".join(current_chunk_elements).strip())
                current_chunk_elements = [sentence]
                current_chunk_byte_length = estimated_bytes
            else:
                current_chunk_elements.append(sentence)
                current_chunk_byte_length += estimated_bytes

        if current_chunk_elements:
            chunks.append(" ".join(current_chunk_elements).strip())
            current_chunk_elements = []
            current_chunk_byte_length = 0

    return [chunk for chunk in chunks if chunk]

def detect_language(text: str) -> str:
    try:
        detection = translate_client.detect_language(text)
        return detection["language"]
    except Exception as e:
        print(f"⚠️ Language detection failed: {e}")
        return "en"  # fallback

def get_voice_for_language(lang_code: str) -> texttospeech.VoiceSelectionParams:
    try:
        voices = client.list_voices().voices
        # Try to find a Neural voice first
        voice = next((v for v in voices if lang_code in v.language_codes and "Neural" in v.name), None)
        # Fallback to any voice with that language
        if not voice:
            voice = next((v for v in voices if lang_code in v.language_codes), None)
        if not voice:
            raise ValueError(f"No voice available for language '{lang_code}'")

        return texttospeech.VoiceSelectionParams(
            language_code=voice.language_codes[0],
            name=voice.name,
            ssml_gender=voice.ssml_gender
        )
    except Exception as e:
        print(f"⚠️ Voice selection failed: {e}. Falling back to en-US.")
        return texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Neural2-D",
            ssml_gender=texttospeech.SsmlVoiceGender.MALE
        )

# --- Play Audio via ffplay ---
def play_audio(audio_bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmpfile:
        tmpfile.write(audio_bytes)
        tmpfile.flush()
        subprocess.run(
            ["ffplay", "-nodisp", "-autoexit", tmpfile.name],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

# --- Main ---
if __name__ == "__main__":
    print(f"📖 Reading PDF from: {pdf_path}")
    full_text = extract_text_from_pdf(pdf_path)

    if not full_text:
        print("❌ No text extracted. Exiting.")
        exit()

    print(f"✅ Extracted {len(full_text)} characters.")
    print("🔍 Chunking text...")
    text_chunks = chunk_text(full_text)

    if not text_chunks:
        print("❌ No chunks generated. Exiting.")
        exit()

    print(f"✅ Generated {len(text_chunks)} chunks.")

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Neural2-D",
        ssml_gender=texttospeech.SsmlVoiceGender.MALE
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=1.0,
        pitch=0.0
    )

    print("\n🔊 Starting Real-Time Playback")
    print("Press Ctrl+C to stop anytime.\n")

    for i, chunk in enumerate(text_chunks):
        try:
            lang = detect_language(chunk)
            lang_code = lang_map.get(lang, lang)  # 👈 normalize to full voice code
            voice = get_voice_for_language(lang_code)

            ssml = f"<speak><p><s>{chunk}</s></p></speak>"
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml)

            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            print(f"  ▶ Playing chunk {i+1}/{len(text_chunks)} ({lang}, voice: {voice.name})")
            play_audio(response.audio_content)

        except Exception as e:
            print(f"❌ Error in chunk {i+1}: {e}")
            print(f"Text: {chunk[:200]}...\n")
            continue

    print("\n✅ Playback Finished!")
