import React from "react";
import dashboardIcon from "../assets/dashboard.png";
import studentFeeIcon from "../assets/studentfee.png";
import manageFeeIcon from "../assets/managefee.png";
import manageStudentIcon from "../assets/managestudent.png";
import studentsIcon from "../assets/students.png";
import analyticsIcon from "../assets/analytics.png";
import adminSettingsIcon from "../assets/adminsettings.png";
import defaultAvatar from "../assets/admin.png";
import logoutIcon from "../assets/logout.png";

function Navigation({ activeTab, setActiveTab, onRequestLogout, userName, userAvatar, collapsed, onToggleCollapse }) {
  const navGroups = [
    {
      label: "Workspace",
      items: [
        {
          key: "home",
          label: "Dashboard",
          icon: dashboardIcon,
          alt: "Dashboard",
        },
        {
          key: "students",
          label: "Students",
          icon: studentsIcon,
          alt: "Students",
        },
        {
          key: "studentFee",
          label: "Student Fee",
          icon: studentFeeIcon,
          alt: "BSIS Student Fee",
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          key: "manageStudent",
          label: "Manage Students",
          icon: manageStudentIcon,
          alt: "Manage Student",
        },
        {
          key: "manageFee",
          label: "Manage Fees",
          icon: manageFeeIcon,
          alt: "Manage Fee",
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          key: "analytics",
          label: "Analytics",
          icon: analyticsIcon,
          alt: "Analytics & Reports",
        },
      ],
    },
    {
      label: "Preferences",
      items: [
        {
          key: "adminSettings",
          label: "Settings",
          icon: adminSettingsIcon,
          alt: "Admin Settings",
        },
      ],
    },
  ];

  return (
    <nav className={`menu-bar${collapsed ? " collapsed" : ""}`}>
      <div className="menu-bar-content">
        <div className="menu-bar-header">
          <button
            type="button"
            className="menu-bar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand menu bar" : "Collapse menu bar"}
            title={collapsed ? "Expand menu bar" : "Collapse menu bar"}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="menu-bar-user">
            <img
              src={userAvatar || defaultAvatar}
              alt={userName || "Admin"}
              className="menu-bar-user-avatar"
            />
            <div className="menu-bar-user-text">
              <span className="menu-bar-user-name">{userName || "Admin"}</span>
              <span className="menu-bar-user-role">Administrator</span>
            </div>
          </div>
        </div>
        <div className="menu-bar-groups">
          {navGroups.map((group) => (
            <div key={group.label} className="menu-group">
              <ul className="nav-menu">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`nav-item ${activeTab === item.key ? "active" : ""}`}
                      onClick={() => setActiveTab(item.key)}
                      type="button"
                      title={item.label}
                    >
                      <img src={item.icon} alt={item.alt} className="nav-icon" />
                      <span className="nav-copy">
                        <span className="nav-label">{item.label}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="menu-bar-footer">
          <button
            type="button"
            className="nav-item nav-logout"
            onClick={onRequestLogout}
            title="Logout"
          >
            <img src={logoutIcon} alt="Logout" className="nav-icon" />
            <span className="nav-copy">
              <span className="nav-label">Logout</span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
