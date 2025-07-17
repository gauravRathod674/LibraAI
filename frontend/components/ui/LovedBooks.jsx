'use client';
import React, { useRef, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { lovedBooks } from '@/app/data';


export default function LovedBooks({ darkMode }) {
  const scrollRef = useRef();
  const cardRef = useRef();
  const [cardHeight, setCardHeight] = useState(0);

  useEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  }, []);

  const scroll = (direction) => {
    const distance = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <div className="w-full mt-16 flex justify-center">
      <div className="w-[80%] relative">
        {/* Title */}
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: darkMode ? '#1a1a1a' : '#F5F5F5' }}
        >
          Loved Books
        </h2>

        {/* Scrollable Books */}
        <div className="relative">
          {/* Scroll Buttons (Stacked Right with Padding) */}
          <div
            className="absolute z-10 flex flex-col rounded-md overflow-hidden shadow"
            style={{
              right: '-40px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: `${cardHeight}px`,
            }}
          >
            <button
              onClick={() => scroll('left')}
              className="flex items-center justify-center w-8 h-1/2 bg-gray-800 text-white hover:bg-gray-700 p-1"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => scroll('right')}
              className="flex items-center justify-center w-8 h-1/2 bg-gray-800 text-white hover:bg-gray-700 p-1"
            >
              <FaChevronRight />
            </button>
          </div>


          {/* Book Scroll Row */}
          <div
            ref={scrollRef}
            className="flex overflow-x-hidden overflow-y-hidden space-x-4 scroll-smooth scrollbar-hide px-2"
          >
            {lovedBooks.map((book, i) => (
              <div
                key={i}
                ref={i === 0 ? cardRef : null}
                className={`min-w-[160px] book-card snap-start rounded-lg shadow-md transition-transform hover:scale-105 ${
                  darkMode
                    ? 'bg-[#1a1a1a] text-white border border-gray-700'
                    : 'bg-white text-black border border-gray-200'
                }`}
              >
                <div className="relative">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded-full font-semibold">
                    #{i + 1}
                  </span>
                </div>
                <div className="p-2 text-center font-medium text-sm">{book.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
