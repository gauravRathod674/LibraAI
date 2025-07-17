"use client";
import React from "react";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = ({ darkMode }) => {
  return (
    <footer
      className={`w-full bottom-0 left-0 mt-20 py-8 px-6 text-center border-t transition-all duration-500
        ${
          darkMode
            ? "bg-[#E7F0FD] text-gray-800 border-gray-300"
            : "bg-gray-900 text-white border-gray-700"
        }`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left - Copyright */}
        <p className="text-sm opacity-80">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold">Nexus Library</span>. All rights reserved.
        </p>

        {/* Right - Social Icons */}
        <div className="flex gap-5">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaXTwitter className="w-5 h-5 hover:text-blue-400 cursor-pointer hover:scale-110 transition-all duration-200" />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <FaGithub className="w-5 h-5 hover:text-gray-400 cursor-pointer hover:scale-110 transition-all duration-200" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <FaLinkedin className="w-5 h-5 hover:text-blue-400 cursor-pointer hover:scale-110 transition-all duration-200" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="w-5 h-5 hover:text-pink-400 cursor-pointer hover:scale-110 transition-all duration-200" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
