// components/ui/SearchInsideCard.jsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SearchInsideCard({ item, darkMode, index }) {
  return (
    <motion.div
      key={item.id}
      className={`flex items-center gap-6 p-4 rounded-xl shadow-md transition hover:scale-[1.01] ${
        darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* cover */}
      <img
        src={item.coverImage}
        alt={item.title}
        className="w-20 h-32 object-cover rounded-md border"
      />

      {/* details */}
      <div className="flex-1 flex flex-col gap-1">
        <h3 className="text-lg font-bold">{item.title}</h3>
        <p className="text-sm font-medium opacity-75">by {item.author}</p>
        <p className="text-sm line-clamp-3 mt-1">{item.description}</p>
      </div>

      {/* buttons */}
      <div className="flex flex-col items-end gap-3">
        <Link href={`/book/${item.id}`} passHref>
          <button
            className="px-4 py-1 rounded text-sm font-semibold text-black"
            style={{
              background:
                "linear-gradient(205deg, rgb(187, 139, 255), rgb(117, 246, 255))",
            }}
          >
            Borrow
          </button>
        </Link>
        <button
          className={`border px-4 py-1 rounded text-sm transition ${
            darkMode
              ? "border-gray-500 text-black hover:bg-gray-300"
              : "border-white text-white hover:bg-gray-700"
          }`}
        >
          Want to Read
        </button>
      </div>
    </motion.div>
  );
}
