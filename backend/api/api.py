from ninja import Router, NinjaAPI, Schema, File
from ninja.files import UploadedFile as NinjaUploadedFile
from ninja.errors import HttpError
from datetime import datetime
import traceback
import os
import re


from django.conf import settings
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from api.pages.auth_page import router as auth_router
from api.pages.item_page import router as item_router
from api.pages.auth_page import AuthSchema, LoginPage
from api.models.models_transactions import BorrowingTransaction
from api.models.models_items import LibraryItem
from api.models.models_users import LibraryUser
from services.openlibrary.search_page import (
    SearchByBookStrategy,
    SearchByAuthorStrategy,
    SearchByInsideStrategy,
    SearchBySubjectStrategy,
    SearchByAdvanceSearchtrategy,
    SearchContext,
)
from services.semantic_scholar.search_page import scrape_semantic_scholar

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
    title:        str
    # link:         str
    authors:      List[str]
    venue:        str
    pub_date:     str
    tldr:         str
    # citations:    str
    pdf_link:     str

@api.get(
    "/search/research",
    response=List[ResearchPaperOut],
    auth=JWTAuth()
)
def research_search_api(request, title: str):
    """
    Scrape Semantic Scholar for `title` and return up to ~50 matching papers.
    """
    try:
        papers = scrape_semantic_scholar(title)
        return papers
    except Exception as e:
        # log and return a 500
        print("❌ research_search_api failed:", e)
        raise HttpError(500, f"Failed to fetch research papers: {e}")

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
    qs = BorrowingTransaction.objects.filter(
        user_id=request.user.id
    ).order_by("-borrow_date")

    result = []
    for tx in qs:
        item: LibraryItem = tx.library_item
        result.append({
            "id":            tx.id,
            "title":         item.title,
            "authors":       item.authors,
            "borrow_date":   tx.borrow_date,
            "due_date":      tx.due_date,
            "return_date":   tx.return_date,
            "status":        tx.status,
            "cover_image":   item.digital_source,  # or item.printed_book.cover_image if you store it there
        })

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
        "profile_photo_url": request.build_absolute_uri(user.profile_photo.url)
        if user.profile_photo
        else request.build_absolute_uri("/media/profile_photos/default.png")  # fallback default
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
def pdf_assistant(
    request,
    file: Optional[NinjaUploadedFile] = File(default=None),  # ✅ now truly optional
):
    try:
        pdf_url  = request.POST.get("pdf_url")
        question = request.POST.get("question")

        if not pdf_url or not question:
            return {"error": "Missing 'pdf_url' or 'question'."}

        print(f"📥 Received question: {question}")
        print(f"🔗 PDF URL: {pdf_url}")

        service = GeminiPDFAssistant()

        # ✅ Get cached file or upload again
        file_ref, temp_path = service.get_file_ref(pdf_url, upload_file=file)

        # ✅ Ask with fallback support
        answer = service.ask_question(file_ref, question, fallback_path=temp_path)

        return {
            "answer": answer,
            "fallback_used": False if file else True
        }

    except Exception as e:
        print("❌ Exception in /pdf_assistant/:")
        import traceback; traceback.print_exc()
        raise HttpError(500, f"Failed to process: {str(e)}")

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
