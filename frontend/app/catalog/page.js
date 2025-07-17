"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer"; 
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";

export default function CatalogPage() {
   const { darkMode } = useTheme();

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

    const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
    cancelAnimationFrame(animationFrameId);
  };
  }, [darkMode]);

  // Local form state
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    coAuthor: "",
    coverImage: null, // for file
    rating: "",
    ratingsCount: "",
    wantToReadCount: "",
    firstPublished: "",
    editions: "",
    previewLink: "",
    publisher: "",
    year: "",
    language: "",
    description: "",
  });

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "coverImage") {
      setFormData({ ...formData, coverImage: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Example submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // In real usage: post to your backend or do state logic
    console.log("New Book Data:", formData);
  };

  return (
    <div
      className={`relative min-h-screen flex flex-col transition-all duration-500 ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      {/* Particle Background */}
      <canvas
        id="backgroundCanvas"
        className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
      />

      
      {/* Navbar (assumes it can toggle darkMode; remove if your global theme is different) */}
      <Navbar darkMode={darkMode}/>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full px-4 mt-50 sm:mt-32 flex flex-col items-center"
      >
        <div
          className={`w-full max-w-3xl mx-auto backdrop-blur rounded-2xl shadow-xl px-4 py-8 sm:px-6 md:px-8 lg:px-10 transition-all ${
              darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800 text-white"
            }`}
        >
          <h1 className="text-3xl font-bold mb-6">Cataloging</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block mb-1 text-sm font-medium">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="Enter the book title"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block mb-1 text-sm font-medium">Author</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="Enter the primary author"
              />
            </div>

            {/* coAuthor */}
            <div>
              <label className="block mb-1 text-sm font-medium">Co-Author</label>
              <input
                type="text"
                name="coAuthor"
                value={formData.coAuthor}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="Optional co-author"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold">Cover Image</label>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Image Preview Box (left) */}
                <div
                  className={`w-32 h-24 rounded-md border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    darkMode
                      ? "bg-[#dcdcdc] border-gray-400"
                      : "bg-[#323145] border-gray-600"
                  }`}
                >
                  {formData.coverImagePreview ? (
                    <img
                      src={formData.coverImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">No Preview</span>
                  )}
                </div>

                {/* Upload button + file name */}
                <div className="flex flex-col">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    name="coverImage"
                    accept="image/*"
                    id="coverImageUpload"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      const previewUrl = file ? URL.createObjectURL(file) : null;
                      handleChange(e);
                      setFormData((prev) => ({
                        ...prev,
                        coverImagePreview: previewUrl,
                        coverImage: file?.name || "",
                      }));
                    }}
                    className="hidden"
                  />

                  {/* Custom Upload Button */}
                  <label
                    htmlFor="coverImageUpload"
                    className="cursor-pointer px-4 py-2 rounded-md text-black font-medium shadow-md transition-all duration-300 hover:opacity-90"
                    style={{
                      background:
                        "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                    }}
                  >
                    Upload Cover
                  </label>

                  {/* File Name Display */}
                  <span className="text-xs mt-1 text-gray-500 dark:text-gray-300">
                    {formData.coverImage|| "No file chosen"}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block mb-1 text-sm font-medium">Rating</label>
              <input
                type="number"
                step="0.1"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="e.g. 4.5"
              />
            </div>

            {/* Ratings Count */}
            <div>
              <label className="block mb-1 text-sm font-medium">Ratings Count</label>
              <input
                type="number"
                name="ratingsCount"
                value={formData.ratingsCount}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="e.g. 1200"
              />
            </div>

            {/* Want to Read Count */}
            <div>
              <label className="block mb-1 text-sm font-medium">Want to Read Count</label>
              <input
                type="number"
                name="wantToReadCount"
                value={formData.wantToReadCount}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="e.g. 530"
              />
            </div>

            {/* First Published */}
            <div>
              <label className="block mb-1 text-sm font-medium">First Published</label>
              <input
                type="text"
                name="firstPublished"
                value={formData.firstPublished}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="e.g. 1953"
              />
            </div>

            {/* Editions */}
            <div>
              <label className="block mb-1 text-sm font-medium">Editions</label>
              <input
                type="text"
                name="editions"
                value={formData.editions}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="e.g. 2"
              />
            </div>

            {/* Preview Link */}
            <div>
              <label className="block mb-1 text-sm font-medium">Preview Link</label>
              <input
                type="url"
                name="previewLink"
                value={formData.previewLink}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="Paste a URL for preview"
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block mb-1 text-sm font-medium">Publisher</label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="Publisher name"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block mb-1 text-sm font-medium">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="Publication year"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block mb-1 text-sm font-medium">Language</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="e.g. English"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-2 rounded-md focus:outline-none ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white placeholder-gray-400"
                }`}
                placeholder="Short summary or notes"
              ></textarea>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start pt-4">
              <button
                type="submit"
                className="px-6 py-2 rounded-full font-semibold text-black shadow-md hover:scale-105 transition-transform"
                style={{
                  background:
                    "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                }}
              >
                Save
              </button>
              <button
                type="reset"
                onClick={() =>
                  setFormData({
                    title: "",
                    author: "",
                    coAuthor: "",
                    coverImage: null,
                    rating: "",
                    ratingsCount: "",
                    wantToReadCount: "",
                    firstPublished: "",
                    editions: "",
                    previewLink: "",
                    publisher: "",
                    year: "",
                    language: "",
                    description: "",
                  })
                }
                className={`px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform border ${
                  darkMode ? "border-gray-600" : "border-white"
                }`}
              >
                Reset
              </button>
              <button
                type="button"
                className={`px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform border ${
                  darkMode ? "border-gray-600" : "border-white"
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
