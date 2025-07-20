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

# Module-level cache: maps a unique key (like a URL or path) → (GeminiFile, temp_path)
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

    def _extract_text_from_pdf(self, path: str) -> str:
        print(f"📄 Extracting text from PDF for fallback: {path}")
        doc = fitz.open(path)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        return full_text.strip()

    def get_file_ref(
        self, cache_key: str, file_path: str
    ) -> Tuple[GeminiFile, str]:
        """
        Returns (GeminiFile, file_path) for fallback use.
        Uses the provided file_path to upload the file to Gemini and caches it against the cache_key.
        """
        print(
            f"📄 get_file_ref called with cache_key: {cache_key}, file_path: {file_path}"
        )

        if cache_key in UPLOADED_FILES:
            print(f"🧠 Found cached file for: {cache_key}")
            return UPLOADED_FILES[cache_key]

        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(
                    f"❌ PDF not found on the server at the specified path: {file_path}"
                )

            print(f"📂 Using local PDF at: {file_path}")
            file_ref = self._upload_from_path(file_path)
            UPLOADED_FILES[cache_key] = (file_ref, file_path)
            print(f"✅ File cached under key: {cache_key}")
            return file_ref, file_path

        except Exception as e:
            print("❌ Exception in get_file_ref:")
            traceback.print_exc()
            raise

    def ask_question_with_text(
        self, text: str, question: str, temperature: float = 0.0, max_tokens: int = 1024
    ) -> str:
        print(f"🤖 Fallback: Asking Gemini using extracted text.")
        # ... (rest of this method is unchanged)
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
        # ... (rest of this method is unchanged)
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