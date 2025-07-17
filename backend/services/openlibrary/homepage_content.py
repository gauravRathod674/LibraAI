import os
import json
import requests
import concurrent.futures
from bs4 import BeautifulSoup
from pathlib import Path

HOME_URL = "https://openlibrary.org/"
CACHE_FOLDER = Path(__file__).resolve().parent.parent.parent / "data_cache" / "openlibrary"
CACHE_FILE = CACHE_FOLDER / "homepage.json"

HEADERS = {
    "User-Agent": "NexusLibraryScraper/1.0"
}

def parse_carousel_section(soup, section_index):
    """
    Given a BeautifulSoup of the entire homepage and an index for the
    <div class="carousel-section">, this extracts all <img> elements,
    returning a list of { "imgSrc": ..., "title": ... }.
    """

    # Grab the specific carousel-section by index
    carousel_sections = soup.select("div.carousel-section")

    # Safety check in case of unexpected page layout
    if section_index >= len(carousel_sections):
        return []

    section = carousel_sections[section_index]
    # .bookcover is the class for images
    imgs = section.select("img.bookcover")

    results = []
    for img in imgs:
        src = img.get("src", "").strip()
        title = img.get("title", "").strip()
        if src or title:
            results.append({
                "imgSrc": src,
                "title": title
            })
    return results

def get_trending_books():
    """Scrape the 2nd carousel (index = 1) for 'Trending Books'."""
    print("[Scraper] Fetching Trending Books ...")
    resp = requests.get(HOME_URL, headers=HEADERS, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    return parse_carousel_section(soup, section_index=1)

def get_classic_books():
    """Scrape the 3rd carousel (index = 2) for 'Classic Books'."""
    print("[Scraper] Fetching Classic Books ...")
    resp = requests.get(HOME_URL, headers=HEADERS, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    return parse_carousel_section(soup, section_index=2)

def get_books_we_love():
    """Scrape the 4th carousel (index = 3) for 'Books We Love'."""
    print("[Scraper] Fetching Books We Love ...")
    resp = requests.get(HOME_URL, headers=HEADERS, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    return parse_carousel_section(soup, section_index=3)

def get_homepage_data(force_refresh: bool = False) -> dict:
    """
    1. If homepage.json exists and force_refresh=False, load data from it.
    2. Otherwise, fetch all 3 sections in parallel:
         - Trending
         - Classics
         - Books We Love
       Merge them into a single dict, save as JSON, then return.
    """
    CACHE_FOLDER.mkdir(parents=True, exist_ok=True)

    # If JSON cache is present and not forcing refresh, load from disk
    if not force_refresh and CACHE_FILE.exists():
        print("[Cache] Loading homepage data from JSON cache...")
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    print("[Scraper] No valid cache or forced refresh. Scraping in parallel...")
    data = {
        "trending_books": [],
        "classic_books": [],
        "books_we_love": []
    }

    # MULTI-THREAD SCRAPING
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_trend = executor.submit(get_trending_books)
        future_classic = executor.submit(get_classic_books)
        future_love = executor.submit(get_books_we_love)

        data["trending_books"] = future_trend.result()
        data["classic_books"] = future_classic.result()
        data["books_we_love"] = future_love.result()

    # Save results to JSON
    print("[Scraper] Saving fresh data to homepage.json...")
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    return data

if __name__ == "__main__":
    # Quick test if run directly
    result = get_homepage_data()
    print(json.dumps(result, indent=2))
