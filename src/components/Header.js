import React from "react";
import aclcLogo from "../assets/aclclogo.png";
import backIcon from "../assets/backicon.png";
import lightIcon from "../assets/light.png";
import darkIcon from "../assets/dark.png";

function Header({ darkMode, toggleTheme, viewTitle, userName, studentCount, schoolYearLabel, showBackButton, onBack }) {
  return (
    <header className="header">
      <div className="header-content">
        {showBackButton ? (
          <button
            type="button"
            className="header-back-btn"
            onClick={onBack}
            aria-label="Back to school year selection"
            title="Back to school year selection"
          >
            <img src={backIcon} alt="Back" className="header-back-icon" />
          </button>
        ) : null}
        <div className="header-brand-mark">
          <img src={aclcLogo} alt="ACLC Logo" className="header-logo" />
        </div>
        <div className="header-copy">
          <div className="header-kicker-row">
            <span className="header-kicker-secondary">Cashier Dashboard</span>
          </div>
          <h1>ACLC COLLEGE OF MANILA</h1>
        </div>
      </div>
      <div className="header-actions">
        <div className="header-stat">
          <span className="header-stat-label">School Year</span>
          <strong>{schoolYearLabel || "Not selected"}</strong>
        </div>
        <div className="header-user-pill">
          <span className="header-user-label">Active Admin</span>
          <strong>{userName || "Administrator"}</strong>
        </div>
        <button
          className={`theme-toggle${darkMode ? " is-dark" : ""}`}
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-knob">
              <img
                src={darkMode ? lightIcon : darkIcon}
                alt={darkMode ? "Light Mode" : "Dark Mode"}
                className="theme-icon"
              />
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}

export default Header;
