import fitz                                      # PyMuPDF
import torch, faiss, numpy as np, re
from sentence_transformers import SentenceTransformer
from transformers import pipeline

# 1) PDF → Sentence Chunks
def extract_sentence_chunks(pdf_path, window=3):
    text = "".join(page.get_text() + " " for page in fitz.open(pdf_path))
    sents = re.split(r'(?<=[\.\?\!])\s+', text.strip())
    for i in range(len(sents)):
        yield " ".join(sents[i:i+window])

# 2) Build FAISS index on embeddings
def build_index(chunks, embedder):
    texts = list(chunks)
    embs  = embedder.encode(texts, convert_to_numpy=True, show_progress_bar=True)
    faiss.normalize_L2(embs)
    idx = faiss.IndexFlatIP(embs.shape[1])
    idx.add(embs)
    return idx, texts

# 3) Retrieve top‑k most relevant
def retrieve_top_k(question, embedder, idx, texts, k=5):
    q_emb = embedder.encode([question], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    scores, ids = idx.search(q_emb, k)
    return [texts[i] for i in ids[0]]

# 4) Summarize each chunk into a bullet
def summarize_chunks(chunks, summarizer):
    bullets = []
    for c in chunks:
        sum_text = summarizer(c, max_length=50, min_length=20)[0]['summary_text']
        bullets.append(f"- {sum_text}")
    return "\n".join(bullets)

# 5) Generative QA with a seq2seq model
def generate_answer(question, context_bullets, generator):
    prompt = (
        "You are an expert on the book “Ikigai: The Japanese Secret to a Long and Happy Life.”\n"
        "Use only the context below to answer the question in a detailed, explanatory way.\n\n"
        "Context:\n"
        f"{context_bullets}\n\n"
        "Question:\n"
        f"{question}\n\nAnswer:"
    )
    outputs = generator(prompt, max_length=256, do_sample=False)
    return outputs[0]['generated_text'].strip()

def main():
    pdf_path  = "ikigai.pdf"
    question  = input("Ask a question about the PDF: ").strip()

    # Load models
    device     = 0 if torch.cuda.is_available() else -1
    embedder   = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
    summarizer = pipeline("summarization",
                          model="facebook/bart-large-cnn",
                          device=device)
    generator  = pipeline("text2text-generation",
                          model="google/flan-t5-large",
                          device=device)

    # Build retrieval index
    chunks = list(extract_sentence_chunks(pdf_path, window=3))
    idx, texts = build_index(chunks, embedder)

    # Retrieve + Summarize
    top_chunks     = retrieve_top_k(question, embedder, idx, texts, k=5)
    context_bullets = summarize_chunks(top_chunks, summarizer)

    # Generate
    answer = generate_answer(question, context_bullets, generator)

    print("\n— Context Bullets —")
    print(context_bullets)
    print("\n— Generated Answer —")
    print(answer)

if __name__ == "__main__":
    main()
