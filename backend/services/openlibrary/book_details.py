import json
from pathlib import Path
import threading
import time
import requests
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class BookDetailPage:
    CACHE_DIR = (
        Path(__file__).resolve().parent.parent.parent
        / "data_cache"
        / "openlibrary"
        / "book_detail"
    )

    def __init__(self, url):
        self.url = url
        self.soup = None
        self.book_details = {}
        self._dynamic_thread = None

    def _clean(self, text):
        return " ".join(text.strip().split()) if text else ""

    def _load_or_fetch_html(self):
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        filename = self.url.rstrip("/").split("/")[-1] + ".json"
        self.cache_file = self.CACHE_DIR / filename

        if self.cache_file.exists():
            with open(self.cache_file, "r", encoding="utf-8") as f:
                self.book_details = json.load(f)
        else:
            response = requests.get(self.url)
            if response.status_code == 200:
                self.soup = BeautifulSoup(response.text, "html.parser")
                self._extract_book_details()
                with open(self.cache_file, "w", encoding="utf-8") as f:
                    json.dump(self.book_details, f, indent=4, ensure_ascii=False)
            else:
                raise Exception(f"Failed to fetch the page. Status code: {response.status_code}")

        # Launch background scraper for dynamic content
        self._dynamic_thread = threading.Thread(target=self._fetch_dynamic_content)
        self._dynamic_thread.start()


    def _extract_book_details(self):
        soup = self.soup

        # General Info
        self.book_details["image_src"] = (
            soup.select_one("img.cover, img.BookCover__image")["src"]
            if soup.select_one("img.cover, img.BookCover__image")
            else None
        )

        self.book_details["title"] = (
            self._clean(soup.select_one("h1.edition-title, h1.work-title, h1").text)
            if soup.select_one("h1.edition-title, h1.work-title, h1")
            else None
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
            else None
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

        # Subjects
        self.book_details["subjects"] = [
            {"name": self._clean(tag.text), "url": tag["href"]}
            for tag in soup.select("div.section.link-box a")
        ]

        # Book URL
        canonical_link = soup.find("link", rel="canonical")
        self.book_details["book_url"] = (
            canonical_link["href"] if canonical_link else None
        )

        # Editions
        editions = []
        edition_rows = soup.select("table#editions tr td.book")
        for row in edition_rows:
            ed = {
                "image_src": (
                    row.select_one("div.cover img")["src"]
                    if row.select_one("div.cover img")
                    else None
                ),
                "title": (
                    self._clean(row.select_one("div.title a").text)
                    if row.select_one("div.title a")
                    else None
                ),
                "url": (
                    row.select_one("div.title a")["href"]
                    if row.select_one("div.title a")
                    else None
                ),
                "year": (
                    self._clean(row.select_one("div.published").text.split(",")[0])
                    if row.select_one("div.published")
                    else None
                ),
                "publisher": (
                    self._clean(row.select_one("div.published").text.split(",")[1])
                    if row.select_one("div.published")
                    and "," in row.select_one("div.published").text
                    else None
                ),
                "language": (
                    self._clean(row.select_one("div.format").text)
                    if row.select_one("div.format")
                    else None
                ),
            }
            editions.append(ed)
        self.book_details["editions"] = editions

        # Detailed Metadata
        fields = {
            "edition_notes": "",
            "published_in": "",
            "other_titles": [],
            "translation_of": "",
            "translated_from": "",
            "edition_identifiers": {},
            "work_identifiers": [],
            "source_records": [],
            "first_sentence": "",
            "work_description": "",
        }

        notes_tag = soup.select_one("div.edition-notes")
        if notes_tag:
            fields["edition_notes"] = " ".join(
                [self._clean(p.text) for p in notes_tag.find_all("p")]
            )

        src_header = soup.select_one("div.section h3:-soup-contains('Source records')")
        if src_header:
            for link in soup.select("div.section a"):
                fields["source_records"].append(
                    {"name": self._clean(link.text), "url": self._clean(link["href"])}
                )

        first_sentence_tag = soup.select_one("p.largest[title='First']")
        if first_sentence_tag:
            fields["first_sentence"] = self._clean(first_sentence_tag.text)

        work_description_tag = soup.select_one("div.work-description p")
        if work_description_tag:
            fields["work_description"] = self._clean(work_description_tag.text)

        for dt, dd in zip(soup.find_all("dt"), soup.find_all("dd")):
            field = self._clean(dt.text.lower())
            value = self._clean(dd.text)
            if "published in" in field:
                fields["published_in"] = value
            elif "other titles" in field:
                fields["other_titles"].append(value)
            elif "translation of" in field:
                fields["translation_of"] = value
            elif "translated from" in field:
                fields["translated_from"] = value
            elif "isbn 10" in field:
                fields["edition_identifiers"]["isbn_10"] = value
            elif "open library" in field:
                fields["edition_identifiers"]["open_library"] = value
            elif "oclc" in field or "worldcat" in field:
                fields["edition_identifiers"]["oclc"] = value
            elif "goodreads" in field:
                fields["edition_identifiers"]["goodreads"] = value
            elif "work id" in field:
                fields["work_identifiers"].append(value)
            elif "source record" in field:
                fields["source_records"].append({"record": value})
            elif "first sentence" in field:
                fields["first_sentence"] = value
            elif "description" in field:
                fields["work_description"] = value

        self.book_details.update(fields)

        # Table of Contents
        toc = []
        toc_container = soup.select_one("div.toc.read-more__content")
        if toc_container:
            for entry in toc_container.select("div.toc__entry"):
                title_elem = entry.select_one("div.toc__title")
                if title_elem:
                    toc.append(self._clean(title_elem.text))
        self.book_details["table_of_contents"] = toc

    def _fetch_dynamic_content(self):
        print("[INFO] Launching Selenium for dynamic content scraping...")
        try:
            options = uc.ChromeOptions()
            # options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            driver = uc.Chrome(options=options)

            driver.get(self.url)
            time.sleep(8)
            carousels = driver.find_elements(By.CLASS_NAME, "carousel-section")

            you_might_also_like = []
            more_by_author = []

            for section in carousels:
                try:
                    header_element = section.find_element(By.TAG_NAME, "h2")
                    header_text = header_element.text.strip().lower()
                    # print(header_text)

                    cards = section.find_elements(By.CSS_SELECTOR, "div.book")
                    # print(cards)
                    section_data = []
                    for card in cards:
                        try:
                            img = card.find_element(By.TAG_NAME, "img").get_attribute("src")
                            title = card.find_element(By.TAG_NAME, "img").get_attribute("title")
                            book_url = card.find_element(By.TAG_NAME, "a").get_attribute("href")  # The book's page URL
                            read_button = card.find_elements(By.CSS_SELECTOR, ".cta-btn")
                            read_url = None
                            if read_button:
                                read_url = read_button[0].get_attribute("href")
                            
                            section_data.append({
                                "image_src": img,
                                "title": title,
                                "book_url": book_url,
                                "read_url": read_url
                            })
                        except Exception as e:
                            print(f"[WARN] Error extracting one card: {e}")
                            continue

                    if "you might also like" in header_text:
                        you_might_also_like = section_data
                    elif "more by" in header_text or "more by this author" in header_text:
                        more_by_author = section_data

                except Exception as e:
                    print(f"[WARN] Error processing a section: {e}")
                    continue

            self.book_details["you_might_also_like"] = you_might_also_like
            self.book_details["more_by_author"] = more_by_author

            print(you_might_also_like)
            print(more_by_author)

            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self.book_details, f, indent=4, ensure_ascii=False)

            print("[INFO] Dynamic content successfully scraped and cached.")

            driver.quit()

            uc.Chrome.__del__ = lambda self: None

        except Exception as e:
            print(f"[ERROR] Selenium scraping failed: {e}")

    def get_details(self):
        self._load_or_fetch_html()

        if self._dynamic_thread:
            self._dynamic_thread.join()

        return self.book_details



if __name__ == "__main__":
    url = "https://openlibrary.org/works/OL1968368W/The_48_Laws_of_Power"
    book = BookDetailPage(url)
    details = book.get_details()