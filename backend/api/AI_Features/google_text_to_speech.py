import os
from google.cloud import texttospeech

# --- Important Note on GPU Usage ---
# When using Google Cloud Text-to-Speech API, the GPU acceleration happens
# on Google's cloud infrastructure. Your local machine (e.g., your Asus ROG Strix G16)
# does NOT need to have its GPU explicitly configured or used for this API.
# The heavy lifting of converting text to natural-sounding speech is done
# by Google's powerful servers in the cloud, which utilize their own GPUs.
# Your local Python script simply sends text and receives audio data over the internet.

# --- Step 1: Ensure your Google Cloud credentials are set ---
# The previous step involved setting an environment variable in PowerShell:
# $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\Gaurav Rathod.LAPTOP-V427NTHN\Documents\LibraAI\backend\AI_Features\Google Text to Speech\nexus-text-to-speech-50d75f778774.json"
# The google-cloud-python client library automatically looks for this variable.
# If it's not set, this script will raise an authentication error.

# --- Step 2: Initialize the Text-to-Speech client ---
# This client will use the credentials from the environment variable to authenticate.
try:
    client = texttospeech.TextToSpeechClient()
    print("Google Cloud Text-to-Speech client initialized successfully.")
except Exception as e:
    print(f"Error initializing client. Make sure GOOGLE_APPLICATION_CREDENTIALS is set correctly: {e}")
    print("Please set the environment variable in PowerShell like this:")
    print(r'$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\Gaurav Rathod.LAPTOP-V427NTHN\Documents\LibraAI\backend\AI_Features\Google Text to Speech\nexus-text-to-speech-50d75f778774.json"')
    exit() # Exit if authentication fails

# --- Step 3: Define the text to be synthesized ---
text_to_synthesize = (
    "In the quiet corners of the ancient library, a forgotten tale stirred to life. "
    "It was the story of the Whispering Woods, where trees sang lullabies and "
    "rivers hummed melodies of old. Every rustle of leaves, every gentle breeze, "
    "carried fragments of this magical narrative, waiting for a listener to piece "
    "them together. This voice, deep and resonant, was perfect for conveying "
    "the wonder and mystery of such a place, making the listener feel as if they "
    "were truly walking among the singing trees."
)

# --- Step 4: Configure the synthesis request ---

# Input text to be synthesized
synthesis_input = texttospeech.SynthesisInput(text=text_to_synthesize)

# Select a voice (choose a WaveNet or Neural2 voice for high quality)
# You can find a list of available voices and their names in the Google Cloud Console
# (Text-to-Speech -> Voices tab) or by using the client.list_voices() method.
# Example voices for English (US) that sound natural:
# 'en-US-Wavenet-D' (male)
# 'en-US-Wavenet-E' (female)
# 'en-US-Neural2-C' (female)
# 'en-US-Neural2-D' (male)
voice_selection_params = texttospeech.VoiceSelectionParams(
    language_code="en-US",            # Language code (e.g., "en-US", "en-GB", "hi-IN")
    name="en-US-Neural2-D",          # Specific voice name for storytelling
    ssml_gender=texttospeech.SsmlVoiceGender.MALE # Gender preference
)

# Audio configuration (MP3 is common and widely supported)
audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3,
    speaking_rate=1.0,  # Speed of speech (1.0 is normal)
    pitch=0.0,          # Pitch (0.0 is normal, positive for higher, negative for lower)
)

# --- Step 5: Perform the Text-to-Speech request ---
print(f"Synthesizing speech using voice: {voice_selection_params.name}...")
try:
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice_selection_params,
        audio_config=audio_config
    )

    # --- Step 6: Save the synthesized audio to a file ---
    output_filename = "storytelling_audio.mp3"
    with open(output_filename, "wb") as out:
        out.write(response.audio_content)
        print(f"Audio content written to file '{output_filename}'")

    print("\nSynthesis complete!")
    print(f"You can now play '{output_filename}' to hear the result.")

except Exception as e:
    print(f"An error occurred during speech synthesis: {e}")
    print("Common issues: API not enabled, invalid voice name, or exceeding free tier limits.")

