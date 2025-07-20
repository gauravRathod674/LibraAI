import json
from ninja import Router, NinjaAPI, Schema, File
from ninja.files import UploadedFile as NinjaUploadedFile
from ninja.errors import HttpError
import threading
from datetime import datetime
import traceback
import requests
import os
import re


from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from api.pages.auth_page import router as auth_router
from api.pages.item_page import router as item_router
from api.pages.auth_page import AuthSchema, LoginPage
from api.models.models_transactions import BorrowingTransaction
from api.models.models_items import LibraryItem
from api.models.models_users import LibraryUser
from api.models.models_downloads import Download
from services.openlibrary.search_page import (
    SearchByBookStrategy,
    SearchByAuthorStrategy,
    SearchByInsideStrategy,
    SearchBySubjectStrategy,
    SearchByAdvanceSearchtrategy,
    SearchContext,
)
from services.semantic_scholar.search_page import scrape_semantic_scholar, safe_filename

from typing import Optional, List
from django.views.decorators.csrf import csrf_exempt
from api.AI_Features.gemini_summary import GeminiSummarizer
from api.AI_Features.gemini_pdf_assistant import GeminiPDFAssistant
from api.AI_Features.hybrid_translate import hybrid_translate_single_text
from api.AI_Features.hybrid_translate import google_translate_single_text
from api.AI_Features.google_text_to_speech_v6 import TextToSpeechPlayer
from api.utils.jwt_auth import JWTAuth


router = Router()
api = NinjaAPI()


@api.get("/test/")
def test_api(request):
    return {"message": "LibraAI API is working!"}


login_page = LoginPage()


@api.get("/login")
def get_login(request):
    return login_page.get_login(request)


@api.post("/login")
def auth(request, data: AuthSchema):
    return login_page.auth(request, data)


@api.get("/search")
def general_search_api(
    request,
    q: str,
    mode: Optional[str] = "everything",
    sort_by: Optional[str] = "relevance",
    page: Optional[int] = 1,
):
    if mode == "everything":
        strategy = SearchByBookStrategy(query=q, sort_by=sort_by, headless=True)
    elif mode == "authors":
        strategy = SearchByAuthorStrategy(query=q)
    elif mode == "inside":
        strategy = SearchByInsideStrategy(query=q)
    elif mode == "subject":
        strategy = SearchBySubjectStrategy(query=q)
    else:
        return {"error": "Invalid 'mode'. Use: everything, authors, inside, subject."}

    context = SearchContext(strategy)
    data = context.search(page=page)

    return {
        "results": data.get("pages", {}).get(f"page_{page}", []),
        **data,
    }


@api.get("/search/advancedsearch")
def advanced_search_api(
    request,
    title: Optional[str] = "",
    author: Optional[str] = "",
    isbn: Optional[str] = "",
    subject: Optional[str] = "",
    publisher: Optional[str] = "",
    sort_by: Optional[str] = "relevance",
    page: Optional[int] = 1,
):
    strategy = SearchByAdvanceSearchtrategy(
        title=title,
        author=author,
        isbn=isbn,
        subject=subject,
        publisher=publisher,
        sort_by=sort_by,
        headless=True,
    )
    context = SearchContext(strategy)
    return context.search(page=page)


# ─────────────────────────────────────────────────────────────────────────────
# Response schema for a single research paper
class ResearchPaperOut(Schema):
    title: str
    # link:         str
    authors: List[str]
    venue: str
    pub_date: str
    tldr: str
    # citations:    str
    pdf_link: str


# In-memory set to track running jobs. For production, a more robust solution like Redis is recommended.
SCRAPING_IN_PROGRESS = set()
SCRAPING_LOCK = threading.Lock()

def scrape_and_cache_task(query: str):
    """
    This function runs in the background to scrape and cache the data.
    """
    print(f"✅ Starting background scraping for: {query}")
    try:
        # This function blocks until scraping is complete, but it's running in a separate thread.
        scrape_semantic_scholar(query)
    except Exception as e:
        print(f"❌ Scraping failed for '{query}': {e}")
    finally:
        # When done (or if it fails), remove the query from the in-progress set.
        with SCRAPING_LOCK:
            if query in SCRAPING_IN_PROGRESS:
                SCRAPING_IN_PROGRESS.remove(query)
        print(f"✅ Finished background task for: {query}")


