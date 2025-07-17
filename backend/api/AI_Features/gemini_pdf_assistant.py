#!/usr/bin/env python3
"""
gemini_pdf_assistant.py (OOP refactor + caching + Gemini fallback with text extraction)
"""

import os
import tempfile
import traceback
import requests
from typing import Optional, Dict, Tuple
import fitz  # PyMuPDF

from google import genai
from google.generativeai.types import File as GeminiFile
from ninja.files import UploadedFile

# Module-level cache: maps pdf_url → (GeminiFile, temp_path)
UPLOADED_FILES: Dict[str, Tuple[GeminiFile, str]] = {}


class GeminiPDFAssistant:
    """
    Service for handling PDF uploads and QA with Gemini API,
    with caching, text extraction fallback, and helpful debug logs.
    """

    API_KEY_ENV = "GEMINI_API_KEY"
    MODEL_NAME = "gemini-2.0-flash"

    def __init__(self):
        print("🔐 Initializing GeminiPDFAssistant...")
        key = os.getenv(self.API_KEY_ENV)
        if not key:
            raise EnvironmentError(f"❌ Set your API key in ${self.API_KEY_ENV}")
        self.client = genai.Client(api_key=key)
        print("✅ Gemini client initialized.")

    def _upload_from_path(self, path: str) -> GeminiFile:
        print(f"⏫ Uploading file to Gemini from path: {path}")
        uploaded = self.client.files.upload(file=path)
        print(f"✅ File uploaded. Gemini file name: {uploaded.name}")
        return uploaded

    def _download_to_temp(self, url: str) -> str:
        print(f"🌐 Downloading PDF from URL: {url}")
        try:
            r = requests.get(url)
            r.raise_for_status()
        except Exception as e:
            print(f"❌ Failed to download PDF: {e}")
            raise

        suffix = os.path.splitext(url)[1] or ".pdf"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp.write(r.content)
        tmp.close()
        print(f"✅ PDF downloaded and saved to temp: {tmp.name}")
        return tmp.name

    def _extract_text_from_pdf(self, path: str) -> str:
        print(f"📄 Extracting text from PDF for fallback: {path}")
        doc = fitz.open(path)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        return full_text.strip()

    def get_file_ref(
        self, pdf_url: str, upload_file: Optional[UploadedFile] = None
    ) -> Tuple[GeminiFile, str]:
        """
        Returns (GeminiFile, file_path) for fallback use.
        Uses static file if upload_file is given, otherwise downloads from URL.
        """
        print(
            f"📄 get_file_ref called with pdf_url: {pdf_url}, upload_file: {'present' if upload_file else 'absent'}"
        )

        if pdf_url in UPLOADED_FILES:
            print(f"🧠 Found cached file for: {pdf_url}")
            return UPLOADED_FILES[pdf_url]

        try:
            if upload_file:
                # ✅ Use filename from upload and construct static path
                filename = os.path.basename(upload_file.name)
                static_path = os.path.join("api", "AI_Features", filename)

                if not os.path.exists(static_path):
                    raise FileNotFoundError(
                        f"❌ Static PDF not found at: {static_path}"
                    )

                print(f"📂 Using static PDF at: {static_path}")
                file_ref = self._upload_from_path(static_path)
                UPLOADED_FILES[pdf_url] = (file_ref, static_path)
                print(f"✅ File cached under: {pdf_url}")
                return file_ref, static_path

            else:
                # 🌐 If file was not provided, fallback to downloading
                temp_path = self._download_to_temp(pdf_url)
                file_ref = self._upload_from_path(temp_path)
                UPLOADED_FILES[pdf_url] = (file_ref, temp_path)
                print(f"✅ File cached under: {pdf_url}")
                return file_ref, temp_path

        except Exception as e:
            print("❌ Exception in get_file_ref:")
            traceback.print_exc()
            raise

    def ask_question_with_text(
        self, text: str, question: str, temperature: float = 0.0, max_tokens: int = 1024
    ) -> str:
        print(f"🤖 Fallback: Asking Gemini using extracted text.")
        config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        try:
            system_prompt = """
                You are a highly intelligent, helpful assistant who provides clear, structured, and beautifully formatted **Markdown** answers.

                🎯 **Guidelines for all responses**:
                - Be **concise and direct by default**. Do **not overexplain** unless the user explicitly asks for details (e.g., "explain in detail", "give me a breakdown", "in-depth", etc.).
                - Always format your response with **bold headings**, **bullet points**, **numbered lists**, and **code blocks** (if applicable).
                - Use **paragraph spacing** for readability. Avoid huge walls of text.
                - If the user asks for *"summary"*, give **3–6 bullet points** maximum.
                - If the question is vague, **assume the user wants a helpful but short answer**.
                - Always avoid repeating definitions or book titles unless asked explicitly.

                🧠 **Voice and tone**:
                - Be professional, friendly, and helpful — never robotic.
                - Use a natural tone that’s easy to read and pleasing to the eye.
                - Never add "As an AI model..." or unnecessary disclaimers.

                📚 **For book/document questions**:
                - Focus on key ideas, structure, themes, and takeaways.
                - Use elegant section headers like `## Overview`, `## Key Concepts`, `## Takeaways`, etc., **only when asked for detail**.

                Now, based on the following user question, provide the best possible answer:

                """

            contents = [system_prompt + text + "\n\n" + question]

            resp = self.client.models.generate_content(
                model=self.MODEL_NAME,
                contents=contents,
                config=config,
            )
            print("✅ Gemini responded using fallback text.")
            return resp.text.strip()
        except Exception as e:
            print("❌ Gemini failed even with text:")
            traceback.print_exc()
            raise

    def ask_question(
        self,
        file: GeminiFile,
        question: str,
        fallback_path: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 1024,
    ) -> str:
        print(f"🤖 Asking Gemini with file: {question}")
        config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }

        try:
            system_prompt = """
            You are a highly intelligent, helpful assistant who provides clear, structured, and beautifully formatted **Markdown** answers.

            🎯 **Guidelines for all responses**:
            - Be **concise and direct by default**. Do **not overexplain** unless the user explicitly asks for details (e.g., "explain in detail", "give me a breakdown", "in-depth", etc.).
            - Always format your response with **bold headings**, **bullet points**, **numbered lists**, and **code blocks** (if applicable).
            - Use **paragraph spacing** for readability. Avoid huge walls of text.
            - If the user asks for *"summary"*, give **3–6 bullet points** maximum.
            - If the question is vague, **assume the user wants a helpful but short answer**.
            - Always avoid repeating definitions or book titles unless asked explicitly.

            🧠 **Voice and tone**:
            - Be professional, friendly, and helpful — never robotic.
            - Use a natural tone that’s easy to read and pleasing to the eye.
            - Never add "As an AI model..." or unnecessary disclaimers.

            📚 **For book/document questions**:
            - Focus on key ideas, structure, themes, and takeaways.
            - Use elegant section headers like `## Overview`, `## Key Concepts`, `## Takeaways`, etc., **only when asked for detail**.

            Now, based on the following user question, provide the best possible answer:

        """

            contents = [file, system_prompt + question]
            resp = self.client.models.generate_content(
                model=self.MODEL_NAME,
                contents=contents,
                config=config,
            )
            print("✅ Gemini responded using file.")
            return resp.text.strip()
        except Exception as e:
            error_msg = str(e)
            print(f"⚠️ Gemini failed with file: {error_msg}")
            if "no pages" in error_msg.lower() and fallback_path:
                print("🔁 Switching to fallback text method...")
                extracted_text = self._extract_text_from_pdf(fallback_path)
                return self.ask_question_with_text(extracted_text, question)
            traceback.print_exc()
            raise
