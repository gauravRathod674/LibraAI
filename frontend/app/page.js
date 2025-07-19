"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import TrendingBooks from "@/components/ui/TrendingBooks";
import { useMemo } from "react";
import ClassicBooks from "@/components/ui/ClassicBooks";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import FeaturedBooks from "@/components/ui/FloatBooks";
import { useTheme } from "./context/ThemeContext";
import LovedBooks from "@/components/ui/LovedBooks";

export default function Home() {
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [books] = useState([
    "The Great Gatsby",
    "To Kill a Mockingbird",
    "1984",
    "The Catcher in the Rye",
    "The Hobbit",
    "Pride and Prejudice",
    "Moby-Dick",
    "War and Peace",
    "Hamlet",
    "Brave New World",
  ]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) =>
      book.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
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
      particles.forEach((particle) => particle.update());
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

      {/* Hero Section */}
      <motion.h1
        className="text-5xl font-bold mb-6 text-center relative z-10 mt-40 flex flex-wrap justify-center gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {["Welcome", "to", "Nexus", "Library"].map((word, index) => (
          <motion.span
            key={index}
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 100, damping: 12 },
              },
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>

      <p className="text-lg mb-6 text-center opacity-80 relative z-10">
        A Smart and Secure Digital Library for Modern Readers
      </p>
      <div className="relative w-96 mb-6">
        <input
          type="text"
          value={searchTerm || ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search books, articles..."
          className={`w-full p-3 rounded-full shadow-md focus:outline-none transition-all duration-300 ${
            darkMode
              ? "bg-[#E7F0FD] text-gray-900 placeholder-gray-600"
              : "bg-gray-800 text-white placeholder-gray-400"
          }`}
        />

        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 text-white rounded-full shadow-md hover:shadow-lg transition-transform hover:scale-105"
          style={{
            background:
              "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
          }}
        >
          🔍
        </button>

        {searchTerm && filteredBooks.length > 0 && (
          <ul
            className={`absolute mt-2 w-full max-h-60 overflow-y-auto rounded-md shadow-lg z-20 ${
              darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
            }`}
          >
            {filteredBooks.map((book, idx) => (
              <li
                key={idx}
                className="px-4 py-2 hover:bg-purple-100 hover:text-black cursor-pointer transition"
                onClick={() => {
                  setSearchTerm(book);
                }}
              >
                {book}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          {
            title: "Digital Archives",
            desc: "Access e-books, research papers, and documents.",
          },
          {
            title: "Seamless Reservations",
            desc: "Reserve physical books effortlessly.",
          },
          {
            title: "AI Recommendations",
            desc: "Personalized book suggestions.",
          },
        ].map((feature, index) => (
          <motion.div
            key={index}
            className={`relative p-6 rounded-lg shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl 
        ${
          darkMode
            ? "bg-[#E7F0FD] text-gray-900 border-gray-400"
            : "bg-gray-800 text-gray-100 border-gray-700 hover:border-blue-500"
        }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 80,
              damping: 14,
              delay: index * 0.15,
            }}
          >
            <h2 className="text-xl font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm opacity-80">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Call-to-Action */}
      <motion.button
        className="mt-10 px-6 py-3 rounded-full shadow-lg font-semibold transition-all duration-300 text-black"
        style={{
          background:
            "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
        }}
        whileHover={{ scale: 1.06, y: -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
      >
        Get Started
      </motion.button>

      <FeaturedBooks darkMode={darkMode} />

      <TrendingBooks darkMode={darkMode} />

      <ClassicBooks darkMode={darkMode} />

      <LovedBooks darkMode={darkMode} />

      {/* Join the Community Section */}
      <section className="relative w-full py-16 px-6 z-10 flex justify-center items-center">
        <div
          className={`w-full max-w-4xl rounded-3xl shadow-xl p-10 text-center transition-all duration-300 
                  relative p-6 rounded-lg shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl 
                  ${
                    darkMode
                      ? "bg-[#E7F0FD] text-gray-900 border-gray-400"
                      : "bg-gray-800 text-gray-100 border-gray-700 hover:border-blue-500"
                  }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join the LibraAI Community
          </h2>

          <p className="text-md md:text-lg mb-6 opacity-90">
            Discover new reads, track your journey, and connect with book lovers
            like you.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-2 px-6 py-3 rounded-full shadow-lg font-semibold transition-all duration-300 text-black"
            style={{
              background:
                "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
            }}
          >
            Coming Soon
          </motion.button>
        </div>
      </section>

      {/* Stats Section */}
      <div className="w-full mt-20 px-6 flex justify-center relative z-10">
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Library In Numbers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: "Books", value: "12,000+" },
              { label: "Active Users", value: "4,500+" },
              { label: "Downloads", value: "36K+" },
              { label: "Branches", value: "12 Cities" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className={`p-6 rounded-xl shadow-md border transition-all duration-300 hover:scale-105 ${
                  darkMode
                    ? "bg-[#E7F0FD] text-gray-900 border-gray-300"
                    : "bg-gray-800 text-white border-gray-700"
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="mt-2 text-sm opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Reader Quotes Section */}
      <div className="w-full mt-20 px-6 flex justify-center relative z-10 mb-20">
        <div className="w-full max-w-6xl text-center">
          <h2 className="text-3xl font-bold mb-10 text-center">
            What Our Readers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Aisha",
                quote: "This library made research so easy and inspiring!",
              },
              {
                name: "Ravi",
                quote:
                  "Love the smart recommendations — I always find something new.",
              },
              {
                name: "Emily",
                quote: "The digital access is a lifesaver during exams.",
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                className={`p-6 rounded-xl shadow-md border transition-transform duration-300 hover:scale-105 ${
                  darkMode
                    ? "bg-[#E7F0FD] text-gray-900 border-gray-300"
                    : "bg-gray-800 text-white border-gray-700"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <p className="italic">"{review.quote}"</p>
                <p className="mt-4 font-semibold text-sm">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Why LibraAI Section */}
      <section
        className={`relative z-10 w-full py-16 px-6 md:px-12 transition-all duration-500 ${
          darkMode ? "bg-[#e7f0fd] text-gray-900" : "bg-gray-800 text-white"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Why Choose LibraAI?</h2>
          <p className="text-lg opacity-80 mb-12">
            A modern platform redefining how you explore, borrow, and enjoy
            books.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "AI-Powered Discovery",
                desc: "Smart recommendations tailored to your interests using intelligent algorithms.",
                icon: "📚",
              },
              {
                title: "Always Available",
                desc: "Access digital content 24/7—anytime, anywhere, across all devices.",
                icon: "🌐",
              },
              {
                title: "Secure & Seamless",
                desc: "Your data is protected, and the experience is buttery smooth.",
                icon: "🔐",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 100, damping: 12 }}
                className={`p-8 rounded-xl shadow-lg transition-colors duration-300 
            ${
              darkMode
                ? "bg-white text-gray-900"
                : "bg-gray-900 text-white border border-gray-700"
            }`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm opacity-80">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer darkMode={darkMode} />
    </div>
  );
}
