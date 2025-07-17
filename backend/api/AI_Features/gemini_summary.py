import os
import sys
from google import genai
from google.genai import types

API_KEY_ENV = "GEMINI_API_KEY"
MODEL_NAME = "gemini-1.5-pro"


class GeminiSummarizer:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv(API_KEY_ENV)
        if not self.api_key:
            sys.exit(f"Error: Please set your API key in the ${API_KEY_ENV} environment variable")
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = MODEL_NAME

    def _generate_prompt(self, text: str, text_type: str) -> str:
        return f"""
        You are an expert analyst tasked with creating a high-fidelity summary of a book {text_type}.
        Your summary should be clear, engaging, and easy to digest.

        Please structure your summary using Markdown with the following three sections:

        ## 📝 One-Paragraph Overview
        Start with a single, compelling paragraph that captures the central theme and core message of the text.

        ## 🔑 Key Points & Insights
        Create a bulleted list of the most important arguments, concepts, and advice. For each point, be sure to:
        - Preserve meaningful metaphors, quotes, names, and statistics.
        - Remain true to the source's tone and intent.

        ## ✨ Concluding Takeaway
        Conclude with a short, powerful paragraph explaining the ultimate conclusion or the main practical advice the reader should take away from the text.

        ---
        **Text to Summarize:**

        {text}
        ---
        """

    def summarize(self, text: str, text_type: str = "chapter") -> str:
        config = types.GenerateContentConfig(
            temperature=0.4,
            top_p=0.95,
            max_output_tokens=2048
        )

        prompt = self._generate_prompt(text, text_type)

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt],
                config=config
            )
            return response.text.strip()
        except Exception as e:
            return f"An error occurred: {e}"

    def summarize_page(self, text: str) -> str:
        return self.summarize(text, text_type="page")

    def summarize_chapter(self, text: str) -> str:
        return self.summarize(text, text_type="chapter")


# ============================== #
# Example usage (Can be removed or used in CLI script)
if __name__ == "__main__":
    sample_page = """Your page text here..."""
    sample_chapter = """Your chapter text here..."""

    summarizer = GeminiSummarizer()

    print("\n📄 Summary of Sample Page:\n")
    print(summarizer.summarize_page(sample_page))

    print("\n📘 Summary of Sample Chapter:\n")
    print(summarizer.summarize_chapter(sample_chapter))
