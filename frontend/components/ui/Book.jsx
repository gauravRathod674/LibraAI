"use client";
import React from "react";
import Link from "next/link";

const Book = ({ item, darkMode }) => {
  if (!item) return null;

  const {
    title,
    author,
    imgSrc,
    rating,
    num_ratings,
    first_published,
    num_editions,
    url,
  } = item;

  return (
    <div
      className={`w-full rounded-xl p-4 shadow-md hover:scale-[1.01] overflow-hidden flex flex-col sm:flex-row gap-6 justify-center items-center transition ${
        darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
      }`}
    >
      {/* Cover Image */}
      <div className="flex flex-col items-center">
        <img
          src={imgSrc}
          alt={title}
          className="w-24 h-36 object-cover rounded-md border"
        />
      </div>

      {/* Book Info */}
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <h2 className="text-xl font-bold leading-tight">{title}</h2>
        <p className="text-white-600 font-medium text-sm">by {author}</p>

        <div className="flex items-center text-sm">
          <span className="text-yellow-400">★</span>
          <span className="ml-1 font-semibold">{rating}</span>
          <span className="ml-1">({num_ratings} ratings)</span>
        </div>

        <div className="text-sm flex flex-wrap gap-4 mt-2 items-center">
          <span>First published in {first_published}</span>
          <span className="text-white-500 hover:underline cursor-pointer">
            {num_editions}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-end gap-5">
        <Link href={url || "#"} passHref>
          <button
            className="px-4 py-1 rounded text-sm font-semibold text-black"
            style={{
              background:
                "linear-gradient(205deg, rgb(187, 139, 255), rgb(117, 246, 255))",
            }}
          >
            Read
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
    </div>
  );
};

export default Book;
