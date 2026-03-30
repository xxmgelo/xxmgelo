import React, { useMemo } from "react";
import studentFeeIcon from "../assets/studentfeedb.png";
import manageFeeIcon from "../assets/managefeedb.png";
import manageStudentIcon from "../assets/managestudentdb.png";
import studentsIcon from "../assets/studentsdb.png";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function HomeDashboard({ setActiveTab, students }) {
  const dashboardMetrics = useMemo(() => {
    const totals = {
      totalStudents: 0,
      totalBse: 0,
      totalBsis: 0,
      totalCollected: 0,
      totalOutstanding: 0,
    };

    const parseAmount = (value) => {
      if (value === null || value === undefined || value === "") return 0;
      const cleaned = String(value).replace(/[^0-9.-]/g, "");
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    if (!Array.isArray(students)) {
      return totals;
    }

    students.forEach((student) => {
      totals.totalStudents += 1;

      const program = (student.Program || "").toLowerCase();
      if (program.includes("bse")) {
        totals.totalBse += 1;
      }
      if (program.includes("bsis")) {
        totals.totalBsis += 1;
      }

      const downpayment = parseAmount(student.Downpayment);
      const prelim = parseAmount(student.Prelim);
      const midterm = parseAmount(student.Midterm);
      const preFinal = parseAmount(student.PreFinal);
      const finals = parseAmount(student.Finals);
      const collected = downpayment + prelim + midterm + preFinal + finals;
      const totalFee = student.TotalFee !== undefined && student.TotalFee !== null && student.TotalFee !== ""
        ? parseAmount(student.TotalFee)
        : collected;
      const outstanding = student.TotalBalance !== undefined && student.TotalBalance !== null && student.TotalBalance !== ""
        ? parseAmount(student.TotalBalance)
        : Math.max(totalFee - collected, 0);

      totals.totalCollected += collected;
      totals.totalOutstanding += outstanding;
    });

    return totals;
  }, [students]);

  const collectionRate = dashboardMetrics.totalCollected + dashboardMetrics.totalOutstanding > 0
    ? Math.round((dashboardMetrics.totalCollected / (dashboardMetrics.totalCollected + dashboardMetrics.totalOutstanding)) * 100)
    : 0;

  const modules = [
    {
      key: "students",
      title: "Student Directory",
      description: "Verify student details and quickly scan the full roster by program.",
      meta: `${dashboardMetrics.totalStudents} total records`,
      icon: studentsIcon,
      className: "students-card",
    },
    {
      key: "studentFee",
      title: "Collection Desk",
      description: "Review balances, open payment actions, and keep collections moving.",
      meta: `${currencyFormatter.format(dashboardMetrics.totalOutstanding)} outstanding`,
      icon: studentFeeIcon,
      className: "student-fee-card",
    },
    {
      key: "manageStudent",
      title: "Manage Students",
      description: "Add new enrollees, edit profiles, and clean incorrect student records.",
      meta: `${dashboardMetrics.totalBse + dashboardMetrics.totalBsis} active roster`,
      icon: manageStudentIcon,
      className: "manage-student-card",
    },
    {
      key: "manageFee",
      title: "Manage Fees",
      description: "Adjust tuition fields and keep payment breakdowns accurate before collection.",
      meta: `${collectionRate}% collection coverage`,
      icon: manageFeeIcon,
      className: "manage-fee-card",
    },
  ];

  return (
    <section className="home-dashboard">
      <div className="home-hero">
        <div className="home-hero-copy">
          <span className="section-kicker">Fee Operations</span>
          <h2>Clean records, faster collections, and a clearer next step for every admin.</h2>
          <p>
            Use the dashboard as a control center for student data, payment tracking, and fee updates so daily work feels
            focused instead of scattered.
          </p>
          <div className="home-hero-tags">
            <span className="home-hero-tag">Centralized student records</span>
            <span className="home-hero-tag">Clear balance visibility</span>
            <span className="home-hero-tag">Fewer clicks to action</span>
          </div>
        </div>

        <div className="home-metric-grid">
          <article className="home-metric-card home-metric-card-primary">
            <span className="home-metric-label">Total Students</span>
            <strong>{dashboardMetrics.totalStudents}</strong>
            <p>{dashboardMetrics.totalBsis} BSIS and {dashboardMetrics.totalBse} BSE currently tracked.</p>
          </article>
          <article className="home-metric-card">
            <span className="home-metric-label">Collected</span>
            <strong>{currencyFormatter.format(dashboardMetrics.totalCollected)}</strong>
            <p>Visible payments already recorded across student accounts.</p>
          </article>
          <article className="home-metric-card">
            <span className="home-metric-label">Outstanding</span>
            <strong>{currencyFormatter.format(dashboardMetrics.totalOutstanding)}</strong>
            <p>Remaining balance that still needs collection follow-up.</p>
          </article>
          <article className="home-metric-card">
            <span className="home-metric-label">Collection Progress</span>
            <strong>{collectionRate}%</strong>
            <p>Estimated coverage based on recorded payments versus remaining balances.</p>
          </article>
        </div>
      </div>

      <div className="home-section-heading">
        <div>
          <span className="section-kicker">Modules</span>
          <h3>Choose the workflow you want to optimize next</h3>
        </div>
        <p>Each module is organized around a focused admin task so users can move from review to action quickly.</p>
      </div>

      <div className="home-card-grid">
        {modules.map((module) => (
          <button
            key={module.key}
            type="button"
            className={`home-card ${module.className}`}
            onClick={() => setActiveTab(module.key)}
          >
            <div className="home-card-top">
              <img src={module.icon} alt={module.title} className="home-card-icon" />
              <span className="home-card-meta">{module.meta}</span>
            </div>
            <span className="home-card-label">{module.title}</span>
            <p className="home-card-description">{module.description}</p>
            <span className="home-card-cta">Open module</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default HomeDashboard;
