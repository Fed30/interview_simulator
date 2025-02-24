import React, { useEffect, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { useAnalyticsPanelData } from "../context/AnalyticsPanelContext";
import Image from "next/image";

Chart.register(...registerables);

export default function AnalyticsPanel({ user }) {
  const [sessionGrade, setSessionGrade] = useState([]);
  const [sessionDates, setSessionDates] = useState([]);
  const [sessionDatesCount, setSessionDatesCount] = useState([]);
  const [categoryGrade, setCategoryGrade] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCompletedSession, setTotalCompletedSession] = useState(0);
  const [totalInCompleteSession, setTotalInCompleteSession] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { data, refetch } = useAnalyticsPanelData();

  useEffect(() => {
    if (data) {
      console.log("Fetched Analytics Data:", data);
      setSessionGrade(
        Array.isArray(data.sessionGrade) ? [...data.sessionGrade] : []
      );
      setSessionDates(data.sessionDates ?? []);
      setCategoryGrade(Object.values(data.categoryGrade ?? {}));
      setSessionDatesCount(Object.values(data.sessionDateCounts ?? {}));
      setCategories(data.categories ?? []);
      setTotalCompletedSession(data.totalCompletedSession ?? 0);
      setTotalInCompleteSession(data.totalInCompleteSession ?? 0);
      setIsLoading(false);
    } else {
      // Refetch only when data is missing or needs to be refreshed
      refetch();
    }
  }, [data, refetch]);

  // Conditional Check for No Data
  const isEmptyData = (data) => data.length === 0 || data === 0;

  const user_growth_data = {
    labels: sessionDates,
    datasets: [
      {
        label: "Grades",
        data: sessionGrade,
        borderColor: "rgb(242, 94, 134)",
        backgroundColor: "rgb(109, 129, 242)",
        tension: 0.4,
      },
    ],
  };

  const average_soft_skill_data = {
    labels: categories,
    datasets: [
      {
        label: "Category Grade",
        data: categoryGrade,
        borderColor: "rgb(242, 94, 134)",
        backgroundColor: categoryGrade.map((_, index) =>
          index % 2 === 0 ? "rgb(109, 129, 242)" : "rgb(242, 94, 134)"
        ),
        tension: 0.4,
      },
    ],
  };

  const performance_data = {
    labels: sessionDates,
    datasets: [
      {
        label: "Completed Sessions",
        data: sessionDatesCount,
        borderColor: "rgb(242, 94, 134)",
        backgroundColor: "rgb(109, 129, 242)",
        tension: 0.4,
      },
    ],
  };

  const activity_data = {
    labels: ["Completed", "Incomplete"],
    datasets: [
      {
        label: "Sessions",
        data: [totalCompletedSession, totalInCompleteSession],
        backgroundColor: ["rgb(109, 129, 242)", "rgb(242, 94, 134)"],
        borderWidth: 0,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: "white",
          maxRotation: 45,
          minRotation: 45,
          callback: function (value, index, values) {
            let label = this.getLabelForValue(value);
            return label?.length > 10 ? label.substring(0, 10) + "..." : label;
          },
        },
        grid: {
          display: false, // Hides the grid for the x-axis
          color: "rgb(255, 255, 255)",
        },
        border: {
          color: "rgb(255, 255, 255)", // Axis line color
        },
      },
      y: {
        ticks: {
          color: "white",
          font: { size: 8 },
          callback: function (value) {
            return value.toFixed(2);
          },
        },
        grid: {
          display: false, // Hides the grid for the x-axis
          color: "rgb(255, 255, 255)",
        },
        border: {
          color: "rgb(255, 255, 255)", // Axis line color
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "white",
          font: { size: 10 },
          boxWidth: 20,
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
      datalabels: { display: false },
    },
  };

  const options_activity = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        ticks: {
          display: false,
          font: { size: 8 },
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "white",
          font: { size: 10 },
          boxWidth: 20,
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
      datalabels: { display: false },
    },
  };

  const LoadingSpinner = () => <div className="analytics-spinner"></div>;

  const NoDataImage = ({ text }) => (
    <div className="no-data-container">
      <Image
        src="/no_data_available.png"
        width={32}
        height={32}
        alt="No data"
        className="no-data-image"
      />
      <p>{text}</p>
    </div>
  );

  return (
    <div className="analytics-container">
      <div className="charts-grid">
        <div className="chart-box">
          <h4>Users Growth</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : isEmptyData(sessionGrade) ? (
            <NoDataImage text="No data available for User Growth" />
          ) : (
            <Line data={user_growth_data} options={options} />
          )}
        </div>
        <div className="chart-box">
          <h4>Average Soft Skill Grade</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : isEmptyData(categoryGrade) ? (
            <NoDataImage text="No data available for Soft Skill Grades" />
          ) : (
            <Bar data={average_soft_skill_data} options={options} />
          )}
        </div>
        <div className="chart-box">
          <h4>Activity</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : totalCompletedSession === 0 && totalInCompleteSession === 0 ? (
            <NoDataImage text="No data available for Activity" />
          ) : (
            <Pie data={activity_data} options={options_activity} />
          )}
        </div>

        <div className="chart-box">
          <h4>Performance</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : isEmptyData(sessionDatesCount) ? (
            <NoDataImage text="No data available for Performance" />
          ) : (
            <Line data={performance_data} options={options} />
          )}
        </div>
      </div>
    </div>
  );
}
