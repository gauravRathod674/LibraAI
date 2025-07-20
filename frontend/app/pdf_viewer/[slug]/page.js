// app/pdf_viewer/[slug]/page.js
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import PdfViewer from "../../../components/ui/PdfViewer";
import Navbar from "../../../components/ui/Navbar";
import { useTheme } from "@/app/context/ThemeContext";

export default function PdfViewerPage() {
  const { slug } = useParams();
  const fileUrl = `/downloads/${decodeURIComponent(slug)}`;

  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [toc, setToc] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightSearch, setHighlightSearch] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);

  const { darkMode } = useTheme();
  const viewerRef = useRef(null);

  const handlePdfSearch = useCallback(async () => {
    if (!pdfDoc || !searchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setHighlightSearch(false);
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
    setHighlightSearch(true);
    if (results.length > 0) {
      setPageNumber(results[0]);
    }
  }, [pdfDoc, searchTerm]);

  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setPageNumber(searchResults[nextIndex]);
    setHighlightSearch(true);
  };

  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex =
      (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    setPageNumber(searchResults[prevIndex]);
    setHighlightSearch(true);
  };

  const handleFullScreen = () => {
    const elem = viewerRef.current;
    if (!elem) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen();
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Navbar
        fileUrl={fileUrl} // Pass the fileUrl prop here
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        rotation={rotation}
        setRotation={setRotation}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        totalPages={totalPages}
        setTotalPages={setTotalPages}
        showToc={showToc}
        setShowToc={setShowToc}
        setPdfDoc={setPdfDoc}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        currentSearchIndex={currentSearchIndex}
        setCurrentSearchIndex={setCurrentSearchIndex}
        handlePdfSearch={handlePdfSearch}
        goToNextResult={goToNextResult}
        goToPrevResult={goToPrevResult}
        highlightSearch={highlightSearch}
        setHighlightSearch={setHighlightSearch}
        handleFullScreen={handleFullScreen}
        pdfDoc={pdfDoc}
        toc={toc}
        setToc={setToc}
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: darkMode ? "#1f2937" : "#F2F7FF",
        }}
        className="mt-16" // Adjusted margin for navbar height
        ref={viewerRef}
      >
        <PdfViewer
          fileUrl={fileUrl}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          rotation={rotation}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          setTotalPages={setTotalPages}
          totalPages={totalPages}
          showToc={showToc}
          setShowToc={setShowToc}
          pdfDoc={pdfDoc}
          setPdfDoc={setPdfDoc}
          searchTerm={searchTerm}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          highlightSearch={highlightSearch}
          handleFullScreen={handleFullScreen}
          viewerRef={viewerRef}
          toc={toc}
          setToc={setToc}
        />
      </div>
    </div>
  );
}