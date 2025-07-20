"use client";
import React, { useEffect, useMemo, useState } from "react";
// 1. Import useSearchParams to read the URL
import { useRouter, useSearchParams } from "next/navigation";

import Navbar from "@/components/ui/Navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import AdvancedSearch from "@/components/ui/AdvancedSearch";
import Book from "@/components/ui/Book";
import AuthorCard from "@/components/ui/Author";
import GenreCard from "@/components/ui/Genre";
import FilterSidebar from "@/components/ui/FilterSidebar";
import Footer from "@/components/ui/Footer";
import SearchInsideCard from "@/components/ui/SearchInsideCard";
import { useTheme } from "@/app/context/ThemeContext";
import { dummyBooks, dummyGenres, papers } from "../data";
import Research from "@/components/ui/Research";

const MODE_MAP = {
  Books: {
    endpoint: "/api/search",
    params: { mode: "everything" },
  },
  "Advanced Search": {
    endpoint: "/api/search/advancedsearch",
    params: {},
  },
  Authors: {
    endpoint: "/api/search",
    params: { mode: "authors" },
  },
  "Search Inside": {
    endpoint: "/api/search",
    params: { mode: "inside" },
  },
};

const STATIC_SECTIONS = {
  Authors: dummyBooks,
  Genres: dummyGenres,
  "Search Inside": dummyBooks,
  Research: papers,
};

const TABS = [
  "Books",
  "Authors",
  "Genres",
  "Search Inside",
  "Advanced Search",
  "Research",
];

