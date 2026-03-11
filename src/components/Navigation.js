import React from "react";
import homeIcon from "../assets/home.png";
import studentFeeIcon from "../assets/studentfee.png";
import manageFeeIcon from "../assets/managefee.png";
import manageStudentIcon from "../assets/managestudent.png";
import studentsIcon from "../assets/students.png";

function Navigation({ activeTab, setActiveTab }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h3>Hello, Jean!</h3>
        </div>
        <ul className="nav-menu">
          <li>
            <button 
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <img src={homeIcon} alt="Home" className="nav-icon" />
              <span className="nav-label">Home</span>
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
              className={`nav-item ${activeTab === 'manageFee' ? 'active' : ''}`}
              onClick={() => setActiveTab('manageFee')}
            >
              <img src={manageFeeIcon} alt="Manage Fee" className="nav-icon" />
              <span className="nav-label">Manage Fee</span>
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
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <img src={studentsIcon} alt="Students" className="nav-icon" />
              <span className="nav-label">Students</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
