import React from "react";
import studentFeeIcon from "../assets/studentfeedb.png";
import manageStudentIcon from "../assets/managestudentdb.png";

function HomeDashboard({ setActiveTab }) {
  return (
    <section className="home-dashboard">
      <div className="home-header">
        <h2>Dashboard</h2>
        <p>Select a module to continue.</p>
      </div>

      <div className="home-card-grid">
        <button className="home-card student-fee-card" onClick={() => setActiveTab("studentFee")}>
          <img src={studentFeeIcon} alt="Student Fee" className="home-card-icon" />
          <span className="home-card-label">Student Fee</span>
        </button>

        <button className="home-card manage-student-card" onClick={() => setActiveTab("manageStudent")}>
          <img src={manageStudentIcon} alt="Manage Student" className="home-card-icon" />
          <span className="home-card-label">Manage Student</span>
        </button>
      </div>
    </section>
  );
}

export default HomeDashboard;
