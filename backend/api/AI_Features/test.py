import fitz  # PyMuPDF

def extract_text_from_pdf(path):
    doc = fitz.open(path)
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text().strip()
        print(f"Page {page_num} - {'✅ Text found' if text else '❌ No text'}")
        if text:
            print(text[:300], '...\n')

extract_text_from_pdf('ikigai.pdf')  # Replace with your PDF file path