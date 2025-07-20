"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import axios from "axios";

export default function Research({ searchTerm, hasSearched }) {
  const { darkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPapers = async (retryCount = 0) => {
      if (!searchTerm.trim()) {
        setPapers([]);
        setLoading(false);
        return;
      }

      // Set a maximum number of retries to avoid an infinite loop
      const maxRetries = 15;
      if (retryCount >= maxRetries) {
        setError("Failed to fetch results from the server after multiple attempts.");
        setLoading(false);
        return;
      }

      // On the first attempt for a new search, clear old results and set loading.
      if (retryCount === 0) {
        setLoading(true);
        setError("");
        setPapers([]);
      }

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/search/research`,
          {
            params: { title: searchTerm },
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
            // Tell axios not to throw an error on a 202 status
            validateStatus: (status) => {
              return (status >= 200 && status < 300) || status === 202;
            },
          }
        );

        // If status is 202, the backend is still scraping.
        if (res.status === 202) {
          console.log("Backend is processing... retrying in 4 seconds.");
          // Wait for 4 seconds and then poll the endpoint again.
          setTimeout(() => fetchPapers(retryCount + 1), 4000);
        } else {
          // If status is 200, the data is ready.
          setPapers(res.data || []);
          setLoading(false);
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("❌ Error fetching research papers:", err);
          setError("Failed to fetch research papers. An error occurred.");
          setPapers([]);
          setLoading(false);
        }
      }
    };

    if (hasSearched && searchTerm.trim()) {
        fetchPapers();
    } else {
        setLoading(false);
        setPapers([]);
    }

    // Cleanup function to abort the request if the component unmounts
    return () => {
      controller.abort();
    };
  }, [searchTerm, hasSearched]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(
      (p) =>
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
        ) : filtered.length === 0 && hasSearched ? (
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

              <div className="w-[15%] flex flex-col items-end justify-center gap-7 min-w-[120px]">
                 {/* {paper.pdf_link && paper.pdf_link !== "N/A" && ( */}
                    <button
                        onClick={() => window.open(paper.pdf_link, "_blank")}
                        className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full"
                    >
                        View PDF
                    </button>
                    <button
                        onClick={() => window.open(paper.pdf_link, "_blank")}
                        className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full"
                    >
                        Download PDF
                    </button>
                 {/* )} */}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}