import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserGear } from "@fortawesome/free-solid-svg-icons";

const UserRoleDropdown = ({ darkMode, selectedRole, setSelectedRole }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleRoleSelect = (role) => {
    setSelectedRole(role); // 🚀 This now updates parent state
    setIsOpen(false);
  };

  const baseItemClasses = `p-2 cursor-pointer rounded-md transition-all`;

  const gradientHoverStyle = {
    background:
      "linear-gradient(205deg, rgb(187,139,255) 8.49%, rgb(117,246,255) 91.51%)",
    color: "#000",
  };

  return (
    <div className="relative z-20">
      <FontAwesomeIcon
        icon={faUserGear}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <div
        onClick={toggleDropdown}
        className={`pl-10 pr-3 py-2 rounded-md w-full cursor-pointer ${
          darkMode ? "bg-[#f7f7f7] text-gray-400" : "bg-white/5 text-gray-400"
        }`}
      >
        {selectedRole || "Select User Role"}
        <span className="ml-2">&#9662;</span>
      </div>

      {isOpen && (
        <div
          className={`absolute mt-1 w-full rounded-md shadow-lg z-30 ${
            darkMode ? "bg-[#f7f7f7]" : "bg-gray-900"
          }`}
          style={{ maxHeight: "220px", overflowY: "auto", padding: "4px 0" }}
        >
          {["Student", "Researcher", "Faculty", "Guest", "Librarian"].map((role) => (
            <div
              key={role}
              className={baseItemClasses}
              onMouseEnter={(e) => Object.assign(e.target.style, gradientHoverStyle)}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = darkMode ? "#9ca3af" : "#9ca3af";
              }}
              onClick={() => handleRoleSelect(role.toLowerCase())}
              style={{
                color: darkMode ? "#9ca3af" : "#9ca3af",
              }}
            >
              {role}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserRoleDropdown;
