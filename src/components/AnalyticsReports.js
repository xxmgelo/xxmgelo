import React, { useMemo } from "react";
import { calculateAnalytics } from "../utils/analytics";
import { ComparisonBarChart, DistributionDoughnutChart, TrendLineChart } from "./ChartComponents";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function AnalyticsReports({ students }) {
  const analytics = useMemo(() => calculateAnalytics(students), [students]);
  const darkMode = document.documentElement.classList.contains("dark-mode");
  const visibleTopBalances = analytics.topBalances.slice(0, 2);
  const totalStatuses = analytics.statusSeries.reduce((total, item) => total + item.value, 0) || 1;

  const insightCards = [
    {
      label: "Total Fees",
      value: currencyFormatter.format(analytics.totalFees),
      primary: true,
    },
    {
      label: "Collected",
      value: currencyFormatter.format(analytics.totalCollected),
    },
    {
      label: "Outstanding",
      value: currencyFormatter.format(analytics.totalOutstanding),
    },
    {
      label: "Collection Rate",
      value: `${analytics.collectionRate}%`,
    },
  ];

  return (
    <section className="analytics-dashboard">
      <div className="analytics-insight-grid">
        {insightCards.map((card) => (
          <article
            key={card.label}
            className={`analytics-insight-card ${card.primary ? "analytics-insight-card-primary" : ""}`}
          >
            <div className="analytics-insight-top">
              <span>{card.label}</span>
            </div>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="analytics-chart-grid">
        <article className="analytics-chart-card analytics-chart-card-period">
          <div className="analytics-chart-header">
            <div>
              <span className="section-kicker">Fees Per Period</span>
              <h3>Collections Trend</h3>
            </div>
          </div>
          <div className="chart-wrap chart-wrap-line">
            <TrendLineChart
              labels={analytics.periodSeries.map((item) => item.label)}
              values={analytics.periodSeries.map((item) => item.collected)}
              darkMode={darkMode}
            />
          </div>
        </article>

        <article className="analytics-chart-card">
          <div className="analytics-chart-header">
            <div>
              <span className="section-kicker">Payment Status</span>
              <h3>Paid, Partial, Unpaid</h3>
            </div>
          </div>
          <div className="analytics-donut-wrap">
            <div className="analytics-donut">
              <div className="chart-wrap chart-wrap-donut">
                <DistributionDoughnutChart
                  labels={analytics.statusSeries.map((segment) => segment.label)}
                  values={analytics.statusSeries.map((segment) => segment.value)}
                  darkMode={darkMode}
                />
              </div>
              <div className="analytics-donut-inner">
                <strong>{analytics.totalStudents}</strong>
                <span>students</span>
              </div>
            </div>
            <div className="analytics-legend">
              {analytics.statusSeries.map((segment) => (
                <div key={segment.key} className="analytics-legend-item">
                  <span className={`analytics-legend-dot analytics-legend-dot-${segment.key}`} />
                  <span>{segment.label}</span>
                  <strong>{segment.value}</strong>
                  <em>{Math.round((segment.value / totalStatuses) * 100)}%</em>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="analytics-chart-card">
          <div className="analytics-chart-header">
            <div>
              <span className="section-kicker">Enrollment</span>
              <h3>Program Comparison</h3>
            </div>
          </div>
          <div className="chart-wrap chart-wrap-bar">
            <ComparisonBarChart
              labels={analytics.programSeries.map((item) => item.label)}
              values={analytics.programSeries.map((item) => item.value)}
              darkMode={darkMode}
            />
          </div>
        </article>

        <article className="analytics-chart-card analytics-chart-card-reports">
          <div className="analytics-chart-header">
            <div>
              <span className="section-kicker">Reports</span>
              <h3>Top balances and action queue</h3>
            </div>
          </div>
          <div className="analytics-report-list">
            {visibleTopBalances.length > 0 ? (
              visibleTopBalances.map((student) => (
                <div key={student.StudentID} className="analytics-report-row">
                  <div>
                    <strong>{student.Name}</strong>
                    <span>{student.StudentID} - {student.Program || "N/A"}</span>
                  </div>
                  <div className="analytics-report-status">
                    <span>{student.PaymentMode === "full" ? "Full Payment" : "Installment"}</span>
                    <strong>{currencyFormatter.format(student.TotalBalance)}</strong>
                  </div>
                </div>
              ))
            ) : (
              <div className="analytics-empty-state">All visible accounts are currently settled.</div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default AnalyticsReports;
