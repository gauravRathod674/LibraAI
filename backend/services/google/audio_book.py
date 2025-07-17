import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
import os

class AudioBookFetcher:
    def __init__(self):
        self.driver = None

    def initialize_driver(self):
        print("[INFO] Initializing ChromeDriver for Audiobook Search...")
        chrome_options = uc.options.ChromeOptions()
        # chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920x1080")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        
        self.driver = uc.Chrome(options=chrome_options)
        custom_user_agent = (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/117.0.0.0 Safari/537.36"
        )
        self.driver.execute_cdp_cmd("Network.setUserAgentOverride", {"userAgent": custom_user_agent})
        print(f"[INFO] User-Agent overridden to: {custom_user_agent}")
        print("[INFO] ChromeDriver initialized successfully!")

    def fetch_audiobook_link(self, book_title: str):
        print(f"\n🔍 Searching Audiobook for: {book_title}")
        self.driver.get("https://www.google.com")
        time.sleep(2)
        
        try:
            consent_btn = self.driver.find_element(By.XPATH, '//button[contains(text(), "Accept")]')
            consent_btn.click()
            time.sleep(1)
        except:
            pass

        # Modify search query to look for audiobooks (MP3 format)
        search_query = f"{book_title} audiobook filetype:mp3"
        search_box = self.driver.find_element(By.NAME, "q")
        search_box.clear()
        search_box.send_keys(search_query)
        search_box.send_keys(Keys.RETURN)
        time.sleep(3)
        
        # Check for first link that ends with .mp3
        links = self.driver.find_elements(By.CSS_SELECTOR, "a")
        for link in links:
            href = link.get_attribute("href")
            if href and href.endswith(".mp3"):
                print(f"✅ Found Audiobook MP3 for '{book_title}': {href}")
                return href

        print(f"❌ No Audiobook MP3 found for '{book_title}'.")
        return None

    def close(self):
        if self.driver:
            self.driver.quit()
            print("[INFO] Driver closed.")

if __name__ == "__main__":
    book_title = "Python Crash Course"
    fetcher = AudioBookFetcher()
    fetcher.initialize_driver()
    audio_link = fetcher.fetch_audiobook_link(book_title)
    print("Returned Audiobook link:", audio_link)
    fetcher.close()
