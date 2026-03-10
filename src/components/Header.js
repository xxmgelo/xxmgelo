import React from "react";
import aclcLogo from "../assets/aclcanimated.gif";
import lightIcon from "../assets/light.png";
import darkIcon from "../assets/dark.png";

function Header({ darkMode, toggleTheme }) {
  return (
    <header className="header">
      <div className="header-content">
        <img src={aclcLogo} alt="ACLC Logo" className="header-logo" />
        <h1>ACLC FEE MANAGEMENT SYSTEM</h1>
      </div>
      <button className="theme-toggle" onClick={toggleTheme}>
        {darkMode ? (
          <img src={lightIcon} alt="Light Mode" className="theme-icon" />
        ) : (
          <img src={darkIcon} alt="Dark Mode" className="theme-icon" />
        )}
      </button>
    </header>
  );
}

export default Header;
