import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
import os

class PDFFetcher:
    def __init__(self):
        self.driver = None

    def initialize_driver(self):
        print("[INFO] Initializing ChromeDriver...")
        chrome_options = uc.options.ChromeOptions()
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920x1080")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        
        # Initialize the driver
        self.driver = uc.Chrome(options=chrome_options)
        
        # Override user agent for headless detection avoidance
        custom_user_agent = (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/117.0.0.0 Safari/537.36"
        )
        self.driver.execute_cdp_cmd("Network.setUserAgentOverride", {"userAgent": custom_user_agent})
        print(f"[INFO] User-Agent overridden to: {custom_user_agent}")
        print("[INFO] ChromeDriver initialized successfully!")

    def fetch_pdf_link(self, book_title: str):
        print(f"\n🔍 Searching PDF for: {book_title}")
        self.driver.get("https://www.google.com")
        time.sleep(2)
        
        # Accept cookies if prompted
        try:
            consent_btn = self.driver.find_element(By.XPATH, '//button[contains(text(), "Accept")]')
            consent_btn.click()
            time.sleep(1)
        except Exception as e:
            pass

        # Enter search query
        search_query = f"{book_title} filetype:pdf"
        search_box = self.driver.find_element(By.NAME, "q")
        search_box.clear()
        search_box.send_keys(search_query)
        search_box.send_keys(Keys.RETURN)
        time.sleep(3)

        # Search for the first link ending in .pdf
        links = self.driver.find_elements(By.CSS_SELECTOR, "a")
        for link in links:
            href = link.get_attribute("href")
            if href and href.endswith(".pdf"):
                print(f"✅ PDF link found: {href}")
                return href

        print(f"❌ No PDF link found for '{book_title}'.")
        return None

    def close(self):
        if self.driver:
            self.driver.quit()
            print("[INFO] Driver closed.")

if __name__ == "__main__":
    # Specify the book title you want to search
    book_title = "Atomic Habits"
    fetcher = PDFFetcher()
    fetcher.initialize_driver()
    pdf_link = fetcher.fetch_pdf_link(book_title)
    print("Returned PDF link:", pdf_link)
    fetcher.close()

    # Avoid potential cleanup errors with undetected_chromedriver
    uc.Chrome.__del__ = lambda self: None
