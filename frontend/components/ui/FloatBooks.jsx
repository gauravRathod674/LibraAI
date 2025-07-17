'use client';
import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const featuredBooks = [
  {
    src: '/book1.jpeg',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
  },
  {
    src: '/book2.jpeg',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
  },
  {
    src: '/book3.jpeg',
    title: '1984',
    author: 'George Orwell',
  },
  {
    src: '/book4.jpeg',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
  },
  {
    src: '/book5.jpeg',
    title: 'Moby Dick',
    author: 'Herman Melville',
  },
];

const floatVariants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default function FeaturedBooks({ darkMode }) {
  const controls = useAnimation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    controls.start({
      x: ['0%', '-50%'],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      },
    });
  }, [controls]);

  const handleHoverStart = (index) => {
    controls.stop();
    setHoveredIndex(index);
  };

  const handleHoverEnd = () => {
    controls.start({
      x: ['0%', '-50%'],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      },
    });
    setHoveredIndex(null);
  };

  return (
    <div className="relative z-10 w-full mt-24 px-6 flex justify-center overflow-hidden">
    <div className="w-[80%]">
        <h2
          className="text-3xl font-bold mb-10 text-center"
          style={{
            color: darkMode ? '#1a1a1a' : '#F5F5F5',
          }}
        >
          Featured Books
        </h2>

        <div className="relative">
          {/* Fade edges */}
          <div
            className="absolute left-0 top-0 w-28 h-full z-10 pointer-events-none"
            style={{
              background: darkMode
                ? 'linear-gradient(to right, #0d0d0d 60%, transparent)'
                : 'linear-gradient(to right, #f8f8f8 60%, transparent)',
            }}
          />
          <div
            className="absolute right-0 top-0 w-28 h-full z-10 pointer-events-none"
            style={{
              background: darkMode
                ? 'linear-gradient(to left, #0d0d0d 60%, transparent)'
                : 'linear-gradient(to left, #f8f8f8 60%, transparent)',
            }}
          />

          <div className="overflow-hidden w-full">
            <motion.div
              className="flex gap-10 w-max"
              animate={controls}
            >
              {[...featuredBooks, ...featuredBooks].map((book, i) => (
                <motion.div
                  key={i}
                  className={`relative min-w-[160px] max-w-[160px] shrink-0 p-4 rounded-xl shadow-xl backdrop-blur-md bg-opacity-60 border transition-all duration-300 ${
                    darkMode
                      ? 'bg-[#1a1a1a]/80 border-gray-700'
                      : 'bg-white/70 border-gray-300'
                  }`}
                  variants={floatVariants}
                  animate="animate"
                  onMouseEnter={() => handleHoverStart(i)}
                  onMouseLeave={handleHoverEnd}
                >
                  <img
                    src={book.src}
                    alt={`Featured Book ${i + 1}`}
                    className="w-full h-48 object-cover rounded-md"
                  />
                  
                  {/* Overlay for details */}
                  {hoveredIndex === i && (
                    <motion.div
                      className="absolute inset-0 bg-black bg-opacity-60 text-white flex flex-col justify-center items-center text-center px-3 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-sm font-semibold mb-1">{book.title}</h3>
                      <p className="text-xs">{book.author}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
