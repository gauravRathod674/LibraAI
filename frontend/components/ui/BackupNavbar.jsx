"use client";
import React, { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode"; // to decode JWT token
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { darkMode, toggleDarkMode } = useTheme();
  const [user, setUser] = useState(null); // To store user info
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    // Check user authentication status
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            username: decoded.username,
            profile_photo:
              localStorage.getItem("profile_photo") || "/default-avatar.jpg",
          });
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        localStorage.removeItem("token");
      }
    }
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "My Books", path: "/book-detail" },
    { name: "Search", path: "/search" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={mounted ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`w-full fixed top-0 left-0 z-50 px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-opacity-90 shadow-md backdrop-blur-lg
        ${darkMode ? "bg-[#E7F0FD] text-gray-900" : "bg-gray-900 text-white"}
      `}
    >
      {/* Logo (Left) */}
      <h1 className="text-xl font-bold z-10">Nexus Library</h1>

      {/* Conditionally Render Search Bar */}
      {pathname !== "/" && pathname !== "/search" && (
        <div className="absolute left-1/2 transform -translate-x-1/2 w-[260px] md:w-[320px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search books, articles..."
              className={`w-full px-4 py-2 rounded-full shadow-md focus:outline-none transition-all duration-300 pr-12 ${
                darkMode
                  ? "bg-[#E7F0FD] text-gray-900 placeholder-gray-600"
                  : "bg-gray-800 text-white placeholder-gray-400"
              }`}
            />
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-white rounded-full shadow-md hover:shadow-lg transition-transform hover:scale-105"
              style={{
                background:
                  "linear-gradient(205deg, rgb(187, 139, 255) 8.49%, rgb(117, 246, 255) 91.51%)",
              }}
            >
              🔍
            </button>
          </div>
        </div>
      )}

      {/* Nav Links + Toggle (Right) */}
      <div className="flex items-center gap-6 z-10">
        <div className="hidden md:flex gap-6 text-lg font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className="relative group transition-all duration-300"
            >
              {link.name}
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}
        </div>

        <button
          className="p-2 rounded-full bg-gray-200 shadow-md hover:shadow-lg dark:bg-gray-800 dark:text-white"
          onClick={toggleDarkMode}
        >
          {darkMode ? (
            <Moon className="w-6 h-6 text-yellow-500" />
          ) : (
            <Sun className="w-6 h-6 text-gray-800" />
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-4">
            <span>{user.username}</span>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-sm font-medium text-blue-500">
            Login
          </Link>
        )}

        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`md:hidden absolute top-full left-0 w-full mt-2 px-6 py-4 flex flex-col gap-4 text-center text-lg font-medium ${
              darkMode ? "text-gray-800 bg-[#E7F0FD]" : "text-white bg-gray-900"
            }`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="hover:underline transition-all duration-300"
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Navbar;