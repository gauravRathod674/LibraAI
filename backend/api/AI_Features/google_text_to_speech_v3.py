import os
import fitz  # PyMuPDF for PDF text extraction
from google.cloud import texttospeech
import io
import re
from pydub import AudioSegment # For combining audio segments

# --- Configuration ---
# Set the path to your PDF file
pdf_path = "ikigai.pdf"
# Set the output filename for the combined audio
output_audio_filename = "ikigai_chapter_audio_storyteller.mp3"

# --- Google Cloud Credentials Setup ---
# The google-cloud-texttospeech library automatically picks up the
# GOOGLE_APPLICATION_CREDENTIALS environment variable.
# Ensure you have set it in your terminal/PowerShell session BEFORE running this script:
# Example for PowerShell:
# $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\Gaurav Rathod.LAPTOP-V427NTHN\Documents\Nexus Library\backend\AI_Features\Google Text to Speech\nexus-text-to-speech-50d75f778774.json"

# --- Step 1: Initialize the Text-to-Speech client ---
try:
    client = texttospeech.TextToSpeechClient()
    print("Google Cloud Text-to-Speech client initialized successfully.")
except Exception as e:
    print(f"Error initializing client. Make sure GOOGLE_APPLICATION_CREDENTIALS is set correctly: {e}")
    print("Please ensure you've run the 'export' or '$env:' command in your terminal session.")
    exit() # Exit if authentication fails

# --- Function to extract text from PDF ---
def extract_text_from_pdf(file_path):
    """
    Extracts all text content from a PDF file.
    """
    try:
        pdf_document = fitz.open(file_path)
        extracted_text = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            # Add newline separation between pages to help with natural phrasing
            extracted_text += page.get_text() + "\n\n"
        pdf_document.close()
        return extracted_text
    except FileNotFoundError:
        print(f"Error: PDF file not found at '{file_path}'")
        return None
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

# --- Text Chunking Function ---
def chunk_text(text, max_bytes=4900):
    """
    Splits text into chunks for TTS API, respecting paragraph/sentence boundaries
    and a maximum byte limit. This helps avoid the 5000-byte API limit per request.
    It also adds a small buffer for the SSML tags like <speak><p><s>.
    """
    chunks = []
    current_chunk_elements = [] # Stores sentences/paragraphs for the current chunk
    current_chunk_byte_length = 0

    # Split by paragraphs first
    paragraphs = text.split('\n\n')

    for paragraph in paragraphs:
        if not paragraph.strip(): # Skip empty paragraphs
            continue

        # Split paragraph into sentences. We keep the delimiters to ensure natural breaks.
        # This regex splits by sentence-ending punctuation followed by whitespace.
        sentences = re.split(r'(?<=[.!?])\s+', paragraph.strip())

        for sentence in sentences:
            sentence_with_overhead = f"<speak><p><s>{sentence}</s></p></speak>" # Estimate SSML overhead
            sentence_bytes = len(sentence_with_overhead.encode('utf-8'))

            if current_chunk_byte_length + sentence_bytes > max_bytes:
                # If adding this sentence exceeds the limit, save the current accumulated chunk
                if current_chunk_elements:
                    chunks.append(" ".join(current_chunk_elements).strip())
                # Start a new chunk with the current sentence
                current_chunk_elements = [sentence]
                current_chunk_byte_length = sentence_bytes
            else:
                # Add sentence to current chunk
                current_chunk_elements.append(sentence)
                current_chunk_byte_length += sentence_bytes

        # After processing all sentences in a paragraph, if there's remaining content
        # in the current chunk, add it. This is important to ensure paragraphs don't
        # get prematurely cut if they don't fill a chunk entirely.
        if current_chunk_elements:
            chunks.append(" ".join(current_chunk_elements).strip())
            current_chunk_elements = [] # Reset for next paragraph
            current_chunk_byte_length = 0


    return [chunk for chunk in chunks if chunk] # Filter out any empty strings

# --- Main execution logic ---
if __name__ == "__main__":
    print(f"Attempting to read PDF from: {pdf_path}")
    full_text = extract_text_from_pdf(pdf_path)

    if not full_text:
        print("Exiting due to inability to extract text from PDF.")
        exit()

    print(f"Successfully extracted {len(full_text)} characters from PDF.")
    print("Chunking text for TTS synthesis...")
    text_chunks = chunk_text(full_text)

    if not text_chunks:
        print("Could not chunk text for synthesis. Text might be too short or malformed after extraction.")
        exit()

    print(f"Text split into {len(text_chunks)} chunks for synthesis.")

    combined_audio = AudioSegment.empty()

    # Define voice parameters once for consistency
    voice_selection_params = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Neural2-D",  # Excellent Neural2 voice for storytelling
        ssml_gender=texttospeech.SsmlVoiceGender.MALE
    )

    # Audio configuration once
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=1.0,
        pitch=0.0,
    )

    print("Starting audio synthesis for each chunk...")
    for i, chunk in enumerate(text_chunks):
        try:
            # Wrap each chunk with basic SSML for best naturalness in pacing
            ssml_chunk_input = f"<speak><p><s>{chunk}</s></p></speak>"
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml_chunk_input)

            # Perform the TTS request for the current chunk
            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice_selection_params,
                audio_config=audio_config
            )

            # Append the audio content to our combined audio
            audio_segment = AudioSegment.from_file(io.BytesIO(response.audio_content), format="mp3")
            combined_audio += audio_segment
            print(f"  Processed chunk {i+1}/{len(text_chunks)} (bytes: {len(chunk.encode('utf-8'))})")

        except Exception as e:
            print(f"Error synthesizing chunk {i+1}: {e}")
            print(f"Problematic chunk content (first 200 chars): {chunk[:200]}...")
            # Decide if you want to continue or exit on error
            continue # Continue to next chunk if one fails

    if combined_audio.duration_seconds > 0:
        # --- Step 6: Save the synthesized audio to a file ---
        try:
            with open(output_audio_filename, "wb") as out:
                combined_audio.export(out, format="mp3")
            print(f"\nSynthesis complete! Combined audio saved to '{output_audio_filename}'")
            print(f"Total audio duration: {combined_audio.duration_seconds:.2f} seconds.")
            print(f"You can now play '{output_audio_filename}' to hear the full chapter narrative.")
        except Exception as e:
            print(f"Error saving combined audio file: {e}")
    else:
        print("\nNo audio was generated. Please check for errors during synthesis.")