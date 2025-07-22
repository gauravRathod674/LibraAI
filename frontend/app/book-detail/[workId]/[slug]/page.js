"use client";
import { motion } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Navbar from "@/components/ui/Navbar";
import { useTheme } from "../../../context/ThemeContext";
import Footer from "@/components/ui/Footer";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";

const BookDetailPage = () => {
  const { darkMode } = useTheme();

  // State for fetched data, loading, and errors
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editionsCardHeight, setEditionsCardHeight] = useState(0);
  const [readersCardHeight, setReadersCardHeight] = useState(0);

  const editionsCardRef = useRef(null);
  const readersCardRef = useRef(null);

  // Hooks to get URL parameters
  const params = useParams();
  const searchParams = useSearchParams();

  // Refs for horizontal scrolling sections
  const editionsScrollRef = useRef(null);
  const readersScrollRef = useRef(null);

  // Fetch book details from the backend API
  useEffect(() => {
    const fetchBookDetails = async () => {
      const workId = params.workId;
      const slug = params.slug;
      const edition = searchParams.get("edition");

      if (!workId || !slug || !edition) {
        setError("Missing required URL parameters to fetch book data.");
        setLoading(false);
        return;
      }

      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/book-detail/${workId}/${slug}?edition=${edition}`;
        const response = await axios.get(apiUrl);

        // Set state directly from the API response
        setBookData(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch book details:", err);
        setError("Could not load book details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [params, searchParams]);

  // Effect to measure card heights for dynamic button sizing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editionsCardRef.current) {
        setEditionsCardHeight(editionsCardRef.current.offsetHeight);
      }
      if (readersCardRef.current) {
        setReadersCardHeight(readersCardRef.current.offsetHeight);
      }
    }, 100); // Small delay to ensure cards are rendered before measuring
    return () => clearTimeout(timer);
  }, [bookData]); // Re-run when bookData changes

  // Updated scroll function
  const scrollSection = (ref, direction) => {
    if (ref.current) {
      // Scroll by the container's visible width to avoid showing partial cards
      const distance = ref.current.clientWidth;
      ref.current.scrollBy({
        left: direction === "left" ? -distance : distance,
        behavior: "smooth",
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

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
        }`}
      >
        Loading book details...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
        }`}
      >
        {error}
      </div>
    );
  }

  // Render content only if bookData is available
  if (!bookData) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
        }`}
      >
        No book data found.
      </div>
    );
  }

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

      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex flex-col lg:flex-row">
          {/* Left Section (Sticky) */}
          <div className="w-full sm:w-3/4 lg:w-1/3 h-fit lg:sticky lg:top-20 flex flex-col items-center lg:items-start space-y-4 px-4 sm:px-8 lg:px-20">
            <img
              src={bookData.image_src}
              alt={bookData.title}
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
                Download E-Book
              </button>
              <button
                className={`w-full px-4 py-2 rounded border text-sm font-medium transition duration-300 ${
                  darkMode
                    ? "border-gray-400 text-black hover:bg-gray-100" // Light Mode Styles
                    : "border-gray-600 text-white hover:bg-gray-700" // Dark Mode Styles
                }`}
              >
                Download AudioBook
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
              <h1
                className={`text-3xl md:text-6xl font-bold ${
                  darkMode ? "text-gray-800" : "text-white"
                }`}
              >
                {bookData.title}
              </h1>
              <p
                className={`text-md ${
                  darkMode ? "text-gray-600" : "text-gray-300"
                }`}
              >
                <span className="font-semibold">By:</span>{" "}
                {bookData.authors?.join(", ")}
              </p>
              {bookData.rating_out_of_5 && (
                <p
                  className={`text-sm font-medium ${
                    darkMode ? "text-yellow-600" : "text-yellow-400"
                  }`}
                >
                  {bookData.rating_out_of_5}
                </p>
              )}
              {bookData.first_sentence && (
                <blockquote
                  className={`italic pl-4 border-l-4 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  } border-indigo-500`}
                >
                  {bookData.first_sentence}
                </blockquote>
              )}
              <div>
                <h2
                  className={`text-lg font-semibold mb-1 ${
                    darkMode ? "text-gray-800" : "text-white"
                  }`}
                >
                  Description
                </h2>
                <p
                  className={`text-sm leading-relaxed ${
                    darkMode ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {bookData.description}
                </p>
              </div>

              {/* Other metadata fields */}
              <div>
                {bookData.translation_of && (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-300"
                    } mt-5 mb-5`}
                  >
                    <strong>Translation of:</strong> {bookData.translation_of}
                  </p>
                )}
                {bookData.translated_from && (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-300"
                    }  mt-5 mb-5`}
                  >
                    <strong>Translated from:</strong> {bookData.translated_from}
                  </p>
                )}
                {bookData.edition_identifiers && (
                  <div className=" mt-5 mb-5 space-y-1">
                    <h2
                      className={`text-md font-semibold ${
                        darkMode ? "text-gray-800" : "text-white"
                      }`}
                    >
                      Edition Identifiers
                    </h2>
                    {Object.entries(bookData.edition_identifiers).map(
                      ([key, value]) => (
                        <p
                          key={key}
                          className={`text-sm ${
                            darkMode ? "text-gray-600" : "text-gray-300"
                          }`}
                        >
                          <strong>
                            {key.replace(/_/g, " ").toUpperCase()}:
                          </strong>{" "}
                          {value}
                        </p>
                      )
                    )}
                  </div>
                )}
                {bookData.edition_notes && (
                  <div className=" mt-5 mb-5">
                    <h2
                      className={`text-md font-semibold ${
                        darkMode ? "text-gray-800" : "text-white"
                      }`}
                    >
                      Edition Notes
                    </h2>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-600" : "text-gray-300"
                      }`}
                    >
                      {bookData.edition_notes}
                    </p>
                  </div>
                )}
                {bookData.published_in && (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-300"
                    }  mt-5 mb-5`}
                  >
                    <strong>Published In:</strong> {bookData.published_in}
                  </p>
                )}
                {bookData.other_titles && bookData.other_titles.length > 0 && (
                  <div className=" mt-5 mb-5">
                    <h2
                      className={`text-md font-semibold ${
                        darkMode ? "text-gray-800" : "text-white"
                      }`}
                    >
                      Other Titles
                    </h2>
                    <ul className="list-disc list-inside text-sm">
                      {bookData.other_titles.map((title, idx) => (
                        <li
                          key={idx}
                          className={`${
                            darkMode ? "text-gray-600" : "text-gray-300"
                          }`}
                        >
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className=" mt-5 mb-5 flex gap-4">
                  {bookData.read_url && (
                    <a
                      href={bookData.read_url}
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
                </div>
              </div>
              {bookData.work_description && (
                <div>
                  <h2
                    className={`text-lg font-semibold  mt-5 mb-5 ${
                      darkMode ? "text-gray-800" : "text-white"
                    }`}
                  >
                    Work Description
                  </h2>
                  <p
                    className={`text-sm leading-relaxed ${
                      darkMode ? "text-gray-700" : "text-gray-300"
                    }`}
                  >
                    {bookData.work_description}
                  </p>
                </div>
              )}
              {bookData.table_of_contents &&
                bookData.table_of_contents.length > 0 && (
                  <div className="mt-5 w-full">
                    <h2
                      className={`text-2xl font-bold mb-4 ${
                        darkMode ? "text-gray-800" : "text-white"
                      }`}
                    >
                      Table of Contents
                    </h2>
                    <div
                      className={`relative max-h-[300px] overflow-y-auto p-4 rounded-lg shadow-inner border ${
                        darkMode
                          ? "bg-[#E4F0FD] text-gray-800 border-gray-300"
                          : "bg-gray-800 text-gray-300 border-gray-700"
                      } space-y-2`}
                    >
                      {bookData.table_of_contents.map((item, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-300"
                    }`}
                  >
                    <strong>Publisher:</strong> {bookData.publisher}
                  </p>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-300"
                    }`}
                  >
                    <strong>Published:</strong> {bookData.publish_date}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-300"
                    }`}
                  >
                    <strong>Language:</strong> {bookData.language}
                  </p>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-300"
                    }`}
                  >
                    <strong>Pages:</strong> {bookData.pages}
                  </p>
                </div>
              </div>
              {bookData.subjects && bookData.subjects.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-semibold mb-1 ${
                      darkMode ? "text-gray-800" : "text-white"
                    }`}
                  >
                    Subjects
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {bookData.subjects.map((subj, idx) => (
                      <a
                        key={idx}
                        href={`https://openlibrary.org${subj.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
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

            {/* This Edition - Conditionally rendered */}
            {bookData?.details && (
              <div className="border-t pt-4">
                <h3 className="text-2xl font-bold mb-2">This Edition</h3>
                <div
                  className={`space-y-1 ${
                    darkMode ? "from-white" : "from-gray-800"
                  }`}
                >
                  <p>
                    <strong>Edition:</strong> {bookData.details.edition}
                  </p>
                  <p>
                    <strong>Format:</strong> {bookData.details.format}
                  </p>
                  <p>
                    <strong>Published:</strong> {bookData.details.published}
                  </p>
                  <p>
                    <strong>ASIN:</strong> {bookData.details.ASIN}
                  </p>
                  <p>
                    <strong>Language:</strong> {bookData.details.language}
                  </p>
                </div>
              </div>
            )}

            {/* More Editions - Mapped from API */}
            {bookData?.editions && bookData.editions.length > 0 && (
              <div className="border-t pt-4">
                <h3
                  className={`text-2xl font-bold mb-4 ${
                    darkMode ? "text-gray-800" : "text-white"
                  }`}
                >
                  More Editions
                </h3>
                <div className="relative group">
                  {editionsCardHeight > 0 && (
                    <div
                      className="absolute z-10 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        gap: `${editionsCardHeight * 0.04}px`,
                      }}
                    >
                      <button
                        onClick={() =>
                          scrollSection(editionsScrollRef, "right")
                        }
                        className={`w-12 rounded-md flex items-center justify-center transition-colors shadow-lg ${
                          darkMode
                            ? "bg-gray-200 hover:bg-gray-300 text-black"
                            : "bg-gray-800 hover:bg-gray-700 text-white"
                        }`}
                        style={{ height: `${editionsCardHeight * 0.48}px` }}
                      >
                        <FaChevronRight size="1.2em" />
                      </button>
                      <button
                        onClick={() => scrollSection(editionsScrollRef, "left")}
                        className={`w-12 rounded-md flex items-center justify-center transition-colors shadow-lg ${
                          darkMode
                            ? "bg-gray-200 hover:bg-gray-300 text-black"
                            : "bg-gray-800 hover:bg-gray-700 text-white"
                        }`}
                        style={{ height: `${editionsCardHeight * 0.48}px` }}
                      >
                        <FaChevronLeft size="1.2em" />
                      </button>
                    </div>
                  )}
                  <div
                    ref={editionsScrollRef}
                    className="flex space-x-4 overflow-x-auto scroll-smooth touch-pan-x py-4 px-2"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {bookData.editions.map((edition, index) => (
                      <div
                        key={index}
                        ref={index === 0 ? editionsCardRef : null}
                        className={`flex-shrink-0 w-40 p-3 rounded-lg shadow-md space-y-2 transition-transform duration-300 hover:scale-105 ${
                          darkMode ? "bg-gray-50" : "bg-gray-800"
                        }`}
                      >
                        <img
                          src={edition.image_src}
                          alt={edition.title}
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <div className="flex flex-col">
                          <p
                            className={`text-sm font-semibold truncate ${
                              darkMode ? "text-gray-800" : "text-white"
                            }`}
                            title={edition.title}
                          >
                            {edition.title}
                          </p>
                          <p
                            className={`text-xs ${
                              darkMode ? "text-gray-600" : "text-gray-400"
                            }`}
                          >
                            {edition.publisher}
                          </p>
                          <p
                            className={`text-xs ${
                              darkMode ? "text-gray-500" : "text-gray-300"
                            }`}
                          >
                            {edition.year}
                          </p>
                          <a
                            href={`https://openlibrary.org${edition.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs mt-1 font-medium ${
                              darkMode
                                ? "text-indigo-600 hover:text-indigo-800"
                                : "text-indigo-400 hover:text-indigo-300"
                            }`}
                          >
                            View Edition
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* About the author - Conditionally rendered */}
            {bookData?.authorInfo && (
              <div className="border-t pt-4">
                <h3 className="text-2xl font-bold mb-2">About the Author</h3>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <img
                    src={bookData.authorInfo.photo}
                    alt={bookData.author}
                    className="w-24 h-24 object-cover rounded-full shadow-lg"
                  />
                  <p className="text-base text-gray-500">
                    {bookData.authorInfo.bio}
                  </p>
                </div>
              </div>
            )}

            {/* Readers Also Enjoyed (Mapped from you_might_also_like) */}
            {bookData?.you_might_also_like &&
              bookData.you_might_also_like.length > 0 && (
                <div className="border-t pt-4">
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      darkMode ? "text-gray-800" : "text-white"
                    }`}
                  >
                    Readers Also Enjoyed
                  </h3>
                  <div className="relative group">
                    {readersCardHeight > 0 && (
                      <div
                        className="absolute z-10 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          right: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          gap: `${readersCardHeight * 0.04}px`,
                        }}
                      >
                        <button
                          onClick={() =>
                            scrollSection(readersScrollRef, "right")
                          }
                          className={`w-12 rounded-md flex items-center justify-center transition-colors shadow-lg ${
                            darkMode
                              ? "bg-gray-200 hover:bg-gray-300 text-black"
                              : "bg-gray-800 hover:bg-gray-700 text-white"
                          }`}
                          style={{ height: `${readersCardHeight * 0.48}px` }}
                        >
                          <FaChevronRight size="1.2em" />
                        </button>
                        <button
                          onClick={() =>
                            scrollSection(readersScrollRef, "left")
                          }
                          className={`w-12 rounded-md flex items-center justify-center transition-colors shadow-lg ${
                            darkMode
                              ? "bg-gray-200 hover:bg-gray-300 text-black"
                              : "bg-gray-800 hover:bg-gray-700 text-white"
                          }`}
                          style={{ height: `${readersCardHeight * 0.48}px` }}
                        >
                          <FaChevronLeft size="1.2em" />
                        </button>
                      </div>
                    )}
                    <div
                      ref={readersScrollRef}
                      className="flex space-x-4 overflow-x-auto scroll-smooth touch-pan-x py-4 px-2"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {bookData.you_might_also_like.map((rec, index) => (
                        <div
                          key={index}
                          ref={index === 0 ? readersCardRef : null}
                          className={`flex-shrink-0 w-40 p-3 rounded-lg shadow-md space-y-2 transition-transform duration-300 hover:scale-105 ${
                            darkMode ? "bg-gray-50" : "bg-gray-800"
                          }`}
                        >
                          <img
                            src={rec.image_src}
                            alt={rec.title}
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <div className="flex flex-col">
                            <p
                              className={`text-sm font-semibold truncate ${
                                darkMode ? "text-gray-800" : "text-white"
                              }`}
                              title={rec.title}
                            >
                              {rec.title}
                            </p>
                            {rec.book_url && (
                              <a
                                href={rec.book_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs mt-1 font-medium ${
                                  darkMode
                                    ? "text-indigo-600 hover:text-indigo-800"
                                    : "text-indigo-400 hover:text-indigo-300"
                                }`}
                              >
                                View Book
                              </a>
                            )}
                            {rec.read_url && (
                              <a
                                href={rec.read_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs mt-1 font-medium ${
                                  darkMode
                                    ? "text-green-600 hover:text-green-800"
                                    : "text-green-400 hover:text-green-300"
                                }`}
                              >
                                Read Now
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default BookDetailPage;
