'use client';
import React, { useRef, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function TrendingBooks({ darkMode, books, isLoading }) {
  const scrollRef = useRef();
  const cardRef = useRef();
  const [cardHeight, setCardHeight] = useState(0);

  useEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  }, [books]);

  const scroll = (direction) => {
    const distance = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <div className="w-full mt-16 flex justify-center">
        <div className="w-[80%]">
          <h2 className="text-2xl font-bold mb-4" style={{ color: darkMode ? '#1a1a1a' : '#F5F5F5' }}>
            Trending Books
          </h2>
          <p style={{ color: darkMode ? '#1a1a1a' : '#F5F5F5' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-16 flex justify-center">
      <div className="w-[80%] relative">
        <h2 className="text-2xl font-bold mb-4" style={{ color: darkMode ? '#1a1a1a' : '#F5F5F5' }}>
          Trending Books
        </h2>
        <div className="relative">
          {/* MODIFIED: Added gap-2 to the button container */}
          <div
            className="absolute z-10 flex flex-col gap-2 shadow"
            style={{
              right: '-40px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: `${cardHeight}px`,
            }}
          >
            {/* MODIFIED: Replaced h-1/2 with flex-1 and added rounding */}
            <button
              onClick={() => scroll('left')}
              className="flex flex-1 items-center justify-center w-8 bg-gray-800 text-white hover:bg-gray-700 p-1 rounded-md"
            >
              <FaChevronLeft />
            </button>
            {/* MODIFIED: Replaced h-1/2 with flex-1 and added rounding */}
            <button
              onClick={() => scroll('right')}
              className="flex flex-1 items-center justify-center w-8 bg-gray-800 text-white hover:bg-gray-700 p-1 rounded-md"
            >
              <FaChevronRight />
            </button>
          </div>
          <div ref={scrollRef} className="flex overflow-x-hidden overflow-y-hidden space-x-4 scroll-smooth scrollbar-hide px-2">
            {books.map((book, i) => (
              <div key={i} ref={i === 0 ? cardRef : null} className={`min-w-[160px] book-card snap-start rounded-lg shadow-md transition-transform hover:scale-105 ${darkMode ? 'bg-[#1a1a1a] text-white border border-gray-700' : 'bg-white text-black border border-gray-200'}`}>
                <div className="relative">
                  <img src={book.imgSrc} alt={book.title} className="w-full h-48 object-cover rounded-t-lg" />
                  <span className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 text-xs rounded-full font-semibold">
                    #{i + 1}
                  </span>
                </div>
                <div
                  className="p-2 text-center font-medium text-sm"
                  style={{
                    lineHeight: '1.4em',
                    height: '3.8em',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {book.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}