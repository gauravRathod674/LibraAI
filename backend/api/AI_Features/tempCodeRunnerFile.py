        "graphical models and statistical learning methods, enabling more robust speech and vision systems. "
    )
    dummy_page_text = " ".join([base_page] * 5)  # ~2,500 words

    # ----------------------------------------------------------------------------
    # 2) Dummy “chapter” simulation: ~15,000 words (~very large chapter)
    # ----------------------------------------------------------------------------
    base_chapter = (
        "Chapter 2: The Rise of Modern AI\n"
        "Artificial intelligence in the 21st century has been driven by data, computing power, and improved algorithms. "
        "Deep learning, a subset of machine learning that uses layered neural networks, has revolutionized fields "
        "like computer vision, natural language processing, and autonomous vehicles. Companies like Google, Facebook, and "
        "Microsoft have invested heavily in AI research, leading to breakthroughs in image recognition, language translation, "
        "and game playing. For example, AlphaGo's victory over a human Go champion in 2016 showcased the potential of reinforcement learning. "
        "Virtual assistants such as Siri, Alexa, and Google Assistant bring AI to everyday users. AI is also transforming "
        "industries—healthcare uses AI to analyze medical images, finance uses it for fraud detection, and transportation tests self-driving cars. "
        "Ethical considerations around bias, privacy, and job displacement have become central as AI systems become more pervasive. "
    )
    dummy_chapter_text = "\n\n".join([base_chapter] * 20)  # ~15,000 words

    print("━━━━━ TEST: DUMMY PAGE SUMMARY (approx. 2,500 words) ━━━━━\n")
    page_summary = summarize_page(dummy_page_text)
    print(page_summary)
    print("\n\n")

    # print("━━━━━ TEST: DUMMY CHAPTER SUMMARY (approx. 15,000 words) ━━━━━\n")