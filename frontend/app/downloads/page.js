"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaFilePdf, FaTimes, FaTrash } from "react-icons/fa";
import axios from "axios";
import Link from "next/link"; // Import the Link component

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "../context/ThemeContext";

export default function DownloadsPage() {
  const { darkMode } = useTheme();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL;

  // Fetch download history on component mount
  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const res = await axios.get(`${API}/downloads`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const mapped = res.data.map((d) => ({
          id: d.id,
          name: d.file_name,
          size: d.file_size,
        }));
        setDownloads(mapped);
      } catch (err) {
        console.error("Failed to fetch downloads:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, [API]);

  // Animated background effect (no changes here)
  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = [];
    const numParticles = 50;
    let animId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 2 + 0.5;
        this.dx = (Math.random() - 0.5) * 1.5;
        this.dy = (Math.random() - 0.5) * 1.5;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = darkMode
          ? "rgba(117,246,255,0.4)"
          : "rgba(100,149,237,0.4)";
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

    for (let i = 0; i < numParticles; i++) particles.push(new Particle());

    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.update());
    };
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [darkMode]);

  // Delete one download from history
  const handleCancelDownload = async (id) => {
    try {
      await axios.delete(`${API}/downloads/${id}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDownloads((prevDownloads) => prevDownloads.filter((pdf) => pdf.id !== id));
    } catch (err) {
      console.error("Failed to delete download:", err);
    }
  };

  // Clear all download history
  const handleClearHistory = async () => {
    try {
      await axios.delete(`${API}/downloads`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDownloads([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  return (
    <div
      className={`relative min-h-screen flex flex-col justify-between transition-all duration-500 ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <canvas
        id="backgroundCanvas"
        className="absolute inset-0 w-full h-full z-0"
      />
      <Navbar />
      <main className="z-10 w-full px-4 flex flex-col items-center flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={`mt-24 sm:mt-32 w-full max-w-2xl backdrop-blur-lg rounded-2xl shadow-[0_0_20px_rgba(187,139,255,0.25),0_0_20px_rgba(117,246,255,0.15)] border border-white/10 transition-all ${
            darkMode ? "bg-[#E7F0FD] text-gray-900" : "bg-gray-900 text-white"
          }`}
        >
          <div className="flex justify-between items-center px-6 pt-6">
            <h1 className="text-3xl font-extrabold">Downloads</h1>
            {!loading && downloads.length > 0 && (
              <button
                onClick={handleClearHistory}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  darkMode
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-red-500/20 text-red-300 hover:bg-red-500/40"
                }`}
              >
                <FaTrash />
                <span>Delete History</span>
              </button>
            )}
          </div>

          <div className="mt-6 px-6 pb-6 space-y-3 min-h-[150px]">
            {loading ? (
              <div className="flex justify-center items-center h-full pt-10">
                   <p className="text-gray-500">Loading downloads...</p>
              </div>
            ) : downloads.length > 0 ? (
              downloads.map((pdf) => (
                <motion.div
                  key={pdf.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className={`flex items-center justify-between gap-4 p-4 rounded-lg transition ${
                    darkMode
                      ? "bg-[#f7f7f7]/80 text-black"
                      : "bg-gray-800/70 text-white"
                  }`}
                >
                  <Link href={`/pdf_viewer/${encodeURIComponent(pdf.name)}`} className="flex items-center gap-4 flex-grow min-w-0">
                      <div className={`text-2xl ${darkMode ? "text-blue-600" : "text-cyan-300"}`}>
                          <FaFilePdf />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="font-medium break-words hover:underline">{pdf.name}</p>
                          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                              {pdf.size}
                          </p>
                      </div>
                  </Link>
                  <button
                    onClick={() => handleCancelDownload(pdf.id)}
                    className={`p-2 rounded-full transition flex-shrink-0 ${
                      darkMode
                        ? "text-gray-500 hover:bg-gray-200 hover:text-black"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                    aria-label="Cancel download"
                  >
                    <FaTimes />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p className="text-lg font-medium">No Active Downloads</p>
                <p className="text-sm mt-1">Your download history is clear.</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <Footer darkMode={darkMode} />
    </div>
  );
}
