"use client";

import React, { useState, useEffect, useCallback } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import { useTheme } from "@/app/context/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./Navbar"; // Adjust if necessary

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PdfViewer({
  fileUrl,
  pageNumber,
  setPageNumber,
  zoomLevel,
  setZoomLevel,
  rotation,
  isExpanded,
  setIsExpanded,
  setTotalPages,
  totalPages,
  showToc,
  setShowToc,
  pdfDoc,
  setPdfDoc,
  searchTerm,
  searchResults,
  currentSearchIndex,
  highlightSearch,
  setSearchResults,
  setCurrentSearchIndex,
  handleFullScreen,
  viewerRef,
  toc,
  setToc,
}) {
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [translateDrawerOpen, setTranslateDrawerOpen] = useState(false);
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState("hi");

  function getCurrentChapterIndex(toc, pageNumber) {
    if (!toc || toc.length === 0) return -1;

    let currentChapter = -1;

    toc.forEach((chapter, index) => {
      if (chapter.pageNumber <= pageNumber) {
        currentChapter = index;
      }
    });

    return currentChapter;
  }

  async function extractPageText(pdf, pageNumber) {
    try {
      if (!pageNumber || pageNumber < 1 || pageNumber > pdf.numPages) {
        console.log(
          `Invalid page number: ${pageNumber}. The page number must be between 1 and ${pdf.numPages}.`
        );
        return;
      }

      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      if (!content.items || content.items.length === 0) {
        console.log(
          `Page ${pageNumber}: This page contains only images or no text.`
        );
        return;
      }

      const pageText = content.items.map((item) => item.str).join(" ");
      console.log(`Page ${pageNumber}: ${pageText}`);
    } catch (err) {
      console.error(`Failed to extract text from page ${pageNumber}:`, err);
    }
  }

  async function extractChapterText(pdf, toc, chapterIndex) {
    if (!pdf || !toc || toc.length === 0) return "";

    const startPage = toc[chapterIndex]?.pageNumber;
    const endPage = toc[chapterIndex + 1]?.pageNumber - 1 || pdf.numPages;

    const allText = [];

    for (let i = startPage; i <= endPage; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item) => item.str).join(" ");
        if (text.trim()) allText.push(text);
      } catch (err) {
        console.warn(`Failed to extract text from page ${i}:`, err);
      }
    }

    return allText.join("\n\n");
  }

  async function extractOutline(pdf) {
    try {
      const outline = await pdf.getOutline();
      if (!outline) return;

      const resolved = await Promise.all(
        outline.map(async (item) => {
          try {
            let dest = item.dest;
            if (typeof dest === "string") {
              dest = await pdf.getDestination(dest);
            }
            const ref = Array.isArray(dest) ? dest[0] : dest;
            if (!ref) return null;

            const pageIndex = await pdf.getPageIndex(ref);
            return {
              title: item.title || "Untitled",
              pageNumber: pageIndex + 1,
            };
          } catch (err) {
            return null;
          }
        })
      );

      setToc(resolved.filter(Boolean)); // ✅ USE setToc FROM PROPS
    } catch (err) {
      console.warn("TOC extraction failed", err);
    }
  }

  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages);
    setTotalPages(pdf.numPages);
    if (typeof setPdfDoc === "function") setPdfDoc(pdf);
    setError(null);
    if (pageNumber > pdf.numPages) setPageNumber(1);
    extractOutline(pdf);
    extractPageText(pdf, pageNumber);
  }

  function onDocumentLoadError(err) {
    console.error(err);
    setError("Failed to load PDF.");
  }

  useEffect(() => {
    if (isExpanded) {
      setZoomLevel(120);
    } else {
      setZoomLevel(100);
    }
  }, [isExpanded]);

  useEffect(() => {
    function onFullScreenChange() {
      setIsFullScreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  useEffect(() => {
    if (pdfDoc) extractPageText(pdfDoc, pageNumber);
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    async function fetchCurrentChapterText() {
      if (!pdfDoc || !toc || toc.length === 0) return;

      const chapterIndex = getCurrentChapterIndex(toc, pageNumber);
      if (chapterIndex !== -1) {
        const chapterText = await extractChapterText(pdfDoc, toc, chapterIndex);
        // console.log("📖 Current Chapter Text:", chapterText);
      }
    }

    fetchCurrentChapterText();
  }, [pdfDoc, pageNumber, toc]);

  function highlightTextLayer(
    textLayerDiv,
    searchTerm,
    currentPage,
    currentSearchIndex,
    searchResults,
    pageNumber
  ) {
    if (!searchTerm || !searchResults.includes(pageNumber)) return;

    const cleanTerm = searchTerm.trim();
    if (!cleanTerm) return;

    // Remove existing highlights
    textLayerDiv.querySelectorAll("mark.pdf-highlight").forEach((el) => {
      el.replaceWith(document.createTextNode(el.textContent));
    });

    // Build a global, case‑insensitive regex
    const regex = new RegExp(
      cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );

    const walker = document.createTreeWalker(
      textLayerDiv,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (!text) continue;

      let lastIndex = 0;
      const parent = node.parentNode;
      const frag = document.createDocumentFragment();
      let match;
      let foundAny = false;

      // Walk through all matches in this text node
      while ((match = regex.exec(text))) {
        foundAny = true;

        // text before the match
        if (match.index > lastIndex) {
          frag.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index))
          );
        }

        // highlighted match
        const mark = document.createElement("mark");
        mark.className = "pdf-highlight";
        mark.textContent = match[0];
        mark.style.backgroundColor = "yellow";
        mark.style.color = "#222";
        mark.style.padding = "0 2px";
        mark.style.borderRadius = "2px";
        frag.appendChild(mark);

        lastIndex = regex.lastIndex;
      }

      // tail of the text node
      if (foundAny && lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      // only replace if we actually found a match
      if (foundAny) {
        parent.replaceChild(frag, node);
      }
    }
  }

  function onRenderTextLayerSuccess() {
    if (!highlightSearch || !searchTerm) return;
    const layers = document.querySelectorAll(".react-pdf__Page__textContent");
    layers.forEach((layer) =>
      highlightTextLayer(
        layer,
        searchTerm,
        pageNumber,
        currentSearchIndex,
        searchResults,
        pageNumber
      )
    );
  }

  const handleSearch = useCallback(async () => {
    if (!pdfDoc || !searchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push(i);
      }
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) {
      setPageNumber(results[0]);
    }
  }, [pdfDoc, searchTerm]);

  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setPageNumber(searchResults[nextIndex]);
  };

  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex =
      (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    setPageNumber(searchResults[prevIndex]);
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") {
        setPageNumber((prev) =>
          Math.min((Number(prev) || 1) + 1, totalPages || 1)
        );
      } else if (e.key === "ArrowLeft") {
        setPageNumber((prev) => Math.max((Number(prev) || 1) - 1, 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setPageNumber, totalPages]);

  const containerBgColor = darkMode ? "#F2F7FF" : "#1f2937";
  const textColor = darkMode ? "#e5e7eb" : "#1f2937";

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
        backgroundColor: containerBgColor,
      }}
    >
      {/* Table of Contents */}
      <AnimatePresence>
        {showToc && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowToc(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed top-[4.2rem] left-0 h-[calc(100vh-4.2rem)] w-[300px] max-w-[90vw] z-50 shadow-lg flex flex-col rounded-tr-xl rounded-br-xl overflow-hidden ${
                darkMode
                  ? "bg-[#E7F0FD] text-gray-900"
                  : "bg-gray-800 text-white"
              }`}
            >
              <h2 className="px-6 mt-6 mb-2 text-lg font-bold">
                Table of Contents
              </h2>
              <ul className="flex-1 px-4 overflow-y-auto">
                {toc.length === 0 && (
                  <li className="py-2">No entries found.</li>
                )}
                {toc.map((item, index) => (
                  <React.Fragment key={index}>
                    <li
                      className={`cursor-pointer py-2 px-2 rounded transition ${
                        darkMode
                          ? "hover:bg-[#c7e0ff] hover:text-gray-900"
                          : "hover:bg-gray-700 hover:text-white"
                      }`}
                      onClick={() => {
                        setPageNumber(item.pageNumber);
                        setShowToc(false);
                      }}
                    >
                      {item.title}{" "}
                      <span className="opacity-70">(p. {item.pageNumber})</span>
                    </li>
                    {index < toc.length - 1 && (
                      <hr
                        className={
                          darkMode ? "border-gray-300" : "border-gray-600"
                        }
                      />
                    )}
                  </React.Fragment>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div
        style={{
          flex: 1,
          overflow: isFullScreen ? "hidden" : "auto",
          padding: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {error ? (
          <div style={{ color: "red", margin: "auto" }}>{error}</div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="pdf-document-container"
            onItemClick={({ pageNumber: dest }) => {
              setPageNumber(dest);
              window.scrollTo({ top: 0, behavior: "smooth" }); // optional
            }}
          >
            {numPages && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center", // use center here
                  minHeight: isFullScreen ? "100vh" : "auto", // full height only in FS
                  paddingTop: isFullScreen ? 0 : "2rem", // no top padding in FS
                }}
              >
                <Page
                  key={`page_${pageNumber}`}
                  pageNumber={pageNumber}
                  scale={zoomLevel / 100}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onRenderTextLayerSuccess={onRenderTextLayerSuccess}
                  className="rounded shadow-md"
                  style={{ backgroundColor: "#fff" }}
                />
              </div>
            )}
          </Document>
        )}
      </div>
    </div>
  );
}
