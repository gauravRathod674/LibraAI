"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import SortSelect from "@/components/ui/SortSelect";

const BorrowCard = ({ rec, darkMode, onReturn }) => {
  const isOverdue = !rec.returnDate && new Date(rec.dueDate) < new Date();
  const status = rec.returnDate
    ? "Returned"
    : isOverdue
    ? "Overdue"
    : "Borrowed";
  const badgeBg =
    status === "Borrowed"
      ? "bg-[linear-gradient(205deg,rgba(187,139,255,1),rgba(117,246,255,1))] text-black"
      : status === "Overdue"
      ? "bg-red-500 text-white"
      : "bg-gray-500 text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative w-full rounded-xl p-4 shadow-md transition hover:scale-[1.01] overflow-hidden flex flex-col sm:flex-row gap-6 justify-center items-center ${
        darkMode ? "bg-white text-black" : "bg-gray-800 text-white"
      }`}
    >
      <span
        className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${badgeBg}`}
      >
        {status}
      </span>
      <img
        src={rec.coverImage}
        alt={rec.title}
        className="object-cover w-24 border rounded-md h-36"
      />
      <div className="flex flex-col items-start justify-center flex-1">
        <div>
          <h2 className="text-lg font-bold">{rec.title}</h2>
          <p className="mb-2 text-sm font-medium">by {rec.author}</p>
          <p className="text-sm">
            <strong>Borrowed:</strong>{" "}
            {new Date(rec.dateBorrowed).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <strong>Due:</strong> {new Date(rec.dueDate).toLocaleDateString()}
          </p>
          {rec.returnDate && (
            <p className="text-sm">
              <strong>Returned:</strong>{" "}
              {new Date(rec.returnDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {status === "Borrowed" && (
            <>
              <button
                className="px-4 py-1 text-sm font-semibold text-black transition rounded-full shadow-md hover:scale-105"
                style={{
                  background:
                    "linear-gradient(205deg, rgb(187, 139, 255), rgb(117, 246, 255))",
                }}
                onClick={() => onReturn(rec)}
              >
                Undo
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

class ReturnBookCommand {
  constructor(book, setRecords) {
    this.book = book;
    this.setRecords = setRecords;
  }
  execute() {
    this.setRecords((prev) =>
      prev.map((b) =>
        b.id === this.book.id
          ? { ...b, returnDate: new Date().toISOString() }
          : b
      )
    );
  }
  undo() {
    this.setRecords((prev) =>
      prev.map((b) => (b.id === this.book.id ? { ...b, returnDate: null } : b))
    );
  }
}

export default function BorrowHistoryPage() {
  const { darkMode } = useTheme();
  const [tab, setTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateBorrowed");
  const [borrowedRecords, setBorrowedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commandStack, setCommandStack] = useState([]);
  const [undoRecord, setUndoRecord] = useState(null);

  useEffect(() => {
    const fetchBorrowHistory = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/borrow-history`, {
          withCredentials: true, // if you're using cookies for auth
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // adjust if JWT
          },
        });

        const mapped = res.data.map((tx) => ({
          id: tx.id,
          title: tx.title,
          author: tx.authors,
          dateBorrowed: tx.borrow_date,
          dueDate: tx.due_date,
          returnDate: tx.return_date,
          coverImage: tx.cover_image,
        }));

        setBorrowedRecords(mapped);
      } catch (err) {
        setError("Failed to fetch borrow history");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowHistory();
  }, []);

  const handleReturn = (book) => {
    const cmd = new ReturnBookCommand(book, setBorrowedRecords);
    cmd.execute();
    setCommandStack((prev) => [cmd, ...prev]);
    setUndoRecord(book);
    setTimeout(() => setUndoRecord(null), 5000);
  };

  const handleUndo = () => {
    const [last, ...rest] = commandStack;
    if (last) {
      last.undo();
      setCommandStack(rest);
      setUndoRecord(null);
    }
  };

  const filtered = useMemo(() => {
    return borrowedRecords
      .filter((r) => {
        if (tab === "Borrowed")
          return !r.returnDate && new Date(r.dueDate) >= new Date();
        if (tab === "Overdue")
          return !r.returnDate && new Date(r.dueDate) < new Date();
        if (tab === "Returned") return !!r.returnDate;
        return true;
      })
      .filter((r) =>
        [r.title, r.author].some((f) =>
          f.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a, b) =>
        sortBy === "title"
          ? a.title.localeCompare(b.title)
          : new Date(b.dateBorrowed) - new Date(a.dateBorrowed)
      );
  }, [borrowedRecords, tab, searchTerm, sortBy]);

  // particle background …
  useEffect(() => {
    const canvas = document.getElementById("backgroundCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let anim;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 50 }, () => {
      const p = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = darkMode
            ? "rgba(117,246,255,0.6)"
            : "rgba(100,149,237,0.6)";
          ctx.fill();
        },
        update() {
          this.x += this.dx;
          this.y += this.dy;
          if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
          if (this.y < 0 || this.y > canvas.height) this.dy *= -1;
          this.draw();
        },
      };
      return p;
    });

    function animate() {
      anim = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.update());
    }
    animate();
    return () => cancelAnimationFrame(anim);
  }, [darkMode]);

  return (
    <div
      className={`relative min-h-screen flex flex-col transition-all duration-500 ${
        darkMode ? "bg-white text-black" : "bg-gray-900 text-white"
      }`}
    >
      <canvas
        id="backgroundCanvas"
        className="absolute top-0 left-0 w-full h-full"
      />
      <Navbar />

      <main className="z-10 flex flex-col items-center justify-center w-full px-4 mt-32">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-4xl font-bold"
        >
          Your Borrow History
        </motion.h1>

        {/* combined Tabs + Filters container */}
        <div
          className={`w-full max-w-xl p-6 space-y-6 transition-all ${
            darkMode ? "bg-[#E7F0FD] text-black" : "bg-gray-900/70 text-white"
          }`}
        >
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList
              className="justify-center w-full p-1 mb-4 transition-all"
              style={{
                background:
                  !darkMode && "linear-gradient(205deg, #2c2c2c, #2c2c2c)",
              }}
            >
              {["All", "Borrowed", "Overdue", "Returned"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className={`px-4 py-1.5 text-sm rounded-md font-semibold transition duration-200
                    ${
                      tab === t
                        ? darkMode
                          ? "text-black"
                          : "text-black"
                        : darkMode
                        ? "text-black hover:bg-[#d6e6fb]"
                        : "text-white hover:bg-[#2c2c2c]"
                    }
                    `}
                  style={
                    tab === t
                      ? {
                          background:
                            "linear-gradient(205deg, rgb(187,139,255), rgb(117,246,255))",
                        }
                      : {}
                  }
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search & Sort row */}
          <div className="flex flex-wrap items-center justify-center w-full gap-4">
            <input
              type="text"
              placeholder="Search title or author…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full sm:w-1/2 px-5 py-3 rounded-full shadow-md focus:outline-none transition ${
                darkMode
                  ? "bg-white text-gray-900 placeholder-gray-600"
                  : "bg-gray-800 text-white placeholder-gray-400"
              }`}
            />
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>
          


          {/* Borrow cards */}
          <div className="space-y-6">
            {loading ? (
              <p className="italic text-center text-gray-500">Loading...</p>
            ) : error ? (
              <p className="italic text-center text-red-500">{error}</p>
            ) : filtered.length ? (
              filtered.map((rec) => (
                <BorrowCard
                  key={rec.id}
                  rec={rec}
                  darkMode={darkMode}
                  onReturn={handleReturn}
                />
              ))
            ) : (
              <p className="italic text-center text-gray-500">
                No records found.
              </p>
            )}
          </div>
        </div>

        {/* Undo snackbar */}
        {undoRecord && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-black dark:text-white shadow-lg px-6 py-3 rounded-full flex items-center gap-4 z-50`}
          >
            <span>Book "{undoRecord.title}" marked as returned.</span>
            <button
              onClick={handleUndo}
              className="font-semibold text-blue-600 dark:text-blue-300 hover:underline"
            >
              Undo
            </button>
          </motion.div>
        )}
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
}
