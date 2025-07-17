import fitz  # PyMuPDF
from transformers import pipeline
import torch

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    return full_text

def chunk_text(text, max_length=500):
    words = text.split()
    for i in range(0, len(words), max_length):
        yield " ".join(words[i:i + max_length])

def main():
    pdf_path = "ikigai.pdf"
    question = "Does the book discuss retirement?"

    print("Extracting text from PDF...")
    text = extract_text_from_pdf(pdf_path)

    print("Loading QA pipeline on GPU..." if torch.cuda.is_available() else "Loading QA pipeline on CPU...")
    device = 0 if torch.cuda.is_available() else -1
    qa_pipeline = pipeline("question-answering", model="deepset/bert-large-uncased-whole-word-masking-squad2", device=device)

    print("Running QA on chunks...")
    answers = []
    for chunk in chunk_text(text, max_length=450):
        result = qa_pipeline(question=question, context=chunk)
        answers.append((result['score'], result['answer']))

    best_answer = max(answers, key=lambda x: x[0])
    print(f"\nBest answer: {best_answer[1]} (score: {best_answer[0]:.4f})")

if __name__ == "__main__":
    main()
