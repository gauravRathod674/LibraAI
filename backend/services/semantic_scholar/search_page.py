import os
import json
import time
import urllib.parse
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def safe_filename(query: str) -> str:
    return query.replace(" ", "_").lower() + ".json"


def scrape_semantic_scholar(query: str):
    # Custom cache path
    cache_dir = os.path.join("backend", "data_cache", "semantic_scholar")
    os.makedirs(cache_dir, exist_ok=True)

    filename = safe_filename(query)
    cache_path = os.path.join(cache_dir, filename)

    # Return from cache if it exists
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            print(f"[CACHE HIT] Returning cached data for: '{query}'")
            return json.load(f)

    # Start scraping
    print(f"[CACHE MISS] Scraping Semantic Scholar for: '{query}'")
    options = uc.ChromeOptions()
    # options.add_argument("--headless=chrome")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--window-size=1920,1080")

    driver = uc.Chrome(options=options)
    results = []

    try:
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.semanticscholar.org/search?q={encoded_query}&sort=relevance"
        driver.get(url)

        WebDriverWait(driver, 20).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "cl-paper-row"))
        )
        paper_elements = driver.find_elements(By.CLASS_NAME, "cl-paper-row")

        for paper in paper_elements:
            try:
                title = paper.find_element(By.CLASS_NAME, "cl-paper-title").text
            except:
                title = "N/A"

            try:
                relative_link = paper.find_element(
                    By.CLASS_NAME, "link-button--show-visited"
                ).get_attribute("href")
                paper_link = (
                    "https://www.semanticscholar.org" + relative_link
                    if relative_link.startswith("/")
                    else relative_link
                )
            except:
                paper_link = "N/A"

            try:
                author_elems = paper.find_elements(
                    By.CLASS_NAME, "cl-paper-authors__author-box"
                )
                authors = [a.text for a in author_elems]
            except:
                authors = ["N/A"]

            try:
                venue = paper.find_element(By.CLASS_NAME, "cl-paper-venue").text
            except:
                venue = "N/A"

            try:
                pub_date = paper.find_element(By.CLASS_NAME, "cl-paper-pubdates").text
            except:
                pub_date = "N/A"

            try:
                tldr = paper.find_element(
                    By.CLASS_NAME, "tldr-abstract-replacement"
                ).text
            except:
                tldr = "N/A"

            try:
                pdf_elem = paper.find_element(
                    By.CSS_SELECTOR, "a[data-heap-link-type='arxiv']"
                )
                pdf_link = pdf_elem.get_attribute("href")
            except:
                pdf_link = "N/A"

            item = {
                "title": title,
                "authors": authors,
                "venue": venue,
                "pub_date": pub_date,
                "tldr": tldr,
                "pdf_link": pdf_link,
            }
            results.append(item)

    finally:
        driver.quit()
        uc.Chrome.__del__ = lambda self: None

    # Save to cache
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"[CACHE SAVE] Results cached at: {cache_path}")

    return results

# data = scrape_semantic_scholar("deep learning")
# print(json.dumps(data, indent=2, ensure_ascii=False))