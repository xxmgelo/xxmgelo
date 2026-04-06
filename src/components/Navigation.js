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
    <nav className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span />
            <span />
            <span />
          </button>
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
        <div className="nav-groups">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              <span className="nav-group-label">{group.label}</span>
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
        <div className="nav-footer">
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
