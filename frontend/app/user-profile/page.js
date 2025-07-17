'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaEnvelope,FaUser,FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useTheme } from '../context/ThemeContext';

export default function AccountSettings() {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const payload = new FormData();
  payload.append("username", formData.username);
  payload.append("email", formData.email);
  payload.append("role", formData.role);
  // Append password fields if needed
  if (profileFile) {
    payload.append("profilePhoto", profileFile);
  }

  await fetch("/api/account/settings", {
    method: "POST",
    body: payload,
  });

  if (profilePreview) {
    localStorage.setItem("profile_photo", profilePreview);
  }

  window.location.reload(); 
};


const handleCancel = () => {
    setFormData({
      username: '',
      email:    '',
      password: '',
      confirmPassword: '',
    });
    setProfileFile(null);
    setProfilePreview(null);
  };

  
  // Ask for confirmation, then deactivate account
  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate your account?")) return;
    // TODO: replace with your real endpoint
    await fetch("/api/account/deactivate", { method: "POST" });
    // e.g., redirect to homepage or login
    window.location.href = "/";
  };

  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const { username, email, role } = JSON.parse(storedUser);
    setFormData((prev) => ({
      ...prev,
      username: username || "",
      email: email || "",
      role: role || "",
    }));
  }

  const storedProfilePhoto = localStorage.getItem("profile_photo");
  if (storedProfilePhoto) {
    setProfilePreview(storedProfilePhoto);
  }
}, []);


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
    <div className={`relative min-h-screen flex flex-col ${darkMode ? "bg-white text-black" : "bg-gray-900 text-white"}`}>
      <canvas id="backgroundCanvas" className="fixed inset-0 w-full h-full pointer-events-none"></canvas>
      <Navbar />
      
      <div className="flex flex-col justify-center min-h-[calc(100vh-4rem)] mt-25 pt-20 pb-10 px-4 sm:px-6 overflow-auto">
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
              ? '0 0 30px 15px rgba(187, 139, 255, 0.15), 0 0 15px 5px rgba(117, 246, 255, 0.35)' 
              : '0 0 50px 10px rgba(187, 139, 255, 0.35), 0 0 60px 1px rgba(117, 246, 255, 0.3)'
          }}
        >
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center">Account Settings</h1>
            </div>
            {/* Title divider */}
            <div className={`border-t-2 ${darkMode ? "border-gray-400" : "border-gray-400/30"}`} />
          </div>

          {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 gap-6">
              {/* Left: Avatar + Upload */}
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed flex items-center justify-center">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/profile-nexus.png"
                      alt="Profile thumbnail"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      priority
                    />
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    type="file"
                    accept="image/*"
                    id="profileUpload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setProfileFile(file);
                      setProfilePreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                  <label
                    htmlFor="profileUpload"
                    className="px-4 py-2 rounded-md font-semibold bg-white text-gray-800 hover:bg-gray-100 cursor-pointer"
                  >
                    Upload Photo
                  </label>
                  {profileFile && (
                    <p className="mt-2 text-sm truncate max-w-xs">{profileFile.name}</p>
                  )}
                </div>
              </div>

              {/* Right: Add whatever you like here! */}
              <div className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                <p>Recommended: 200×200px</p>
                <p>Max 2 MB, JPG/PNG</p>
              </div>
            </div>



            {/* Divider */}
            <div className={`border-t-2 ${darkMode ? "border-gray-400" : "border-gray-400/30"}`} />
            {/* Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">

              {/* Username */}
              <div>
                <div className="flex items-center mb-2 gap-2">
                  <FaUser className={darkMode ? "text-gray-700" : "text-gray-300"} />
                  <label className={darkMode ? "text-gray-700" : "text-gray-300"}>
                    Username
                  </label>
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Luffy"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full block px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 focus:outline-none transition ${
                    darkMode
                      ? "bg-white text-gray-900 border-gray-400 focus:ring-[#75F6FF] focus:ring-offset-white"
                      : "bg-gray-800 text-white border-gray-600 focus:ring-[#BB8BFF] focus:ring-offset-gray-900"
                  }`}
                />
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center mb-2 gap-2">
                  <FaEnvelope className={darkMode ? "text-gray-700" : "text-gray-300"} />
                  <label className={darkMode ? "text-gray-700" : "text-gray-300"}>
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

              {/* Role */}
              <div>
              <div className="flex items-center mb-2 gap-2">
                <FaUser className={darkMode ? "text-gray-700" : "text-gray-300"} />
                <label className={darkMode ? "text-gray-700" : "text-gray-300"}>Role</label>
              </div>
              <p className="pl-2">{formData.role || "Not Provided"}</p>
            </div>


              {/* Password */}
              <div>
                <div className="flex items-center mb-2 gap-2">
                  <FaLock className={darkMode ? "text-gray-700" : "text-gray-300"} />
                  <label className={darkMode ? "text-gray-700" : "text-gray-300"}>
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 focus:outline-none transition ${
                    darkMode
                      ? "bg-white text-gray-900 border-gray-400 focus:ring-[#75F6FF] focus:ring-offset-white"
                      : "bg-gray-800 text-white border-gray-600 focus:ring-[#BB8BFF] focus:ring-offset-gray-900"
                  }`}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex items-center mb-2 gap-2">
                  <FaLock className={darkMode ? "text-gray-700" : "text-gray-300"} />
                  <label className={darkMode ? "text-gray-700" : "text-gray-300"}>
                    Confirm Password
                  </label>
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="*********"
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


            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:justify-start">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 rounded-full text-black font-semibold shadow-lg transition transform hover:scale-105"
                style={{
                  background: "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto px-6 py-2 font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>

            {/* Divider */}
            <div className={`border-t-2 ${darkMode ? "border-gray-400" : "border-gray-400/30"} mt-6`} />

            {/* Deactivate Account Section */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Deactivate your account</h3>
                  <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                    Details about your company account and password
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </form>
          ) :(
              <div className="space-y-6">
                {/* Profile + Info Row */}
                <div className="flex items-center mb-6 gap-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center">
                    <img
                      src={profilePreview || "/profile-nexus.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Username, Email, Role */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <FaUser className={darkMode ? "text-gray-700" : "text-gray-300"} />
                      <span className="font-medium">{formData.username || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaEnvelope className={darkMode ? "text-gray-700" : "text-gray-300"} />
                      <span className="font-medium">{formData.email || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUser className={darkMode ? "text-gray-700" : "text-gray-300"} />
                      <span className="font-medium">{formData.role || "No Role"}</span>
                    </div>
                  </div>
                </div>

                {/* Edit Button (bolder text) */}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto px-6 py-2 rounded-full text-black font-semibold shadow-lg transition transform hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
                  }}
                >
                  Edit Profile
                </button>
              </div>
            )
            }
        </motion.div>
      </div>
      <Footer className="mt-auto" />
    </div>
  );
}

