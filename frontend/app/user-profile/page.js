"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaEnvelope } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "../context/ThemeContext";

export default function AccountSettings() {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: "luffy07",
    email: "202412080@daiict.ac.in",
    password: "123456789",
    confirmPassword: "123456789",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
  };

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
      className={`relative min-h-screen ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <canvas
        id="backgroundCanvas"
        className="absolute top-0 left-0 w-full h-full"
      ></canvas>
      <Navbar />

      <div className="flex items-center justify-center min-h-screen px-4 pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`relative p-8 rounded-2xl w-full max-w-[600px] mx-4 ${
            darkMode
              ? "text-gray-900 bg-[#e7f0fd] bg-opacity-30 backdrop-blur-sm"
              : "text-white bg-gray-900/30 backdrop-blur-sm"
          }`}
          style={{
            boxShadow: darkMode
              ? "0 0 30px 15px rgba(187, 139, 255, 0.15), 0 0 15px 5px rgba(117, 246, 255, 0.35)"
              : "0 0 50px 10px rgba(187, 139, 255, 0.35), 0 0 60px 1px rgba(117, 246, 255, 0.3)",
          }}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8" /> {/* Spacer for centering */}
              <h1 className="flex-grow text-2xl font-bold text-center">
                Account Settings
              </h1>
              <button
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  darkMode
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center justify-center w-full h-full -mt-1 text-3xl font-bold">
                  &times;
                </span>
              </button>
            </div>
            {/* Title divider */}
            <div
              className={`border-t-2 ${
                darkMode ? "border-gray-400" : "border-gray-400/30"
              }`}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Section */}
            <div className="flex items-center mb-6 space-x-4">
              <div className="relative">
                <div className="w-24 h-24 overflow-hidden rounded-full">
                  <Image
                    src="/profile_photo.png"
                    alt="Profile thumbnail"
                    width={96}
                    height={96}
                    className="object-cover w-24 h-24"
                    priority
                  />
                </div>
              </div>
              <div>
                <p
                  className={`${
                    darkMode ? "text-gray-700" : "text-gray-300"
                  } mb-2`}
                >
                  Profile Photo
                </p>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg flex items-center justify-center font-bold ${
                    darkMode
                      ? "bg-white text-gray-800"
                      : "bg-white text-gray-800"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Divider */}
            <div
              className={`border-t-2 ${
                darkMode ? "border-gray-400" : "border-gray-400/30"
              }`}
            />

            {/* Form Grid */}
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
              <div>
                <label
                  className={`block mb-2 ${
                    darkMode ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border backdrop-blur-sm focus:outline-none transition-all duration-300 ${
                    darkMode
                      ? "border-gray-400 text-gray-900 focus:border-gray-400"
                      : "border-gray-400 text-white focus:border-[#95C4FF]"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block mb-2 ${
                    darkMode ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border backdrop-blur-sm focus:outline-none transition-all duration-300 ${
                      darkMode
                        ? "border-gray-400 text-gray-900 focus:border-gray-400"
                        : "border-gray-400 text-white focus:border-[#95C4FF]"
                    }`}
                  />
                  <FaEnvelope
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block mb-2 ${
                    darkMode ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border backdrop-blur-sm focus:outline-none transition-all duration-300 ${
                    darkMode
                      ? "border-gray-400 text-gray-900 focus:border-gray-400"
                      : "border-gray-400 text-white focus:border-[#95C4FF]"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block mb-2 ${
                    darkMode ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border backdrop-blur-sm focus:outline-none transition-all duration-300 ${
                    darkMode
                      ? "border-gray-400 text-gray-900 focus:border-gray-400"
                      : "border-gray-400 text-white focus:border-[#95C4FF]"
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="px-6 py-2 font-semibold text-black transition-all duration-300 rounded-md shadow-lg cursor-pointer"
                style={{
                  background:
                    "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                className={`px-6 py-2 font-semibold cursor-pointer rounded-lg transition-all duration-300 ${
                  darkMode
                    ? "bg-white text-gray-800 hover:bg-gray-100"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
            </div>

            {/* Divider */}
            <div
              className={`border-t-2 ${
                darkMode ? "border-gray-400" : "border-gray-400/30"
              } mt-6`}
            />

            {/* Deactivate Account Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Deactivate your account</h3>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    Details about your company account and password
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 text-white bg-red-500 rounded-md cursor-pointer font-semiboldtransition-colors hover:bg-red-600"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
}
