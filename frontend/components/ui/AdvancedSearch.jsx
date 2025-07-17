"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const AdvancedSearch = ({ darkMode, setResults, setHasSearched, setActiveSection }) => {
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    subject: "",
    publisher: "",
  });

  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    setActiveSection("Books");

    const url = new URL("http://127.0.0.1:8000/api/search/advancedsearch");
    const queryParams = new URLSearchParams();

    Object.entries(form).forEach(([key, value]) => {
      if (value.trim()) {
        url.searchParams.set(key, value);
        queryParams.set(key, value);  // for browser URL
      }
    });

    // Push to URL (client-side route update)
    router.push(`/search?${queryParams.toString()}&mode=advanced`);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Network error");

      const data = await res.json();
      const results = Array.isArray(data?.pages?.page_1)
        ? data.pages.page_1
        : [];

      setResults(results);
    } catch (error) {
      console.error("Advanced search error:", error);
      setResults([]);
    }
  };

  return (
    <div
      className={`relative flex flex-col transition-all duration-500 ${
        darkMode ? "bg-[#f7f7f7] text-black" : "bg-gray-900 text-white"
      }`}
    >
      <main className="z-10 px-6 w-full">
        <form
          onSubmit={handleSubmit}
          className={`w-full max-w-2xl mx-auto backdrop-blur rounded-2xl shadow-xl p-8 space-y-6 ${
            darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-800/70 text-white"
          }`}
        >
          <h1 className="text-3xl font-bold text-center mb-6">
            Advanced Book Search
          </h1>

          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <label className="block mb-2 capitalize text-sm font-semibold">
                {key}
              </label>
              <input
                type="text"
                name={key}
                value={value}
                onChange={handleChange}
                placeholder={`Enter ${key}`}
                className={`w-full px-5 py-3 rounded-lg shadow-inner focus:outline-none focus:ring-2 ${
                  darkMode
                    ? "bg-white text-gray-900"
                    : "bg-gray-900 text-white placeholder-[#E7F0FD]"
                }`}
              />
            </div>
          ))}

          <button
            type="submit"
            className="px-6 py-2 rounded-lg font-semibold text-black"
            style={{
              background:
                "linear-gradient(205deg, rgb(187, 139, 255), rgb(117, 246, 255))",
            }}
          >
            Search
          </button>
        </form>
      </main>
    </div>
  );
};

export default AdvancedSearch;
