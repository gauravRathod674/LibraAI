"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { X, Volume2, ClipboardCopy, Bot } from 'lucide-react';
import { toast } from 'sonner'; // ✅ CORRECTED: Import from sonner

// The component now accepts `isOpen` and `onClose` props to be controlled externally.
export default function AskMeModal({ isOpen, onClose, fileUrl }) {
    const { darkMode } = useTheme();
    const [askInput, setAskInput] = useState("");
    const [askMessages, setAskMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const askInputRef = useRef(null);
    const chatBodyRef = useRef(null);
    
    useEffect(() => {
        if (isOpen) {
            askInputRef.current?.focus();
            if (askMessages.length === 0) {
                setAskMessages([{
                    from: 'bot',
                    text: 'Hello! Ask me anything about this document.'
                }]);
            }
        }
    }, [isOpen]); // Effect now depends on the isOpen prop
    
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [askMessages, isLoading]);

    const handleAskSubmit = async (event) => {
        event.preventDefault();
        const question = askInput.trim();
        if (!question || isLoading) return;

        const newUserMessage = { from: "user", text: question };
        setAskMessages(prev => [...prev, newUserMessage]);
        setAskInput("");
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("pdf_url", fileUrl);
            formData.append("question", question);

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/pdf_assistant/`,
                formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    withCredentials: true,
                }
            );

            const newBotMessage = { from: "bot", text: res.data.answer };
            setAskMessages(prev => [...prev, newBotMessage]);

        } catch (err) {
            console.error("Failed to get answer from chatbot:", err);
            const errorMessage = {
                from: "bot",
                text: "Sorry, I encountered an error. Please try again.",
            };
            setAskMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSpeak = (text) => {
        // Your text-to-speech logic
        console.log("Speaking:", text);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        // ✅ CORRECTED: Added toast notification on successful copy
        toast.success("Copied to clipboard!");
    };

    // If the modal is not open, render nothing.
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div
                className={`w-full sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 h-[80vh] sm:h-[75vh] md:h-[70vh] rounded-2xl mx-2 sm:mx-auto flex flex-col shadow-lg ${
                    darkMode
                        ? "bg-white text-gray-900 border border-gray-200"
                        : "bg-[#1e293b] text-white border border-[#334155]"
                }`}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${
                        darkMode
                            ? "bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-white"
                            : "bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white"
                    }`}
                >
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                        <Bot />
                        Nexus Chatbot
                    </h2>
                    <button
                        className="p-1 rounded-full transition hover:bg-black/20"
                        onClick={onClose} // Use the onClose prop to close the modal
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Chat Body */}
                <div
                    ref={chatBodyRef}
                    className={`flex-1 overflow-y-auto p-4 space-y-5 ${
                        darkMode ? "bg-[#f8fafc]" : "bg-[#101828]"
                    }`}
                >
                    {askMessages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${
                                msg.from === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`relative max-w-xs md:max-w-md px-4 py-2 rounded-lg text-base break-words shadow-sm ${
                                    msg.from === "user"
                                        ? darkMode
                                            ? "bg-indigo-100 text-indigo-800"
                                            : "bg-[#4f46e5] text-white"
                                        : darkMode
                                            ? "bg-[#E7F0FD] text-gray-900"
                                            : "bg-[#2b3c6e] text-gray-300"
                                }`}
                            >
                                <ReactMarkdown
                                    components={{
                                        h2: ({ node, ...props }) => <h2 className="mt-2 mb-1 font-bold text-blue-500" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="ml-5 space-y-1 list-disc" {...props} />,
                                        li: ({ node, ...props }) => <li className="leading-snug" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold text-indigo-500" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                                {msg.from === "bot" && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleSpeak(msg.text)}>
                                            <Volume2 size={16} className={`${isSpeaking ? "animate-pulse text-red-500" : "text-gray-500"} hover:text-indigo-400`} />
                                        </button>
                                        <button onClick={() => handleCopy(msg.text)}>
                                            <ClipboardCopy size={16} className="text-gray-500 hover:text-indigo-400" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div
                                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg text-base italic animate-pulse ${
                                    darkMode
                                        ? "bg-[#E7F0FD] text-gray-600"
                                        : "bg-[#2b3c6e] text-gray-300"
                                }`}
                            >
                                🤖 Generating response...
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Section */}
                <div
                    className={`p-4 rounded-b-2xl ${
                        darkMode
                            ? "bg-[#f1f5f9] border-t border-gray-200"
                            : "bg-[#1e293b] border-t border-[#334155]"
                    }`}
                >
                    <form onSubmit={handleAskSubmit} className="flex items-center gap-3">
                        <input
                            ref={askInputRef}
                            type="text"
                            value={askInput}
                            onChange={(e) => setAskInput(e.target.value)}
                            placeholder="Type your question here..."
                            className={`flex-1 px-2 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base outline-none ${
                                darkMode
                                    ? "bg-white text-gray-900 placeholder-gray-400"
                                    : "bg-[#0f172a] text-white placeholder-gray-400"
                            }`}
                        />
                        <button
                            type="submit"
                            className={`px-2 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${
                                darkMode
                                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                                    : "bg-[#6366f1] text-white hover:bg-[#4f46e5]"
                            }`}
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