@api.get("/search/research", response=List[ResearchPaperOut], auth=JWTAuth())
def research_search_api(request, title: str):
    """
    Scrape Semantic Scholar for `title`.

    - If results are cached, returns them immediately with a 200 OK status.
    - If not cached, starts a background scraping task and returns a
      202 Accepted status, telling the client to poll this endpoint again.
    """
    if not title:
        raise HttpError(400, "The 'title' query parameter is required.")

    query = title.strip()
    cache_path = os.path.join("data_cache", "semantic_scholar", safe_filename(query))

    # 1. If the result is already cached, return it.
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # For Ninja, we return data directly for a 200 OK response.
        # The ResearchPaperOut schema will validate this.
        return data

    # 2. If not cached, check if a job is already running.
    with SCRAPING_LOCK:
        if query in SCRAPING_IN_PROGRESS:
            # Tell the client we're still processing.
            return JsonResponse({"status": "processing"}, status=202)

        # 3. If not cached and not running, start the new background task.
        SCRAPING_IN_PROGRESS.add(query)
        # Use a standard Python thread to run the task in the background.
        thread = threading.Thread(target=scrape_and_cache_task, args=(query,))
        thread.start()

    # Immediately return a 202 Accepted response.
    return JsonResponse({"status": "processing"}, status=202)

# ─── Schema for the new download request ──────────────────────────────────────
class DownloadRequest(Schema):
    pdf_url: str
    title: str

def format_file_size(size_in_bytes):
    """Converts bytes to a human-readable format (KB, MB, GB)."""
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024**2:
        return f"{size_in_bytes/1024:.2f} KB"
    elif size_in_bytes < 1024**3:
        return f"{size_in_bytes/1024**2:.2f} MB"
    else:
        return f"{size_in_bytes/1024**3:.2f} GB"

# ─── New endpoint to download a research paper ────────────────────────────────
@api.post("/download-research-paper", auth=JWTAuth())
def download_research_paper(request, data: DownloadRequest):
    """
    Downloads a PDF from a URL, saves it locally, and creates a download record.
    """
    if not request.user:
        raise HttpError(401, "Unauthorized")

    # 1. Sanitize the title to create a safe filename
    sanitized_title = re.sub(r'[\s:/\\]+', '_', data.title)
    file_name = f"{sanitized_title}.pdf"

    # 2. Check if this user has already downloaded this file
    if Download.objects.filter(user=request.user, file_name=file_name).exists():
        return JsonResponse({"message": "File already downloaded."}, status=208) # 208 Already Reported

    try:
        # 3. Fetch the PDF content from the external URL
        response = requests.get(data.pdf_url, stream=True, timeout=30)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        pdf_content = response.content
        file_size_bytes = len(pdf_content)
        file_size_str = format_file_size(file_size_bytes)

        # 4. Define save paths and ensure directories exist
        # Note: Adjust these paths if your project structure differs from BASE_DIR -> project_root
        backend_save_path = os.path.join(settings.BASE_DIR, 'downloads', file_name)
        frontend_save_path = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', 'downloads', file_name)

        os.makedirs(os.path.dirname(backend_save_path), exist_ok=True)
        os.makedirs(os.path.dirname(frontend_save_path), exist_ok=True)

        # 5. Save the file to both locations
        with open(backend_save_path, 'wb') as f_back:
            f_back.write(pdf_content)
        with open(frontend_save_path, 'wb') as f_front:
            f_front.write(pdf_content)
        
        print(f"✅ Saved PDF to backend: {backend_save_path}")
        print(f"✅ Saved PDF to frontend: {frontend_save_path}")

        # 6. Create the database record
        new_download = Download.objects.create(
            user=request.user,
            file_name=file_name,
            file_size=file_size_str
        )
        
        return {
            "message": "Download successful!",
            "download": {
                "id": new_download.id,
                "file_name": new_download.file_name,
                "file_size": new_download.file_size
            }
        }

    except requests.exceptions.RequestException as e:
        raise HttpError(500, f"Failed to download PDF from source: {str(e)}")
    except IOError as e:
        raise HttpError(500, f"Failed to save PDF file: {str(e)}")
    except Exception as e:
        raise HttpError(500, f"An unexpected error occurred: {str(e)}")



# ─── Response schema for a single download record ──────────────────────────────
class DownloadOut(Schema):
    id: int
    file_name: str
    file_size: str
    downloaded_at: datetime

