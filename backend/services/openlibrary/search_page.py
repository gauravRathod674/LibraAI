import requests
import json
import re
import time
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
from urllib.parse import urljoin, quote_plus, urlencode
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Thread

import undetected_chromedriver as uc
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from threading import Lock
from typing import Callable

from abc import ABC, abstractmethod


class SearchStrategy(ABC):
    @abstractmethod
    def search(self, page: int = 1) -> dict:
        """Perform a search and return the results."""
        pass


class SearchByBookStrategy(SearchStrategy):
    """
    In this search strategy we are fetching content from source url where most of the content is static and some content (in the right sidebar) is dynamic. Here we are creating methods in such a way we get all things in frontend in minimum time.

    For that we have divided content into 3 categories:
    1) First page static data
    2) Remaining page static data
    3) Common dynamic data

    At start we are taking book title and filter(optional) from frontend by this we are creating customized url for data fetching.
    By this url we are fetchin first page static data and returing it to frontend immediately so that user don't have to wait and saving it in cache so that when user search same book title second onwards time it will fetch data from cache this insure minimum response time.
    After that in background we are fetching dynamic data where we wait for right sidebar to show up when it shows up we fetch content from it and return it immediately later we save data in same cache file.
    At last we are fetching remaining pages using multi threading for fastest data fetching and later saves it in cache file.

    Seens we are using threading for background task there can be senario of race condition for that we are putting thread lock on file insure only single function can write in cache file.
    """

    BASE_URL = "https://openlibrary.org"
    SEARCH_URL_TEMPLATE = BASE_URL + "/search?q={query}{sort_suffix}&page={page}"
    SIDEBAR_URL_TEMPLATE = BASE_URL + "/search?q={query}&mode=everything"
    CACHE_DIR = (
        Path(__file__).resolve().parent.parent.parent
        / "data_cache"
        / "openlibrary"
        / "search_page"
        / "search_by_books"
    )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def __init__(self, query: str, sort_by: str = "relevance", headless: bool = True):
        self.query = query
        self.headless = headless
        self._file_lock = Lock()

        self.sort_by = sort_by.lower()
        self.encoded_query = quote_plus(query)
        self.sort_suffix = self._get_sort_suffix()

        self.filename = (
            self.CACHE_DIR / f"{query.replace(' ', '_').lower()}__{self.sort_by}.json"
        )

    def _get_sort_suffix(self) -> str:
        sort_map = {
            "relevance": "",  # default
            "most editions": "&sort=editions",
            "first published": "&sort=old",
            "most recent": "&sort=new",
            "top rated": "&sort=rating",
            "random": "&sort=random",
        }
        return sort_map.get(self.sort_by.lower(), "")

    def search(self, page: int = 1) -> dict:
        """
        Fetch search results and handle caching for each page.
        If the cache exists and the requested page exists in it, return cached data.
        If the requested page doesn't exist in the cache, fetch and update the cache for that page.
        Also initiates a background fetch for sidebar data if not already cached.
        """
        page_key = f"page_{page}"

        # Scenario A: If the cache file exists
        if self.filename.exists():
            cached_data = json.loads(self.filename.read_text(encoding="utf-8"))

            # Scenario A1: Requested page is in cache
            if page_key in cached_data.get("pages", {}):
                print(
                    f"[Cache Hit] Returning cached data for {page_key} from: {self.filename}"
                )
                return cached_data

            # Scenario A2: Page is not in cache – fetch and update
            print(f"[Cache Miss] {page_key} not found. Fetching and updating cache.")
            html = self._fetch_search_page(page=page)
            soup = BeautifulSoup(html, "lxml")
            page_books = self._extract_books(soup)

            # Update cached_data and write it back
            cached_data.setdefault("pages", {})[page_key] = page_books

            self._save_to_cache(
                lambda data: {
                    **(data or {}),
                    "pages": cached_data["pages"],
                    "last_page": cached_data.get("last_page"),
                    "hits": cached_data.get("hits"),
                    "sidebar_info": cached_data.get(
                        "sidebar_info"
                    ),  # Preserve if already exists
                }
            )

            return {
                "pages": cached_data["pages"],
                "last_page": cached_data.get("last_page"),
                "hits": cached_data.get("hits"),
            }

        # Scenario B: Cache does not exist — fetch from scratch
        print(f"[Cache] No cache found. Fetching new data.")

        html = self._fetch_search_page(page=1)
        soup = BeautifulSoup(html, "lxml")
        page_1_books = self._extract_books(soup)
        last_page = self._extract_last_page(soup)
        hits = self._extract_no_of_hits(soup)

        result = {
            "pages": {"page_1": page_1_books},
            "last_page": last_page,
            "hits": hits,
        }

        # Save initial result to cache
        self._save_to_cache(lambda _: result)

        # Background thread: fetch sidebar data
        def background_fetch_sidebar():
            sidebar_info = self._fetch_sidebar_info()
            print("[Sidebar] Extracted:", sidebar_info)

            def update(data):
                data = data or {}
                data["sidebar_info"] = sidebar_info
                return data

            self._save_to_cache(update)
            uc.Chrome.__del__ = lambda self: None

        Thread(target=background_fetch_sidebar).start()

        return result

    def _fetch_search_page(self, page: int = 1) -> str:
        search_url = self.SEARCH_URL_TEMPLATE.format(
            query=self.encoded_query, page=page, sort_suffix=self.sort_suffix
        )
        print(f"[Fetch] Hitting URL: {search_url}")
        response = requests.get(search_url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch page {page}: {response.status_code}")
        return response.text

    def _extract_books(self, soup: BeautifulSoup) -> list:
        results_container = soup.find("div", class_="resultsContainer")
        results_list = (
            results_container.find("ul", class_="list-books")
            if results_container
            else None
        )
        result_items = (
            results_list.find_all("li", class_="searchResultItem")
            if results_list
            else []
        )

        books = []
        for item in result_items:
            img_tag = item.find("img", itemprop="image")
            img_src = img_tag.get("src").strip() if img_tag else None
            if img_src:
                if img_src.startswith("//"):
                    img_src = "https:" + img_src
                elif img_src.startswith("/"):
                    img_src = "https://openlibrary.org" + img_src

            title_a = item.select_one("h3.booktitle a.results")
            raw_title = title_a.get_text() if title_a else ""
            book_title = re.sub(r"\s+", " ", raw_title).strip()
            book_url = urljoin(self.BASE_URL, title_a.get("href")) if title_a else None

            author_a = item.select_one("span.bookauthor a")
            author_name = author_a.get_text(strip=True) if author_a else None

            rating_span = item.select_one(
                "span.ratingsByline span[itemprop='ratingValue']"
            )
            rating_text = rating_span.get_text(strip=True) if rating_span else ""
            rating_value, num_ratings = None, None

            if rating_text:
                parts = rating_text.split("(")
                if parts:
                    rating_value = parts[0].strip()
                if len(parts) > 1:
                    num_ratings = (
                        parts[1].replace("ratings", "").replace(")", "").strip()
                    )
            details_span = item.select_one("span.resultDetails")
            first_published, num_editions = None, None
            if details_span:
                details_text = details_span.get_text(" ", strip=True)
                parts = details_text.split("—")
                if len(parts) >= 1 and "First published in" in parts[0]:
                    first_published = parts[0].replace("First published in", "").strip()
                if len(parts) >= 2:
                    edition_link = details_span.find("a")
                    if edition_link:
                        raw_editions = edition_link.get_text()
                        num_editions = re.sub(r"\s+", " ", raw_editions).strip()
            books.append(
                {
                    "imgSrc": img_src,
                    "title": book_title,
                    "url": book_url,
                    "author": author_name,
                    "rating": rating_value,
                    "num_ratings": num_ratings,
                    "first_published": first_published,
                    "num_editions": num_editions,
                }
            )
        return books

    def _extract_last_page(self, soup: BeautifulSoup) -> int:
        pagination = soup.find("div", class_="pagination")
        if not pagination:
            return 1
        pages = pagination.find_all("a")
        for page in reversed(pages):
            if page.text.strip().isdigit():
                return int(page.text.strip())
        return 1

    def _extract_no_of_hits(self, soup: BeautifulSoup) -> int:
        hits_div = soup.find("div", class_="search-results-stats")
        if not hits_div:
            return 0

        text = hits_div.get_text(strip=True)
        match = re.search(r"([\d,]+)\s+hits", text, re.IGNORECASE)

        if match:
            hits_str = match.group(1).replace(",", "")
            return int(hits_str)
        return 0

    def _fetch_sidebar_info(self) -> dict:
        options = Options()
        options.headless = self.headless
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = uc.Chrome(options=options)
        sidebar_url = self.SIDEBAR_URL_TEMPLATE.format(query=self.encoded_query)
        print(f"[Sidebar] Fetching with undetected_selenium: {sidebar_url}")

        driver.get(sidebar_url)
        try:
            # Wait up to 10 seconds for at least one facet to appear.
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "div.facet h4.facetHead")
                )
            )
        except Exception as e:
            print("[Sidebar] Timeout or error waiting for facet head:", e)

        html = driver.page_source
        driver.quit()

        soup = BeautifulSoup(html, "lxml")
        sidebar_info = {}
        facet_groups = soup.find_all(
            "div", class_=lambda x: x and x.startswith("facet")
        )

        for group in facet_groups:
            header = group.find("h4", class_="facetHead")
            if not header:
                continue
            facet_name = header.get_text(strip=True)
            entries = []
            for entry in group.find_all("div", class_="facetEntry"):
                a_tag = entry.find("a", href=True)
                label_tag = entry.find("span", class_="small")
                count_tag = entry.find("span", class_="smaller")

                if a_tag and label_tag and count_tag:
                    label = label_tag.get_text(strip=True)
                    count_text = count_tag.get_text(strip=True)
                    try:
                        count = int(count_text)
                    except ValueError:
                        count = count_text

                    relative_url = a_tag["href"]
                    full_url = urljoin(self.BASE_URL, relative_url)

                    entries.append({"label": label, "count": count, "url": full_url})
            sidebar_info[facet_name] = entries
        return sidebar_info

    def _load_from_cache(self) -> dict:
        try:
            if self.filename.exists() and self.filename.stat().st_size > 0:
                with self.filename.open("r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"[Warning] Failed to load JSON: {e}")
        return {}

    def _save_to_cache(self, update_fn: Callable[[dict], dict]):
        with self._file_lock:
            data = self._load_from_cache()
            updated_data = update_fn(data)
            try:
                with self.filename.open("w", encoding="utf-8") as f:
                    json.dump(updated_data, f, indent=2, ensure_ascii=False)
                print(f"[Saved] JSON updated at: {self.filename}")
            except Exception as e:
                print(f"[Error] JSON save failed: {e}")


class SearchByAuthorStrategy(SearchStrategy):
    """
    Strategy to fetch author search results and their books (only first author).
    """

    BASE_URL = "https://openlibrary.org"
    AUTHOR_SEARCH_URL = BASE_URL + "/search/authors?q={query}&page={page}"
    CACHE_DIR = (
        Path(__file__).resolve().parent.parent.parent
        / "data_cache"
        / "openlibrary"
        / "search_page"
        / "search_by_author"
    )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def __init__(self, query: str, page: int = 1):
        self.query = query
        self.page = page
        self.encoded_query = quote_plus(query)
        self.filename = self._build_cache_filename()
        self.lock = Lock()

    def search(self, page: int = 1) -> dict:
        """
        Fetch search results and handle caching for each page.
        If the cache exists and the requested page exists in it, return cached data.
        If the requested page doesn't exist in the cache, fetch and update the cache for that page.
        """
        # If the cache file exists
        if self.filename.exists():
            cached_data = self._load_from_cache()

            # Check if the requested page is already in the cache
            page_key = f"page_{page}"
            if page_key in cached_data:
                print(f"[Cache] Loaded {page_key} from {self.filename}")
                return cached_data

            # If the page isn't in the cache, call get_books_by_page to fetch and update cache
            else:
                print(f"[Cache] {page_key} not found. Fetching and updating cache.")
                books = self.get_books_by_page(page)

                # After updating the cache, load and return the data
                updated_cached_data = self._load_from_cache()
                return updated_cached_data

        # If the cache doesn't exist, fetch new data from the web
        else:
            print(f"[Cache] No cache found. Fetching new data.")
            html = self._fetch_html()
            data = self._parse_html(html)
            self._save_to_cache(data)
            return data

    def get_books_by_page(self, page: int) -> list:
        """
        Fetch books from a specific page of the cached author's profile
        and update the JSON cache using the centralized _save_to_cache method.
        """
        cached = self._load_from_cache()
        first_page_key = f"page_{self.page}"
        if first_page_key not in cached:
            raise ValueError(
                f"Author data for {first_page_key} not in cache. Please run search() first."
            )

        author_info = cached[first_page_key]["authors"][0]
        author_url = author_info.get("author_url")
        if not author_url:
            raise ValueError("Author URL missing in cache.")

        # Fetch books for requested page
        books = self._fetch_author_books(author_url, page)

        # Save to cache using existing method
        new_page_key = f"page_{page}"
        self._save_to_cache({new_page_key: {"authors": [{"books": books}]}})

        return books

    def _build_cache_filename(self) -> Path:
        safe_query = self.query.replace(" ", "_").lower()
        return self.CACHE_DIR / f"search_author_{safe_query}.json"

    def _fetch_html(self) -> str:
        url = self.AUTHOR_SEARCH_URL.format(query=self.encoded_query, page=self.page)
        print(f"[Fetch] Requesting URL: {url}")
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch author results: {response.status_code}")
        return response.text

    def _parse_html(self, html: str) -> dict:
        soup = BeautifulSoup(html, "lxml")
        stats_element = soup.find("div", class_="search-results-stats")
        total_hits = stats_element.get_text(strip=True) if stats_element else ""

        author_items = soup.select("ul.authorList li.searchResultItem")
        authors = []

        if author_items:
            first_author = author_items[0]
            name_tag = first_author.find("a", class_="larger")
            author_name = name_tag.get_text(strip=True) if name_tag else ""
            author_url = (
                urljoin(self.BASE_URL, name_tag.get("href")) if name_tag else ""
            )

            img_tag = first_author.find("img")
            image_src = img_tag.get("src") if img_tag else ""
            if image_src.startswith("//"):
                image_src = "https:" + image_src
            elif image_src.startswith("/"):
                image_src = urljoin(self.BASE_URL, image_src)

            about_tag = first_author.select_one("span.small.grey")
            about = about_tag.get_text(strip=True) if about_tag else ""

            # Fetch page 1 books + total pages
            books = self._fetch_author_books(author_url, page=1)
            total_pages = self._get_total_pages(author_url)

            authors.append(
                {
                    "author_name": author_name,
                    "author_url": author_url,
                    "image_src": image_src,
                    "about": about,
                    "books": books,
                    "total_pages": total_pages,
                }
            )

        return {
            "query": self.query,
            f"page_{self.page}": {"total_hits": total_hits, "authors": authors},
        }

    def _fetch_author_books(self, author_url: str, page: int = 1) -> list:
        url = f"{author_url}?page={page}"
        print(f"[Fetch] Visiting author book page: {url}")
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return []
        except Exception as e:
            print(f"[Error] While fetching page {page}: {e}")
            return []

        soup = BeautifulSoup(response.text, "lxml")
        book_items = soup.select("li.searchResultItem.sri--w-main")

        books = []
        for book in book_items:
            title_tag = book.select_one("h3.booktitle a.results")
            book_title = title_tag.get_text(strip=True) if title_tag else ""
            book_url = (
                urljoin(self.BASE_URL, title_tag.get("href")) if title_tag else ""
            )

            img_tag = book.select_one("img[itemprop='image']")
            image_src = img_tag.get("src") if img_tag else ""
            if image_src.startswith("//"):
                image_src = "https:" + image_src
            elif image_src.startswith("/"):
                image_src = urljoin(self.BASE_URL, image_src)

            author_tag = book.select_one("span.bookauthor a")
            book_author = author_tag.get_text(strip=True) if author_tag else ""

            details = book.select_one("span.resultDetails")
            first_published, editions = "", ""
            if details:
                spans = details.find_all("span")
                if len(spans) >= 2:
                    first_published = spans[0].get_text(strip=True)
                    editions = spans[1].get_text(strip=True)

            books.append(
                {
                    "title": book_title,
                    "book_url": book_url,
                    "image_src": image_src,
                    "author": book_author,
                    "first_published": first_published,
                    "editions": editions,
                }
            )

        return books

    def _get_total_pages(self, author_url: str) -> int:
        url = f"{author_url}?page=1"
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return 1
        except Exception:
            return 1

        soup = BeautifulSoup(response.text, "lxml")
        pagination = soup.select_one("div.pagination")
        if pagination:
            links = pagination.select("a")
            if len(links) >= 2:
                try:
                    return int(links[-2].get_text(strip=True))
                except ValueError:
                    return 1
        return 1

    def _load_from_cache(self) -> dict:
        with open(self.filename, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_to_cache(self, data: dict):
        with self.lock:
            if self.filename.exists():
                with open(self.filename, "r+", encoding="utf-8") as f:
                    existing = json.load(f)
                    existing.update(data)
                    f.seek(0)
                    json.dump(existing, f, indent=2, ensure_ascii=False)
                    f.truncate()
            else:
                with open(self.filename, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"[Saved] Data saved to {self.filename}")


class SearchByInsideStrategy(SearchStrategy):
    """
    Overview:
    ---------
    This strategy fetches search results from the Open Library "inside search" page.

    Responsibilities:
      - Build and encode the search URL
      - Fetch and parse HTML content
      - Extract:
          • Result statistics (hits, response time)
          • Image, title, URL, author list (with URLs), and snippet highlights for each result
      - Cache the results page-wise in a JSON file (e.g., "page_1", "page_2" as keys)
      - Reuse cache if available
    """

    BASE_URL = "https://openlibrary.org"
    SEARCH_INSIDE_URL = BASE_URL + "/search/inside?q={query}&page={page}"
    CACHE_DIR = (
        Path(__file__).resolve().parent.parent.parent
        / "data_cache"
        / "openlibrary"
        / "search_page"
        / "search_by_inside"
    )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def __init__(self, query: str):
        """
        Initialize the strategy with a search query (e.g., "data science").
        """
        self.query = query
        self.encoded_query = quote_plus(query)
        self.filename = self._build_cache_filename()

    def search(self, page: int = 1) -> dict:
        """
        Entry point: Return results for the specified page.
        Use cache if available; else fetch, parse, and store.
        """
        key = f"page_{page}"

        if self.filename.exists():
            cached_data = self._load_from_cache()
            if key in cached_data:
                print(f"[Cache] Loaded {key} from {self.filename}")
                return {key: cached_data[key]}

        html = self._fetch_html(page)
        parsed_data = self._parse_html(html)

        all_data = self._load_from_cache()
        all_data[key] = parsed_data
        self._save_to_cache(all_data)

        return {key: parsed_data}

    def _build_cache_filename(self) -> Path:
        """
        Build a consistent filename for caching based on the query.
        """
        safe_query = self.query.replace(" ", "_").lower()
        return self.CACHE_DIR / f"search_inside_{safe_query}.json"

    def _fetch_html(self, page: int) -> str:
        """
        Request the inside search page HTML from Open Library.
        """
        url = self.SEARCH_INSIDE_URL.format(query=self.encoded_query, page=page)
        print(f"[Fetch] Requesting URL: {url}")
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch inside results: {response.status_code}")
        return response.text

    def _parse_html(self, html: str) -> dict:
        """
        Parse HTML and extract inside search results.
        """
        soup = BeautifulSoup(html, "lxml")

        # Stats
        stats_element = soup.find("p", class_="search-results-stats")
        stats_text = stats_element.get_text(strip=True) if stats_element else ""

        # All result items
        result_items = soup.find_all(
            "li", class_=lambda c: c and "searchResultItem" in c
        )
        results = []

        for item in result_items:
            # Image
            img_tag = item.find("img", itemprop="image")
            img_src = None
            if img_tag:
                img_src = img_tag.get("src")
                if img_src.startswith("//"):
                    img_src = "https:" + img_src
                elif img_src.startswith("/"):
                    img_src = urljoin(self.BASE_URL, img_src)

            # Title + Book URL
            title_element = item.find("h3", class_="booktitle")
            book_title = ""
            book_url = ""
            if title_element:
                link = title_element.find("a", class_="results")
                if link:
                    book_title = link.get_text(strip=True)
                    book_url = urljoin(self.BASE_URL, link.get("href"))

            # Authors
            authors = []
            author_span = item.find("span", class_="bookauthor")
            if author_span:
                for a in author_span.find_all("a"):
                    authors.append(
                        {
                            "name": a.get_text(strip=True),
                            "url": urljoin(self.BASE_URL, a.get("href")),
                        }
                    )

            # Snippets
            highlighted_snippets = []
            snippet_container = item.find("ul", class_="fsi-snippet")
            if snippet_container:
                for snippet in snippet_container.find_all(
                    "li", class_=lambda c: c and "fsi-snippet__main" in c
                ):
                    a_tag = snippet.find("a", class_="fsi-snippet__link")
                    if a_tag:
                        snippet_parts = []
                        for child in a_tag.children:
                            if isinstance(child, NavigableString):
                                text = child.strip()
                                if text:
                                    snippet_parts.append(
                                        {"text": text, "highlighted": False}
                                    )
                            elif child.name == "mark":
                                marked_text = child.get_text(strip=True)
                                if marked_text:
                                    snippet_parts.append(
                                        {"text": marked_text, "highlighted": True}
                                    )

                        snippet_url = urljoin(self.BASE_URL, a_tag.get("href"))

                        highlighted_snippets.append(
                            {"snippet_parts": snippet_parts, "url": snippet_url}
                        )

            results.append(
                {
                    "image_src": img_src,
                    "title": book_title,
                    "book_url": book_url,
                    "authors": authors,
                    "highlighted_snippets": highlighted_snippets,
                }
            )

        return {"query": self.query, "stats": stats_text, "results": results}

    def _load_from_cache(self) -> dict:
        """
        Load the full cached file as a dictionary.
        """
        if self.filename.exists():
            with open(self.filename, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def _save_to_cache(self, data: dict):
        """
        Save the full JSON file, merging pages progressively.
        """
        with open(self.filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[Saved] Data saved to {self.filename}")


class SearchBySubjectStrategy(SearchStrategy):
    """
    Overview:
    ---------
    This strategy fetches subject-related results from the Open Library's subject search page.

    Responsibilities:
      - Build and encode the search URL
      - Fetch and parse HTML content
      - Extract:
          • Total number of hits
          • Subject name, URL, and book count per result
      - Cache the results as a JSON file (reused if already present)
    """

    BASE_URL = "https://openlibrary.org"
    SUBJECT_SEARCH_URL = BASE_URL + "/search/subjects?q={query}"
    CACHE_DIR = (
        Path(__file__).resolve().parent.parent.parent
        / "data_cache"
        / "openlibrary"
        / "search_page"
        / "search_by_subject"
    )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def __init__(self, query: str):
        """
        Initialize the strategy with a search query (e.g., "data science").
        """
        self.query = query
        self.encoded_query = quote_plus(query)
        self.filename = self._build_cache_filename()

    def search(self) -> dict:
        """
        Entrypoint for fetching subject results. Uses cache if available.
        """
        if self.filename.exists():
            print(f"[Cache] Loading cached data from {self.filename}")
            return self._load_from_cache()

        html = self._fetch_html()
        data = self._parse_html(html)
        self._save_to_cache(data)
        return data

    def _build_cache_filename(self) -> Path:
        """
        Build a consistent, readable filename for caching based on the query.
        """
        safe_query = self.query.replace(" ", "_").lower()
        return self.CACHE_DIR / f"search_subject_{safe_query}.json"

    def _fetch_html(self) -> str:
        """
        Request the subject search page HTML from Open Library.
        """
        url = self.SUBJECT_SEARCH_URL.format(query=self.encoded_query)
        print(f"[Fetch] Requesting URL: {url}")
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch subject results: {response.status_code}")
        return response.text

    def _parse_html(self, html: str) -> dict:
        """
        Parse HTML and extract subject search data.
        """
        soup = BeautifulSoup(html, "lxml")

        # Extract total number of hits
        stats_element = soup.find("p", class_="search-results-stats")
        total_hits = stats_element.get_text(strip=True) if stats_element else ""

        # Extract subjects list
        subject_list = soup.find("ul", class_="subjectList")
        subject_items = subject_list.find_all("li") if subject_list else []

        subjects = []
        for li in subject_items:
            anchor = li.find("a")
            count_span = li.find("span", class_="count")
            if anchor and count_span:
                subject_name = anchor.get_text(strip=True)
                subject_link = urljoin(self.BASE_URL, anchor.get("href"))
                book_count_text = (
                    count_span.find("b").get_text(strip=True)
                    if count_span.find("b")
                    else "0"
                )

                subjects.append(
                    {
                        "subject": subject_name,
                        "url": subject_link,
                        "book_count": book_count_text,
                    }
                )

        return {"query": self.query, "total_hits": total_hits, "subjects": subjects}

    def _load_from_cache(self) -> dict:
        """
        Load previously cached JSON results.
        """
        with open(self.filename, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_to_cache(self, data: dict):
        """
        Save scraped results to JSON cache.
        """
        with open(self.filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[Saved] Data saved to {self.filename}")


class SearchByAdvanceSearchtrategy(SearchStrategy):
    """
    In this search strategy we are fetching content from source url where most of the content is static and some content (in the right sidebar) is dynamic. Here we are creating methods in such a way we get all things in frontend in minimum time.

    For that we have divided content into 2 categories:
    1) First page static data
    2) Common dynamic data

    At start we are taking book title and filter(optional) from frontend by this we are creating customized url for data fetching.
    By this url we are fetchin first page static data and returing it to frontend immediately so that user don't have to wait and saving it in cache so that when user search same book title second onwards time it will fetch data from cache this insure minimum response time.
    After that in background we are fetching dynamic data where we wait for right sidebar to show up when it shows up we fetch content from it and return it immediately later we save data in same cache file.

    Seens we are using threading for background task there can be senario of race condition for that we are putting thread lock on file insure only single function can write in cache file.
    """

    BASE_URL = "https://openlibrary.org"
    SEARCH_URL_TEMPLATE = BASE_URL + "/search?{query_params}{sort_suffix}&page={page}"
    SIDEBAR_URL_TEMPLATE = BASE_URL + "/search?{query_params}&mode=everything"
    CACHE_DIR = (
        Path(__file__).resolve().parent.parent.parent
        / "data_cache"
        / "openlibrary"
        / "search_page"
        / "search_by_advance_search"
    )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def __init__(
        self,
        title: str = "",
        author: str = "",
        isbn: str = "",
        subject: str = "",
        publisher: str = "",
        sort_by: str = "relevance",
        headless: bool = True,
    ):
        self.headless = headless
        self._file_lock = Lock()

        self.title = title
        self.author = author
        self.isbn = isbn
        self.subject = subject
        self.publisher = publisher

        self.sort_by = sort_by.lower()
        self.sort_suffix = self._get_sort_suffix()

        raw_filename = f"title={title}_author={author}_isbn={isbn}_subject={subject}_publisher={publisher}_{self.sort_by}"
        safe_filename = raw_filename.replace(" ", "_").replace("/", "_").lower()
        self.filename = self.CACHE_DIR / f"{safe_filename}.json"

        self.encoded_query = self._generate_query_params()

    def _generate_query_params(self) -> str:
        """
        Constructs the query string using advanced search fields.
        """
        params = {
            "title": self.title,
            "author": self.author,
            "isbn": self.isbn,
            "subject": self.subject,
            "publisher": self.publisher,
        }

        # Remove empty values
        clean_params = {k: v for k, v in params.items() if v}
        return urlencode(clean_params)

    def _get_sort_suffix(self) -> str:
        sort_map = {
            "relevance": "",  # default
            "most editions": "&sort=editions",
            "first published": "&sort=old",
            "most recent": "&sort=new",
            "top rated": "&sort=rating",
            "random": "&sort=random",
        }
        return sort_map.get(self.sort_by.lower(), "")

    def search(self, page: int = 1) -> dict:
        """
        Fetch search results and handle caching for each page.
        If the cache exists and the requested page exists in it, return cached data.
        If the requested page doesn't exist in the cache, fetch and update the cache for that page.
        Also initiates a background fetch for sidebar data if not already cached.
        """
        page_key = f"page_{page}"

        # Scenario A: If the cache file exists
        if self.filename.exists():
            cached_data = json.loads(self.filename.read_text(encoding="utf-8"))

            # Scenario A1: Requested page is in cache
            if page_key in cached_data.get("pages", {}):
                print(
                    f"[Cache Hit] Returning cached data for {page_key} from: {self.filename}"
                )
                return cached_data

            # Scenario A2: Page is not in cache – fetch and update
            print(f"[Cache Miss] {page_key} not found. Fetching and updating cache.")
            html = self._fetch_search_page(page=page)
            soup = BeautifulSoup(html, "lxml")
            page_books = self._extract_books(soup)

            # Update cached_data and write it back
            cached_data.setdefault("pages", {})[page_key] = page_books

            self._save_to_cache(
                lambda data: {
                    **(data or {}),
                    "pages": cached_data["pages"],
                    "last_page": cached_data.get("last_page"),
                    "hits": cached_data.get("hits"),
                    "sidebar_info": cached_data.get(
                        "sidebar_info"
                    ),  # Preserve if already exists
                }
            )

            return {
                "pages": cached_data["pages"],
                "last_page": cached_data.get("last_page"),
                "hits": cached_data.get("hits"),
            }

        # Scenario B: Cache does not exist — fetch from scratch
        print(f"[Cache] No cache found. Fetching new data.")

        html = self._fetch_search_page(page=1)
        soup = BeautifulSoup(html, "lxml")
        page_1_books = self._extract_books(soup)
        last_page = self._extract_last_page(soup)
        hits = self._extract_no_of_hits(soup)

        result = {
            "pages": {"page_1": page_1_books},
            "last_page": last_page,
            "hits": hits,
        }

        # Save initial result to cache
        self._save_to_cache(lambda _: result)

        # Background thread: fetch sidebar data
        def background_fetch_sidebar():
            sidebar_info = self._fetch_sidebar_info()
            print("[Sidebar] Extracted:", sidebar_info)

            def update(data):
                data = data or {}
                data["sidebar_info"] = sidebar_info
                return data

            self._save_to_cache(update)
            uc.Chrome.__del__ = lambda self: None

        Thread(target=background_fetch_sidebar).start()

        return result

    def _fetch_search_page(self, page: int = 1) -> str:
        search_url = self.SEARCH_URL_TEMPLATE.format(
            query_params=self.encoded_query, page=page, sort_suffix=self.sort_suffix
        )
        print(f"[Fetch] Hitting URL: {search_url}")
        response = requests.get(search_url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch page {page}: {response.status_code}")
        return response.text

    def _extract_books(self, soup: BeautifulSoup) -> list:
        results_container = soup.find("div", class_="resultsContainer")
        results_list = (
            results_container.find("ul", class_="list-books")
            if results_container
            else None
        )
        result_items = (
            results_list.find_all("li", class_="searchResultItem")
            if results_list
            else []
        )

        books = []
        for item in result_items:
            img_tag = item.find("img", itemprop="image")
            img_src = img_tag.get("src").strip() if img_tag else None
            if img_src:
                if img_src.startswith("//"):
                    img_src = "https:" + img_src
                elif img_src.startswith("/"):
                    img_src = "https://openlibrary.org" + img_src

            title_a = item.select_one("h3.booktitle a.results")
            raw_title = title_a.get_text() if title_a else ""
            book_title = re.sub(r"\s+", " ", raw_title).strip()
            book_url = urljoin(self.BASE_URL, title_a.get("href")) if title_a else None

            author_a = item.select_one("span.bookauthor a")
            author_name = author_a.get_text(strip=True) if author_a else None

            rating_span = item.select_one(
                "span.ratingsByline span[itemprop='ratingValue']"
            )
            rating_text = rating_span.get_text(strip=True) if rating_span else ""
            rating_value, num_ratings = None, None

            if rating_text:
                parts = rating_text.split("(")
                if parts:
                    rating_value = parts[0].strip()
                if len(parts) > 1:
                    num_ratings = (
                        parts[1].replace("ratings", "").replace(")", "").strip()
                    )
            details_span = item.select_one("span.resultDetails")
            first_published, num_editions = None, None
            if details_span:
                details_text = details_span.get_text(" ", strip=True)
                parts = details_text.split("—")
                if len(parts) >= 1 and "First published in" in parts[0]:
                    first_published = parts[0].replace("First published in", "").strip()
                if len(parts) >= 2:
                    edition_link = details_span.find("a")
                    if edition_link:
                        raw_editions = edition_link.get_text()
                        num_editions = re.sub(r"\s+", " ", raw_editions).strip()
            books.append(
                {
                    "imgSrc": img_src,
                    "title": book_title,
                    "url": book_url,
                    "author": author_name,
                    "rating": rating_value,
                    "num_ratings": num_ratings,
                    "first_published": first_published,
                    "num_editions": num_editions,
                }
            )
        return books

    def _extract_last_page(self, soup: BeautifulSoup) -> int:
        pagination = soup.find("div", class_="pagination")
        if not pagination:
            return 1
        pages = pagination.find_all("a")
        for page in reversed(pages):
            if page.text.strip().isdigit():
                return int(page.text.strip())
        return 1

    def _extract_no_of_hits(self, soup: BeautifulSoup) -> int:
        hits_div = soup.find("div", class_="search-results-stats")
        if not hits_div:
            return 0

        text = hits_div.get_text(strip=True)
        match = re.search(r"([\d,]+)\s+hits", text, re.IGNORECASE)

        if match:
            hits_str = match.group(1).replace(",", "")
            return int(hits_str)
        return 0

    def _fetch_sidebar_info(self) -> dict:
        options = Options()
        options.headless = self.headless
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = uc.Chrome(options=options)
        sidebar_url = self.SIDEBAR_URL_TEMPLATE.format(query_params=self.encoded_query)
        print(f"[Sidebar] Fetching with undetected_selenium: {sidebar_url}")

        driver.get(sidebar_url)
        try:
            # Wait up to 10 seconds for at least one facet to appear.
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "div.facet h4.facetHead")
                )
            )
        except Exception as e:
            print("[Sidebar] Timeout or error waiting for facet head:", e)

        html = driver.page_source
        driver.quit()

        soup = BeautifulSoup(html, "lxml")
        sidebar_info = {}
        facet_groups = soup.find_all(
            "div", class_=lambda x: x and x.startswith("facet")
        )

        for group in facet_groups:
            header = group.find("h4", class_="facetHead")
            if not header:
                continue
            facet_name = header.get_text(strip=True)
            entries = []
            for entry in group.find_all("div", class_="facetEntry"):
                a_tag = entry.find("a", href=True)
                label_tag = entry.find("span", class_="small")
                count_tag = entry.find("span", class_="smaller")

                if a_tag and label_tag and count_tag:
                    label = label_tag.get_text(strip=True)
                    count_text = count_tag.get_text(strip=True)
                    try:
                        count = int(count_text)
                    except ValueError:
                        count = count_text

                    relative_url = a_tag["href"]
                    full_url = urljoin(self.BASE_URL, relative_url)

                    entries.append({"label": label, "count": count, "url": full_url})
            sidebar_info[facet_name] = entries
        return sidebar_info

    def _load_from_cache(self) -> dict:
        try:
            if self.filename.exists() and self.filename.stat().st_size > 0:
                with self.filename.open("r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"[Warning] Failed to load JSON: {e}")
        return {}

    def _save_to_cache(self, update_fn: Callable[[dict], dict]):
        with self._file_lock:
            data = self._load_from_cache()
            updated_data = update_fn(data)
            try:
                with self.filename.open("w", encoding="utf-8") as f:
                    json.dump(updated_data, f, indent=2, ensure_ascii=False)
                print(f"[Saved] JSON updated at: {self.filename}")
            except Exception as e:
                print(f"[Error] JSON save failed: {e}")


class SearchContext:
    def __init__(self, strategy: SearchStrategy):
        self.search_strategy = strategy

    def search(self, page: int = 1):
        return self.search_strategy.search(page)

    def set_new_strategy(self, new_strategy: SearchStrategy):
        self.search_strategy = new_strategy

if __name__ == "__main__":

    # strategy = SearchByBookStrategy(
    #     "atomic habits", sort_by="Random", headless=True
    # )  # try "recent", "random", etc.
    # result = strategy.search()
    # print(json.dumps(result, indent=2, ensure_ascii=False))
    # print("[Main] Waiting for background tasks to finish...")
    # time.sleep(20)
    # print("[Main] Background tasks finished!")

    # strategy = SearchByAuthorStrategy("James Patterson")
    # result = strategy.search(3)
    # print(json.dumps(result, indent=2))

    # strategy = SearchByInsideStrategy(query="data science")
    # results = strategy.search(page=3)
    # json.dumps(results, indent=2, ensure_ascii=False)

    # strategy = SearchBySubjectStrategy("data science")
    # result = strategy.search()
    # print(json.dumps(result, indent=2))

    # strategy = SearchByAdvanceSearchtrategy(
    #     title="harry potter",
    #     author="j.k. rowling",
    #     sort_by="relevance",  # You can try other options like "most recent", "first published", etc.
    #     headless=True  # Set to False if you want to see the browser window (for debugging)
    # )
    # result = strategy.search(page=1)
    # print(json.dumps(result, indent=2, ensure_ascii=False))
    # print("[Main] Waiting for background tasks to finish...")
    # time.sleep(20)
    # print("[Main] Background tasks finished!")

    search_context = SearchContext(
        SearchByBookStrategy(
            "how to win friends and influence people",
            sort_by="Most Edition",
            headless=True,
        )
    )
    search_context.search()

    search_context.set_new_strategy(SearchByAuthorStrategy("James Patterson"))
    search_context.search()

    search_context.set_new_strategy(SearchByInsideStrategy("data science"))
    search_context.search()

    search_context.set_new_strategy(SearchBySubjectStrategy("data science"))
    search_context.search()

    search_context.set_new_strategy(SearchBySubjectStrategy("data science"))
    search_context.search()

    search_context.set_new_strategy(
        SearchByAdvanceSearchtrategy(
            title="harry potter",
            author="j.k. rowling",
            sort_by="relevance",  
            headless=True, 
        )
    )
    search_context.search()
