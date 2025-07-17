import requests
import html

API_KEY = "AIzaSyBi0O2XvJRpWngtjvv2JswmGfnhESCy_20"
TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"

def get_dummy_page_text() -> str:
    """Simulates a realistic single book page (~1,800 characters)."""
    return (
        "The sun dipped below the western mountains, casting long shadows on the winding trail. "
        "Arav paused at the ridge, breathing in the crisp evening air.\n\n"
        "The valley below shimmered in golden light, dotted with tiny huts and freshly harvested fields. "
        "Memories of his childhood here came rushing back—playing near the stream, running barefoot over warm stones, "
        "and listening to grandfather’s stories by the fire.\n\n"
        "Tonight, the village awaited his return. He tightened the strap of his satchel and began the descent, "
        "heart swelling with a mix of anticipation and nostalgia.\n\n"
        "The scent of wildflowers filled the path, and in the distance, a flute’s melody welcomed him home. "
        "Every step forward was a step into a familiar past, reawakened by the hues of twilight and the whispering wind through the deodar trees."
    )

def translate_text_with_key(text: str, target_lang: str = "hi") -> str:
    """Translates English text to Hindi using API Key via REST request."""
    params = {
        "q": text,
        "target": target_lang,
        "source": "en",
        "format": "text",
        "key": API_KEY,
    }
    response = requests.post(TRANSLATE_URL, data=params)

    if response.status_code != 200:
        raise Exception(f"Translation failed: {response.text}")

    result = response.json()
    translated_raw = result["data"]["translations"][0]["translatedText"]
    translated_clean = html.unescape(translated_raw)
    return translated_clean

def main():
    text = get_dummy_page_text()
    print("Original Text (English):\n" + text)
    print("\nCharacter Count:", len(text))

    translated = translate_text_with_key(text)
    print("\nTranslated Text (Hindi):\n" + translated.encode('utf-8').decode('utf-8'))


if __name__ == "__main__":
    main()
