"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useTheme } from "../context/ThemeContext";
import { dummyBorrowed, dummyReserved } from "../data";


class ReturnBookCommand {
  constructor(book, setRecords) {
    this.book = book;
    this.setRecords = setRecords;
  }
  execute() {
    this.setRecords(prev =>
      prev.map(b =>
        b.id === this.book.id ? { ...b, returnDate: new Date().toISOString() } : b
      )
    );
  }
  undo() {
    this.setRecords(prev =>
      prev.map(b =>
        b.id === this.book.id ? { ...b, returnDate: null } : b
      )
    );
  }
}

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
      initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{duration:0.3}}
      className={`relative w-full rounded-xl p-4 shadow-md hover:scale-[1.01] transition flex flex-col sm:flex-row gap-6 justify-center items-center ${
        darkMode ? "bg-white text-black" : "bg-gray-800 text-white"
      }`}
    >
      <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${badgeBg}`}>
        {status}
      </span>
      <img src={rec.coverImage} alt={rec.title}
           className="w-24 h-36 object-cover rounded-md border" />
      <div className="flex-1 flex flex-col justify-center items-start">
        <h2 className="text-lg font-bold">{rec.title}</h2>
        <p className="text-sm font-medium mb-2">by {rec.author}</p>
        <p className="text-sm"><strong>Borrowed:</strong> {new Date(rec.dateBorrowed).toLocaleDateString()}</p>
        <p className="text-sm"><strong>Due:</strong> {new Date(rec.dueDate).toLocaleDateString()}</p>
        {rec.returnDate && <p className="text-sm"><strong>Returned:</strong> {new Date(rec.returnDate).toLocaleDateString()}</p>}
        <div className="flex gap-2 mt-4">
          {status==="Borrowed" && (
            <button
              onClick={()=>onReturn(rec)}
              className="px-4 py-1 rounded-full text-sm font-semibold text-black shadow-md hover:scale-105 transition"
              style={{background:"linear-gradient(205deg, rgb(187,139,255), rgb(117,246,255))"}}
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LateFeeCard = ({ rec, darkMode, onPay }) => {
  // dummy fee: $0.50 per day overdue
  const days = Math.ceil((Date.now() - new Date(rec.dueDate)) / (1000*60*60*24));
  const fee = days>0 ? (days*0.5).toFixed(2) : "0.00";
  return (
    <motion.div
      initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{duration:0.3}}
      className={`relative w-full rounded-xl p-4 shadow-md hover:scale-[1.01] transition flex flex-col sm:flex-row gap-6 justify-center items-center ${
        darkMode ? "bg-white text-black" : "bg-gray-800 text-white"
      }`}
    >
      <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
        Fee: ${fee}
      </span>
      <img src={rec.coverImage} alt={rec.title}
           className="w-24 h-36 object-cover rounded-md border" />
      <div className="flex-1 flex flex-col justify-center items-start">
        <h2 className="text-lg font-bold">{rec.title}</h2>
        <p className="text-sm font-medium mb-2">by {rec.author}</p>
        <p className="text-sm">Due: {new Date(rec.dueDate).toLocaleDateString()}</p>
        <button
          onClick={()=>onPay(rec)}
          className="mt-4 px-4 py-1 rounded-full text-sm font-semibold text-black shadow-md hover:scale-105 transition"
          style={{background:"linear-gradient(205deg, rgb(187,139,255), rgb(117,246,255))"}}
        >
          Pay Fee
        </button>
      </div>
    </motion.div>
  );
};

const ReservedCard = ({ rec, darkMode, onCancel, onPickup }) => (
  <motion.div
    initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{duration:0.3}}
    className={`relative w-full rounded-xl p-4 shadow-md hover:scale-[1.01] transition flex flex-col sm:flex-row gap-6 justify-center items-center ${
      darkMode ? "bg-white text-black" : "bg-gray-800 text-white"
    }`}
  >
    <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${
      rec.available ? "bg-green-400 text-black" : "bg-yellow-500 text-black"
    }`}>
      {rec.available ? "Available" : "Waiting"}
    </span>
    <img src={rec.coverImage} alt={rec.title}
         className="w-24 h-36 object-cover rounded-md border" />
    <div className="flex-1 flex flex-col justify-center items-start">
      <h2 className="text-lg font-bold">{rec.title}</h2>
      <p className="text-sm font-medium mb-2">by {rec.author}</p>
      <p className="text-sm">Reserved: {new Date(rec.reservedDate).toLocaleDateString()}</p>
      <div className="flex gap-2 mt-4">
        {rec.available && (
          <button
            onClick={()=>onPickup(rec)}
            className="px-4 py-1 rounded-full text-sm font-semibold text-black shadow-md hover:scale-105 transition"
            style={{background:"linear-gradient(205deg, rgb(187,139,255), rgb(117,246,255))"}}
          >
            Pick Up
          </button>
        )}
        <button
          onClick={()=>onCancel(rec)}
          className={`px-4 py-1 rounded-full text-sm font-semibold transition border ${
            darkMode ? "border-gray-600 text-black hover:bg-gray-300" : "border-white text-white hover:bg-gray-700"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  </motion.div>
);

// --- Main Component ---
export default function TransactionPage() {
  const { darkMode } = useTheme();
  const tabs = ["All","Borrowed","Overdue","Returned","Late Fees","Reserved"];
  const [tab, setTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateBorrowed");
  const [borrowedRecords, setBorrowedRecords] = useState(dummyBorrowed);
  const [reservedRecords, setReservedRecords] = useState(dummyReserved);
  const [commandStack, setCommandStack] = useState([]);
  const [undoRecord, setUndoRecord] = useState(null);

  // Return / Undo
  const handleReturn = book => {
    const cmd = new ReturnBookCommand(book,setBorrowedRecords);
    cmd.execute();
    setCommandStack(prev=>[cmd,...prev]);
    setUndoRecord(book);
    setTimeout(()=>setUndoRecord(null),5000);
  };
  const handleUndo = () => {
    const [last,...rest]=commandStack;
    if(last){ last.undo(); setCommandStack(rest); setUndoRecord(null); }
  };

  // Pay fee, simply remove from borrow list
  const handlePayFee = rec => {
    setBorrowedRecords(prev=>prev.filter(b=>b.id!==rec.id));
  };

  // Reservation actions
  const handleCancel = rec => {
    setReservedRecords(prev=>prev.filter(r=>r.id!==rec.id));
  };
  const handlePickup = rec => {
    setReservedRecords(prev=>prev.map(r=>
      r.id===rec.id?{...r,available:false}:r));
  };

  // Build display list
  const displayList = useMemo(() => {
    switch(tab) {
      case "Borrowed":
        return borrowedRecords.filter(r=>!r.returnDate && new Date(r.dueDate)>=new Date());
      case "Overdue":
        return borrowedRecords.filter(r=>!r.returnDate && new Date(r.dueDate)<new Date());
      case "Returned":
        return borrowedRecords.filter(r=>!!r.returnDate);
      case "Late Fees":
        return borrowedRecords.filter(r=>!r.returnDate && new Date(r.dueDate)<new Date());
      case "Reserved":
        return reservedRecords;
      case "All":
      default:
        return borrowedRecords;
    }
  },[tab,borrowedRecords,reservedRecords]);

  // Filtering by searchTerm
  const filtered = displayList.filter(r=>
    [r.title,r.author, r.reservedDate||""]
      .some(f=>f.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Particle background
  useEffect(()=>{
    const canvas=document.getElementById("backgroundCanvas");
    if(!canvas) return;
    const ctx=canvas.getContext("2d");
    let anim;
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const pts=Array.from({length:50},()=>({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      r:Math.random()*3+1,
      dx:(Math.random()-0.5)*2, dy:(Math.random()-0.5)*2,
      draw(){
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
        ctx.fillStyle=darkMode?"rgba(117,246,255,0.6)":"rgba(100,149,237,0.6)";
        ctx.fill();
      },
      update(){
        this.x+=this.dx; this.y+=this.dy;
        if(this.x<0||this.x>canvas.width) this.dx*=-1;
        if(this.y<0||this.y>canvas.height) this.dy*=-1;
        this.draw();
      }
    }));
    (function loop(){
      anim=requestAnimationFrame(loop);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p=>p.update());
    })();
    return ()=>cancelAnimationFrame(anim);
  },[darkMode]);

  return (
    <div className={`relative min-h-screen flex flex-col ${darkMode?"bg-white text-black":"bg-gray-900 text-white"}`}>
      <canvas id="backgroundCanvas" className="absolute inset-0" />
      <Navbar />

      <main className="z-10 mt-32 px-4 w-full flex flex-col items-center">
        <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8}}
                   className="text-4xl font-bold mb-6">
          Transactions & Fees
        </motion.h1>

        <div className={`w-full max-w-xl p-6 space-y-6 rounded-2xl shadow-xl backdrop-blur transition-all ${
            darkMode?"bg-[#E7F0FD] text-black":"bg-gray-900/70 text-white"
        }`}>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="p-1 flex justify-center mb-4">
              {tabs.map(t=>(
                <TabsTrigger
                  key={t} value={t}
                  className={`px-4 py-1.5 rounded-full font-semibold transition ${
                    tab===t
                      ? "bg-[linear-gradient(205deg,rgba(187,139,255,1),rgba(117,246,255,1))] text-black shadow-lg"
                      : darkMode?"text-gray-600":"text-gray-300"
                  }`}
                >{t}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <input
              type="text" placeholder="Search title, author…"
              value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              className={`w-full sm:w-1/2 px-5 py-3 rounded-full shadow-md focus:outline-none transition ${
                darkMode?"bg-white text-gray-900 placeholder-gray-600":"bg-gray-800 text-white placeholder-gray-400"
              }`}
            />

            {["All","Borrowed","Overdue","Returned","Late Fees"].includes(tab)&&(
            <select
              value={sortBy} onChange={e=>setSortBy(e.target.value)}
              className={`w-full sm:w-1/4 px-4 py-3 rounded-full shadow-md focus:outline-none transition ${
                darkMode?"bg-white text-gray-900":"bg-gray-800 text-white"
              }`}
            >
              <option value="dateBorrowed">Newest Borrowed</option>
              <option value="title">Title</option>
            </select>
            )}
          </div>

          <div className="space-y-6">
            {filtered.length ? filtered.map(rec => {
              if(tab==="Late Fees") {
                return <LateFeeCard key={rec.id} rec={rec} darkMode={darkMode} onPay={handlePayFee} />;
              }
              if(tab==="Reserved") {
                return <ReservedCard key={rec.id} rec={rec} darkMode={darkMode}
                                     onCancel={handleCancel} onPickup={handlePickup} />;
              }
              // else first four tabs:
              return <BorrowCard key={rec.id} rec={rec} darkMode={darkMode} onReturn={handleReturn} />;
            }) : (
              <p className="text-center italic text-gray-500">No records found.</p>
            )}
          </div>
        </div>

        {undoRecord && (
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-black dark:text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50"
          >
            <span>Book “{undoRecord.title}” marked returned.</span>
            <button onClick={handleUndo}
                    className="text-purple-600 dark:text-cyan-300 font-semibold hover:underline">
              Undo
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
