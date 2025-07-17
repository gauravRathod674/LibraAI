// app/genres/romance/page.js
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/app/context/ThemeContext";

// --- Static data for Romance ---
const description = `According to the Romance Writers of America, "Two basic elements comprise every romance novel: a central love story and an emotionally‑satisfying and optimistic ending." Both the conflict and the climax of the novel should be directly related to that core theme of developing a romantic relationship, although the novel can also contain subplots that do not specifically relate to the main characters’ romantic love. Other definitions of a romance novel may be broader, including other plots and endings or more than two people, or narrower, restricting the types of romances or conflicts.`;

const newReleases = [
  { id: 1, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
  { id: 2, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
  { id: 3, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
  { id: 4, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
  { id: 5, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
  { id: 6, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
  { id: 7, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
  { id: 8, cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg" },
];

const relatedGenres = [
  "Fiction",
  "Contemporary Romance",
  "Historical Romance",
  "Paranormal Romance",
  "Romantic Suspense",
  "Fantasy Romance",
  "M M Romance",
  "Erotic Romance",
  "Clean Romance",
  "Christian Romance",
  "Category Romance",
  "Interracial Romance",
  "Western Romance",
  "Science Fiction Romance",
  "Lesbian Romance",
  "Time Travel Romance",
  "African American Romance",
];

const relatedNews = {
  image:
    "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg",
  title: "10 New Books Recommended by Readers This Week",
  snippet:
    "Need another excuse to treat yourself to a new book this week? We’ve got you covered with the buzziest new releases of the day, according to early readers …",
  link: "#",
};

const lists = [
  {
    id: 1,
    title: "Best Contemporary Romance",
    creator: "JohnDoe123",
    books: "52 books",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg"
  },
  {
    id: 2,
    title: "Romantic Fantasy Gems",
    creator: "JaneSmith88",
    books: "38 books",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg"
  },
  {
    id: 3,
    title: "Historical Romance Favorites",
    creator: "Alice_in_Wonder",
    books: "47 books",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg"
  },
  {
    id: 4,
    title: "Clean & Sweet Romance",
    creator: "CleanReads",
    books: "29 books",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1729249655l/217245588.jpg"
  },
];

export default function RomancePage() {
  const { darkMode } = useTheme();

  // particle background (unchanged)
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

  return (
    <div
      className={`relative flex flex-col ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      {/* Particle canvas */}
      <canvas
        id="backgroundCanvas"
        className="absolute inset-0 w-full h-full z-0"
      />

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 py-8 mt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT */}
          <div className="flex-1 space-y-8">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500">
              <Link href="/genres" className="hover:underline">
                Genres
              </Link>{" "}
              &gt; <span className="font-semibold">Romance</span>
            </nav>

            {/* Title & Button */}
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold">Romance</h1>
              <button
                className={`px-4 py-2 rounded transition ${
                  darkMode
                    ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                Favorited
              </button>
            </div>

            {/* Description */}
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
              {description}
            </p>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                New Releases Tagged “Romance”
              </h2>
              <div
                className="
                  grid
                  w-full
                  gap-4
                  grid-cols-[repeat(auto-fill,minmax(120px,1fr))]
                "
              >
                {newReleases.map((book) => (
                  <div
                    key={book.id}
                    className="rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
                  >
                    <img
                      src={book.cover}
                      alt=""
                      className="w-full h-40 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

          {/* Lists Tagged “Romance” */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Lists Tagged “Romance”</h2>
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
              {lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="block rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
                >
                  <img
                    src={list.cover}
                    alt={list.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2">
                    <p className="font-medium text-sm line-clamp-2">{list.title}</p>
                    <p className="text-xs text-gray-500">
                      by {list.creator} &middot; {list.books}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          </div>

          {/* RIGHT */}
          <aside className="w-full lg:w-64 space-y-8">
            {/* Related Genres */}
            <div
              className={`p-6 rounded-2xl shadow-xl transition ${
                darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Related Genres</h3>
                <Link
                  href="/genres"
                  className="text-sm underline hover:text-blue-500"
                >
                  more…
                </Link>
              </div>
              <ul className="space-y-1 text-sm">
                {relatedGenres.map((g) => (
                  <li key={g}>
                    <Link
                      href={`/genres/${encodeURIComponent(
                        g.toLowerCase().replace(/\s+/g, "-")
                      )}`}
                      className="hover:underline block"
                    >
                      {g}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Related News */}
            <div
              className={`p-6 rounded-2xl shadow-xl transition ${
                darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
              }`}
            >
              <h3 className="text-lg font-semibold mb-4">Related News</h3>
              <div className="space-y-3">
                <img
                  src={relatedNews.image}
                  alt=""
                  className="w-full h-32 object-cover rounded"
                />
                <h4 className="font-medium">{relatedNews.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {relatedNews.snippet}
                </p>
                <Link
                  href={relatedNews.link}
                  className="text-sm underline hover:text-blue-500"
                >
                  Read more…
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
