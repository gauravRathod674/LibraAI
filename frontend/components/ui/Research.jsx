"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";

export default function Research({ papers, searchTerm }) {
  const { darkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);

  // for client‑side only bits (e.g. toLocaleDateString)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // filter by title, subtitle, author, description
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }, [papers, searchTerm]);

  return (
    <div className="relative min-h-screen transition-all">
      {/* Particle background (copied from your page.js) */}
      <canvas
        id="researchBackground"
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      />

      {/* Papers list */}
      <div className="relative z-10 flex flex-col space-y-6">
        {filtered.map((paper, idx) => (
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
                {paper.subtitle}
              </p>
              {isClient && (
                <p className="text-sm text-gray-500 mb-2">
                  By {paper.author} •{" "}
                  {new Date(paper.date).toLocaleDateString()}
                </p>
              )}
              <p className="text-sm opacity-80 mb-4">{paper.description}</p>
            </div>
            <div className="w-[15%] flex flex-col items-end justify-center gap-3 min-w-[120px]">
              <button className="px-4 py-2 rounded-full text-sm font-medium shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full">
                View Abstract
              </button>
              <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-900 hover:bg-gray-300 w-full">
                Download PDF
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500">
            No research papers found for “{searchTerm}”
          </p>
        )}
      </div>
    </div>
  );
}
