#!/usr/bin/env python3
import os, re, fitz, faiss, torch, numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM, TextGenerationPipeline

def extract_chunks(pdf_path: str, window: int = 5):
    raw = " ".join(page.get_text() for page in fitz.open(pdf_path))
    sents = re.split(r'(?<=[.?!])\s+', raw.strip())
    for i in range(0, len(sents), window):
        yield " ".join(sents[i : i + window])

def build_faiss_index(chunks, embedder):
    texts = list(chunks)
    embs  = embedder.encode(texts, convert_to_numpy=True, show_progress_bar=True)
    faiss.normalize_L2(embs)
    idx = faiss.IndexFlatIP(embs.shape[1])
    idx.add(embs)
    return idx, texts

def retrieve(texts, question: str, embedder, idx, k: int = 5):
    q_emb = embedder.encode([question], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    _, ids = idx.search(q_emb, k)
    return [texts[i] for i in ids[0]]

def make_generator(model_name: str):
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
    try:
        from transformers import BitsAndBytesConfig
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            torch_dtype=torch.float16,
        )
        print("✅ Loaded 4‑bit model via bitsandbytes")
    except (ImportError, ModuleNotFoundError):
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            load_in_8bit=True,
            device_map="auto",
            torch_dtype=torch.float16,
        )
        print("⚠️ bitsandbytes not found: loaded 8‑bit model as fallback")

    return TextGenerationPipeline(
        model=model,
        tokenizer=tokenizer,
        device=0 if torch.cuda.is_available() else -1,
        model_kwargs={"temperature": 0.0, "max_new_tokens": 512}
    )

def generate_answer(question: str, context: str, gen: TextGenerationPipeline):
    prompt = (
        "You are an expert on the book “Ikigai: The Japanese Secret to a Long and Happy Life.”\n"
        "Using the context below, provide a detailed, accurate, and well‑explained answer.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    )
    out = gen(prompt)[0]["generated_text"]
    return out.split("Answer:")[-1].strip()

def main():
    pdf_path = "ikigai.pdf"
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    # 1) build retrieval
    embedder = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
    chunks   = list(extract_chunks(pdf_path, window=5))
    idx, texts = build_faiss_index(chunks, embedder)

    # 2) setup generator with Falcon‑7B‑Instruct
    model_name = "tiiuae/falcon-7b-instruct"
    gen        = make_generator(model_name)

    # 3) interactive loop
    while True:
        q = input("\nAsk a question (or 'exit'): ").strip()
        if q.lower() in ("exit","quit"):
            break

        top_ctx = retrieve(texts, q, embedder, idx, k=5)
        merged  = "\n\n".join(top_ctx)
        print("\n— Retrieved Context —\n", merged)

        ans = generate_answer(q, merged, gen)
        print("\n— Generated Answer —\n", ans)

if __name__ == "__main__":
    main()
