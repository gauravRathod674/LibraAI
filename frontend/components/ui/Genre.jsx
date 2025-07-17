"use client";
import React from "react";
import { motion } from "framer-motion";

const GenreCard = ({ item, darkMode }) => {
  const { name, image, description } = item;

  return (
    <motion.div
              className={`w-full rounded-xl p-4 shadow-md transition hover:scale-[1.01] overflow-hidden flex flex-col sm:flex-row gap-6 justify-between items-start ${
                darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
      <img
        src={image}
        alt={name}
        className="w-24 h-24 object-cover rounded-md border"
      />
      <div className="flex-1 space-y-2">
        <h3 className="text-xl font-bold leading-tight">{name}</h3>
        <p className="text-sm">{description}</p>
      </div>
    </motion.div>
  );
};

export default GenreCard;
