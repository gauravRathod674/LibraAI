"use client";
import { motion } from "framer-motion";
import React, { useEffect } from "react";
import Navbar from "@/components/ui/Navbar";
import { useTheme } from "../context/ThemeContext";
import Footer from "@/components/ui/Footer";
import { paper } from "../data";


const ResearchDetailPage = () => {
    const { darkMode } = useTheme();
    const [showFullAbstract, setShowFullAbstract] = React.useState(false);
    

    useEffect(() => {
        const canvas = document.getElementById("backgroundCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const particles = [];
        const numParticles = 50;
        let animationFrameId;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.radius = Math.random() * 3 + 1;
                this.dx = (Math.random() - 0.5) * 2;
                this.dy = (Math.random() - 0.5) * 2;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = darkMode
                    ? "rgba(100, 149, 237, 0.6)"
                    : "rgba(117, 246, 255, 0.6)";
                ctx.fill();
            }

            update() {
                this.x += this.dx;
                this.y += this.dy;
                if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.dy *= -1;
                this.draw();
            }
        }

        for (let i = 0; i < numParticles; i++) particles.push(new Particle());

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => p.update());
        }

        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [darkMode]);

    const cardStyles = "p-6 rounded-xl transition-transform duration-300 hover:shadow-lg";


    return (
        <div
            className={`relative flex flex-col min-h-screen transition-all duration-500 ${darkMode ? "bg-white text-black" : "bg-gray-900 text-white"}`}
        >
            <canvas
                id="backgroundCanvas"
                className="absolute top-0 left-0 w-full h-full"
            ></canvas>

            <Navbar darkMode={darkMode} />

            {/* Main Content */}
            <main className="relative z-10 w-[70%] mx-auto flex-grow pt-28 pb-16">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                    {paper.title}
                </h1>
                <p className="text-md text-gray-500 dark:text-gray-400">
                    {paper.authors.join(", ")} · {paper.venue}, {paper.year}
                </p>

                <div className="mt-4 flex space-x-2">
                    <button
                            className={`px-4 py-2 text-sm font-medium rounded border transition duration-500 cursor-pointer ${
                                darkMode
                                  ? 'text-black border-black hover:bg-gray-100'
                                  : 'text-white border-white hover:bg-gray-800'
                              }`}
                              
                    >
                        Download PDF
                    </button>
                </div>

                {/* TLDR + Abstract Section */}
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold mb-2">TLDR</h2>

                    {/* TLDR text & Expand button inline */}
                    <div className="text-base mb-4 flex flex-wrap items-center gap-2 leading-relaxed">
                        <span className={darkMode ? "text-black" : "text-gray-100"}>
                            Oracle-MNIST is a dataset designed to reflect real-world conditions in machine learning systems, addressing noise, occlusion, and domain shift to evaluate robustness and generalization. consequat placerat a nec ligula. Vestibulum accumsan purus nec lectus facilisis dignissim. Aliquam et nisl et risus sollicitudin laoreet. Nunc vitae diam ac. Aliquam et nisl et risus sollicitudin.
                        </span>

                        {!showFullAbstract && (
                            <button
                                onClick={() => setShowFullAbstract(true)}
                                // className={text-sm font-medium underline focus:outline-none ${darkMode ? "text-blue-600" : "text-blue-300"}}
                                className={`text-sm font-medium underline focus:outline-none ${darkMode ? "text-blue-600" : "text-blue-300"}`}
                            >
                                Expand
                            </button>
                        )}
                    </div>

                    {/* Abstract shown only when expanded */}
                    {showFullAbstract && (
                        <>
                            <div className="mt-4">
                                <h2 className="text-2xl font-semibold mb-2">Abstract</h2>
                                <p className={`text-base leading-[1.9] ${darkMode ? "text-black" : "text-gray-100"}`}>

                                    {paper.abstract}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowFullAbstract(false)}
                                className={`mt-3 text-sm font-medium underline focus:outline-none ${darkMode ? "text-blue-600" : "text-blue-300"}`}
                            >
                                Collapse
                            </button>
                        </>
                    )}
                </div>

                {/* Topics */}
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold mb-4">Topics</h2>
                    <div className="flex flex-wrap gap-2">
                        {paper.topics.map((topic, index) => (
                            <span
                                key={index}
                                className="px-3 py-2 bg-purple-200 text-purple-900 rounded-full text-sm font-medium"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>

                {/* References */}
                <div className="mt-12">
                    <h2 className="text-2xl font-semibold mb-6">References</h2>
                    <div className="flex flex-col gap-6">
                        {paper.references.map((ref, index) => (
                            <motion.div
                                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                                key={index}
                                className={`${cardStyles} ${darkMode ? "" : "border"}`}
                                style={{
                                    backgroundColor: darkMode
                                        ? "#e5efff"
                                        : "oklch(27.8% .033 256.848)",
                                    ...(darkMode && {
                                        borderColor: "var(--color-gray-700)"
                                    }),
                                }}
                            >                                <div className="flex w-full">
                                    <div className="w-[85%] pr-4">
                                        <p className="text-lg font-semibold mb-1">{ref.title}</p>
                                        <p className="text-sm mb-2">
                                            {ref.authors.join(", ")} · {ref.year}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed mb-3">
                                            {ref.description}
                                        </p>
                                    </div>
                                    <div className="w-[12%] flex flex-col items-end justify-center gap-3 min-w-[100px]">
                                        <button className="px-4 py-2 rounded-full text-sm font-medium shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full">
                                            View Paper
                                        </button>
                                        <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-900 hover:bg-gray-300 w-full">
                                            Download PDF
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Related Papers */}
                <div className="mt-12">
                    <h2 className="text-2xl font-semibold mb-6">Related Papers</h2>
                    <div className="flex flex-col gap-6">
                        {paper.relatedPapers.map((rel, index) => (
                            <motion.div
                                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                                key={index}
                                className={`${cardStyles} ${darkMode ? "" : "border"}`}
                                style={{
                                    backgroundColor: darkMode
                                        ? "#e5efff"
                                        : "oklch(27.8% .033 256.848)",
                                    ...(darkMode && {
                                        borderColor: "var(--color-gray-700)"
                                    }),
                                }}
                            >
                                <div className="flex w-full">
                                    <div className="w-[85%] pr-4">
                                        <p className="text-lg font-semibold mb-1">{rel.title}</p>
                                        <p className="text-sm mb-2">{rel.authors.join(", ")}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed mb-3">
                                            {rel.description}
                                        </p>
                                    </div>
                                    <div className="w-[12%] flex flex-col items-end justify-center gap-3 min-w-[100px]">
                                        <button className="px-4 py-2 rounded-full text-sm font-medium shadow-md hover:scale-105 transition bg-gradient-to-r from-purple-400 to-cyan-300 text-black w-full">
                                            View Paper
                                        </button>
                                        <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-900 hover:bg-gray-300 w-full">
                                            Download PDF
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main >

            <Footer darkMode={darkMode} />
        </div >
    );
};

export default ResearchDetailPage;  