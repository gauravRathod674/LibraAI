from dotenv import load_dotenv
import os
import re
import fitz
import tempfile
import subprocess

from google.oauth2 import service_account
from google.cloud import texttospeech
from google.cloud import translate_v2 as translate
from django.conf import settings

# ✅ Load .env first
load_dotenv()


class TextToSpeechPlayer:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path

        # ✅ Dynamically resolve credentials
        creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.path.join(
            settings.BASE_DIR,
            "api",
            "AI_Features",
            "Google Text to Speech",
            "nexus-text-to-speech-50d75f778774.json",
        )
        print("✅ Loaded credentials from:", creds_path)

        if not os.path.exists(creds_path):
            raise FileNotFoundError(f"❌ Google credentials not found at: {creds_path}")

        # ✅ Set env var for downstream compatibility
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

        # ✅ Create clients with loaded credentials
        credentials = service_account.Credentials.from_service_account_file(creds_path)
        self.translate_client = translate.Client(credentials=credentials)
        self.tts_client = texttospeech.TextToSpeechClient(credentials=credentials)

        self.audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3, speaking_rate=1.0, pitch=0.0
        )

        self.lang_map = self._get_language_map()

    def _get_language_map(self):
        return {
            "en": "en-US",
            "hi": "hi-IN",
            "gu": "gu-IN",
            "bn": "bn-IN",
            "ta": "ta-IN",
            "te": "te-IN",
            "ml": "ml-IN",
            "mr": "mr-IN",
            "kn": "kn-IN",
            "ur": "ur-IN",
            "pa": "pa-IN",
            "or": "or-IN",
            "sa": "sa-IN",
            "ne": "ne-NP",
            "fr": "fr-FR",
            "de": "de-DE",
            "es": "es-ES",
            "it": "it-IT",
            "pt": "pt-PT",
            "ru": "ru-RU",
            "ja": "ja-JP",
            "ko": "ko-KR",
            "zh-CN": "cmn-CN",
            "zh-TW": "cmn-TW",
            "vi": "vi-VN",
            "th": "th-TH",
            "id": "id-ID",
            "tr": "tr-TR",
            "pl": "pl-PL",
            "nl": "nl-NL",
            "sv": "sv-SE",
            "fi": "fi-FI",
            "da": "da-DK",
            "no": "nb-NO",
            "cs": "cs-CZ",
            "sk": "sk-SK",
            "hu": "hu-HU",
            "ro": "ro-RO",
            "el": "el-GR",
            "ar": "ar-XA",
            "sw": "sw-KE",
            "am": "am-ET",
            "jw": "jv-ID",
            "is": "is-IS",
            "cy": "cy-GB",
            "lv": "lv-LV",
            "lt": "lt-LT",
            "et": "et-EE",
            "bg": "bg-BG",
            "uk": "uk-UA",
            "hr": "hr-HR",
            "sl": "sl-SI",
            "sr": "sr-RS",
            "he": "he-IL",
            "lo": "lo-LA",
            "km": "km-KH",
            "mn": "mn-MN",
            "si": "si-LK",
            "my": "my-MM",
            "ka": "ka-GE",
            "fa": "fa-IR",
            "ps": "ps-AF",
            "uz": "uz-UZ",
            "kk": "kk-KZ",
            "ky": "ky-KG",
            "tg": "tg-TJ",
            "az": "az-AZ",
            "hy": "hy-AM",
        }

    def extract_text(self):
        try:
            pdf = fitz.open(self.pdf_path)
            text = "\n\n".join(page.get_text() for page in pdf)
            pdf.close()
            return text
        except Exception as e:
            raise RuntimeError(f"Failed to extract text: {e}")

    def chunk_text(self, text, max_bytes=4900):
        chunks, current_chunk = [], []
        current_size = 0

        for paragraph in text.split("\n\n"):
            if not paragraph.strip():
                continue
            sentences = re.split(r"(?<=[.!?])\s+", paragraph.strip())
            for s in sentences:
                size = len(f"<speak><p><s>{s}</s></p></speak>".encode("utf-8"))
                if current_size + size > max_bytes:
                    if current_chunk:
                        chunks.append(" ".join(current_chunk).strip())
                    current_chunk = [s]
                    current_size = size
                else:
                    current_chunk.append(s)
                    current_size += size
        if current_chunk:
            chunks.append(" ".join(current_chunk).strip())
        return chunks

    def detect_language(self, text):
        try:
            return self.translate_client.detect_language(text)["language"]
        except Exception:
            return "en"

    def get_voice(self, lang_code):
        full_code = self.lang_map.get(lang_code, lang_code)
        try:
            voices = self.tts_client.list_voices().voices
            voice = next(
                (
                    v
                    for v in voices
                    if full_code in v.language_codes and "Neural" in v.name
                ),
                None,
            )
            if not voice:
                voice = next((v for v in voices if full_code in v.language_codes), None)
            if not voice:
                raise ValueError(f"No voice found for {full_code}")
            return texttospeech.VoiceSelectionParams(
                language_code=voice.language_codes[0],
                name=voice.name,
                ssml_gender=voice.ssml_gender,
            )
        except Exception as e:
            print(f"⚠️ Using fallback voice (en-US): {e}")
            return texttospeech.VoiceSelectionParams(
                language_code="en-US",
                name="en-US-Neural2-D",
                ssml_gender=texttospeech.SsmlVoiceGender.MALE,
            )

    def play_audio(self, audio_bytes):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(audio_bytes)
            tmp.flush()
            subprocess.run(
                ["ffplay", "-nodisp", "-autoexit", tmp.name],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

    def run(self):
        print(f"📖 Reading PDF from: {self.pdf_path}")
        text = self.extract_text()
        print(f"✅ Extracted {len(text)} characters.")
        chunks = self.chunk_text(text)
        print(f"✅ Generated {len(chunks)} chunks.")

        print("\n🔊 Starting Playback — Ctrl+C to stop\n")

        for idx, chunk in enumerate(chunks):
            try:
                lang = self.detect_language(chunk)
                voice = self.get_voice(lang)

                synthesis_input = texttospeech.SynthesisInput(
                    ssml=f"<speak><p><s>{chunk}</s></p></speak>"
                )
                response = self.tts_client.synthesize_speech(
                    input=synthesis_input,
                    voice=voice,
                    audio_config=self.audio_config,
                )
                print(f"▶ Chunk {idx+1}/{len(chunks)} — {lang} ({voice.name})")
                self.play_audio(response.audio_content)

            except Exception as e:
                print(f"❌ Error in chunk {idx+1}: {e}")
                continue

        print("\n✅ Playback Finished!")

    def extract_page_text(self, page_number: int) -> str:
        try:
            pdf = fitz.open(self.pdf_path)
            text = pdf[page_number - 1].get_text().strip()
            pdf.close()
            return text
        except Exception as e:
            raise RuntimeError(f"Failed to extract page {page_number}: {e}")

    def play_page(self, page_number: int):
        text = self.extract_page_text(page_number)
        chunks = self.chunk_text(text)
        for idx, chunk in enumerate(chunks):
            lang = self.detect_language(chunk)
            voice = self.get_voice(lang)
            ssml = f"<speak><p><s>{chunk}</s></p></speak>"
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml)
            resp = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=self.audio_config,
            )
            print(f"▶ Reading page {page_number}, chunk {idx+1}/{len(chunks)} ({lang})")
            self.play_audio(resp.audio_content)


# --- Entry (for testing locally) ---
if __name__ == "__main__":
    tts = TextToSpeechPlayer(pdf_path="ikigai.pdf")
    tts.run()
