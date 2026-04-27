import React from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const buildSharedOptions = (darkMode) => {
  const tickColor = darkMode ? "#9FB0C9" : "#6B7A90";
  const gridColor = darkMode ? "rgba(238, 244, 255, 0.08)" : "rgba(22, 34, 56, 0.06)";

  return {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    animation: {
      duration: 600,
    },
    layout: {
      padding: {
        top: 4,
        right: 6,
        bottom: 2,
        left: 2,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? "rgba(20, 31, 51, 0.96)" : "rgba(255, 255, 255, 0.96)",
        titleColor: darkMode ? "#EEF4FF" : "#162238",
        bodyColor: darkMode ? "#C8D4E6" : "#42516A",
        borderColor: darkMode ? "rgba(238, 244, 255, 0.08)" : "rgba(22, 34, 56, 0.08)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: tickColor,
          font: {
            size: 11,
            weight: 600,
          },
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        beginAtZero: true,
        ticks: {
          color: tickColor,
          font: {
            size: 10,
          },
          precision: 0,
          maxTicksLimit: 5,
        },
        border: {
          display: false,
        },
      },
    },
  };
};

const buildSafeSeries = (labels = [], values = []) => {
  const normalizedLabels = Array.isArray(labels) ? labels : [];
  const normalizedValues = Array.isArray(values) ? values : [];

  const safePairs = normalizedValues.map((rawValue, index) => ({
    label: normalizedLabels[index] || `Item ${index + 1}`,
    value: Number.isFinite(Number(rawValue)) ? Number(rawValue) : 0,
  }));

  if (safePairs.length === 0) {
    return {
      labels: ["No Data"],
      values: [0],
    };
  }

  return {
    labels: safePairs.map((item) => item.label),
    values: safePairs.map((item) => item.value),
  };
};

export function TrendLineChart({ labels, values, darkMode }) {
  const safeSeries = buildSafeSeries(labels, values);
  const sharedOptions = buildSharedOptions(darkMode);
  const data = {
    labels: safeSeries.labels,
    datasets: [
      {
        label: "Collected",
        data: safeSeries.values,
        borderColor: darkMode ? "#63D1D4" : "#0C7C86",
        backgroundColor: darkMode ? "rgba(99, 209, 212, 0.16)" : "rgba(12, 124, 134, 0.12)",
        fill: true,
      },
    ],
  };

  return (
    <Line
      data={data}
      options={{
        ...sharedOptions,
        elements: {
          line: {
            tension: 0.38,
            borderWidth: 3,
          },
          point: {
            radius: 0,
            hoverRadius: 4,
          },
        },
      }}
    />
  );
}

export function ComparisonBarChart({ labels, values, darkMode }) {
  const safeSeries = buildSafeSeries(labels, values);
  const sharedOptions = buildSharedOptions(darkMode);
  const data = {
    labels: safeSeries.labels,
    datasets: [
      {
        label: "Students",
        data: safeSeries.values,
        backgroundColor: darkMode ? "#88A7FF" : "#4F7CFF",
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        ...sharedOptions,
        scales: {
          ...sharedOptions.scales,
          x: {
            ...sharedOptions.scales.x,
            ticks: {
              ...sharedOptions.scales.x.ticks,
              font: {
                size: 10,
                weight: 600,
              },
            },
          },
        },
      }}
    />
  );
}

export function DistributionDoughnutChart({ labels, values, darkMode }) {
  const safeSeries = buildSafeSeries(labels, values);
  const data = {
    labels: safeSeries.labels,
    datasets: [
      {
        data: safeSeries.values,
        backgroundColor: darkMode
          ? ["#63D1D4", "#F2B85D", "#FF7F8D"]
          : ["#0C7C86", "#CF8A2E", "#D4525E"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <Doughnut
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        cutout: "72%",
        layout: {
          padding: 4,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: darkMode ? "rgba(20, 31, 51, 0.96)" : "rgba(255, 255, 255, 0.96)",
            titleColor: darkMode ? "#EEF4FF" : "#162238",
            bodyColor: darkMode ? "#C8D4E6" : "#42516A",
            borderColor: darkMode ? "rgba(238, 244, 255, 0.08)" : "rgba(22, 34, 56, 0.08)",
            borderWidth: 1,
            padding: 12,
            displayColors: true,
          },
        },
      }}
    />
  );
}
