import React from "react";
import backIcon from "../assets/backicon.png";
import studentsIcon from "../assets/studentdb1.png";
import studentFeeIcon from "../assets/studentfeedb1.png";
import manageFeeIcon from "../assets/managefeedb1.png";
import manageStudentIcon from "../assets/managestudentdb1.png";
import analyticsIcon from "../assets/analyticsdb1.png";
import adminSettingsIcon from "../assets/adminsettingsdb.png";

function HomeDashboard({ setActiveTab, onBackToSchoolYears }) {
  const shortcutCards = [
    {
      key: "students",
      title: "Students",
      icon: studentsIcon,
      className: "students-card",
      meta: "Directory",
      description: "Browse enrolled students and jump into the active school year roster.",
    },
    {
      key: "studentFee",
      title: "Student Fee",
      icon: studentFeeIcon,
      className: "student-fee-card",
      meta: "Collections",
      description: "Track balances, receive payments, and keep collection work moving.",
    },
    {
      key: "manageFee",
      title: "Manage Fees",
      icon: manageFeeIcon,
      className: "manage-fee-card",
      meta: "Structure",
      description: "Set tuition amounts and adjust fee breakdowns for each student record.",
    },
    {
      key: "analytics",
      title: "Analytics",
      icon: analyticsIcon,
      className: "analytics-card",
      meta: "Reports",
      description: "Review trends, monitor payment status, and summarize outcomes quickly.",
    },
    {
      key: "adminSettings",
      title: "Admin Settings",
      icon: adminSettingsIcon,
      className: "admin-settings-card",
      meta: "Preferences",
      description: "Control dashboard behavior, theme choices, and account configuration.",
    },
    {
      key: "manageStudent",
      title: "Manage Students",
      icon: manageStudentIcon,
      className: "manage-student-card",
      meta: "Records",
      description: "Add, update, and maintain student information from one workspace.",
    },
  ];

  return (
    <section className="home-dashboard dashboard-module-layout">
      <div className="dashboard-back-row">
        <button
          type="button"
          className="dashboard-back-btn"
          onClick={onBackToSchoolYears}
        >
          <img src={backIcon} alt="Back" className="dashboard-back-icon" />
          <span>Back to School Years</span>
        </button>
      </div>
      <div className="home-card-grid dashboard-shortcut-grid">
        {shortcutCards.map((card, index) => (
          <button
            key={`${card.title}-${card.key}`}
            type="button"
            className={`home-card dashboard-shortcut-card ${card.className}`}
            onClick={() => setActiveTab(card.key)}
          >
            <img
              src={card.icon}
              alt=""
              aria-hidden="true"
              className="home-card-peek-icon"
            />
            <div className="home-card-top">
              <img src={card.icon} alt={card.title} className="home-card-icon" />
              <span className="home-card-meta">{card.meta}</span>
            </div>
            <div className="home-card-body">
              <span className="home-card-label">{card.title}</span>
              <p className="home-card-description">{card.description}</p>
            </div>
            <div className="home-card-footer">
              <span className="home-card-link">Open module</span>
              <span className="home-card-index">{String(index + 1).padStart(2, "0")}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default HomeDashboard;
