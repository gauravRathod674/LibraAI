"use client"; 
import { motion } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Navbar from "@/components/ui/Navbar";
import { useTheme } from "../context/ThemeContext"; 
import Footer from "@/components/ui/Footer";
import { book } from "../data";

const BookDetailPage = () => {
  const { darkMode } = useTheme();
  
  // Ref and state for More Editions scroll buttons height
  const editionsScrollRef = useRef(null);
  const editionsCardRef = useRef(null);
  const [editionsCardHeight, setEditionsCardHeight] = useState(0);
  
  // Refs and state for Readers Also Enjoyed scroll buttons height
  const readersScrollRef = useRef(null);
  const readersCardRef = useRef(null);
  const [readersCardHeight, setReadersCardHeight] = useState(0);

  useEffect(() => {
    // Measure More Editions card height
    if (editionsCardRef.current) {
      setEditionsCardHeight(editionsCardRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    // Measure Readers Also Enjoyed first card height
    if (readersCardRef.current) {
      setReadersCardHeight(readersCardRef.current.offsetHeight);
    }
  }, []);

  const scrollEditions = (direction) => {
    const distance = 300;
    if (editionsScrollRef.current) {
      editionsScrollRef.current.scrollBy({
        left: direction === 'left' ? -distance : distance,
        behavior: 'smooth',
      });
    }
  };


  

  // Particles effect
  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = [];
    const numParticles = 50;
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 3 + 1;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = darkMode
          ? "rgba(117, 246, 255, 0.6)"
          : "rgba(100, 149, 237, 0.6)";
        ctx.fill();
      }
      update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.dy *= -1;
        this.draw();
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.update());
    }
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [darkMode]);


  return (
    <div
      className={`relative flex flex-col items-center justify-center min-h-screen transition-all duration-500 ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <canvas
        id="backgroundCanvas"
        className="absolute top-0 left-0 w-full h-full"
      ></canvas>

      <Navbar />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex flex-col lg:flex-row">
          {/* Left Section (Sticky) */}
          <div className="w-full sm:w-3/4 lg:w-1/3 h-fit lg:sticky lg:top-20 flex flex-col items-center lg:items-start space-y-4 px-4 sm:px-8 lg:px-20">
            <img
              src={book.image_src}
              alt={book.title}
              className="w-full max-w-xs sm:max-w-sm rounded-md shadow-lg"
            />

            <div className="flex flex-col space-y-2 w-75">
              <button
                className="w-full px-4 py-2 rounded text-sm font-medium text-black shadow-md transition duration-300"
                style={{
                  background:
                    "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                }}
              >
                Want to Read
              </button>
              <button className="w-full px-4 py-2 rounded border text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300">
                Read
              </button>
            </div>

            <div className="w-75">
              <p className="mt-2 mb-2 font-medium text-sm">Rate this book:</p>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6 cursor-pointer text-yellow-400 hover:scale-110 transition-transform duration-150"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section (Scrollable Content) */}
          <div className="w-full lg:w-2/3 lg:ml-8 mt-8 lg:mt-0 space-y-8">
          <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`rounded-xl shadow-xl p-6 space-y-5 transition-colors duration-300 ${
        darkMode ? "bg-white" : "bg-gray-900"
      }`}
    >
      {/* Title */}
      <h1
        className={`text-3xl md:text-6xl font-bold ${
          darkMode ? "text-gray-800" : "text-white"
        }`}
      >
        {book.title}
      </h1>

      {/* Authors */}
      <p
        className={`text-md ${
          darkMode ? "text-gray-600" : "text-gray-300"
        }`}
      >
        <span className="font-semibold">By:</span> {book.authors.join(", ")}
      </p>

      {/* Ratings */}
      <p
        className={`text-sm font-medium ${
          darkMode ? "text-yellow-600" : "text-yellow-400"
        }`}
      >
        {book.rating_out_of_5}
      </p>

      {/* First Sentence */}
      {book.first_sentence && (
        <blockquote
          className={`italic pl-4 border-l-4 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          } border-indigo-500`}
        >
          {book.first_sentence}
        </blockquote>
      )}

      {/* Description */}
      <div>
        <h2
          className={`text-lg font-semibold mb-1 ${
            darkMode ? "text-gray-800" : "text-white"
          }`}
        >
          Description
        </h2>
        <p className={`text-sm leading-relaxed ${
          darkMode ? "text-gray-700" : "text-gray-300"
        }`}>
          {book.description}
        </p>
      </div>

      <div>
        {/* Translation Info */}
        {book.translation_of && (
          <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"} mt-5 mb-5`}>
            <strong>Translation of:</strong> {book.translation_of}
          </p>
        )}
        {book.translated_from && (
          <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}  mt-5 mb-5`}>
            <strong>Translated from:</strong> {book.translated_from}
          </p>
        )}

        {/* Edition Identifiers */}
        {book.edition_identifiers && (
          <div className=" mt-5 mb-5 space-y-1">
            <h2 className={`text-md font-semibold ${darkMode ? "text-gray-800" : "text-white"}`}>Edition Identifiers</h2>
            {Object.entries(book.edition_identifiers).map(([key, value]) => (
              <p key={key} className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
                <strong>{key.replace(/_/g, " ").toUpperCase()}:</strong> {value}
              </p>
            ))}
          </div>
        )}

        {/* Edition Notes */}
        {book.edition_notes && (
          <div className=" mt-5 mb-5">
            <h2 className={`text-md font-semibold ${darkMode ? "text-gray-800" : "text-white"}`}>Edition Notes</h2>
            <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
              {book.edition_notes}
            </p>
          </div>
        )}

        {/* Published In */}
        {book.published_in && (
          <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}  mt-5 mb-5`}>
            <strong>Published In:</strong> {book.published_in}
          </p>
        )}

        {/* Other Titles */}
        {book.other_titles && book.other_titles.length > 0 && (
          <div className=" mt-5 mb-5">
            <h2 className={`text-md font-semibold ${darkMode ? "text-gray-800" : "text-white"}`}>Other Titles</h2>
            <ul className="list-disc list-inside text-sm">
              {book.other_titles.map((title, idx) => (
                <li key={idx} className={`${darkMode ? "text-gray-600" : "text-gray-300"}`}>
                  {title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Read & Book Links */}
        <div className=" mt-5 mb-5 flex gap-4">
          {book.read_url && (
            <a
              href={book.read_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                darkMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              Read Book
            </a>
          )}
          {book.book_url && (
            <a
              href={book.book_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2  mt-5 mb-5 rounded-md text-sm font-medium ${
                darkMode
                  ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              View on OpenLibrary
            </a>
          )}
        </div>
      </div>


            {/* Work Description */}
            {book.work_description && (
              <div>
                <h2
                  className={`text-lg font-semibold  mt-5 mb-5 ${
                    darkMode ? "text-gray-800" : "text-white"
                  }`}
                >
                  Work Description
                </h2>
                <p className={`text-sm leading-relaxed ${
                  darkMode ? "text-gray-700" : "text-gray-300"
                }`}>
                  {book.work_description}
                </p>
              </div>
            )}

      {/* Table of Contents */}
      <div className="book-detail-container p-6">
      {book.table_of_contents && book.table_of_contents.length > 0 && (
        <div className="mt-8 w-full">
          <h2
            className={`text-2xl font-bold mb-4 ${
              darkMode ? "text-gray-800" : "text-white"
            }`}
          >
            Table of Contents
          </h2>

          {/* Container showing part of the content with fade effect */}
          <div
            className={`relative max-h-[300px] overflow-y-auto p-4 rounded-lg shadow-inner border ${
              darkMode
                ? "bg-[#E4F0FD] text-gray-800 border-gray-300"
                : "bg-gray-800 text-gray-300 border-gray-700"
            } space-y-2`}
          >
            
            {book.table_of_contents.map((item, idx) => (
              <p key={idx} className="leading-relaxed">
                {item}
              </p>
            ))}
          </div>
  
        </div>
      )}
    </div>
  

      {/* Additional Info */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
            <strong>Publisher:</strong> {book.publisher}
          </p>
          <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
            <strong>Published:</strong> {book.publish_date}
          </p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
            <strong>Language:</strong> {book.language}
          </p>
          <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
            <strong>Pages:</strong> {book.pages}
          </p>
        </div>
      </div>

      {/* Subjects */}
      {book.subjects && book.subjects.length > 0 && (
        <div>
          <h2
            className={`text-lg font-semibold mb-1 ${
              darkMode ? "text-gray-800" : "text-white"
            }`}
          >
            Subjects
          </h2>
          <div className="flex flex-wrap gap-2">
            {book.subjects.map((subj, idx) => (
              <a
                key={idx}
                href={subj.url}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  darkMode
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {subj.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>

            {/* Book Details */}
            <div className="border-t pt-4">
              <h3 className="text-2xl font-bold mb-2">This Edition</h3>
              <div className={`space-y-1 ${darkMode ? "from-white" : "from-gray-800"}`}>
                <p>
                  <strong>Edition:</strong> {book.details.edition}
                </p>
                <p>
                  <strong>Format:</strong> {book.details.format}
                </p>
                <p>
                  <strong>Published:</strong> {book.details.published}
                </p>
                <p>
                  <strong>ASIN:</strong> {book.details.ASIN}
                </p>
                <p>
                  <strong>Language:</strong> {book.details.language}
                </p>
              </div>
            </div>

           {/* More Editions */}
            <div className="border-t pt-4">
              <h3 className={`text-2xl font-bold mb-2 ${darkMode ? "text-gray-800" : "text-white"}`}>
                More Editions
              </h3>

              {/* Scrollable Container for More Editions */}
              <div className="relative">
                {/* Scroll Buttons */}
                <div
                  className="absolute z-10 flex flex-col rounded-md overflow-hidden shadow"
                  style={{
                    right: "-10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: `${editionsCardHeight}px`,
                  }}
                >
                  <button
                    onClick={() => scrollEditions("left")}
                    className={`flex items-center justify-center w-8 h-1/2 p-1 ${
                      darkMode ? "bg-gray-200 text-gray-900 hover:bg-gray-300" : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() => scrollEditions("right")}
                    className={`flex items-center justify-center w-8 h-1/2 p-1 ${
                      darkMode ? "bg-gray-200 text-gray-900 hover:bg-gray-300" : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    <FaChevronRight />
                  </button>
                </div>

                {/* Horizontal Scroll Row */}
                <div
                  ref={(el) => {
                    editionsScrollRef.current = el;
                    // Attach card ref to the first edition for height measurement
                    if (el && !editionsCardRef.current) {
                      editionsCardRef.current = el.firstChild;
                    }
                  }}
                  className="flex space-x-4 overflow-x-auto scroll-smooth touch-pan-x px-2 pr-6"
                >
                  {book.moreEditions.map((edition, index) => (
                    <div key={index} className="min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-start flex-shrink-0">
                      <img
                        src={edition.image_src}
                        alt={edition.title}
                        className="w-200 h-60 object-cover rounded-md shadow"
                      />
                      <p
                        className={`text-xs mt-1 font-medium truncate ${
                          darkMode ? "text-gray-800" : "text-white"
                        }`}
                        title={edition.title}
                      >
                        {edition.title}
                      </p>

                      <p
                        className={`text-[11px] transition-colors duration-300 ${
                          darkMode ? "text-gray-600" : "text-[#E4F0FD]"
                        }`}
                      >
                        {edition.publisher}
                      </p>

                      <p
                        className={`text-[11px] transition-colors duration-300 ${
                          darkMode ? "text-gray-600" : "text-[#E4F0FD]"
                        }`}
                      >
                        {edition.year}
                      </p>

                      <p
                        className={`text-[11px] break-all transition-colors duration-300 ${
                          darkMode ? "text-blue-700 hover:text-blue-900" : "text-[#E4F0FD] hover:text-white"
                        }`}
                      >
                        <a href={edition.url} target="_blank" rel="noopener noreferrer">
                          {edition.url}
                        </a>
                      </p>

                      <p
                        className={`text-[11px] transition-colors duration-300 ${
                          darkMode ? "text-gray-600" : "text-[#E4F0FD]"
                        }`}
                      >
                        {edition.language}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#"
                className={`mt-4 text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300 hover:underline inline-block ${
                  darkMode ? "text-gray-800" : "text-white"
                }`}
              >
                Browse all editions →
              </a>
            </div>



            {/* About the Author */}
            <div className="border-t pt-4">
              <h3 className="text-2xl font-bold mb-2">About the Author</h3>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <img
                  src={book.authorInfo.photo}
                  alt={book.author}
                  className="w-24 h-24 object-cover rounded-full shadow-lg"
                />
                <p className="text-base text-gray-500">{book.authorInfo.bio}</p>
              </div>
            </div>

            {/* Readers Also Enjoyed with Scroll Buttons */}
<div className="border-t pt-4">
  <h3 className={`text-2xl font-bold mb-10 ${darkMode ? "text-gray-800" : "text-white"}`}>
    Readers Also Enjoyed
  </h3>
  <div className="relative">
    {/* Scroll Buttons for Readers Also Enjoyed */}
    <div
      className="absolute z-10 flex flex-col rounded-md overflow-hidden shadow"
      style={{
        right: "-10px",
        top: "50%",
        transform: "translateY(-50%)",
        height: `${readersCardHeight}px`,
      }}
    >
      <button
        onClick={() => scrollEditions("left")}
        className={`flex items-center justify-center w-8 h-1/2 p-1 ${
          darkMode ? "bg-gray-200 text-gray-900 hover:bg-gray-300" : "bg-gray-800 text-white hover:bg-gray-700"
        }`}
      >
        <FaChevronLeft />
      </button>
      <button
        onClick={() => scrollEditions("right")}
        className={`flex items-center justify-center w-8 h-1/2 p-1 ${
          darkMode ? "bg-gray-200 text-gray-900 hover:bg-gray-300" : "bg-gray-800 text-white hover:bg-gray-700"
        }`}
      >
        <FaChevronRight />
      </button>
    </div>

    {/* Horizontal Scroll Row for Readers */}
    <div
      ref={(el) => {
        readersScrollRef.current = el;
      }}
      className="flex space-x-4 overflow-x-auto scroll-smooth touch-pan-x px-2"
    >
      {book.readersAlsoEnjoyed.map((rec, index) => (
        <div
          key={index}
          className="min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-start flex-shrink-0"
          ref={index === 0 ? readersCardRef : null}
        >
          <img
            src={rec.image_src}
            alt={rec.title}
            className="w-full h-60 object-cover rounded-md shadow"
          />
          <p
            className={`text-xs mt-1 font-medium truncate ${
              darkMode ? "text-gray-800" : "text-white"
            }`}
            title={rec.title}
          >
            {rec.title}
          </p>

          <p
            className={`text-xs mt-1 break-all transition-colors duration-300 ${
              darkMode ? "text-blue-700 hover:text-blue-900" : "text-[#E4F0FD] hover:text-white"
            }`}
          >
            <a href={rec.book_url} target="_blank" rel="noopener noreferrer">
              {rec.book_url}
            </a>
          </p>

          <p
            className={`text-xs mt-1 break-all transition-colors duration-300 ${
              darkMode ? "text-blue-700 hover:text-blue-900" : "text-[#E4F0FD] hover:text-white"
            }`}
          >
            <a href={rec.read_url} target="_blank" rel="noopener noreferrer">
              {rec.read_url}
            </a>
          </p>
        </div>
      ))}
    </div>
  </div>
</div>


            
          </div>
        </div>
      </div>


     

      {/* BELOW MAIN CONTENT: HUNGER GAMES SERIES (SAME STYLE AS 'MORE EDITIONS') */}
      <div className="container mx-auto px-4 pb-8">
        <div className="border-t pt-4">
          <h3 className="text-2xl font-bold mb-10 mt-10">
            The Hunger Games Series
          </h3>
          <div className="flex space-x-4 overflow-x-auto">
            {/* Example Book #1 */}
            <div className="min-w-[100px] text-start">
              <img
                src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1586722975i/2767052._SX600_.jpg"
                alt="The Hunger Games"
                className="w-full h-75 object-cover rounded-md shadow"
              />
              <p className="text-xs mt-1 font-medium">The Hunger Games</p>
              <p className="text-[11px] text-gray-500">Suzanne Collins</p>
            </div>

            {/* Example Book #2 */}
            <div className="min-w-[100px] text-start">
              <img
                src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1586722918i/7260188._SX600_.jpg"
                alt="Catching Fire"
                className="w-full h-75 object-cover rounded-md shadow"
              />
              <p className="text-xs mt-1 font-medium">Catching Fire</p>
              <p className="text-[11px] text-gray-500">Suzanne Collins</p>
            </div>

            {/* Example Book #3 */}
            <div className="min-w-[100px] text-start">
              <img
                src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1586722941i/6148028._SX600_.jpg"
                alt="Mockingjay"
                className="w-full h-75 object-cover rounded-md shadow"
              />
              <p className="text-xs mt-1 font-medium">Mockingjay</p>
              <p className="text-[11px] text-gray-500">Suzanne Collins</p>
            </div>
            {/* Add more if desired */}
          </div>
        </div>
      </div>

            {/* MORE BY THIS AUTHOR (SCROLLABLE STYLE WITH ALIGNMENT) */}
            {book.more_by_author && book.more_by_author.length > 0 && (
              <div className="container mx-auto px-4 pb-8">
                <div className="border-t pt-4">
                  <h3
                    className={`text-2xl font-bold mb-10 mt-10 ${
                      darkMode ? "text-gray-800" : "text-white"
                    }`}
                  >
                    More by this Author
                  </h3>

                  <div className="flex space-x-4 overflow-x-auto pb-2">
                    {book.more_by_author.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`min-w-[120px] max-w-[200px] text-start flex-shrink-0`}
                      >
                        <img
                          src={rec.image_src}
                          alt={rec.title}
                          className="w-150 h-75 object-cover rounded-md shadow"
                        />

                        <p
                          className={`text-xs mt-1 font-medium truncate ${
                            darkMode ? "text-gray-800" : "text-white"
                          }`}
                          title={rec.title}
                        >
                          {rec.title}
                        </p>

                        <a
                          href={rec.book_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[11px] block truncate underline ${
                            darkMode ? "text-blue-700" : "text-[#E4F0FD]"
                          }`}
                          title="View Book"
                        >
                          View Book
                        </a>

                        <a
                          href={rec.read_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[11px] block truncate underline ${
                            darkMode ? "text-blue-700" : "text-[#E4F0FD]"
                          }`}
                          title="Read Now"
                        >
                          Read Now
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


    <Footer darkMode={darkMode} />
    </div>
  );
};

export default BookDetailPage;

