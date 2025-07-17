"use client";
import React from "react";
import { motion } from "framer-motion";

const ListCard = ({ item, darkMode }) => {
  const { title, books } = item;

  return (
    <motion.div
      className={`w-full rounded-xl p-4 shadow-md transition hover:scale-[1.01] overflow-hidden flex flex-col gap-4 ${
        darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-xl font-bold">{title}</h3>
      <ul className="list-disc list-inside text-sm space-y-1 pl-2">
        {books.map((book, idx) => (
          <li key={idx}>{book}</li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ListCard;
