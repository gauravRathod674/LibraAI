# # https://www.semanticscholar.org/search?q=machine%20learning&sort=relevance
# import urllib.parse

# def generate_semantic_scholar_url(query: str) -> str:
#     base_url = "https://www.semanticscholar.org/search"
#     encoded_query = urllib.parse.quote(query, safe='')
#     return f"{base_url}?q={encoded_query}&sort=relevance"

# # Example usage
# search_term = "machine learning"
# url = generate_semantic_scholar_url(search_term)
# print(url)
import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains

def scrape_semantic_scholar(query: str):
    options = uc.ChromeOptions()
    # options.add_argument("--headless=new")  # or remove this to see the browser
    driver = uc.Chrome(options=options)

    try:
        encoded_query = query.replace(" ", "%20")
        url = f"https://www.semanticscholar.org/search?q={encoded_query}&sort=relevance"
        driver.get(url)

        # Wait until papers load
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
                relative_link = paper.find_element(By.CLASS_NAME, "link-button--show-visited").get_attribute("href")
                paper_link = "https://www.semanticscholar.org" + relative_link if relative_link.startswith("/") else relative_link
            except:
                paper_link = "N/A"

            try:
                author_elems = paper.find_elements(By.CLASS_NAME, "cl-paper-authors__author-box")
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
                tldr = paper.find_element(By.CLASS_NAME, "tldr-abstract-replacement").text
            except:
                tldr = "N/A"

            # Click expand if available and wait for full abstract relative to current paper
            # try:
            #     # Click the expand button (if it exists)
            #     expand_button = paper.find_element(By.CLASS_NAME, "more-toggle")
            #     driver.execute_script("arguments[0].click();", expand_button)
            #     time.sleep(0.3)  # Let content expand

            #     # Scope inside tldr-abstract-replacement block
            #     tldr_block = paper.find_element(By.CLASS_NAME, "tldr-abstract-replacement")

            #     # Look for full abstract inside that expanded block
            #     full_abstract_span = tldr_block.find_element(
            #         By.XPATH,
            #         ".//div[contains(@class, 'tldr-abstract__pill')]/following-sibling::span"
            #     )
            #     full_abstract = full_abstract_span.text.strip()

            # except Exception as e:
            #     full_abstract = "N/A"




            try:
                citations = paper.find_element(By.CLASS_NAME, "cl-paper-stats__v2-citations").text
            except:
                citations = "N/A"

            try:
                pdf_elem = paper.find_element(By.CSS_SELECTOR, "a[data-heap-link-type='arxiv']")
                pdf_link = pdf_elem.get_attribute("href")
            except:
                pdf_link = "N/A"

            print("Title:", title)
            print("Link:", paper_link)
            print("Authors:", ", ".join(authors))
            print("Venue:", venue)
            print("Published on:", pub_date)
            print("TLDR:", tldr)
            # print("Full abstract:", full_abstract)
            print("Citations:", citations)
            print("PDF Link:", pdf_link)
            print("-" * 100)

    finally:
        driver.quit()
        uc.Chrome.__del__ = lambda self: None

# Example usage
scrape_semantic_scholar("machine learning")
