"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "../context/ThemeContext";
import { allNotifications, filters } from "../data";

export default function NotificationPage() {
  const { darkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState("New Arrivals");

  
  const notifications = allNotifications.filter(n => n.type === activeFilter);

  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
    const ctx    = canvas.getContext("2d");
    const particles = [];
    const numParticles = 50;
    let animId;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      constructor() {
        this.x      = Math.random() * canvas.width;
        this.y      = Math.random() * canvas.height;
        this.radius = Math.random() * 2 + 0.5;
        this.dx     = (Math.random() - 0.5) * 1.5;
        this.dy     = (Math.random() - 0.5) * 1.5;
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
    (function animate() {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p => p.update());
    })();

    return () => cancelAnimationFrame(animId);
  }, [darkMode]);

  return (
    <div
      className={` relative min-h-screen flex flex-col justify-between transition-all duration-500 ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <canvas id="backgroundCanvas" className="absolute inset-0 w-full h-full z-0"/>
      <Navbar darkMode={darkMode}/>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full px-4 flex flex-col items-center"
      >
        <div
          className={`mt-32 w-full max-w-xl backdrop-blur rounded-2xl shadow-[0_0_20px_rgba(187,139,255,0.25),0_0_20px_rgba(117,246,255,0.15)] border border-white/10 transition-all ${darkMode ? "bg-[#E7F0FD] text-gray-900" : "bg-gray-900 text-white"}`}
        >
          <h1 className="text-3xl font-extrabold px-6 pt-6">Notifications</h1>

          {/* Filter Bar */}
          <div className="px-6 mt-4 flex flex-wrap gap-3">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === f
                    ? "bg-gradient-to-r from-purple-400 to-cyan-300 text-black"
                    : darkMode
                      ? "bg-white text-black hover:bg-white/30"
                      : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="mt-6 px-6 pb-6 space-y-3">
            {/* No AnimatePresence or exit animations here */}
            {notifications.length > 0 ? (
              notifications.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-4 p-4 rounded-lg transition ${
                    darkMode
                      ? "bg-[#f7f7f7]/80 text-black"
                      : "bg-gray-800/70 text-white"
                  }`}
                >
                  <div className="text-2xl">{n.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium">{n.text}</p>
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      {n.date}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">
                No notifications in “{activeFilter}.”
              </p>
            )}
          </div>
        </div>
      </motion.main>
      <Footer darkMode={darkMode}/>
    </div>
  );
}
