"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { ClipboardCopy, Volume2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Moon,
  Sun,
  Menu,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Bell,
  Download

} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { LuExpand, LuShrink, LuTableOfContents } from "react-icons/lu";
import { TbRotateClockwise2 } from "react-icons/tb";
import { CgFileDocument } from "react-icons/cg";
import { IoLanguage, IoVolumeHigh } from "react-icons/io5";
import { MdSummarize } from "react-icons/md"; // Add this for summary icon
import { FiSearch } from "react-icons/fi";
import { BiFullscreen } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import SummaryDrawer from "./SummaryDrawer";
import axios from "axios";
import { getCookie } from "@/lib/csrf";
import TranslateDrawer from "./TranslateDrawer";
import { pdfjs } from "react-pdf";

// Custom Tooltip (shows below, with gradient background and dark text)
const Tooltip = ({ text, children, offsetX = 0 }) => (
  <span className="relative cursor-pointer group">
    {children}
    <span
      className="absolute z-50 px-3 py-1 text-xs font-semibold transition-all duration-200 scale-95 -translate-x-1/2 rounded-md shadow-lg opacity-0 pointer-events-none left-1/2 top-9 whitespace-nowrap group-hover:opacity-100 group-hover:scale-100"
      style={{
        background:
          "linear-gradient(205deg, rgb(187,139,255) 8.49%, rgb(117,246,255) 91.51%)",
        color: "#1e293b", // slate-800 (dark blue/gray)
        marginLeft: offsetX ? `${offsetX}px` : undefined,
      }}
    >
      {text}
      <span
        className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 rotate-45"
        style={{
          background:
            "linear-gradient(205deg, rgb(187,139,255) 8.49%, rgb(117,246,255) 91.51%)",
        }}
      ></span>
    </span>
  </span>
);

