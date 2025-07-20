import json
from pathlib import Path
import time
import requests
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
import re
import traceback

class BookDetailPage:
    """
    Scrapes detailed information for a single book from an Open Library URL.

    This class fetches both static and dynamic content. It first checks for a
    complete cache file. If the cache is missing or incomplete, it scrapes the
    necessary data using requests for static content and Selenium for
    dynamic carousels like "You Might Also Like". The final combined data is
    then saved to a JSON cache file.
    """
    
    CACHE_DIR = Path("data_cache/openlibrary/book_detail")

    def __init__(self, url):
        """
        Initializes the scraper with the book's URL.

        Args:
            url (str): The full URL of the Open Library book page.
        """
        self.url = url
        self.soup = None
        self.book_details = {}
        
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # Use the unique Book ID (e.g., OL27918581M) for a reliable cache filename
        match = re.search(r'/(OL\d+M)', self.url)
        if match:
            filename = f"{match.group(1)}.json"
        else:
            # Fallback for URLs that might not have a standard ID
            filename = self.url.rstrip("/").split("/")[-1].replace("?", "_") + ".json"
            
        self.cache_file = self.CACHE_DIR / filename

    def _clean(self, text):
        """A helper function to clean and normalize whitespace in a string."""
        return " ".join(text.strip().split()) if text else ""

    def _extract_static_details(self):
        """Extracts all static book details from the page's HTML soup."""
        soup = self.soup
        if not soup:
            print("[ERROR] Soup object is not available for static extraction.")
            return

        # General Info
        self.book_details["image_src"] = (
            soup.select_one("img.cover, img.BookCover__image")["src"]
            if soup.select_one("img.cover, img.BookCover__image")
            else None
        )
        self.book_details["title"] = (
            self._clean(soup.select_one("h1.edition-title, h1.work-title, h1").text)
            if soup.select_one("h1.edition-title, h1.work-title, h1")
            else "Title not found"
        )
        self.book_details["authors"] = list(
            set(
                self._clean(a.text)
                for a in soup.select("a[itemprop='author'], a.authorName")
            )
        )
        self.book_details["rating_out_of_5"] = (
            self._clean(soup.select_one("[itemprop='ratingValue']").text)
            if soup.select_one("[itemprop='ratingValue']")
            else None
        )
        self.book_details["description"] = (
            self._clean(
                soup.select_one(
                    "div#description, div.description, div[itemprop='description'], div.book-description.read-more .read-more__content"
                ).text
            )
            if soup.select_one(
                "div#description, div.description, div[itemprop='description'], div.book-description.read-more .read-more__content"
            )
            else "No description available."
        )
        self.book_details["publish_date"] = (
            self._clean(soup.select_one("span[itemprop='datePublished']").text)
            if soup.select_one("span[itemprop='datePublished']")
            else None
        )
        self.book_details["publisher"] = (
            self._clean(soup.select_one("a[itemprop='publisher']").text)
            if soup.select_one("a[itemprop='publisher']")
            else None
        )
        self.book_details["language"] = (
            self._clean(soup.select_one("span[itemprop='inLanguage'] a").text)
            if soup.select_one("span[itemprop='inLanguage'] a")
            else None
        )
        self.book_details["pages"] = (
            self._clean(soup.select_one("span[itemprop='numberOfPages']").text)
            if soup.select_one("span[itemprop='numberOfPages']")
            else None
        )
        self.book_details["subjects"] = [
            {"name": self._clean(tag.text), "url": "https://openlibrary.org" + tag["href"]}
            for tag in soup.select("div.section.link-box a[href^='/subjects']")
        ]
        canonical_link = soup.find("link", rel="canonical")
        self.book_details["book_url"] = (
            canonical_link["href"] if canonical_link else self.url
        )

    def _fetch_dynamic_content(self):
        """
        Launches a headless browser to scrape dynamically loaded content,
        such as carousels for related books.
        """
        print("[INFO] Launching Selenium for dynamic content scraping...")
        driver = None
        try:
            options = uc.ChromeOptions()
            options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920x1080")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-extensions")
            
            driver = uc.Chrome(options=options)
            
            custom_user_agent = (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/117.0.0.0 Safari/537.36"
            )
            driver.execute_cdp_cmd("Network.setUserAgentOverride", {"userAgent": custom_user_agent})

            driver.get(self.url)
            time.sleep(5)  # Allow time for dynamic elements to load
            
            carousels = driver.find_elements(By.CLASS_NAME, "carousel-section")
            you_might_also_like = []
            more_by_author = []

            for section in carousels:
                try:
                    header_text = section.find_element(By.TAG_NAME, "h2").text.strip().lower()
                    section_data = []
                    cards = section.find_elements(By.CSS_SELECTOR, "div.book-carousel-card a")

                    for card in cards:
                        try:
                            img = card.find_element(By.TAG_NAME, "img")
                            section_data.append({
                                "image_src": img.get_attribute("src"),
                                "title": img.get_attribute("title"),
                                "book_url": card.get_attribute("href"),
                            })
                        except Exception as e:
                            print(f"[WARN] Error extracting one card: {e}")
                            continue

                    if "you might also like" in header_text or "readers also enjoyed" in header_text:
                        you_might_also_like = section_data
                    elif "more by" in header_text:
                        more_by_author = section_data
                
                except Exception as e:
                    print(f"[WARN] Error processing a carousel section: {e}")
                    continue

            self.book_details["you_might_also_like"] = you_might_also_like
            self.book_details["more_by_author"] = more_by_author
            print("[INFO] Dynamic content successfully scraped.")

        except Exception as e:
            print(f"[ERROR] Selenium scraping failed: {e}")
            traceback.print_exc()
            # Ensure keys exist even if scraping fails, to prevent frontend errors
            if "you_might_also_like" not in self.book_details:
                self.book_details["you_might_also_like"] = []
            if "more_by_author" not in self.book_details:
                self.book_details["more_by_author"] = []
        finally:
            if driver:
                driver.quit()
                uc.Chrome.__del__ = lambda self: None

    def _scrape_and_cache(self):
        """
        Orchestrates the scraping process for both static and dynamic content,
        then saves the combined result to the cache file.
        """
        # Scrape static content with requests
        print(f"[INFO] Fetching static content from: {self.url}")
        response = requests.get(self.url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch page with requests. Status: {response.status_code}")
        
        self.soup = BeautifulSoup(response.text, "html.parser")
        self._extract_static_details()

        # Scrape dynamic content with Selenium
        self._fetch_dynamic_content()

        # Save combined results to cache
        with open(self.cache_file, "w", encoding="utf-8") as f:
            json.dump(self.book_details, f, indent=4, ensure_ascii=False)
            print(f"[CACHE SAVE] Full book details cached at: {self.cache_file}")

    def get_details(self):
        """
        Main public method to get book details.
        It first checks the cache for complete data. If not found, it
        triggers the full scraping process.
        """
        if self.cache_file.exists():
            with open(self.cache_file, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                # Simple check if dynamic content might be missing
                if "you_might_also_like" in cached_data:
                    print(f"[CACHE HIT] Returning full cached data for: {self.url}")
                    return cached_data

        # If cache is missing or incomplete, scrape everything
        print(f"[CACHE MISS] Scraping required for: {self.url}")
        self._scrape_and_cache()
        
        return self.book_details