# ─── List all downloads for current user ────────────────────────────────────────
@api.get("/downloads", response=List[DownloadOut], auth=JWTAuth())
def get_downloads(request):
    if not request.user:
        raise HttpError(401, "Unauthorized")
    qs = Download.objects.filter(user=request.user).order_by("-downloaded_at")
    return [
        {
            "id": d.id,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "downloaded_at": d.downloaded_at,
        }
        for d in qs
    ]

# ─── Delete a single download by ID ───────────────────────────────────────────
@api.delete("/downloads/{download_id}", auth=JWTAuth())
def delete_download(request, download_id: int):
    if not request.user:
        raise HttpError(401, "Unauthorized")
    d = get_object_or_404(Download, id=download_id, user=request.user)
    d.delete()
    return {"message": "Download record deleted."}

# ─── Clear all download history for current user ──────────────────────────────
@api.delete("/downloads", auth=JWTAuth())
def clear_downloads(request):
    if not request.user:
        raise HttpError(401, "Unauthorized")
    Download.objects.filter(user=request.user).delete()
    return {"message": "All download history cleared."}

# ─────────────────────────────────────────────────────────────────────────────
# Response schema for a single borrowing transaction
class BorrowingTransactionOut(Schema):
    id: int
    title: str
    authors: str
    borrow_date: datetime
    due_date: datetime
    return_date: Optional[datetime]
    status: str
    cover_image: Optional[str]


# ─────────────────────────────────────────────────────────────────────────────
@api.get("/borrow-history", response=List[BorrowingTransactionOut], auth=JWTAuth())
def get_borrow_history(request):
    """
    Returns all BorrowingTransaction records for the current user,
    ordered by most-recent borrow_date first.
    """
    # 1) Authentication check
    print(f"🔒 Authenticated user: {request.user}")
    if not request.user:
        raise HttpError(401, "Unauthorized")

    # 2) Fetch & serialize
    qs = BorrowingTransaction.objects.filter(user_id=request.user.id).order_by(
        "-borrow_date"
    )

    result = []
    for tx in qs:
        item: LibraryItem = tx.library_item
        result.append(
            {
                "id": tx.id,
                "title": item.title,
                "authors": item.authors,
                "borrow_date": tx.borrow_date,
                "due_date": tx.due_date,
                "return_date": tx.return_date,
                "status": tx.status,
                "cover_image": item.digital_source,  # or item.printed_book.cover_image if you store it there
            }
        )

    return result


# -------------------------------
# 🧑‍💼 USER PROFILE ENDPOINTS
# -------------------------------


@api.get("/user/profile/", auth=JWTAuth())
def get_user_profile(request):
    user = request.user
    return {
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "profile_photo_url": (
            request.build_absolute_uri(user.profile_photo.url)
            if user.profile_photo
            else request.build_absolute_uri("/media/profile_photos/default.png")
        ),  # fallback default
    }


@api.put("/user/profile/", auth=JWTAuth())
def update_profile_photo(request, profile_photo: NinjaUploadedFile = File(...)):
    user = request.user
    user.profile_photo = profile_photo
    user.save()
    return {"message": "✅ Profile photo updated successfully."}


@api.delete("/user/profile/", auth=JWTAuth())
def delete_user_account(request):
    user = request.user
    user.delete()
    return {"message": "⚠️ User account deleted permanently."}


# ------------------------------
# Summary Endpoint with Gemini Integration
# ------------------------------


class SummaryRequest(Schema):
    text: str
    text_type: Optional[str] = "page"  # Defaults to "page", can be "chapter" too


@api.post("/summary")
def generate_summary(request, data: SummaryRequest):
    summarizer = GeminiSummarizer()

    if data.text_type == "chapter":
        summary = summarizer.summarize_chapter(data.text)
    else:
        summary = summarizer.summarize_page(data.text)

    print(f"Generated Summary: {summary}")
    if not summary:
        return {"error": "Failed to generate summary. Please check the input text."}

    return {
        "message": "Summary generated successfully.",
        "summary": summary,
    }


