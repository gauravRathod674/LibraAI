"use client";
import React from "react";

const FilterSection = ({ title, options, onSelect, activeFilters, darkMode }) => {
  const category = title.toLowerCase();

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2 border-b pb-1 border-gray-400">
        {title}
      </h3>
      <ul className="space-y-1 text-sm">
  {options.map((option, idx) => {
    const isActive = activeFilters?.[category]?.includes(option.label);

    return (
      <li
        key={idx}
        className={`cursor-pointer hover:underline ${
          isActive
            ? "bg-gradient-to-br from-[#BB8BFF] to-[#75F6FF] bg-clip-text text-transparent font-semibold"
            : darkMode
            ?"text-gray-600": "text-gray-400"
            
        }`}
        onClick={() => onSelect(category, option.label)}
      >
        {option.label}{" "}
        <span className="text-gray-400">({option.count})</span>
      </li>
    );
  })}
</ul>

    </div>
  );
};

const FilterSidebar = ({
  darkMode,
  activeFilters,
  setActiveFilters,
  rating,
  setRating,
  year,
  setYear,
}) => {
  const baseStyle = darkMode
    ? "bg-[#E7F0FD] text-black"
    : "bg-gray-800 text-white";

  const handleSelect = (category, value) => {
    setActiveFilters((prev) => {
      const current = prev[category] || [];
      const alreadySelected = current.includes(value);

      const updatedCategory = alreadySelected
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [category]: updatedCategory,
      };
    });
  };

  const clearAll = () => {
    setActiveFilters({});
    setRating(0);
    setYear(null);
  };

  return (
    <div
      className={`w-full md:w-64 p-4 rounded-xl shadow-md h-fit ${baseStyle}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Zoom In</h2>
        <button
          onClick={clearAll}
          className="text-xs text-white-400 hover:underline"
        >
          Clear All
        </button>
      </div>

      <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
        Focus your results using these filters
      </p>

      {/* 🎯 Rating Filter */}
      <div className="mb-6">
        <label className="font-semibold text-sm">Minimum Rating</label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={rating}
          onChange={(e) => setRating(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-sm mt-1">{rating} ⭐</div>
      </div>

      {/* 🎯 Year Filter */}
      <div className="mb-6">
        <label className="font-semibold text-sm">Published After (Year)</label>
        <input
          type="number"
          placeholder="e.g. 2000"
          value={year || ""}
          onChange={(e) => setYear(parseInt(e.target.value) || null)}
          className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700"
        />
      </div>

      {/* ✅ Dynamic Filters */}
      <FilterSection
        title="Language"
        options={[
          { label: "English", count: 1599 },
          { label: "French", count: 69 },
          { label: "German", count: 59 },
          { label: "Spanish", count: 50 },
          { label: "Dutch", count: 40 },
        ]}
        onSelect={handleSelect}
        activeFilters={activeFilters}
        darkMode={darkMode}
      />

      <FilterSection
        title="Author"
        options={[
          { label: "Charles Dickens", count: 969 },
          { label: "Wilkie Collins", count: 118 },
          { label: "Edgar Allan Poe", count: 58 },
          { label: "Arthur Conan Doyle", count: 48 },
        ]}
        onSelect={handleSelect}
        activeFilters={activeFilters}
        darkMode={darkMode}
      />

      <FilterSection
        title="Subjects"
        options={[
          { label: "Fiction", count: 271 },
          { label: "History", count: 155 },
          { label: "Biography", count: 136 },
        ]}
        onSelect={handleSelect}
        activeFilters={activeFilters}
        darkMode={darkMode}
      />
    </div>
  );
};

export default FilterSidebar;
