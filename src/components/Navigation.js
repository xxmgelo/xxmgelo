import React from "react";
import dashboardIcon from "../assets/dashboard.png";
import studentFeeIcon from "../assets/studentfee.png";
import manageFeeIcon from "../assets/managefee.png";
import manageStudentIcon from "../assets/managestudent.png";
import studentsIcon from "../assets/students.png";
import adminSettingsIcon from "../assets/adminsettings.png";
import defaultAvatar from "../assets/admin.png";
import logoutIcon from "../assets/logout.png";
import aclcLogo from "../assets/aclclogo.png";

function Navigation({ activeTab, setActiveTab, onLogout, userName, userAvatar }) {
  const navItems = [
    {
      key: "home",
      label: "Dashboard",
      description: "Overview and priorities",
      icon: dashboardIcon,
      alt: "Dashboard",
    },
    {
      key: "students",
      label: "Students",
      description: "Roster and directory",
      icon: studentsIcon,
      alt: "Students",
    },
    {
      key: "studentFee",
      label: "Student Fee",
      description: "Collections and payments",
      icon: studentFeeIcon,
      alt: "BSIS Student Fee",
    },
    {
      key: "manageStudent",
      label: "Manage Student",
      description: "Record maintenance",
      icon: manageStudentIcon,
      alt: "Manage Student",
    },
    {
      key: "manageFee",
      label: "Manage Fee",
      description: "Tuition breakdowns",
      icon: manageFeeIcon,
      alt: "Manage Fee",
    },
    {
      key: "adminSettings",
      label: "Admin Settings",
      description: "Profile and preferences",
      icon: adminSettingsIcon,
      alt: "Admin Settings",
    },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <img src={aclcLogo} alt="ACLC" className="sidebar-brand-logo" />
          </div>
          <div className="sidebar-brand-copy">
            <span className="sidebar-brand-label">ACLC Manila</span>
            <strong className="sidebar-brand-title">Fee Management</strong>
          </div>
        </div>
        <div className="sidebar-header">
          <div className="sidebar-user">
            <img
              src={userAvatar || defaultAvatar}
              alt={userName || "Admin"}
              className="sidebar-user-avatar"
            />
            <div className="sidebar-user-text">
              <span className="sidebar-user-name">{userName || "Admin"}</span>
              <span className="sidebar-user-role">Administrator</span>
            </div>
          </div>
        </div>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.key}>
              <button
                className={`nav-item ${activeTab === item.key ? "active" : ""}`}
                onClick={() => setActiveTab(item.key)}
                type="button"
              >
                <img src={item.icon} alt={item.alt} className="nav-icon" />
                <span className="nav-copy">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="nav-footer">
          <p className="nav-footer-text">Securely sign out when you're done managing records.</p>
          <button
            type="button"
            className="nav-item nav-logout"
            onClick={onLogout}
          >
            <img src={logoutIcon} alt="Logout" className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
