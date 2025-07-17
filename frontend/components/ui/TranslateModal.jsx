import React, { useState, Fragment, useEffect  } from "react";
import { IoClose } from "react-icons/io5";
import { useTheme } from "@/app/context/ThemeContext"; // assuming you use ThemeContext like in SummaryDrawer
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

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

export default function TranslateModal({ isOpen, onClose, onTranslate }) {
  const [query, setQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [scope, setScope] = useState("page");
  const { darkMode } = useTheme();
  
  useEffect(() => {
  if (query.trim()) {
    const topMatch = filteredLanguages[0];
    if (topMatch && topMatch.code !== selectedLang) {
      setSelectedLang(topMatch.code);
    }
  }
}, [query]);


  if (!isOpen) return null;

  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`rounded-lg shadow-lg p-6 w-[90%] max-w-md relative transition-all duration-300 ${
          darkMode ? "bg-white text-gray-900" : "bg-[#1e293b] text-white"
        }`}
      >
        <button
          className={`absolute top-2 right-2 hover:text-red-500 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
          onClick={onClose}
        >
          <IoClose size={24} />
        </button>

        <h2 className="mb-4 text-lg font-bold text-center">🌐 Translate</h2>

        <input
          type="text"
          placeholder="Search language..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full px-3 py-2 mb-3 border rounded-md transition-colors ${
            darkMode
              ? "bg-white border-gray-300 text-black"
              : "bg-[#334155] border-gray-600 text-white placeholder-gray-400"
          }`}
        />

        <Listbox value={selectedLang} onChange={setSelectedLang}>
          <div className="relative mt-1">
            <Listbox.Button
              className={`flex justify-between items-center w-full py-2 px-3 border rounded-md transition-all duration-300 ${
                darkMode
                  ? "bg-white text-black border-gray-300"
                  : "bg-[#334155] text-white border-gray-600"
              }`}
            >
              <span>
                {languages.find((lang) => lang.code === selectedLang)?.name ||
                  "Select language"}
              </span>
              <ChevronDownIcon
                className={`h-5 w-5 ml-2 ${
                  darkMode ? "text-gray-500" : "text-white"
                } transition-transform`}
              />
            </Listbox.Button>

            <Listbox.Options
              className={`absolute mt-2 max-h-60 w-full overflow-auto rounded-md z-50 shadow-lg ring-1 ring-black/10 focus:outline-none transition-all duration-200 ${
                darkMode ? "bg-white text-black" : "bg-[#334155] text-white"
              }`}
            >
              {filteredLanguages.map((lang) => (
                <Listbox.Option
                  key={lang.code}
                  value={lang.code}
                  className={({ active }) =>
                    `cursor-pointer select-none py-2 px-4 transition-colors ${
                      active ? (darkMode ? "bg-blue-100" : "bg-blue-700") : ""
                    }`
                  }
                >
                  {lang.name}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>

        <div className="flex items-center gap-2 mt-4 mb-5">
          <input
            type="checkbox"
            id="translateScope"
            checked={scope === "chapter"}
            onChange={(e) => setScope(e.target.checked ? "chapter" : "page")}
            className="w-4 h-4 cursor-pointer accent-blue-600"
          />
          <label
            htmlFor="translateScope"
            className={`text-sm cursor-pointer ${
              darkMode ? "text-gray-800" : "text-gray-300"
            }`}
          >
            Translate entire chapter
          </label>
        </div>

        <button
          className={`w-full px-4 py-2 text-white rounded-md transition-colors ${
            darkMode
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          }`}
          onClick={() => onTranslate(selectedLang, scope)}
        >
          Translate
        </button>
      </div>
    </div>
  );
}
