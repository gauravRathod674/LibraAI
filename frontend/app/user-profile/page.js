"use client";
import Link from "next/link";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaEnvelope, FaUser, FaLock, FaUserShield } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "../context/ThemeContext";
// Integration: Import axios for making API requests. Make sure to install it: npm install axios
import axios from "axios";

export default function AccountSettings() {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    // Integration: Changed 'username' to 'name' to match the API response key.
    name: "",
    email: "",
    password: "", // Password fields are for UI only as per API
    confirmPassword: "",
    role: "",
  });
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // Integration: Added loading and error states for better UX
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Integration: Get API URL from environment variables
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Integration: useEffect to fetch user profile data from the backend on component mount.
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Retrieve the JWT token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated.");
        setLoading(false);
        // Optional: redirect to login page
        // window.location.href = '/login';
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/user/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Populate form and profile picture with data from the API
        setFormData((prev) => ({
          ...prev,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        }));
        setProfilePreview(res.data.profile_photo_url);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [API_URL]); // Dependency on API_URL to re-run if it changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Integration: Renamed handleSubmit to handleUpdateProfile and connected it to the PUT endpoint.
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileFile) {
      // If only text fields were changed, you could add a separate logic here.
      // Since the backend only supports photo updates, we only proceed if a file is selected.
      setIsEditing(false); // Exit editing mode
      return;
    }

    const payload = new FormData();
    // The backend endpoint expects the file under the key 'profile_photo'
    payload.append("profile_photo", profileFile);

    const token = localStorage.getItem("token");

    try {
      await axios.put(`${API_URL}/user/profile/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      // Refresh the page to show the new photo
      window.location.reload();
    } catch (err) {
      console.error("Failed to update profile photo:", err);
      setError("Failed to update photo. Please try a different image.");
    }
  };

  // Integration: Connected the deactivate function to the DELETE endpoint.
  const handleDeactivate = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API_URL}/user/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Clear user session and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Also clear any other user data
      window.location.href = "/"; // Redirect to homepage
    } catch (err) {
      console.error("Failed to deactivate account:", err);
      setError("Failed to deactivate account. Please try again.");
    }
  };

  // ... (The particle animation useEffect remains unchanged)

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
      particles.forEach((particle) => particle.update());
    }

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [darkMode, loading]);

  if (loading) {
    return (
      <div
        className={`relative min-h-screen flex items-center justify-center ${
          darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
        }`}
      >
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen flex flex-col ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <canvas
        id="backgroundCanvas"
        className="fixed inset-0 w-full h-full pointer-events-none"
      ></canvas>
      <Navbar />

      <div className="flex flex-col justify-center min-h-[calc(100vh-4rem)] mt-17 pb-10 px-4 sm:px-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`relative p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-sm sm:max-w-lg md:max-w-xl mx-auto transition-all duration-300 ${
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
          {/* Header Row */}
          <div className="relative flex items-center justify-center mb-4">
            <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
              Account Settings
            </h1>

            <Link
              href="/"
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-red-500 text-lg font-extrabold px-2.5 py-0.5 rounded-md transition"
              title="Close"
            >
              ✕
            </Link>
          </div>

          <div
            className={`border-t-2 ${
              darkMode ? "border-gray-400" : "border-gray-400/30"
            } mb-6`}
          />

          {/* Integration: Display API error message if any */}
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          {isEditing ? (
            // Integration: Changed onSubmit to call the new function
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex flex-col items-center gap-6 mb-6 sm:flex-row sm:items-start">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-24 h-24 overflow-hidden border-2 rounded-full">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="Profile Preview"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Image
                          src="/profile_photo.png" // Fallback image
                          alt="Profile thumbnail"
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                          priority
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col pt-1.5 pl-1.5">
                    <span className="text-md mb-2.5 text-[#bb8bff] font-semibold">
                      Profile Photo
                    </span>
                    <div className="flex flex-col">
                      <input
                        type="file"
                        accept="image/*"
                        id="profileUpload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setProfileFile(file);
                          setProfilePreview(
                            file ? URL.createObjectURL(file) : null
                          );
                        }}
                      />
                      <label
                        htmlFor="profileUpload"
                        className="px-4 py-2 w-fit font-semibold text-sm text-gray-800 bg-white rounded-md cursor-pointer hover:bg-gray-100"
                      >
                        Upload
                      </label>
                      {profileFile && (
                        <p className="max-w-xs mt-2 text-sm text-gray-400 truncate">
                          {profileFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`border-t-2 ${
                  darkMode ? "border-gray-400" : "border-gray-400/30"
                }`}
              />
              <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 sm:gap-6">
                {/* Integration: Changed name to "name" and value to formData.name */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaUser
                      className={
                        darkMode ? "text-gray-700 ml-1" : "text-gray-300 ml-1"
                      }
                    />
                    <label
                      className={darkMode ? "text-gray-700" : "text-gray-300"}
                    >
                      Username
                    </label>
                  </div>
                  <input
                    type="text"
                    name="name" // Changed from username
                    placeholder="Luffy"
                    value={formData.name}
                    onChange={handleInputChange}
                    // The backend API does not support updating username/email, so this field is for display/editing state only.
                    className={`w-full block px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 focus:outline-none transition ${
                      darkMode
                        ? "bg-white text-gray-900 border-gray-400 focus:ring-[#75F6FF] focus:ring-offset-white"
                        : "bg-gray-800 text-white border-gray-600 focus:ring-[#BB8BFF] focus:ring-offset-gray-900"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaEnvelope
                      className={
                        darkMode ? "text-gray-700 ml-1" : "text-gray-300 ml-1"
                      }
                    />
                    <label
                      className={darkMode ? "text-gray-700" : "text-gray-300"}
                    >
                      Email Address
                    </label>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="luffy1352@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 focus:outline-none transition ${
                      darkMode
                        ? "bg-white text-gray-900 border-gray-400 focus:ring-[#75F6FF] focus:ring-offset-white"
                        : "bg-gray-800 text-white border-gray-600 focus:ring-[#BB8BFF] focus:ring-offset-gray-900"
                    }`}
                  />
                </div>
                {/* Password fields are not connected to the backend */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaLock
                      className={
                        darkMode ? "text-gray-700 ml-1" : "text-gray-300 ml-1"
                      }
                    />
                    <label
                      className={darkMode ? "text-gray-700" : "text-gray-300"}
                    >
                      New Password
                    </label>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 focus:outline-none transition ${
                      darkMode
                        ? "bg-white text-gray-900 border-gray-400 focus:ring-[#75F6FF] focus:ring-offset-white"
                        : "bg-gray-800 text-white border-gray-600 focus:ring-[#BB8BFF] focus:ring-offset-gray-900"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaLock
                      className={
                        darkMode ? "text-gray-700 ml-1" : "text-gray-300 ml-1"
                      }
                    />
                    <label
                      className={darkMode ? "text-gray-700" : "text-gray-300"}
                    >
                      Confirm Password
                    </label>
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Leave blank to keep current"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 focus:outline-none transition ${
                      darkMode
                        ? "bg-white text-gray-900 border-gray-400 focus:ring-[#75F6FF] focus:ring-offset-white"
                        : "bg-gray-800 text-white border-gray-600 focus:ring-[#BB8BFF] focus:ring-offset-gray-900"
                    }`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:justify-start">
                <button
                  type="submit"
                  className="w-full px-6 py-2 font-semibold transition transform rounded-lg cursor-pointer shadow-lg text-black sm:w-auto"
                  style={{
                    background:
                      "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full px-6 py-2 font-semibold text-gray-800 transition cursor-pointer bg-gray-200 rounded-lg sm:w-auto dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>

              <div
                className={`border-t-2 ${
                  darkMode ? "border-gray-400" : "border-gray-400/30"
                } mt-6`}
              />
              <div className="flex flex-col gap-4 mt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">Deactivate your account</h3>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    This will permanently delete your account and data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-6 py-2 text-white transition cursor-pointer bg-red-600 rounded-lg hover:bg-red-700 w-full sm:w-auto"
                >
                  Deactivate
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center justify-center w-24 h-24 overflow-hidden border-2 rounded-full">
                  <img
                    src={profilePreview || "/profile_photo.png"}
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <FaUser
                      className={darkMode ? "text-gray-700" : "text-gray-300"}
                    />
                    {/* Integration: Display name from state */}
                    <span className="font-medium">
                      {formData.name || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope
                      className={darkMode ? "text-gray-700" : "text-gray-300"}
                    />
                    {/* Integration: Display email from state */}
                    <span className="font-medium">
                      {formData.email || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUserShield
                      className={darkMode ? "text-gray-700" : "text-gray-300"}
                    />
                    <span className="font-medium capitalize">
                      {formData.role || "No Role"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full px-6 py-2 font-semibold text-black transition cursor-pointer transform rounded-lg shadow-lg sm:w-auto hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Footer className="mt-auto"  darkMode={darkMode}/>
    </div>
  );
}
