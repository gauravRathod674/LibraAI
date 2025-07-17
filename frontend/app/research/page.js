"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/app/context/ThemeContext";
import { papers } from "../data"; 

export default function ResearchPage() {
  const { darkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

 

  const filteredPapers = papers;

  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

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
    <div className={`relative min-h-screen transition-all ${darkMode ? "bg-white text-black" : "bg-gray-900 text-white"}`}>
      <canvas id="backgroundCanvas" className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />

      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-4 mt-10"
        >
          Research Papers
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-lg text-center opacity-80 mb-10"
        >
          Browse curated academic content, tech trends, and scientific breakthroughs.
        </motion.p>

        <div className="flex flex-col space-y-6">
  {filteredPapers.map((paper, idx) => {
    return (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className={`p-6 rounded-xl border shadow-md hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01] w-full flex ${darkMode ? "bg-[#E7F0FD] text-gray-900 border-gray-300" : "bg-gray-800 text-white border-gray-700"}`}
      >
        <div className="w-[85%] pr-4">
          <h2 className="text-xl font-semibold mb-1 hover:text-indigo-400 transition duration-200">{paper.title}</h2>
          <p className="text-sm text-indigo-500 font-medium mb-1">{paper.subtitle}</p>
          {isClient && (
            <p className="text-sm text-gray-500 mb-2">
              By {paper.author} • {new Date(paper.date).toLocaleDateString()}
            </p>
          )}
          <p className="text-sm opacity-80 mb-4">{paper.description}</p>
        </div>

        <div className="w-[15%] flex flex-col items-end justify-center gap-3 min-w-[120px]">
          <button className="px-4 py-2 rounded-full text-sm font-medium shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full">
            View Abstract
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-900 hover:bg-gray-300 w-full">
            Download PDF
          </button>
        </div>
      </motion.div>
    );
  })}
</div>

      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}
