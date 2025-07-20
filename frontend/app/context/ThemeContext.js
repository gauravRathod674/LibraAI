"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // on mount: read stored preference
  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    setDarkMode(stored === "true");
  }, []);

  // whenever darkMode changes, update only the scrollbar variable
  useEffect(() => {
    const trackColor = darkMode ? "#E7F0FD" :  "#1E2939";
    document.documentElement.style.setProperty(
      "--scrollbar-track",
      trackColor
    );
    // still persist your preference
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((v) => !v);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
