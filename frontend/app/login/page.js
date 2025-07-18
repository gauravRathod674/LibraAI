"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import UserRoleDropdown from "@/components/ui/UserRoleDropdown";
import { useTheme } from "../context/ThemeContext";
import { CheckCircle, XCircle } from "lucide-react";

export default function AuthPage() {
  const { darkMode } = useTheme();
  const [isRegistering, setIsRegistering] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("idle");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [alert, setAlert] = useState({ message: "", success: false });

  // Fetch a welcome message on load (optional)
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/login`)
      .then((res) => console.log("Backend says:", res.data.message))
      .catch((err) => console.error("Fetch /login failed:", err));
  }, []);

  // Auto-fade alert after 5s then clear after animation
  // auto-hide our motion-alert after 5s
  useEffect(() => {
    if (!alert.message) return;
    const timer = setTimeout(() => {
      setAlert({ message: "", success: false });
    }, 3000);
    return () => clearTimeout(timer);
  }, [alert.message]);

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        action: "login",
        username,
        password,
      });
      setAlert({ message: res.data.message, success: res.data.success });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (res.data.success) {
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        }
    } catch (err) {
      console.error("Login error:", err);
      setAlert({ message: "Login failed. Try again.", success: false });
    }
  };

  const onSubmitRegister = async (e) => {
    e.preventDefault();
    console.log("Role:", role); // Add this line to check the role value

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        action: "register",
        username,
        email,
        password,
        role,
      });
      setAlert({ message: res.data.message, success: res.data.success });
      if (res.data.success) {
        handleToggle();
      }
    } catch (err) {
      console.error("Register error:", err);
      setAlert({ message: "Registration failed. Try again.", success: false });
    }
  };

  const handleToggle = () => {
    setAlert({ message: "", success: false });
    setAnimationPhase("stretch");
    setTimeout(() => {
      setIsRegistering((prev) => !prev);
      setAnimationPhase("restore");
    }, 300);
    setTimeout(() => setAnimationPhase("idle"), 600);
  };

  // Canvas particles (same as before)...
  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
    const ctx = canvas.getContext("2d");
    const particles = [];
    const num = 40;
    let af;
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
    for (let i = 0; i < num; i++) particles.push(new P());
    function anim() {
      af = requestAnimationFrame(anim);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.update());
    }
    anim();
    return () => cancelAnimationFrame(af);
  }, [darkMode]);

  const imageLeft = isRegistering ? "0%" : "50%";
  const imageAnimate =
    animationPhase === "stretch"
      ? { left: 0, width: "100%" }
      : animationPhase === "restore"
      ? { left: imageLeft, width: "50%" }
      : { left: imageLeft, width: "50%" };

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center transition-all duration-500 ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <canvas
        id="backgroundCanvas"
        className="absolute top-0 left-0 z-0 w-full h-full"
      />
      <Navbar />

      {/* Global Alert */}
      <AnimatePresence>
  {alert.message && (
    <motion.div
      key="auth-alert"
      className={`absolute left-1/2 z-20 px-4 py-2 rounded-lg shadow-2xl flex items-center space-x-3 text-sm sm:text-base
                  transform -translate-x-1/2 font-semibold
                  ${
                    alert.success
                      ? darkMode
                        ? "bg-green-500 text-white"
                        : "bg-green-400 text-black"
                      : darkMode
                      ? "bg-red-500 text-white"
                      : "bg-red-400 text-black"
                  }`}
      style={{
        top: "4.5rem",
        minWidth: "200px",
        maxWidth: "90vw",
      }}
      initial={{ x: "100vw", opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: "-100vw", opacity: 0, scale: 0.8 }}
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      }}
    >
      {alert.success ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <XCircle className="w-5 h-5" />
      )}
      <span>{alert.message}</span>
    </motion.div>
  )}
</AnimatePresence>

      <div
        className={`relative w-full max-w-2xl min-h-[470px] rounded-3xl
          shadow-[0_0_30px_rgba(187,139,255,0.25),_0_0_30px_rgba(117,246,255,0.15)]
          overflow-visible backdrop-blur-lg border border-white/10 flex items-start
          after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full
          after:h-1 after:bg-gradient-to-r after:from-purple-400 after:via-cyan-400 after:to-purple-400 after:blur-sm
          ${darkMode ? "bg-[#E7F0FD] text-black" : "bg-white/5 text-white"}`}
      >
        {/* LOGIN PANEL */}
        <div className="z-10 flex flex-col flex-1 w-1/2 p-8">
          <AnimatePresence mode="wait">
            {!isRegistering && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-4xl font-bold mb-7">Log In</h2>
                <form className="space-y-7" onSubmit={onSubmitLogin}>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                    />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`pl-10 pr-3 py-2 rounded-md w-full ${
                        darkMode
                          ? "bg-[#f7f7f7]/90 text-black"
                          : "bg-white/5 text-white"
                      }`}
                      required
                    />
                  </div>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 pr-3 py-2 rounded-md w-full ${
                        darkMode
                          ? "bg-[#f7f7f7]/90 text-black"
                          : "bg-white/5 text-white"
                      }`}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 text-sm font-semibold text-black rounded-lg cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(205deg, rgb(187,139,255) 8.49%, rgb(117,246,255) 91.51%)",
                    }}
                  >
                    Log In
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <p>
                    Don’t have an account?{" "}
                    <span
                      className="text-purple-500 cursor-pointer"
                      onClick={handleToggle}
                    >
                      Sign Up
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* IMAGE PANEL */}
        <motion.div
          className="absolute top-0 z-0 h-full bg-center bg-cover"
          animate={imageAnimate}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ backgroundImage: "url('/bg.png')" }}
        />

        {/* SIGNUP PANEL */}
        <div className="z-10 flex flex-col flex-1 w-1/2 p-8">
          <AnimatePresence mode="wait">
            {isRegistering && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-4xl font-bold mb-7">Sign Up</h2>
                <form className="space-y-7" onSubmit={onSubmitRegister}>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                    />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`pl-10 pr-3 py-2 rounded-md w-full ${
                        darkMode
                          ? "bg-[#f7f7f7]/90 text-black"
                          : "bg-white/5 text-white"
                      }`}
                      required
                    />
                  </div>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 pr-3 py-2 rounded-md w-full ${
                        darkMode
                          ? "bg-[#f7f7f7]/90 text-black"
                          : "bg-white/5 text-white"
                      }`}
                      required
                    />
                  </div>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 pr-3 py-2 rounded-md w-full ${
                        darkMode
                          ? "bg-[#f7f7f7]/90 text-black"
                          : "bg-white/5 text-white"
                      }`}
                      required
                    />
                  </div>
                  <UserRoleDropdown
                    darkMode={darkMode}
                    selectedRole={role}
                    setSelectedRole={setRole}
                  />

                  <button
                    type="submit"
                    className="w-full py-2 text-sm font-semibold text-black rounded-lg cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(205deg, rgb(187,139,255) 8.49%, rgb(117,246,255) 91.51%)",
                    }}
                  >
                    Sign Up
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <p>
                    Already have an account?{" "}
                    <span
                      className="text-purple-500 cursor-pointer"
                      onClick={handleToggle}
                    >
                      Log In
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

