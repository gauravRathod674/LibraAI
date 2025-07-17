import { useState } from 'react';

export default function FitToggleIcon({ className = 'w-6 h-6 text-white' }) {
  const [isFitToWidth, setIsFitToWidth] = useState(true);

  const toggleIcon = () => setIsFitToWidth(!isFitToWidth);

  return (
    <button onClick={toggleIcon} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
      {isFitToWidth ? (
        // Fit to Width Icon
        <svg
          id="fit-to-width-icon"
          width="21"
          height="20"
          viewBox="0 0 21 20"
          fill="currentColor"
          className={className}
        >
          <path d="M7.38 7.92a.5.5 0 01-.04.7l-1 .88H9a.5.5 0 010 1H6.34l1 .87a.5.5 0 11-.66.76l-2-1.75a.5.5 0 010-.76l2-1.75a.5.5 0 01.7.05z"></path>
          <path d="M14.68 10.5l-1 .87a.5.5 0 00.66.76l2-1.75a.5.5 0 000-.76l-2-1.75a.5.5 0 00-.66.76l1 .87H12a.5.5 0 000 1h2.67z"></path>
          <path d="M2.5 6c0-1.1.9-2 2-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-12a2 2 0 01-2-2V6zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1h-12z"></path>
        </svg>
      ) : (
        // Fit to Page Icon
        <svg
          id="fit-to-page-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={className}
        >
          <path d="M5.5 6C4.67 6 4 6.67 4 7.5v1a.5.5 0 001 0v-1c0-.28.22-.5.5-.5h1a.5.5 0 000-1h-1z"></path>
          <path d="M13.5 6a.5.5 0 000 1h1c.28 0 .5.22.5.5v1a.5.5 0 001 0v-1c0-.83-.67-1.5-1.5-1.5h-1z"></path>
          <path d="M5 11.5a.5.5 0 00-1 0v1c0 .83.67 1.5 1.5 1.5h1a.5.5 0 000-1h-1a.5.5 0 01-.5-.5v-1z"></path>
          <path d="M16 11.5a.5.5 0 00-1 0v1a.5.5 0 01-.5.5h-1a.5.5 0 000 1h1c.83 0 1.5-.67 1.5-1.5v-1z"></path>
          <path d="M2 6c0-1.1.9-2 2-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm1 0v8a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1z"></path>
        </svg>
      )}
    </button>
  );
}
