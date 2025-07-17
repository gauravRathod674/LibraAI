"use client";
import React from "react";
import { motion } from "framer-motion";

const ResultsHeader = ({ totalHits = 0, darkMode }) => {
  return (
    <div
      className={`w-60 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-2 py-2 rounded-lg ${
        darkMode ? "bg-[#f7f7f7] text-black" : "bg-gray-900 text-white"
      }`}
    >
      <p className="text-sm font-medium mb-2 sm:mb-0">
        {totalHits} {totalHits === 1 ? "hit" : "hits"}
      </p>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Sort by:</label>
        <select
          className={`px-2 py-1 rounded border text-sm focus:outline-none ${
            darkMode
              ? "bg- text-black border-gray-300"
              : "bg-gray-700 text-white border-gray-600"
          }`}
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
};

export default ResultsHeader;