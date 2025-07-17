"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardCopy, Volume2 } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import ReactMarkdown from "react-markdown";
import { toast } from "react-hot-toast";

export default function SummaryDrawer({
  isOpen,
  toggleDrawer,
  summary,
  loading,
  textType,
  onGenerateSummary,
}) {
  const { darkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const el = document.querySelector(".summary-scroll");
      if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [isOpen]);

  const stripMarkdown = (markdownText) => {
    return markdownText
      .replace(/[#*_>`~\[\]\(\)]/g, "")
      .replace(/\n{2,}/g, "\n")
      .replace(/\n/g, " ");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(stripMarkdown(summary));
    toast.success("Summary copied to clipboard!");
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const cleanText = stripMarkdown(summary);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleDrawer}
          />

          <motion.div
            className={`fixed top-0 right-0 z-50 h-full ${
              isMobile ? "w-full" : "w-80 sm:w-96"
            } flex flex-col shadow-2xl ${
              darkMode ? "bg-white text-gray-900" : "bg-[#1e293b] text-white"
            }`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            <div
              className={`flex items-center justify-between px-5 py-4 rounded-t-lg ${
                darkMode
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-gradient-to-r from-[#818cf8] to-[#a78bfa]"
              }`}
            >
              <h2 className="text-lg font-bold">📄 Summary</h2>
              <button onClick={toggleDrawer} className="p-1 transition hover:text-red-300">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto summary-scroll">
              {!summary && !loading && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed opacity-80">
                    ✨ Choose what you want to summarize:
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onGenerateSummary("page")}
                      className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    >
                      📄 Summarize Current Page
                    </button>
                    <button
                      onClick={() => onGenerateSummary("chapter")}
                      className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                    >
                      📘 Summarize Current Chapter
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <p className="text-sm leading-relaxed animate-pulse">📝 Generating summary, please wait...</p>
              )}

              {!loading && summary && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      📄 Summary Type: <span className="italic">{textType || "page"}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={handleSpeak} className="text-gray-400 hover:text-indigo-400">
                        <Volume2 size={18} className={isSpeaking ? "animate-pulse text-red-500" : ""} />
                      </button>
                      <button onClick={handleCopy} className="text-gray-400 hover:text-indigo-400">
                        <ClipboardCopy size={18} />
                      </button>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="leading-relaxed prose prose-base dark:prose-invert max-w-none"
                  >
                    <ReactMarkdown
                      components={{
                        h2: ({ node, ...props }) => (
                          <h2 className="mt-6 mb-3 text-xl font-bold text-blue-500" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="ml-5 space-y-2 list-disc" {...props} />
                        ),
                        li: ({ node, ...props }) => <li className="leading-normal" {...props} />,
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-indigo-500" {...props} />
                        ),
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
