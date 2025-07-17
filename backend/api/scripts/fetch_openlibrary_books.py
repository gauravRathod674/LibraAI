import aiohttp
import asyncio
import json
import os
from aiohttp import ClientSession
from tqdm import tqdm
import time

# Constants
TOTAL_BOOKS = 10000
BOOKS_PER_REQUEST = 50  # OpenLibrary allows batch fetching
SAVE_PATH = "sources/open_library/books_metadata.json"
SEARCH_URL = "https://openlibrary.org/search.json?q=book&limit=100&page={page}"
BOOK_DETAILS_URL = "https://openlibrary.org/works/{work_id}.json"

# Ensure save directory exists
os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

async def fetch_valid_book_ids():
    """Fetch valid book IDs from OpenLibrary Search API across multiple pages."""
    book_ids = []
    page = 1

    async with aiohttp.ClientSession() as session:
        while len(book_ids) < TOTAL_BOOKS:
            async with session.get(SEARCH_URL.format(page=page)) as response:
                if response.status == 200:
                    data = await response.json()
                    new_ids = [book["key"].replace("/works/", "") for book in data.get("docs", [])]
                    if not new_ids:
                        break  # No more results
                    book_ids.extend(new_ids)
                else:
                    print(f"Error {response.status} fetching book IDs on page {page}")
                    break
            page += 1
            await asyncio.sleep(1)  # Avoid hitting rate limits
    
    return book_ids[:TOTAL_BOOKS]  # Ensure we don't exceed 10,000 books

async def fetch_book(session: ClientSession, book_id: str):
    """Fetch book details from OpenLibrary API."""
    url = BOOK_DETAILS_URL.format(work_id=book_id)
    for attempt in range(5):  # Retry mechanism
        try:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status in [429, 500]:  # Rate limit or server error
                    await asyncio.sleep(2**attempt)  # Exponential backoff
                elif response.status == 404:  # Book ID doesn't exist
                    return None  
                else:
                    print(f"Error {response.status} for {book_id}")
                    return None
        except Exception as e:
            print(f"Error fetching {book_id}: {e}")
    return None

async def fetch_books(book_ids):
    """Fetch multiple books concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_book(session, book_id) for book_id in book_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        time.sleep(1)
        return [book for book in results if book]  # Remove None values

async def process_books():
    """Main function to fetch and store books."""
    print("Fetching valid book IDs...")
    book_ids = await fetch_valid_book_ids()
    
    if not book_ids:
        print("No valid book IDs found. Exiting.")
        return
    
    all_books = []
    for i in tqdm(range(0, len(book_ids), BOOKS_PER_REQUEST), desc="Fetching Books"):
        batch_ids = book_ids[i : i + BOOKS_PER_REQUEST]
        books_data = await fetch_books(batch_ids)
        all_books.extend(books_data)

    # Save to JSON file
    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(all_books, f, indent=4)
    print(f"Saved {len(all_books)} books to {SAVE_PATH}")

# Run the event loop
if __name__ == "__main__":
    asyncio.run(process_books())
