import React, { useMemo } from "react";
import analyticsIcon from "../assets/analyticsdb.png";
import { calculateAnalytics } from "../utils/analytics";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function AnalyticsReports({ students }) {
  const analytics = useMemo(() => calculateAnalytics(students), [students]);
  const visibleTopBalances = analytics.topBalances.slice(0, 2);
  const maxPeriodValue = Math.max(
    ...analytics.periodSeries.map((item) => item.scheduled || 0),
    1
  );
  const totalStatuses = analytics.statusSeries.reduce((total, item) => total + item.value, 0) || 1;
  const statusBreakdown = analytics.statusSeries.reduce((segments, item, index) => {
    const previousTotal = analytics.statusSeries
      .slice(0, index)
      .reduce((sum, current) => sum + current.value, 0);
    const start = Math.round((previousTotal / totalStatuses) * 360);
    const end = Math.round(((previousTotal + item.value) / totalStatuses) * 360);
    segments.push({
      ...item,
      start,
      end,
      percent: Math.round((item.value / totalStatuses) * 100),
    });
    return segments;
  }, []);
  const donutBackground = statusBreakdown.length
    ? `conic-gradient(${statusBreakdown
        .map((segment) => `var(--chart-${segment.key}) ${segment.start}deg ${segment.end}deg`)
        .join(", ")})`
    : "conic-gradient(var(--surface-tint) 0deg 360deg)";

  const insightCards = [
    {
      label: "Total Fees",
      value: currencyFormatter.format(analytics.totalFees),
      icon: analyticsIcon,
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
              {card.icon ? <img src={card.icon} alt={card.label} className="analytics-insight-icon" /> : null}
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
              <h3>Total fees collected per period</h3>
            </div>
          </div>
          <div className="period-bar-grid">
            {analytics.periodSeries.map((item) => (
              <div key={item.key} className="period-bar-card">
                <div className="period-bar-chart">
                  <div
                    className="period-bar period-bar-scheduled"
                    style={{ height: `${Math.max((item.scheduled / maxPeriodValue) * 100, 8)}%` }}
                  />
                  <div
                    className="period-bar period-bar-collected"
                    style={{ height: `${Math.max((item.collected / maxPeriodValue) * 100, item.collected > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <strong>{item.label}</strong>
                <span>{currencyFormatter.format(item.collected)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-chart-card">
          <div className="analytics-chart-header">
            <div>
              <span className="section-kicker">Payment Status</span>
              <h3>Paid, unpaid, and partial</h3>
            </div>
          </div>
          <div className="analytics-donut-wrap">
            <div className="analytics-donut" style={{ background: donutBackground }}>
              <div className="analytics-donut-inner">
                <strong>{analytics.totalStudents}</strong>
                <span>students</span>
              </div>
            </div>
            <div className="analytics-legend">
              {statusBreakdown.map((segment) => (
                <div key={segment.key} className="analytics-legend-item">
                  <span className={`analytics-legend-dot analytics-legend-dot-${segment.key}`} />
                  <span>{segment.label}</span>
                  <strong>{segment.value}</strong>
                  <em>{segment.percent}%</em>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="analytics-chart-card">
          <div className="analytics-chart-header">
            <div>
              <span className="section-kicker">Enrollment</span>
              <h3>Student enrollment statistics</h3>
            </div>
          </div>
          <div className="analytics-progress-list">
            {analytics.programSeries.map((item) => {
              const width = analytics.totalStudents > 0 ? (item.value / analytics.totalStudents) * 100 : 0;
              return (
                <div key={item.key} className="analytics-progress-item">
                  <div className="analytics-progress-meta">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="analytics-progress-track">
                    <div className="analytics-progress-fill" style={{ width: `${Math.max(width, item.value > 0 ? 8 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
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
