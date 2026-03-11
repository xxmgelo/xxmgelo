import React, { useMemo } from "react";
import studentFeeIcon from "../assets/studentfeedb.png";
import manageFeeIcon from "../assets/managefeedb.png";
import manageStudentIcon from "../assets/managestudentdb.png";
import studentsIcon from "../assets/studentsdb.png";

function HomeDashboard({ setActiveTab, students }) {
  const { totalBse, totalBsis } = useMemo(() => {
    const totals = { totalBse: 0, totalBsis: 0 };
    if (!Array.isArray(students)) {
      return totals;
    }
    students.forEach((student) => {
      const program = (student.Program || "").toLowerCase();
      if (program.includes("bse")) {
        totals.totalBse += 1;
      }
      if (program.includes("bsis")) {
        totals.totalBsis += 1;
      }
    });
    return totals;
  }, [students]);

  return (
    <section className="home-dashboard">
      <div className="home-header">
        <h2>Dashboard</h2>
        <p>Select a module to continue.</p>
      </div>

      <div className="home-card-grid">
        <button className="home-card students-card" onClick={() => setActiveTab("students")}>
          <img src={studentsIcon} alt="Students" className="home-card-icon" />
          <span className="home-card-label">Students</span>
          <div className="home-card-counts">
            <span>Total Students in BSE: {totalBse}</span>
            <span>Total Students in BSIS: {totalBsis}</span>
          </div>
        </button>

        <button className="home-card student-fee-card" onClick={() => setActiveTab("studentFee")}>
          <img src={studentFeeIcon} alt="Student Fee" className="home-card-icon" />
          <span className="home-card-label">Student Fee</span>
        </button>

        <button className="home-card manage-student-card" onClick={() => setActiveTab("manageStudent")}>
          <img src={manageStudentIcon} alt="Manage Student" className="home-card-icon" />
          <span className="home-card-label">Manage Student</span>
        </button>

        <button className="home-card manage-fee-card" onClick={() => setActiveTab("manageFee")}>
          <img src={manageFeeIcon} alt="Manage Fee" className="home-card-icon" />
          <span className="home-card-label">Manage Fee</span>
        </button>

      </div>
    </section>
  );
}

export default HomeDashboard;
