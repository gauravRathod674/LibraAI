// app/genres/page.js
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/app/context/ThemeContext";
import Link from "next/link";
import { sections, favoriteGenres, browseGenres } from "@/app/data";

export default function GenresPage() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Particle Background
  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = [];
    const N = 50;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class P {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 3 + 1;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = darkMode
          ? "rgba(117,246,255,0.6)"
          : "rgba(100,149,237,0.6)";
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

    for (let i = 0; i < N; i++) particles.push(new P());
    let anim;
    (function animate() {
      anim = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.update());
    })();
    return () => cancelAnimationFrame(anim);
  }, [darkMode]);

  // Navigation on Search
  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/genre-detail`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div
      className={`relative flex flex-col ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      {/* Background Canvas */}
      <canvas
        id="backgroundCanvas"
        className="absolute inset-0 w-full h-full z-0"
      />

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 py-8 mt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT Section */}
          <div className="flex-1 space-y-12">
            {/* Search Box */}
            <div
              className={`p-4 w-full rounded shadow-md mb-8 ${
                darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
              }`}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Find a genre by name"
                className={`w-full p-2 rounded border focus:outline-none ${
                  darkMode
                    ? "border-gray-300 bg-white text-black"
                    : "border-gray-600 bg-gray-700 text-white"
                }`}
              />
              <button
                onClick={handleSearch}
                className={`mt-3 px-4 py-2 rounded font-semibold transition text-black`}
                style={{
                  background:
                    "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                }}
              >
                Find Genre
              </button>
            </div>

            {/* Genre Sections */}
            {sections.map(({ name, books }) => (
              <section key={name}>
                <h2 className="text-2xl font-bold mb-4">{name}</h2>
                <div className="flex flex-wrap gap-4">
                  {books.map((b) => (
                    <Link
                      key={b.id}
                      href={`/genre-detail`}
                      className={`min-w-[160px] rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${
                        darkMode
                          ? "bg-gray-800 text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      <img
                        src={b.cover}
                        alt={b.title}
                        className="w-full h-40 object-cover"
                      />
                      <p className="p-2 text-sm font-medium">{b.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* RIGHT Sidebar */}
          <aside className="w-full lg:w-64 space-y-8">
            {/* Favorites */}
            <div
              className={`p-6 rounded-2xl shadow-xl ${
                darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">My Favorite Genres</h3>
                <a href="#" className="text-sm hover:text-blue-500">
                  edit
                </a>
              </div>
              <ul className="space-y-2 text-sm">
                {favoriteGenres.map((g) => (
                  <li key={g}>
                    <Link
                      href={`/genre-detail`}
                      className="block px-3 py-1 rounded hover:bg-opacity-20 hover:underline"
                    >
                      {g}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Browse Genres */}
            <div
              className={`p-6 rounded-2xl shadow-xl ${
                darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Browse Genres</h3>
                <a href="/genres" className="text-sm hover:text-blue-500">
                  more…
                </a>
              </div>
              <ul className="space-y-2 text-sm">
                {browseGenres.map((g) => (
                  <li key={g}>
                    <Link
                      href={`/genre-detail`}
                      className="block px-3 py-1 rounded hover:bg-opacity-20 hover:underline"
                    >
                      {g}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
