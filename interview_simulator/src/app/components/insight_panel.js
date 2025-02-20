import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";

Chart.register(ArcElement, Tooltip, Legend);

const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    const { width, height, ctx } = chart;
    const showCenterText = chart.config.options.showCenterText; // Check if the flag is set

    // If flag is true, draw the center text
    if (showCenterText) {
      const text = chart.config.data.datasets[0].data[0] || 0;

      ctx.save();
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2);
      ctx.restore();
    }
  },
};

// Register the plugin globally
Chart.register(centerTextPlugin);

export default function InsightPanel({ user }) {
  const [completed, setCompleted] = useState(0);
  const [incomplete, setIncomplete] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(true);
  const [isLoadingIncomplete, setIsLoadingIncomplete] = useState(true);
  const [isLoadingOverall, setIsLoadingOverall] = useState(true);

  const maxSessions = 10;

  // Compute values for sessions and scores
  const completedSessions = completed;
  const incompleteSessions = incomplete;
  const overallScoreSessions = Math.min(score, maxSessions);
  const remainingScoreSessions = maxSessions - overallScoreSessions;
  console.log("Overall Score Sessions:", overallScoreSessions);
  console.log("Remaining Score Sessions:", remainingScoreSessions);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(
          "http://127.0.0.1:5000/get_insight_panel_data",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        const data = await response.json();
        console.log("Fetched insights:", data);

        setCompleted(data.completed_sessions || 0);
        setIncomplete(data.incomplete_sessions || 0);
        setScore(data.overall_score);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setIsLoadingCompleted(false);
        setIsLoadingIncomplete(false);
        setIsLoadingOverall(false);
      }
    };

    fetchData();
  }, [user]);

  // Doughnut Chart Data
  const completedData = {
    labels: ["Completed", "Incomplete"],
    datasets: [
      {
        data: [completedSessions, incompleteSessions],
        backgroundColor:
          completedSessions === 0
            ? ["#6D81F2", "#6D81F2"]
            : ["#F25E86", "#6D81F2"],
        borderWidth: 0,
      },
    ],
  };

  const incompleteData = {
    labels: ["Incomplete", "Completed"],
    datasets: [
      {
        data: [incompleteSessions, completedSessions],
        backgroundColor:
          incompleteSessions === 0
            ? ["#6D81F2", "#6D81F2"]
            : ["#F25E86", "#6D81F2"],
        borderWidth: 0,
      },
    ],
  };

  const overallScoreData = {
    labels: ["Overall Score", "Remaining"],
    datasets: [
      {
        data: [overallScoreSessions, remainingScoreSessions],
        backgroundColor: [
          overallScoreSessions === 0 ? "#6D81F2" : "#6D81F2",
          overallScoreSessions > 0 ? "#F25E86" : "#6D81F2",
        ],
        borderWidth: 0,
      },
    ],
  };

  const NoDataImage = ({ text }) => (
    <div className="no-data-container-IP">
      <img
        src="/no_data_available.png"
        alt="No data"
        className="no-data-image-IP"
      />
      <p className="text-white text-xs">{text}</p>
    </div>
  );

  const LoadingSpinner = () => <div className="analytics-spinner"></div>;

  return (
    <div className="insight-panel">
      <div className="chart-container">
        <h3>Insights Panel</h3>
        <div className="chart-card">
          <h4>Completed Sessions</h4>
          <h6>vs incomplete sessions</h6>
          <div className="chart-wrapper">
            {isLoadingCompleted ? (
              <LoadingSpinner />
            ) : completedSessions === 0 && incompleteSessions === 0 ? (
              <NoDataImage text="No data available" />
            ) : (
              <Doughnut
                data={completedData}
                options={{
                  cutout: "80%",
                  plugins: {
                    legend: { display: false },
                    centerText: true,
                  },
                  showCenterText: true,
                }}
              />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h4>Incomplete Sessions</h4>
          <h6>vs completed sessions</h6>
          <div className="chart-wrapper">
            {isLoadingIncomplete ? (
              <LoadingSpinner />
            ) : completedSessions === 0 && incompleteSessions === 0 ? (
              <NoDataImage text="No data available" />
            ) : (
              <Doughnut
                data={incompleteData}
                options={{
                  cutout: "80%",
                  plugins: {
                    legend: { display: false },
                    centerText: true,
                  },
                  showCenterText: true,
                }}
              />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h4>Overall Score</h4>
          <h6>total session average</h6>
          <div className="chart-wrapper">
            {isLoadingOverall ? (
              <LoadingSpinner />
            ) : overallScoreSessions === 0 ? (
              <NoDataImage text="No data available" />
            ) : (
              <Doughnut
                data={overallScoreData}
                options={{
                  cutout: "80%",
                  plugins: {
                    legend: { display: false },
                    centerText: true,
                  },
                  showCenterText: true,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
