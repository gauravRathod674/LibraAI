from elevenlabs import ElevenLabsClient

client = ElevenLabsClient(api_key="sk_010dd9ce9a588ce311e7c1a7021248d61a087f30c787fa15")

# Generate speech from text
audio = client.text_to_speech(
    text="Hello world!",
    voice="Rachel"  # or your preferred voice
)

# Save audio to a file
with open("output.mp3", "wb") as f:
    f.write(audio)
