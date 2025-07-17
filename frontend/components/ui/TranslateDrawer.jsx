"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, ClipboardCopy } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { toast } from "react-hot-toast";

const languages = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "co", name: "Corsican" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Estonian" },
  { code: "tl", name: "Filipino" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "fy", name: "Frisian" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "Hawaiian" },
  { code: "iw", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "ig", name: "Igbo" },
  { code: "id", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "jw", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "ko", name: "Korean" },
  { code: "ku", name: "Kurdish (Kurmanji)" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lb", name: "Luxembourgish" },
  { code: "mk", name: "Macedonian" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "ny", name: "Nyanja (Chichewa)" }, // Keep this one
  { code: "or", name: "Odia (Oriya)" },
  { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sm", name: "Samoan" },
  { code: "gd", name: "Scots Gaelic" },
  { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" },
  { code: "es", name: "Spanish" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "uz", name: "Uzbek" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
  // Newly added languages as of recent updates (this list is not exhaustive of all 249+):
  { code: "ace", name: "Acehnese" },
  { code: "ach", name: "Acholi" },
  { code: "bss", name: "Akoose" }, // Example, check specific code if needed
  { code: "arq", name: "Algerian Arabic" }, // Example, check specific code if needed
  { code: "ak", name: "Akan" }, // Twi (Akan)
  { code: "chr", name: "Cherokee" },
  // Removed the duplicate { code: "ny", name: "Chichewa" }, as it was causing the error.
  { code: "crs", name: "Seychellois Creole" },
  { code: "fon", name: "Fon" },
  { code: "ff", name: "Fulfulde" },
  { code: "gaa", name: "Ga" },
  { code: "lg", name: "Ganda" }, // Luganda
  // Removed the duplicate { code: "haw", name: "Hawaiian" }, as it was causing the error.
  { code: "cnh", name: "Hakha Chin" },
  { code: "ilo", name: "Iloko" },
  { code: "kde", name: "Makonde" }, // Example, check specific code if needed
  { code: "kg", name: "Kongo" },
  { code: "ktu", name: "Kituba" },
  { code: "lus", name: "Mizo" },
  { code: "nqo", name: "NKo" },
  { code: "om", name: "Oromo" },
  { code: "pap", name: "Papiamento" },
  { code: "qu", name: "Quechua" },
  { code: "run", name: "Rundi" },
  { code: "sg", name: "Sango" },
  { code: "sa", name: "Sanskrit" },
  { code: "nso", name: "Sepedi" },
  // Removed the duplicate { code: "st", name: "Sesotho" }, as it was causing the error.
  { code: "ss", name: "Swati" },
  { code: "ti", name: "Tigrinya" },
  { code: "ts", name: "Tsonga" },
  { code: "tn", name: "Tswana" },
  { code: "tk", name: "Turkmen" },
  { code: "ug", name: "Uyghur" },
  { code: "ve", name: "Venda" },
  { code: "wo", name: "Wolof" },
  { code: "yua", name: "Yucatec Maya" },
];
export default function TranslateDrawer({
  isOpen,
  toggleDrawer,
  onTranslate,
  loading,
  translation,
}) {
  const { darkMode } = useTheme();
  const [selectedLang, setSelectedLang] = useState("hi");
  const [scope, setScope] = useState("page");
  const [query, setQuery] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (filteredLanguages.length > 0) {
      setSelectedLang(filteredLanguages[0].code);
    }
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      const el = document.querySelector(".translate-scroll");
      el?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isOpen]);

  // Read‑aloud (supports Hindi text and Devanagari digits)
  // Read‑aloud (dynamic language support + Devanagari digits)
  const handleSpeak = (txt) => {
    console.log("🗣 handleSpeak input:", txt);

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // 🔐 Normalize input
    let speakSource = "";

    if (Array.isArray(txt)) {
      speakSource = txt
        .map((block) =>
          typeof block === "string"
            ? block
            : typeof block?.text === "string"
            ? block.text
            : ""
        )
        .join(" ");
    } else if (typeof txt === "object" && txt?.text) {
      speakSource = txt.text;
    } else if (typeof txt === "string") {
      speakSource = txt;
    }

    if (!speakSource.trim()) {
      toast.error("Nothing to speak.");
      return;
    }

    // 🔠 Convert digits to Devanagari for Hindi (hi)
    const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    let normalized = speakSource;

    if (selectedLang.startsWith("hi")) {
      normalized = speakSource.replace(/\d/g, (d) => devanagariDigits[d]);
    }

    const utterance = new SpeechSynthesisUtterance(normalized);
    utterance.rate = 1.1;

    // 🎯 Set language & voice dynamically
    const voices = speechSynthesis.getVoices();
    const matchingVoice =
      voices.find((v) => v.lang.startsWith(selectedLang)) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      utterance.lang = matchingVoice.lang;
    } else {
      utterance.lang = selectedLang; // fallback
    }

    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy to clipboard
  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied to clipboard!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDrawer}
          />

          {/* Drawer */}
          <motion.div
            className={`fixed top-0 right-0 z-50 h-full overflow-y-auto flex flex-col shadow-2xl
              ${darkMode ? "bg-white text-gray-900" : "bg-[#1e293b] text-white"}
              ${
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "w-full"
                  : "w-[90vw] max-w-[700px]"
              }
            `}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 py-4 rounded-t-lg
                ${
                  darkMode
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-gradient-to-r from-[#818cf8] to-[#a78bfa] text-white"
                }
              `}
            >
              <h2 className="text-lg font-bold">🌐 Translate</h2>
              <button onClick={toggleDrawer} className="p-1 hover:text-red-300">
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto translate-scroll">
              {!translation && !loading && (
                <>
                  {/* Intro */}
                  <div className="text-sm opacity-80">
                    ✨ Choose language & scope:
                  </div>

                  {/* Search input */}
                  <input
                    type="text"
                    placeholder="Search language..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md
                      ${
                        darkMode
                          ? "bg-white border-gray-300 text-black"
                          : "bg-[#334155] border-gray-600 text-white placeholder-gray-400"
                      }
                    `}
                    onKeyDown={(e) =>
                      e.key === "Enter" && onTranslate(selectedLang, scope)
                    }
                  />

                  {/* Listbox dropdown */}
                  <Listbox value={selectedLang} onChange={setSelectedLang}>
                    <div className="relative">
                      <Listbox.Button
                        className={`w-full py-2 px-3 border rounded-md flex justify-between items-center
                          ${
                            darkMode
                              ? "bg-white text-black border-gray-300"
                              : "bg-[#334155] text-white border-gray-600"
                          }
                        `}
                      >
                        {languages.find((l) => l.code === selectedLang)?.name}
                        <ChevronDownIcon className="w-5 h-5" />
                      </Listbox.Button>

                      <Listbox.Options
                        className={`absolute mt-1 w-full max-h-60 overflow-auto rounded-md shadow-lg ring-1 z-50 focus:outline-none
                          ${
                            darkMode
                              ? "bg-white text-black"
                              : "bg-[#334155] text-white"
                          }
                        `}
                      >
                        {filteredLanguages.length > 0 ? (
                          filteredLanguages.map((lang) => (
                            <Listbox.Option
                              key={lang.code}
                              value={lang.code}
                              className="px-3 py-2 cursor-pointer hover:bg-gray-200 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white"
                            >
                              {lang.name}
                            </Listbox.Option>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            No matching languages
                          </div>
                        )}
                      </Listbox.Options>
                    </div>
                  </Listbox>

                  {/* Scope */}
                  <label className="flex items-center gap-2 mt-1 text-sm">
                    <input
                      type="checkbox"
                      checked={scope === "chapter"}
                      onChange={(e) =>
                        setScope(e.target.checked ? "chapter" : "page")
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                    Translate entire chapter
                  </label>

                  {/* Translate button */}
                  <button
                    onClick={() => onTranslate(selectedLang, scope)}
                    className="w-full py-2 text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Translate
                  </button>
                </>
              )}

              {loading && (
                <div className="space-y-2 text-sm italic animate-pulse">
                  <p>
                    🔄 Translating to{" "}
                    {languages.find((l) => l.code === selectedLang)?.name}…
                  </p>
                  <p>This may take a few seconds depending on page length.</p>
                </div>
              )}

              {!loading && translation && (
                <div className="p-4 space-y-4 bg-transparent rounded-lg">
                  <div className="flex justify-end gap-2 mb-2">
                    <button
                      onClick={() => handleSpeak(translation)}
                      className="text-gray-400 hover:text-indigo-400"
                    >
                      <Volume2
                        size={18}
                        className={
                          isSpeaking ? "animate-pulse text-red-500" : ""
                        }
                      />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="text-gray-400 hover:text-indigo-400"
                    >
                      <ClipboardCopy size={18} />
                    </button>
                  </div>
                  {translation.split(/\n{2,}/g).map((block, idx) => {
                    const text = block.trim();
                    if (!text) return null;

                    // Match common heading indicators (English, Hindi, Gujarati, Marathi, etc.)
                    const headingRegex =
                      /^\[(HEADING|शीर्षक|શીર્ષક|শিরোনাম|ಶೀರ್ಷಿಕೆ|శీర్షిక|தலைப்பு|หัวข้อ)\]\s*/i;
                    const isHeading = headingRegex.test(text);

                    if (isHeading) {
                      const headingText = text.replace(headingRegex, "");
                      return (
                        <h2
                          key={idx}
                          className={`text-2xl font-bold text-center mb-4 font-serif ${
                            darkMode ? "text-indigo-600" : "text-indigo-400"
                          }`}
                        >
                          {headingText}
                        </h2>
                      );
                    }

                    return (
                      <p
                        key={idx}
                        className={`text-lg leading-relaxed mb-4 font-sans ${
                          darkMode ? "text-gray-700" : "text-gray-200"
                        }`}
                      >
                        {text}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
