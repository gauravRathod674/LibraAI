import os
from google.cloud import texttospeech

# --- Important Note on GPU Usage ---
# Just a reminder: When using Google Cloud Text-to-Speech API, the GPU acceleration
# for processing these advanced voice models (like WaveNet/Neural2) happens
# on Google's powerful cloud infrastructure. Your local machine's GPU
# is not directly involved in the synthesis process, but it's crucial
# for tasks like local AI model training or high-end graphics processing.

# --- Step 1: Ensure your Google Cloud credentials are set ---
# This environment variable MUST be set in your PowerShell session
# before running this script:
# $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\Gaurav Rathod.LAPTOP-V427NTHN\Documents\LibraAI\backend\AI_Features\Google Text to Speech\nexus-text-to-speech-50d75f778774.json"

# --- Step 2: Initialize the Text-to-Speech client ---
try:
    client = texttospeech.TextToSpeechClient()
    print("Google Cloud Text-to-Speech client initialized successfully.")
except Exception as e:
    print(f"Error initializing client. Make sure GOOGLE_APPLICATION_CREDENTIALS is set correctly: {e}")
    print("Please set the environment variable in PowerShell like this:")
    print(r'$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\Gaurav Rathod.LAPTOP-V427NTHN\Documents\LibraAI\backend\AI_Features\Google Text to Speech\nexus-text-to-speech-50d75f778774.json"')
    exit() # Exit if authentication fails

# --- Step 3: Define the text to be synthesized using SSML for enhanced storytelling ---
# SSML (Speech Synthesis Markup Language) is crucial for expressive narration.
# We're fine-tuning pauses, adding subtle emphasis, and adjusting prosody for a more natural flow.
ssml_text_to_synthesize = """
<speak>
  <p>
    <s>In the quiet corners of the ancient library, <break time="300ms"/>a forgotten tale stirred to life.</s>
    <!-- Reduced the pause slightly for a more immediate impact after "library" -->

    <s>It was the story of the Whispering Woods, where trees sang lullabies<break strength="medium"/> and rivers hummed melodies of old.</s>
    <!-- Maintained a medium break here, as it feels natural for the conjunction. -->

    <s>Every <emphasis level="strong">rustle</emphasis> of leaves, <break time="150ms"/>every gentle breeze, <break time="250ms"/>carried fragments of this magical narrative,
    <prosody rate="1.05" pitch="+0.5st">waiting for a listener to piece them together.</prosody></s>
    <!-- Shortened the breaks further for a quicker, more flowing list.
         Subtly increased rate and slightly raised pitch for "waiting for a listener" to convey anticipation without overdoing it. -->

    <s>This voice, <prosody volume="+2dB">deep and resonant,</prosody> was perfect for conveying the wonder and mystery of such a place,<break time="400ms"/>
    making the listener feel as if they were truly walking among the singing trees.</s>
    <!-- Reduced the dramatic pause after "place" significantly from 700ms to 400ms.
         Slightly adjusted volume emphasis. -->
  </p>
</speak>
"""

# --- Step 4: Configure the synthesis request ---

# Input text is now SSML
synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text_to_synthesize)

# Select a high-quality Neural2 voice for expressive storytelling.
# 'en-US-Neural2-D' (male) or 'en-US-Neural2-C' (female) are excellent choices.
# Experiment with other WaveNet/Neural2 voices to find your perfect storyteller.
voice_selection_params = texttospeech.VoiceSelectionParams(
    language_code="en-US",            # Target language
    name="en-US-Neural2-D",          # Specific voice name for storytelling
    ssml_gender=texttospeech.SsmlVoiceGender.MALE # Explicitly set gender preference
)

# Audio configuration (MP3 for broad compatibility)
audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3,
    speaking_rate=1.0,  # Base speed, SSML tags will fine-tune specific sections
    pitch=0.0,          # Base pitch, SSML tags will fine-tune specific sections
)

# --- Step 5: Perform the Text-to-Speech request ---
print(f"Synthesizing speech using voice: {voice_selection_params.name} with SSML enhancements...")
try:
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice_selection_params,
        audio_config=audio_config
    )

    # --- Step 6: Save the synthesized audio to a file ---
    output_filename = "storytelling_audio_further_improved.mp3"
    with open(output_filename, "wb") as out:
        out.write(response.audio_content)
        print(f"Improved audio content written to file '{output_filename}'")

    print("\nSynthesis complete! Listen to the nuanced storytelling.")
    print(f"Play '{output_filename}' to hear the enhanced storytelling.")

except Exception as e:
    print(f"An error occurred during speech synthesis: {e}")
    print("Double-check:")
    print("1. Your GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly.")
    print("2. The Text-to-Speech API is enabled in your Google Cloud Project.")
    print("3. Your selected voice name is valid and available (e.g., 'en-US-Neural2-D').")
    print("4. You haven't exceeded your Google Cloud Text-to-Speech free tier limits.")