const SearchPage = () => {
  const { darkMode } = useTheme();
  const router = useRouter();
  // 2. Initialize useSearchParams
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("Books");
  const [activeFilters, setActiveFilters] = useState({});
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const [rating, setRating] = useState(0);
  const [year, setYear] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch dynamic results - now takes the query as an argument
  const fetchResults = async (query) => {
    if (!query || activeSection === "Advanced Search") return;

    setHasSearched(true);
    setLoading(true);
    setSubmittedSearchTerm(query);

    const config = MODE_MAP[activeSection] || MODE_MAP["Books"];
    const url = new URL(`http://127.0.0.1:8000${config.endpoint}`);
    url.searchParams.set("q", query);
    Object.entries(config.params).forEach(([k, v]) =>
      url.searchParams.set(k, v)
    );

    try {
      const res = await fetch(url.toString());
      const data = await res.json();
      let resultsData = [];

      if (activeSection === "Authors") {
        resultsData = data?.page_1?.authors || [];
      } else if (activeSection === "Books" || activeSection === "Search Inside") {
        resultsData = data?.pages?.page_1 || [];
      }

      setResults(resultsData);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 3. This useEffect handles the initial search from the URL
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    const modeFromUrl = searchParams.get('mode');

    if (queryFromUrl) {
      setSearchTerm(queryFromUrl);
      // Find the tab that corresponds to the mode
      const tabForMode = Object.keys(MODE_MAP).find(key => MODE_MAP[key].params.mode === modeFromUrl);
      if (tabForMode) {
        setActiveSection(tabForMode);
      }
      fetchResults(queryFromUrl);
    }
  }, [searchParams]); // Rerun when URL params change

  // This useEffect handles searches when the tab is changed
  useEffect(() => {
    if (submittedSearchTerm && hasSearched) {
      fetchResults(submittedSearchTerm);
    }
  }, [activeSection]);

  // Filter dynamic results (Books)
  const filteredBooks = useMemo(() => {
    // No client-side filtering needed if the API does it all
    return results;
  }, [results]);

  // Filter static tabs
  const staticFiltered = useMemo(() => {
    const q = submittedSearchTerm.trim().toLowerCase();
    return {
      Authors: STATIC_SECTIONS.Authors.filter((item) =>
        (item.author || "").toLowerCase().includes(q)
      ),
      Genres: STATIC_SECTIONS.Genres.filter(
        (g) =>
          (g.name || "").toLowerCase().includes(q) ||
          (g.description || "").toLowerCase().includes(q)
      ),
      "Search Inside": STATIC_SECTIONS["Search Inside"].filter((item) =>
        (item.description || "").toLowerCase().includes(q)
      ),
      Research: STATIC_SECTIONS.Research.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      ),
    };
  }, [submittedSearchTerm]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    // Update URL
    const config = MODE_MAP[activeSection] || MODE_MAP["Books"];
    const params = new URLSearchParams({
      q: searchTerm,
      ...config.params,
    });
    router.push(`/search?${params.toString()}`);

    // Trigger the search
    fetchResults(searchTerm);
  };

  return (
    <div
      className={`relative min-h-screen flex flex-col transition-all duration-500 ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <Navbar />

      <main className="z-10 mt-32 px-6 w-full">
        <h1 className="text-4xl font-bold text-center mb-6">
          Explore the LibraAI
        </h1>

        <div className="flex justify-center mb-10 gap-4 flex-wrap">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            type="text"
            placeholder="Search books, authors, topics..."
            className={`w-full max-w-xl px-5 py-4 rounded-full shadow-md focus:outline-none transition ${
              darkMode
                ? "bg-[#E7F0FD] text-gray-900 placeholder-gray-600"
                : "bg-gray-800 text-white placeholder-gray-400"
            }`}
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 rounded-full cursor-pointer font-semibold text-black"
            style={{
              background:
                "linear-gradient(205deg, rgb(187, 139, 255), rgb(117, 246, 255))",
            }}
          >
            Search
          </button>
        </div>

        {hasSearched && (
          <div
            className={`w-full max-w-5xl mx-auto backdrop-blur rounded-2xl shadow-xl p-6 space-y-6 transition-all ${
              darkMode ? "bg-[#f7f7f7] text-white" : "bg-gray-900/70 text-black"
            }`}
          >
            <Tabs
              value={activeSection}
              onValueChange={setActiveSection}
              darkMode={darkMode}
              className="w-full"
            >
              <TabsList
                darkMode={darkMode}
                className="p-1 w-full justify-center mb-10"
              >
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    darkMode={darkMode}
                    className={`px-4 py-1.5 text-sm rounded-md font-semibold transition-all duration-200 ${
                      activeSection === tab
                        ? "text-black shadow"
                        : darkMode
                        ? "text-black hover:bg-[#d6e6fb]"
                        : "text-white hover:bg-[#2c2c2c]"
                    }`}
                    style={
                      activeSection === tab
                        ? {
                            backgroundImage:
                              "linear-gradient(205deg, rgb(187, 139, 255), rgb(117, 246, 255))",
                          }
                        : {}
                    }
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {TABS.map((tab) => (
                <TabsContent key={tab} value={tab}>
                  {tab === "Advanced Search" ? (
                    <AdvancedSearch
                      darkMode={darkMode}
                      setResults={setResults}
                      setHasSearched={setHasSearched}
                      setActiveSection={setActiveSection}
                    />
                  ) : tab === "Authors" ? (
                    <div>
                      {results.map((author, index) => (
                        <AuthorCard
                          key={index}
                          author={author}
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      {!loading ? (
                        <section className="flex flex-col lg:flex-row gap-6 w-full">
                          <div
                            className={`flex-1 flex flex-col gap-6 ${
                              tab === "Books" ? "lg:pr-6" : ""
                            }`}
                          >
                            {tab === "Books" &&
                              filteredBooks.map((item, idx) => (
                                <Book
                                  key={idx}
                                  item={item}
                                  darkMode={darkMode}
                                />
                              ))}

                            {tab === "Authors" &&
                              staticFiltered.Authors.map((item, idx) => (
                                <AuthorCard
                                  key={idx}
                                  item={item}
                                  darkMode={darkMode}
                                />
                              ))}

                            {tab === "Genres" &&
                              staticFiltered.Genres.map((item, idx) => (
                                <GenreCard
                                  key={idx}
                                  item={item}
                                  darkMode={darkMode}
                                />
                              ))}
                            {tab === "Search Inside" &&
                              results.map((item, idx) => (
                                <SearchInsideCard
                                  key={item.id || idx}
                                  item={item}
                                  darkMode={darkMode}
                                  index={idx}
                                />
                              ))}

                            {tab === "Research" && (
                              <Research
                                searchTerm={submittedSearchTerm}
                                hasSearched={hasSearched}
                              />
                            )}

                            {(tab === "Books" && filteredBooks.length === 0 && hasSearched && !loading) ||
                            (tab !== "Books" &&
                              staticFiltered[tab]?.length === 0) ? (
                              <p className="text-center text-gray-500">
                                No results found for “{submittedSearchTerm}”
                              </p>
                            ) : null}
                          </div>

                          {tab === "Books" && (
                            <div className="lg:w-80 flex flex-col gap-6 mt-8 lg:mt-0">
                              <FilterSidebar
                                setActiveFilters={setActiveFilters}
                                setRating={setRating}
                                setYear={setYear}
                                activeFilters={activeFilters}
                                rating={rating}
                                year={year}
                                darkMode={darkMode}
                              />
                            </div>
                          )}
                        </section>
                      ) : (
                        <div className="text-xl font-semibold text-center text-gray-600">
                          Loading...
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;