import React, { useMemo } from "react";
import studentFeeIcon from "../assets/studentfeedb.png";
import manageFeeIcon from "../assets/managefeedb.png";
import manageStudentIcon from "../assets/managestudentdb.png";
import studentsIcon from "../assets/studentsdb.png";
import analyticsIcon from "../assets/analyticsdb.png";
import { calculateAnalytics } from "../utils/analytics";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function HomeDashboard({ setActiveTab, students }) {
  const dashboardMetrics = useMemo(() => calculateAnalytics(students), [students]);
  const collectionRate = dashboardMetrics.collectionRate;

  const modules = [
    {
      key: "students",
      title: "Student Directory",
      meta: `${dashboardMetrics.totalStudents} total records`,
      icon: studentsIcon,
      className: "students-card",
    },
    {
      key: "studentFee",
      title: "Collection Desk",
      meta: `${currencyFormatter.format(dashboardMetrics.totalOutstanding)} outstanding`,
      icon: studentFeeIcon,
      className: "student-fee-card",
    },
    {
      key: "manageStudent",
      title: "Manage Students",
      meta: `${dashboardMetrics.totalStudents} active roster`,
      icon: manageStudentIcon,
      className: "manage-student-card",
    },
    {
      key: "manageFee",
      title: "Manage Fees",
      meta: `${collectionRate}% collection coverage`,
      icon: manageFeeIcon,
      className: "manage-fee-card",
    },
    {
      key: "analytics",
      title: "Analytics & Reports",
      meta: `${dashboardMetrics.overdueCount} needs follow-up`,
      icon: analyticsIcon,
      className: "analytics-card",
    },
  ];

  const periodPeaks = Math.max(...dashboardMetrics.periodSeries.map((item) => item.collected || 0), 1);

  return (
    <section className="home-dashboard">
      <div className="home-hero">
        <div className="home-hero-copy">
          <span className="section-kicker">Fee Operations</span>
          <h2>Clean records, faster collections, and a clearer next step for every admin.</h2>
        </div>

        <div className="home-metric-grid">
          <article className="home-metric-card home-metric-card-primary">
            <span className="home-metric-label">Total Students</span>
            <strong>{dashboardMetrics.totalStudents}</strong>
          </article>
          <article className="home-metric-card">
            <span className="home-metric-label">Collected</span>
            <strong>{currencyFormatter.format(dashboardMetrics.totalCollected)}</strong>
          </article>
          <article className="home-metric-card">
            <span className="home-metric-label">Outstanding</span>
            <strong>{currencyFormatter.format(dashboardMetrics.totalOutstanding)}</strong>
          </article>
          <article className="home-metric-card">
            <span className="home-metric-label">Collection Progress</span>
            <strong>{collectionRate}%</strong>
          </article>
        </div>
      </div>

      <div className="home-analytics-strip">
        <article className="home-analytics-panel">
          <div className="home-analytics-panel-header">
            <div>
              <span className="section-kicker">Analytics Snapshot</span>
              <h3>Collection and reporting at a glance</h3>
            </div>
            <button type="button" className="home-analytics-link" onClick={() => setActiveTab("analytics")}>
              Open Analytics
            </button>
          </div>
          <div className="home-analytics-bars">
            {dashboardMetrics.periodSeries.map((period) => (
              <div key={period.key} className="home-analytics-bar-item">
                <div className="home-analytics-bar-track">
                  <div
                    className="home-analytics-bar-fill"
                    style={{ height: `${Math.max((period.collected / periodPeaks) * 100, period.collected > 0 ? 10 : 0)}%` }}
                  />
                </div>
                <strong>{period.label}</strong>
                <span>{currencyFormatter.format(period.collected)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="home-section-heading">
        <div>
          <span className="section-kicker">Modules</span>
          <h3>Choose the workflow you want to optimize next</h3>
        </div>
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
          </button>
        ))}
      </div>
    </section>
  );
}

export default HomeDashboard;