const Navbar = ({
  pageNumber,
  setPageNumber,
  zoomLevel,
  setZoomLevel,
  rotation,
  setRotation,
  isExpanded,
  setIsExpanded,
  totalPages,
  setTotalPages,
  showToc,
  setShowToc,
  searchTerm,
  setSearchTerm,
  searchResults,
  setSearchResults,
  currentSearchIndex,
  setCurrentSearchIndex,
  handlePdfSearch,
  goToNextResult,
  goToPrevResult,
  highlightSearch,
  setHighlightSearch,
  handleFullScreen,
  pdfDoc,
  toc,
  
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPdfSearch, setShowPdfSearch] = useState(false);
  const [askMeOpen, setAskMeOpen] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [askMessages, setAskMessages] = useState([
    {
      from: "bot",
      text: "Hi! Ask me anything about your document or library.",
    },
  ]);
  const askInputRef = useRef(null);
  const { darkMode, toggleDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false); // State for drawer
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [textType, setTextType] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslateDrawerOpen, setTranslateDrawerOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState("");
  const [reading, setReading] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/test/`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Response not OK");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Test API success:", data);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch CSRF test:", err);
      });

    console.log("Navbar component mounted");
  }, []);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            username: decoded.username,
            profile_photo:
              localStorage.getItem("profile_photo") || "/default-avatar.jpg",
          });
        } else {
          handleLogout(true);
        }
      } catch {
        handleLogout(true);
      }
    }
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e) {
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [moreOpen]);

  useEffect(() => {
  if (pathname === "/notification") {
    setHasNotification(false);
  } else {
    setHasNotification(true);
  }
}, [pathname]);

  const navLinks = [
  { name: "Home", path: "/" },
  {
    name: "My Books",
    children: [
      { name: "Book Details", path: "/book-detail" },
      { name: "Borrow History", path: "/borrow-history" },
      { name: "Transactions", path: "/transaction" },
    ],
  },
  {
    name: "Search",
    children: [
      { name: "Search Page", path: "/search" },
      { name: "Research", path: "/research" },
      { name: "Genres", path: "/genres" },
      { name: "PDF Viewer", path: "/pdf_viewer" },
    ],
  },
];


  const handleLogout = (isAutoLogout = false) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); 
    setUser(null);
    if (!isAutoLogout) {
      router.push("/login");
    }
    router.push("/login");
  };

  const isPdfViewer = pathname.startsWith("/pdf_viewer/");
  const handleToggle = () => setIsExpanded((prev) => !prev);

  const UserStatus = () => (
    <>
      {user ? (
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Profile icon + user name */}
        <Link
          href="/user-profile"
          className="relative flex items-center gap-2 group transition-all duration-300"
        >
          <img
            src={user.profile_photo}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />  
          <span className="text-lg font-medium">{user.username}</span>
          <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-current
                          group-hover:w-full transition-all duration-300" />
        </Link>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="text-red-500 hover:text-red-700 text-lg font-medium"
        >
          Logout
        </button>
      </div>
    ) : (
      <Link
        href="/login"
        className={`relative group text-lg font-medium transition-all duration-300 ${
          darkMode ? "text-gray-900" : "text-white"
        }`}
      >
        Login
        <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-current
                        group-hover:w-full transition-all duration-300" />
      </Link>
    )}

    <Tooltip text="Notifications">
    <Link href="/notification" className="relative">
      <Bell className="w-5 h-5 sm:w-6 sm:h-6 hover:text-blue-400 transition" />
      {hasNotification && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full
                    ring-2 ring-white dark:ring-gray-900"
        />
      )}
    </Link>
    </Tooltip>


    {/* Download Icon */}
    <Tooltip text="Download PDF">
      <button
        className={`p-1.5 rounded-full ${darkMode ? "bg-[#E7F0FD] text-gray-900 hover:bg-gray-300" : "bg-gray-900 text-white           hover:bg-gray-700"}`}
        title="Download PDF"
        onClick={() => {
          const pdfUrl = "/pdfs/your-document.pdf";
          window.open(pdfUrl, "_blank");
        }}
      >
        <Download size={27} />
      </button>
    </Tooltip>
    <span className={`w-px h-6 mx-1 ${darkMode ? "bg-gray-400" :"bg-gray-600}"}`}/>
    </>
  );

  // Simulate bot response (replace with real API call as needed)
  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!askInput.trim()) return;

    const pdfUrl = window.location.href;
    const form = new FormData();
    form.append("pdf_url", pdfUrl);
    form.append("question", askInput);

    try {
      setIsLoading(true);
      if (!fileUploaded) {
        const res = await fetch(pdfUrl);
        const blob = await res.blob();
        const filename = pdfUrl.split("/").pop();
        form.append("file", blob, filename);
        setFileUploaded(true);
      }

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/pdf_assistant/`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      setAskMessages((msgs) => [
        ...msgs,
        { from: "user", text: askInput },
        { from: "bot", text: data.answer },
      ]);
      setAskInput("");
    } catch (err) {
      console.error("Ask failed:", err);
      toast.error("Failed to get response!");
    } finally {
      setIsLoading(false);
    }
  };

  const extractPageText = async (pdf, pageNumber) => {
    try {
      if (!pageNumber || pageNumber < 1 || pageNumber > pdf.numPages) return "";

      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items;

      items.sort((a, b) => b.transform[5] - a.transform[5]); // top-to-bottom

      const lines = [];
      let currentLine = [],
        lastY = null;

      for (const item of items) {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          lines.push(currentLine);
          currentLine = [];
        }
        currentLine.push(item);
        lastY = y;
      }
      if (currentLine.length) lines.push(currentLine);

      const output = [];
      let buffer = "";

      const pageHeight = Math.max(...items.map((i) => i.transform[5]));
      const scoreThreshold = 6;

      for (const line of lines) {
        const text = line
          .map((i) => i.str)
          .join(" ")
          .trim();
        if (!text) continue;

        const avgFontSize =
          line.reduce((sum, i) => sum + Math.abs(i.transform[0]), 0) /
          line.length;
        const avgY =
          line.reduce((sum, i) => sum + i.transform[5], 0) / line.length;
        const fontFamilies = new Set(
          line.map((i) => (i.fontName || "").toLowerCase())
        );
        const wordCount = text.split(/\s+/).length;
        const endsWithPunct = /[.!?।]$/.test(text);

        let score = 0;
        if (avgFontSize > 18) score += 3;
        if ([...fontFamilies].some((f) => f.includes("sans"))) score += 1;
        if (wordCount <= 10) score += 2;
        if (!endsWithPunct) score += 2;
        if (avgY >= pageHeight * 0.75) score += 1;

        const isHeading = score >= scoreThreshold;

        if (isHeading) {
          if (buffer) {
            output.push(buffer.trim());
            buffer = "";
          }
          output.push(`[HEADING] ${text}`);
        } else {
          buffer += (buffer ? " " : "") + text;
          if (/[.!?।]$/.test(text)) {
            output.push(buffer.trim());
            buffer = "";
          }
        }
      }

      if (buffer) output.push(buffer.trim());

      return output.join("\n\n");
    } catch (err) {
      console.error("Text extraction error:", err);
      return "";
    }
  };

  function getCurrentChapterIndex(toc, pageNumber) {
    if (!toc || toc.length === 0) return -1;

    let currentChapter = -1;

    toc.forEach((chapter, index) => {
      if (chapter.pageNumber <= pageNumber) {
        currentChapter = index;
      }
    });
    console.log(
      "TOC:",
      toc,
      "Page Number:",
      pageNumber,
      "Current Chapter Index:",
      currentChapter
    );

    return currentChapter;
  }

  async function extractChapterText(pdf, toc, chapterIndex) {
    if (!pdf || !toc || toc.length === 0) return "";

    const startPage = toc[chapterIndex]?.pageNumber;
    const endPage = toc[chapterIndex + 1]?.pageNumber - 1 || pdf.numPages;

    console.log("Extracting chapter text from page", startPage, "to", endPage);

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

    console.log("Extracted Chapter Text:", allText.join("\n\n"));

    return allText.join("\n\n");
  }

  const handleSummaryClick = () => {
    setSummary(""); // Reset
    setLoadingSummary(false); // Ensure it's false at open
    setIsSummaryDrawerOpen(true);
  };

  const handleGenerateSummary = async (type) => {
    try {
      if (!pdfDoc) {
        console.error("PDF not loaded yet");
        return;
      }

      setSummary("");
      setLoadingSummary(true);

      let text = "";

      if (type === "page") {
        text = await extractPageText(pdfDoc, pageNumber);
      } else if (type === "chapter") {
        const chapterIndex = getCurrentChapterIndex(toc, pageNumber);
        if (chapterIndex !== -1) {
          text = await extractChapterText(pdfDoc, toc, chapterIndex);
        } else {
          console.error("No chapter found for the current page");
          setSummary("❗ No chapter found for the current page.");
          setLoadingSummary(false);
          return;
        }
      }

      console.log("Text to summarize:", text);

      if (!text.trim()) {
        setSummary("❗ No text found to summarize.");
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/summary`,
        {
          text,
          text_type: type,
        }
      );

      setSummary(response.data.summary);
      setTextType(type);
    } catch (error) {
      setSummary("❗ Error generating summary.");
      console.error("Summary generation failed:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleTranslate = async (lang, scope) => {
    setTranslating(true);
    setTranslation("");
    setTranslateDrawerOpen(true);

    try {
      let text = "";
      if (scope === "page") {
        text = await extractPageText(pdfDoc, pageNumber);
      } else {
        const chapterIdx = getCurrentChapterIndex(toc, pageNumber);
        text = await extractChapterText(pdfDoc, toc, chapterIdx);
      }

      // 🔥 Split original text into paragraphs using double newlines
      const paragraphs = text
        .split(/\n{2,}/g)
        .map((p) => p.trim())
        .filter(Boolean);

      const translatedParas = [];

      for (const para of paragraphs) {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/translate/`,
          {
            pdf_url: window.location.href,
            text: para,
            target_lang: lang,
            scope,
            page_number: pageNumber,
          },
          { withCredentials: true }
        );

        console.log(
          "⏺ paragraph translation:",
          JSON.stringify(data.translation)
        );
        translatedParas.push(data.translation.trim());
      }

      // ✅ Join paragraphs with real breaks so UI can format them
      setTranslation(translatedParas.join("\n\n"));
    } catch (err) {
      console.error(err);
      toast.error("Translation failed.");
    } finally {
      setTranslating(false);
    }
  };

  const openTranslateDrawer = () => {
    setTranslation(""); // 1️⃣ clear old translation
    setTranslating(false);
    setTranslateDrawerOpen(true);
  };

  const stripMarkdown = (text) =>
    text
      .replace(/[#*_>`~\[\]\(\)]/g, "")
      .replace(/\n{2,}/g, "\n")
      .replace(/\n/g, " ");

  const handleSpeak = (text) => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const cleanText = text.replace(/[#*_>`~\[\]\(\)]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = (text) => {
    const clean = text.replace(/[#*_>`~\[\]\(\)]/g, "");
    navigator.clipboard.writeText(clean);
    toast.success("Copied to clipboard!");
  };

  const handleReadAloud = async () => {
    if (!pdfDoc) {
      console.error("PDF not loaded yet");
      return;
    }

    setReading(true);
    try {
      // Extract file name from URL, e.g. "/pdf_viewer/ikigai.pdf"
      const parts = window.location.pathname.split("/");
      const pdf_name = parts[parts.length - 1];

      // await axios.post(
      //   `${process.env.NEXT_PUBLIC_API_URL}/read_aloud`,
      //   {
      //     pdf_name,
      //     page_number: pageNumber,
      //   },
      //   { withCredentials: true }
      // );

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/read_aloud/`,
        {
          pdf_name,
          page_number: pageNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      toast.success(`Reading page ${pageNumber} aloud…`);
    } catch (err) {
      console.error("Read‑aloud failed:", err);
      toast.error("Failed to start read‑aloud");
    } finally {
      setReading(false);
    }
  };

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [askMeOpen]);

  useEffect(() => {
    console.log("Navbar TOC updated:", toc);
  }, [toc]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && askMeOpen && askInput.trim()) {
        e.preventDefault();
        handleAskSubmit(e);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [askInput, askMeOpen]);

  function Dropdown({ link }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="cursor-pointer"
    >
      <div className="flex items-center space-x-1 group">
        <span>{link.name}</span>
        <ChevronRight
          size={16}
          className={`transition-transform ${
            open ? "rotate-90" : "rotate-0"
          }`}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 mt-2 w-44 rounded-md shadow-lg overflow-hidden z-20
              ${darkMode ? "bg-[#E7F0FD] text-gray-900" : "bg-gray-900 text-white"}
              `}
          >
            {link.children.map((child) => (
              <Link
                key={child.name}
                href={child.path}
                className="relative block px-4 py-2 text-lg font-medium transition-all duration-300 group"
              >
                <span
                  className="block"
                  aria-hidden="true"
                >
                  {child.name}
                </span>
                {/* underline on hover */}
                <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </motion.div>

                  )}
      </AnimatePresence>
    </div>
  );
}


  if (!mounted) {
    return (
      <div
        className={`w-full fixed top-0 left-0 z-50 px-6 py-4 flex items-center justify-between shadow-md
        ${darkMode ? "bg-[#E7F0FD] text-gray-900" : "bg-gray-900 text-white"}
      `}
      >
        <h1 className="text-xl font-bold">Nexus Library</h1>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`w-full fixed top-0 left-0 z-50
                    px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-3
                    flex items-center justify-between
                    bg-opacity-90 backdrop-blur-lg
                    ${darkMode ? "bg-[#E7F0FD] text-gray-900" : "bg-gray-900 text-white"}
      `}
      >
        {/* PDF VIEWER NAVBAR */}
        {isPdfViewer ? (
          <>
            {/* Left Section */}
            <div className="flex flex-1 items-center gap-1 sm:gap-2 lg:gap-4">
              {/* Table of Contents Button */}
              {!showToc ? (
                <Tooltip text="Table of Contents" offsetX={8}>
                  <button
                    title="Toggle Table of Contents"
                    className="p-1.5 rounded-full hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={() => setShowToc((prev) => !prev)}
                  >
                    <LuTableOfContents size={20} />
                  </button>
                </Tooltip>
              ) : (
                <button
                  title="Toggle Table of Contents"
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:bg-gray-700 light:hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => setShowToc((prev) => !prev)}
                >
                  <LuTableOfContents size={20} />
                </button>
              )}
              <h1 className="text-lg sm:text-xl font-bold truncate">Nexus Library</h1>
              <span className="w-px h-6 mx-2 bg-gray-400 dark:bg-gray-600"></span>
              {/* Summary */}
              <Tooltip text="Summary">
                <button
                  onClick={handleSummaryClick}
                  className="p-1.5 rounded-full"
                >
                  <MdSummarize size={20} />
                </button>
              </Tooltip>

              <span className="w-px h-6 mx-2 bg-gray-400 dark:bg-gray-600"></span>
              {/* Translate */}
              <Tooltip text="Translate">
                <button
                  title="Translate"
                  className="p-1.5 rounded-full cursor-pointer"
                  onClick={openTranslateDrawer}
                >
                  <IoLanguage size={20} />
                </button>
              </Tooltip>

              <span className="w-px h-6 mx-2 bg-gray-400 dark:bg-gray-600"></span>
              {/* Read Aloud */}
              <Tooltip text="Read Aloud">
                <button
                  title="Read Aloud"
                  className="p-1.5 rounded-full cursor-pointer"
                  onClick={handleReadAloud}
                  disabled={reading}
                >
                  <IoVolumeHigh size={20} />
                </button>
              </Tooltip>

              <span className="w-px h-6 mx-2 bg-gray-400 dark:bg-gray-600"></span>
              {/* Ask Me */}
              {/* Ask Me Button */}
              <button
                type="button"
                className="flex items-center gap-1 text-base font-medium bg-transparent border-0 cursor-pointer hover:underline focus:outline-none"
                onClick={() => {
                  setAskMeOpen(true);
                }}
                style={{ background: "none" }}
              >
                Ask Me
              </button>
            </div>
            {/* Center Section */}
            <div className="flex justify-center flex-1">
              <div
                className={`hidden sm:flex items-center gap-1 md:gap-2 lg:gap-3 p-1 sm:p-2 rounded-lg pdf-viewer-controls ${
                  darkMode
                    ? "bg-[#E7F0FD] text-gray-900 "
                    : "bg-gray-800 text-white "
                }`}
              >
                <button
                  title="Zoom In"
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700"
                  onClick={() => setZoomLevel((z) => Math.min(z + 10, 200))}
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  title="Fit to Page"
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700"
                  onClick={handleToggle}
                >
                  {isExpanded ? <LuShrink size={20} /> : <LuExpand size={20} />}
                </button>
                <div className="w-px h-6 mx-1 bg-gray-400 dark:bg-gray-600"></div>
                {/* Next/Previous Buttons */}
                <button
                  title="Previous Page"
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700"
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={pageNumber}
                    onChange={(e) =>
                      setPageNumber(e.target.value ? Number(e.target.value) : 1)
                    }
                    className="w-10 text-center rounded bg-transparent focus:outline-none ring-1 ring-inset ring-gray-500/50 focus:ring-blue-500 px-1 py-0.5"
                  />
                  <span className="px-2 text-sm">of {totalPages}</span>
                </div>
                <button
                  title="Next Page"
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700"
                  onClick={() =>
                    setPageNumber((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={pageNumber >= totalPages}
                >
                  <ChevronRight size={20} />
                </button>
                <div className="w-px h-6 mx-1 bg-gray-400 dark:bg-gray-600"></div>
                <button
                  title="Rotate Clockwise"
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                >
                  <TbRotateClockwise2 size={23} />
                </button>
                <button
                  title="Zoom Out"
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700"
                  onClick={() => setZoomLevel((z) => Math.max(z - 10, 10))}
                >
                  <ZoomOut size={20} />
                </button>
              </div>
            </div>
            {/* Right Section */}
            <div className="flex items-center gap-4">

              {/* Download Icon */}
              <Tooltip text="Download PDF">
                <button
                  className="p-1.5 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700"
                  title="Download PDF"
                  onClick={() => {
                    // replace with your actual PDF path or dynamic variable
                    const pdfUrl = "/pdfs/your-document.pdf";
                    window.open(pdfUrl, "_blank");
                  }}
                >
                  <Download size={22} />
                </button>
              </Tooltip>
              <span className="w-px h-6 mx-1 bg-gray-400 dark:bg-gray-600" />
          
              {/* Search Icon */}
              <Tooltip text="Search">
                <button
                  className="p-1.5 rounded-full"
                  onClick={() => setShowPdfSearch((v) => !v)}
                >
                  <FiSearch size={22} />
                </button>
              </Tooltip>
              <span className="w-px h-6 mx-1 bg-gray-400 dark:bg-gray-600"></span>
              {/* Fullscreen Icon */}
              <Tooltip text="Full Screen">
                <button
                  className="p-1.5 rounded-full"
                  onClick={handleFullScreen}
                >
                  <BiFullscreen size={22} />
                </button>
              </Tooltip>
              <span className="w-px h-6 mx-1 bg-gray-400 dark:bg-gray-600"></span>
              {/* Toggle Theme */}
              <button
                className="p-2 bg-gray-200 rounded-full shadow-md cursor-pointer hover:shadow-lg dark:bg-gray-800 dark:text-white"
                onClick={toggleDarkMode}
                title="Toggle Theme"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                )}
              </button>
              <UserStatus />
              <button
                className="sm:hidden p-2"
                onClick={() => setMenuOpen(open => !open)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

            </div>
            {/* PDF Search Box (floating, only for /pdf_viewer) */}
            {showPdfSearch && (
              <div
                className="fixed top-[5.2rem] right-2 sm:right-8 left-2 sm:left-auto z-50
                            flex items-center space-x-1 sm:space-x-2 bg-white dark:bg-[#23272f]
                            rounded-full shadow px-2 sm:px-3 py-1 text-xs sm:text-sm"
                style={{ minWidth: 220 }}
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePdfSearch(); // <-- This should call the prop from page.js
                    }
                  }}
                  placeholder="Search in PDF..."
                  className="flex-1 px-2 py-1 text-sm text-gray-900 bg-transparent outline-none dark:text-white"
                />
                <button
                  onClick={handlePdfSearch} // <-- This should call the prop from page.js
                  className="text-blue-600 transition-transform dark:text-blue-300 hover:scale-110"
                  title="Search"
                >
                  <FiSearch size={18} />
                </button>
                <button
                  onClick={goToPrevResult}
                  disabled={searchResults.length === 0}
                  className="text-gray-500 hover:text-blue-500 disabled:opacity-40"
                  title="Previous result"
                >
                  &#8592;
                </button>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {searchResults.length > 0
                    ? `${currentSearchIndex + 1}/${searchResults.length}`
                    : ""}
                </span>
                <button
                  onClick={goToNextResult}
                  disabled={searchResults.length === 0}
                  className="text-gray-500 hover:text-blue-500 disabled:opacity-40"
                  title="Next result"
                >
                  &#8594;
                </button>
                <button
                  onClick={() => setShowPdfSearch(false)}
                  className="ml-2 text-gray-400 transition hover:text-red-500"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          // NON-PDF VIEWER NAVBAR
          <>
            <div className="flex items-center gap-2 z-10">
            <h1 className="text-xl font-bold">Nexus Library</h1>
            <button
              className="p-2 bg-gray-200 rounded-full shadow-md hover:shadow-lg dark:bg-gray-800 dark:text-white"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              )}
            </button>
          </div>

            <div className="z-10 flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-lg font-medium">
                {navLinks.map((link) => (
                  <div key={link.name} className="relative">
                    {link.children ? (
                      <Dropdown link={link} />
                    ) : (
                      <Link href={link.path} className="relative group">
                        {link.name}
                        <span className="absolute left-0 -bottom-1 w-0 h-0.5
                                        bg-current group-hover:w-full transition-all duration-300" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              
              <UserStatus />
            </div>
          </>
        )}

        {/* Mobile Menu for non-pdf-viewer */}
        {!isPdfViewer && (
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className={`sm:hidden absolute top-full left-0 w-full max-h-[60vh] overflow-y-auto bg-opacity-90 backdrop-blur-lg
                  ${darkMode ? "bg-[#E7F0FD] text-gray-900" : "bg-gray-900 text-white"}`}
              >
                <div className="flex flex-col items-center py-4 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => setMenuOpen(false)}
                    className="text-lg font-medium transition-all duration-300 hover:underline"
                  >
                    {link.name}
                  </Link>
                ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
      {askMeOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div
            className={`w-full sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2
                        h-[80vh] sm:h-[75vh] md:h-[70vh]
                        rounded-2xl mx-2 sm:mx-auto flex flex-col shadow-lg ${
              darkMode
                ? "bg-white text-gray-900 border border-gray-200"
                : "bg-[#1e293b] text-white border border-[#334155]"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${
                darkMode
                  ? "bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-white"
                  : "bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white"
              }`}
            >
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <FontAwesomeIcon icon={faRobot} />
                Nexus Chatbot
              </h2>
              <button
                className="text-xl transition hover:text-red-500"
                onClick={() => setAskMeOpen(false)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Body */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-5 ${
                darkMode ? "bg-[#f8fafc]" : "bg-[#101828]"
              }`}
            >
              {isLoading && (
                <motion.div
                  className={`text-sm italic text-center animate-pulse ${
                    darkMode ? "text-gray-600" : "text-gray-300"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* 🤖 Generating response... */}
                </motion.div>
              )}

              {askMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.from === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`relative max-w-xs md:max-w-md px-4 py-2 rounded-lg text-base break-words shadow-sm ${
                      msg.from === "user"
                        ? darkMode
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-[#4f46e5] text-white"
                        : darkMode
                        ? "bg-[#E7F0FD] text-gray-900"
                        : "bg-[#2b3c6e] text-gray-300"
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        h2: ({ node, ...props }) => (
                          <h2
                            className="mt-2 mb-1 font-bold text-blue-500"
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="ml-5 space-y-1 list-disc" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-snug" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong
                            className="font-semibold text-indigo-500"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>

                    {/* Tools below the bot message */}
                    {msg.from === "bot" && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleSpeak(msg.text)}>
                          <Volume2
                            size={16}
                            className={`${
                              isSpeaking
                                ? "animate-pulse text-red-500"
                                : "text-gray-500"
                            } hover:text-indigo-400`}
                          />
                        </button>
                        <button onClick={() => handleCopy(msg.text)}>
                          <ClipboardCopy
                            size={16}
                            className="text-gray-500 hover:text-indigo-400"
                          />
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>
              ))}

              {/* Inline loading message box styled like bot message */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex ${
                    darkMode ? "justify-start" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg text-base italic animate-pulse ${
                      darkMode
                        ? "bg-[#E7F0FD] text-gray-600"
                        : "bg-[#2b3c6e] text-gray-300"
                    }`}
                  >
                    🤖 Generating response...
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Section */}
            <div
              className={`p-4 rounded-b-2xl ${
                darkMode
                  ? "bg-[#f1f5f9] border-t border-gray-200"
                  : "bg-[#1e293b] border-t border-[#334155]"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  ref={askInputRef}
                  type="text"
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  placeholder="Type your question here..."
                  className={`flex-1 px-2 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base outline-none ${
                    darkMode
                      ? "bg-white text-gray-900 placeholder-gray-400"
                      : "bg-[#0f172a] text-white placeholder-gray-400"
                  }`}
                />
                <button
                  onClick={handleAskSubmit}
                  className={`px-2 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${
                    darkMode
                      ? "bg-indigo-500 text-white hover:bg-indigo-600"
                      : "bg-[#6366f1] text-white hover:bg-[#4f46e5]"
                  }`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Drawer */}
      <SummaryDrawer
        isOpen={isSummaryDrawerOpen}
        toggleDrawer={() => setIsSummaryDrawerOpen((prev) => !prev)}
        summary={summary}
        loading={loadingSummary}
        textType={textType}
        onGenerateSummary={handleGenerateSummary}
      />

      {/* Translate Sidebar */}
      <TranslateDrawer
        isOpen={isTranslateDrawerOpen}
        toggleDrawer={() => setTranslateDrawerOpen(false)}
        onTranslate={handleTranslate}
        loading={translating}
        translation={translation}
      />
    </>
  );
};

export default Navbar;
