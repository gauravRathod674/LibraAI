import os
import fitz  # PyMuPDF
from google.cloud import texttospeech
import io
import re
import tempfile
import subprocess

# --- Configuration ---
pdf_path = "ikigai.pdf"

# ✅ Automatically set Google credentials
GOOGLE_CREDENTIAL_PATH = os.path.join(
    os.getcwd(),
    "Google Text to Speech",
    "nexus-text-to-speech-50d75f778774.json"
)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_CREDENTIAL_PATH

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
            ssml = f"<speak><p><s>{chunk}</s></p></speak>"
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml)

            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            print(f"  ▶ Playing chunk {i+1}/{len(text_chunks)}")
            play_audio(response.audio_content)

        except Exception as e:
            print(f"❌ Error in chunk {i+1}: {e}")
            print(f"Text: {chunk[:200]}...\n")
            continue

    print("\n✅ Playback Finished!")
