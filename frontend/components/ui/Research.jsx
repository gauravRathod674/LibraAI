"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import axios from "axios";

export default function Research({ searchTerm, hasSearched  }) {
  const { darkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch research papers from backend API
  useEffect(() => {
    const fetchPapers = async () => {
      if (!hasSearched || !searchTerm.trim()) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/search/research`,
          {
            params: { title: searchTerm },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
          }
        );
        setPapers(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching research papers:", err);
        setError("Failed to fetch research papers");
        setPapers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [hasSearched, searchTerm]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q) ||
      p.tldr.toLowerCase().includes(q) ||
      (p.authors || []).join(" ").toLowerCase().includes(q)
    );
  }, [papers, searchTerm]);

  return (
    <div className="relative min-h-screen transition-all">
      <canvas
        id="researchBackground"
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      />

      <div className="relative z-10 flex flex-col space-y-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading papers...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500">
            No research papers found for “{searchTerm}”
          </p>
        ) : (
          filtered.map((paper, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`p-6 rounded-xl border shadow-md hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01] w-full flex ${
                darkMode
                  ? "bg-[#E7F0FD] text-gray-900 border-gray-300"
                  : "bg-gray-800 text-white border-gray-700"
              }`}
            >
              <div className="w-[85%] pr-4">
                <h2 className="text-xl font-semibold mb-1 hover:text-indigo-400 transition duration-200">
                  {paper.title}
                </h2>
                <p className="text-sm text-indigo-500 font-medium mb-1">
                  {paper.venue}
                </p>
                {isClient && (
                  <p className="text-sm text-gray-500 mb-2">
                    {paper.authors.join(", ")} • {paper.pub_date}
                  </p>
                )}
                <p className="text-sm opacity-80 mb-4">{paper.tldr}</p>
              </div>

              <div className="w-[15%] flex flex-col items-end justify-center gap-3 min-w-[120px]">
                <button
                  onClick={() => window.open(paper.pdf_link, "_blank")}
                  className="px-4 py-2 rounded-full text-sm font-medium shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full"
                >
                  View PDF
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
