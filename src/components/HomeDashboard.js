import React from "react";
import backIcon from "../assets/backicon.png";
import studentsIcon from "../assets/studentsdb.png";
import studentFeeIcon from "../assets/studentfeedb.png";
import manageFeeIcon from "../assets/managefeedb.png";
import manageStudentIcon from "../assets/managestudentdb.png";
import analyticsIcon from "../assets/analyticsdb.png";
import adminSettingsIcon from "../assets/adminsettings.png";

function HomeDashboard({ setActiveTab, onBackToSchoolYears }) {
  const shortcutCards = [
    { key: "students", title: "Students", icon: studentsIcon, className: "students-card" },
    { key: "studentFee", title: "Student Fee", icon: studentFeeIcon, className: "student-fee-card" },
    { key: "manageFee", title: "Manage Fees", icon: manageFeeIcon, className: "manage-fee-card" },
    { key: "studentFee", title: "Payments / Receipts", icon: studentFeeIcon, className: "student-fee-card" },
    { key: "studentFee", title: "Reminders", icon: studentFeeIcon, className: "student-fee-card" },
    { key: "analytics", title: "Analytics", icon: analyticsIcon, className: "analytics-card" },
    { key: "adminSettings", title: "Admin Settings", icon: adminSettingsIcon, className: "analytics-card" },
    { key: "manageStudent", title: "Manage Students", icon: manageStudentIcon, className: "manage-student-card" },
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
        {shortcutCards.map((card) => (
          <button
            key={`${card.title}-${card.key}`}
            type="button"
            className={`home-card dashboard-shortcut-card ${card.className}`}
            onClick={() => setActiveTab(card.key)}
          >
            <div className="home-card-top">
              <img src={card.icon} alt={card.title} className="home-card-icon" />
            </div>
            <span className="home-card-label">{card.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default HomeDashboard;