@api.post("/pdf_assistant/")
def pdf_assistant(request):
    """
    Handles questions about a PDF. Dynamically finds the PDF in the 'downloads'
    directory based on the URL provided by the frontend.
    """
    try:
        # The frontend sends the web path, e.g., "/downloads/My-File.pdf"
        pdf_url = request.POST.get("pdf_url")
        question = request.POST.get("question")

        if not pdf_url or not question:
            raise HttpError(400, "Missing 'pdf_url' or 'question'.")

        print(f"📥 Received question: {question}")
        print(f"🔗 PDF URL from frontend: {pdf_url}")

        # --- DYNAMIC PATH LOGIC ---
        # 1. Extract the filename from the URL path
        filename = os.path.basename(pdf_url)
        if not filename:
            raise HttpError(400, "Invalid 'pdf_url' format. Could not extract filename.")

        # 2. Construct the full, absolute path to the file in the `backend/downloads` directory
        #    This assumes your settings.BASE_DIR points to the `backend` folder.
        file_path = os.path.join(settings.BASE_DIR, 'downloads', filename)
        print(f"🗺️  Resolved file path on server: {file_path}")

        # 3. Check if the file actually exists on the server before proceeding
        if not os.path.exists(file_path):
            raise HttpError(404, f"PDF file '{filename}' not found on the server.")
        # --- END DYNAMIC PATH LOGIC ---

        service = GeminiPDFAssistant()

        # Call the refactored service method.
        # We use the original pdf_url as the unique key for caching.
        file_ref, resolved_path = service.get_file_ref(cache_key=pdf_url, file_path=file_path)

        # Ask the question using the file reference
        answer = service.ask_question(file_ref, question, fallback_path=resolved_path)

        return {"answer": answer}

    except HttpError as e:
        # Re-raise known HTTP errors to let Ninja handle the response
        raise e
    except Exception as e:
        # Catch any other unexpected errors
        print("❌ Unhandled exception in /pdf_assistant/:")
        traceback.print_exc()
        raise HttpError(500, f"An unexpected error occurred: {str(e)}")


class TranslateRequest(Schema):
    pdf_url: str
    text: str
    target_lang: str
    scope: Optional[str] = "page"
    page_number: Optional[int] = 1


@api.post("/translate/")
def translate_text(request, data: TranslateRequest):
    """
    Translates plain text content (from frontend) using the hybrid method.
    """

    # 🖨️ Debug print of incoming data
    print("\n--- Incoming Translation Request ---")
    print("Target Language:", data.target_lang)
    print("Scope:", data.scope)
    print("Text Preview (first 500 chars):\n", data.text[:500])
    print("------------------------------------\n")

    translated_text = hybrid_translate_single_text(data.text, data.target_lang)
    return {"translation": translated_text}


# class TranslateChunksRequest(Schema):
#     items: List[str]
#     target_lang: str

# @api.post("/translate_chunks/")
# def translate_chunks(request, data: TranslateChunksRequest):
#     """
#     Translates each PDF.js text-item (span) individually.
#     """
#     print(f"\n🔵 Translating {len(data.items)} chunks to '{data.target_lang}'\n")

#     translations = []
#     for idx, chunk in enumerate(data.items):
#         try:
#             translated = hybrid_translate_single_text(chunk, data.target_lang)
#         except Exception as e:
#             print(f"❌ Error translating chunk {idx}: {e}")
#             translated = chunk  # fallback to original
#         translations.append(translated)

#     return {"translations": translations}


class TranslateChunksRequest(Schema):
    items: List[str]
    target_lang: str


@csrf_exempt
@api.post("/translate_chunks/")
def translate_chunks(request, data: TranslateChunksRequest):
    """
    Uses only Google Translate for each individual PDF.js text item.
    """
    translations = []
    for chunk in data.items:
        try:
            translation = google_translate_single_text(chunk, data.target_lang)
        except Exception as e:
            print(f"❌ Error translating: {chunk} → {e}")
            translation = chunk  # fallback: keep original if translation fails
        translations.append(translation)

    return {"translations": translations}


class ReadAloudRequest(Schema):
    pdf_name: str
    page_number: int


@api.post("/read_aloud/")
@csrf_exempt
def read_aloud(request, data: ReadAloudRequest):
    """
    Streams TTS audio for a single PDF page back to the client (via server-side playback).
    """
    pdf_path = os.path.join(settings.BASE_DIR, "api", "AI_Features", data.pdf_name)
    if not os.path.exists(pdf_path):
        raise HttpError(404, f"PDF not found: {data.pdf_name}")

    player = TextToSpeechPlayer(pdf_path=pdf_path)
    try:
        player.play_page(data.page_number)
    except Exception as e:
        raise HttpError(500, f"Read-aloud failed: {e}")

    return {"message": f"Started reading {data.pdf_name}, page {data.page_number}"}
    return {"message": "Read-aloud feature is currently disabled."}


api.add_router("/items", item_router)
