import React from "react";
import dashboardIcon from "../assets/dashboard.png";
import studentFeeIcon from "../assets/studentfee.png";
import manageFeeIcon from "../assets/managefee.png";
import manageStudentIcon from "../assets/managestudent.png";
import studentsIcon from "../assets/students.png";
import defaultAvatar from "../assets/admin.png";
import logoutIcon from "../assets/logout.png";

function Navigation({ activeTab, setActiveTab, onLogout, userName, userAvatar }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-content">
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
          <li>
            <button 
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <img src={dashboardIcon} alt="Dashboard" className="nav-icon" />
              <span className="nav-label">Dashboard</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <img src={studentsIcon} alt="Students" className="nav-icon" />
              <span className="nav-label">Students</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'studentFee' ? 'active' : ''}`}
              onClick={() => setActiveTab('studentFee')}
            >
              <img src={studentFeeIcon} alt="BSIS Student Fee" className="nav-icon" />
              <span className="nav-label">Student Fee</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'manageStudent' ? 'active' : ''}`}
              onClick={() => setActiveTab('manageStudent')}
            >
              <img src={manageStudentIcon} alt="Manage Student" className="nav-icon" />
              <span className="nav-label">Manage Student</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'manageFee' ? 'active' : ''}`}
              onClick={() => setActiveTab('manageFee')}
            >
              <img src={manageFeeIcon} alt="Manage Fee" className="nav-icon" />
              <span className="nav-label">Manage Fee</span>
            </button>
          </li>
        </ul>
        <div className="nav-footer">
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
