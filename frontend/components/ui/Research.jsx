// frontend/app/search/Research.jsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import axios from "axios";
import { FaDownload, FaSpinner, FaCheckCircle } from "react-icons/fa"; // Import new icons

export default function Research({ searchTerm, hasSearched }) {
  const { darkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadStatus, setDownloadStatus] = useState({}); // To track download state for each paper

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ... (keep the existing useEffect for fetching papers)
  useEffect(() => {
    const controller = new AbortController();

    const fetchPapers = async (retryCount = 0) => {
      if (!searchTerm.trim()) {
        setPapers([]);
        setLoading(false);
        return;
      }

      const maxRetries = 15;
      if (retryCount >= maxRetries) {
        setError("Failed to fetch results from the server after multiple attempts.");
        setLoading(false);
        return;
      }

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
            validateStatus: (status) => {
              return (status >= 200 && status < 300) || status === 202;
            },
          }
        );

        if (res.status === 202) {
          console.log("Backend is processing... retrying in 4 seconds.");
          setTimeout(() => fetchPapers(retryCount + 1), 4000);
        } else {
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

    return () => {
      controller.abort();
    };
  }, [searchTerm, hasSearched]);
  
  const filtered = useMemo(() => {
    // ... (keep this memoized filter logic the same)
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


  const handleDownloadPdf = async (paper) => {
    // Use paper title as a unique key for status
    const paperKey = paper.title;
    if (downloadStatus[paperKey] === 'downloading' || downloadStatus[paperKey] === 'downloaded') {
        return; // Prevent multiple clicks
    }

    setDownloadStatus(prev => ({ ...prev, [paperKey]: 'downloading' }));

    try {
        await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/download-research-paper`,
            {
                pdf_url: paper.pdf_link,
                title: paper.title,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                withCredentials: true,
            }
        );
        setDownloadStatus(prev => ({ ...prev, [paperKey]: 'downloaded' }));
    } catch (err) {
        console.error("Failed to download PDF:", err);
        setDownloadStatus(prev => ({ ...prev, [paperKey]: 'error' }));
        // Optionally, reset status after a few seconds to allow retrying
        setTimeout(() => {
            setDownloadStatus(prev => ({ ...prev, [paperKey]: null }));
        }, 5000);
    }
  };
  
  const getDownloadButtonContent = (paper) => {
    const status = downloadStatus[paper.title];
    switch (status) {
      case 'downloading':
        return <><FaSpinner className="animate-spin" /> Downloading...</>;
      case 'downloaded':
        return <><FaCheckCircle /> Downloaded</>;
      case 'error':
        return "Download Failed";
      default:
        return <> Download PDF</>;
    }
  };

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
              // ... (keep animation props)
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`p-6 rounded-xl border shadow-md hover:shadow-xl transition-all w-full flex ${
                darkMode
                  ? "bg-[#E7F0FD] text-gray-900 border-gray-300"
                  : "bg-gray-800 text-white border-gray-700"
              }`}
            >
              <div className="w-[85%] pr-4">
                 {/* ... (keep paper details) */}
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

              <div className="w-[15%] flex flex-col items-end justify-center gap-4 min-w-[130px]">
                 <button
                    onClick={() => window.open(paper.pdf_link, "_blank")}
                    className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full"
                >
                    View PDF
                </button>
                <button
                    onClick={() => handleDownloadPdf(paper)}
                    disabled={downloadStatus[paper.title] === 'downloading' || downloadStatus[paper.title] === 'downloaded'}
                    className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer shadow-md hover:scale-105 transition w-full flex items-center justify-center gap-2 ${
                        downloadStatus[paper.title] === 'downloaded' ? 'bg-green-500 text-white' : 
                        downloadStatus[paper.title] === 'downloading' ? 'bg-gray-500 text-white' : 
                        downloadStatus[paper.title] === 'error' ? 'bg-red-500 text-white' : 
                        'bg-gradient-to-r from-purple-400 to-cyan-300 text-black'
                    }`}
                >
                    {getDownloadButtonContent(paper)}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}