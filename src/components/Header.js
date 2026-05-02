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
            <span className="header-kicker">ACLC College of Manila</span>
            <span className="header-kicker-dot" aria-hidden="true" />
            <span className="header-kicker-secondary">Cashier Dashboard</span>
          </div>
          <h1>Student Fee Management</h1>
        </div>
      </div>
      <div className="header-actions">
        <div className="header-stat">
          <span className="header-stat-label">School Year</span>
          <strong>{schoolYearLabel || "Not selected"}</strong>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">Students</span>
          <strong>{studentCount}</strong>
        </div>
        <div className="header-user-pill">
          <span className="header-user-label">Active Admin</span>
          <strong>{userName || "Administrator"}</strong>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label="Toggle theme">
          <span className="theme-toggle-text">{darkMode ? "Light mode" : "Dark mode"}</span>
          <span className="theme-toggle-icon-wrap">
            {darkMode ? (
              <img src={lightIcon} alt="Light Mode" className="theme-icon" />
            ) : (
              <img src={darkIcon} alt="Dark Mode" className="theme-icon" />
            )}
          </span>
        </button>
      </div>
    </header>
  );
}

export default Header;
