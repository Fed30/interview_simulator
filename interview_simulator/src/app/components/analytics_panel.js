import React, { useEffect, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function AnalyticsPanel({ user }) {
  const [sessionGrade, setSessionGrade] = useState([]);
  const [sessionMonth, setSessionMonth] = useState([]);
  const [categoryGrade, setCategoryGrade] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCompletedSession, setTotalCompletedSession] = useState(0);
  const [totalInCompleteSession, setTotalInCompleteSession] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(
          "http://127.0.0.1:5000/get_analytics_panel_data",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        const data = await response.json();
        console.log("Fetched insights:", data);

        setSessionGrade(
          Array.isArray(data.sessionGrade)
            ? data.sessionGrade
            : [data.sessionGrade]
        );
        setSessionMonth(data.sessionMonth ?? []);
        setCategoryGrade(Object.values(data.categoryGrade ?? {}));
        setCategories(data.categories ?? []);
        setTotalCompletedSession(data.totalCompletedSession ?? 0);
        setTotalInCompleteSession(data.totalInCompleteSession ?? 0);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const user_growth_data = {
    labels: sessionMonth,
    datasets: [
      {
        label: "Grades",
        data: sessionGrade,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
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
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const performance_data = {
    labels: sessionMonth,
    datasets: [
      {
        label: "Users",
        data: [totalCompletedSession],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
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
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const LoadingSpinner = () => <div className="loading-spinner"></div>;

  return (
    <div className="analytics-container">
      <h3 className="analytics-title">Analytics Overview</h3>
      <div className="charts-grid">
        <div className="chart-box">
          <h4>Users Growth</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Line data={user_growth_data} options={options} />
          )}
        </div>
        <div className="chart-box">
          <h4>Average Soft Skill Grade</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Bar data={average_soft_skill_data} options={options} />
          )}
        </div>
        <div className="chart-box">
          <h4>Activity</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Pie data={activity_data} options={options} />
          )}
        </div>
        <div className="chart-box">
          <h4>Performance</h4>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Line data={performance_data} options={options} />
          )}
        </div>
      </div>
    </div>
  );
}
