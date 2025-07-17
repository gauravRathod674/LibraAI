"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const AuthorCard = ({ author, darkMode }) => {
  if (!author) return null;

  const {
    author_name,
    image_src,
    about,
    books = [],
    total_pages,
    author_url,
  } = author;

  return (
    <motion.div
      className={`w-full rounded-xl p-4 shadow-md transition hover:scale-[1.01] overflow-hidden flex flex-col gap-6 ${
        darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Author Info */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <img
          src={image_src}
          alt={author_name}
          className="w-28 h-36 object-cover rounded-md border"
        />

        <div className="flex-1 space-y-2">
          <h2 className="text-xl font-bold leading-tight">{author_name}</h2>

          {about && (
            <p className="text-sm text-white-700 whitespace-pre-line">
              {about}
            </p>
          )}

          <p className="text-sm mt-1">
            <span className="font-semibold">{books.length}</span> books listed
          </p>

          {books.length > 0 && (
            <p className="text-sm italic mt-1">
              Notable works:{" "}
              <span className="text-white-500 font-medium">
                {books.slice(0, 3).map((book) => book.title).join(", ")}
              </span>
            </p>
          )}

          <a
            href={author_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold mt-2 underline text-blue-300"
          >
            View on OpenLibrary →
          </a>
        </div>
      </div>

      {/* Books Section */}
      {books.length > 0 && (
        <div className="flex flex-col gap-6 mt-4">
          {books.map((book, idx) => (
            <div
              key={idx}
              className={`w-full rounded-xl p-4 shadow-md hover:scale-[1.01] overflow-hidden flex flex-col sm:flex-row gap-6 justify-center items-center transition ${
                darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
              }`}
            >
              {/* Book Cover */}
              <div className="flex flex-col items-center">
                <img
                  src={book.image_src}
                  alt={book.title}
                  className="w-24 h-36 object-cover rounded-md border"
                />
              </div>

              {/* Book Info */}
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <h2 className="text-xl font-bold leading-tight">{book.title}</h2>
                <p className="text-white-600 font-medium text-sm">by {book.author}</p>


                <div className="text-sm flex flex-wrap gap-4 mt-2 items-center">
                  <span>{book.first_published}</span>
                  <span className="text-white-500 hover:underline cursor-pointer">
                    {book.editions}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-end gap-5">
                <Link href={book.book_url || "#"} passHref>
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
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AuthorCard;
