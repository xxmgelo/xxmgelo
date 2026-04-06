import React, { useMemo } from "react";
import studentFeeIcon from "../assets/studentfeedb.png";
import manageFeeIcon from "../assets/managefeedb.png";
import manageStudentIcon from "../assets/managestudentdb.png";
import studentsIcon from "../assets/studentsdb.png";
import analyticsIcon from "../assets/analyticsdb.png";
import { calculateAnalytics } from "../utils/analytics";
import { ComparisonBarChart, DistributionDoughnutChart, TrendLineChart } from "./ChartComponents";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function HomeDashboard({ setActiveTab, students }) {
  const dashboardMetrics = useMemo(() => calculateAnalytics(students), [students]);
  const collectionRate = dashboardMetrics.collectionRate;
  const darkMode = document.documentElement.classList.contains("dark-mode");

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

  const trendLabels = dashboardMetrics.periodSeries.map((item) => item.label);
  const trendValues = dashboardMetrics.periodSeries.map((item) => item.collected);
  const programLabels = dashboardMetrics.programSeries.map((item) => item.label);
  const programValues = dashboardMetrics.programSeries.map((item) => item.value);
  const statusLabels = dashboardMetrics.statusSeries.map((item) => item.label);
  const statusValues = dashboardMetrics.statusSeries.map((item) => item.value);
  const priorityRows = dashboardMetrics.topBalances.slice(0, 5);

  return (
    <section className="home-dashboard">
      <div className="home-metric-grid">
        <article className="home-metric-card home-metric-card-primary">
          <span className="home-metric-label">Students</span>
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
          <span className="home-metric-label">Rate</span>
          <strong>{collectionRate}%</strong>
        </article>
      </div>

      <div className="home-analytics-grid">
        <article className="home-analytics-panel home-analytics-panel-wide">
          <div className="home-analytics-panel-header">
            <div>
              <span className="section-kicker">Trend</span>
              <h3>Collection Flow</h3>
            </div>
            <button type="button" className="home-analytics-link" onClick={() => setActiveTab("analytics")}>
              View analytics
            </button>
          </div>
          <div className="chart-wrap chart-wrap-line">
            <TrendLineChart labels={trendLabels} values={trendValues} darkMode={darkMode} />
          </div>
        </article>

        <article className="home-analytics-panel">
          <div className="home-analytics-panel-header">
            <div>
              <span className="section-kicker">Programs</span>
              <h3>Enrollment Mix</h3>
            </div>
          </div>
          <div className="chart-wrap chart-wrap-bar">
            <ComparisonBarChart labels={programLabels} values={programValues} darkMode={darkMode} />
          </div>
        </article>

        <article className="home-analytics-panel">
          <div className="home-analytics-panel-header">
            <div>
              <span className="section-kicker">Status</span>
              <h3>Payment Split</h3>
            </div>
          </div>
          <div className="chart-wrap chart-wrap-donut">
            <DistributionDoughnutChart labels={statusLabels} values={statusValues} darkMode={darkMode} />
          </div>
        </article>
      </div>

      <div className="home-bottom-grid">
        <article className="home-priority-card">
          <div className="home-analytics-panel-header">
            <div>
              <span className="section-kicker">Priority</span>
              <h3>Outstanding Accounts</h3>
            </div>
          </div>
          <div className="home-priority-table">
            <div className="home-priority-row home-priority-row-head">
              <span>Student</span>
              <span>Program</span>
              <span>Balance</span>
            </div>
            {priorityRows.length > 0 ? (
              priorityRows.map((student) => (
                <div key={student.StudentID} className="home-priority-row">
                  <span title={student.Name}>{student.Name}</span>
                  <span title={student.Program || "N/A"}>{student.Program || "N/A"}</span>
                  <strong>{currencyFormatter.format(student.TotalBalance)}</strong>
                </div>
              ))
            ) : (
              <div className="analytics-empty-state">No outstanding balances.</div>
            )}
          </div>
        </article>

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
      </div>
    </section>
  );
}

export default HomeDashboard;
