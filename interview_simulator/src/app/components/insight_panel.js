import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

const completedData = {
  labels: ["Sessions Completed"],
  datasets: [
    {
      data: [2], // Adjust values for subcategories
      backgroundColor: ["#55efc4"],
    },
  ],
};

const incompleteData = {
  labels: ["Sessions Not Completed"],
  datasets: [
    {
      data: [3], // Adjust values for subcategories
      backgroundColor: ["#F25E86"],
    },
  ],
};

const overallScoreData = {
  labels: ["Overall Score"],
  datasets: [
    {
      data: [6], // Adjust values for subcategories
      backgroundColor: ["#6D81F2"],
    },
  ],
};

export default function InsightPanel() {
  return (
    <div className="insight-panel">
      <h3>Insights Panel</h3>
      <div className="chart-container">
        <div className="chart-card">
          <Doughnut data={completedData} options={{ cutout: "80%" }} />
        </div>
        <div className="chart-card">
          <Doughnut data={incompleteData} options={{ cutout: "80%" }} />
        </div>
        <div className="chart-card">
          <Doughnut data={overallScoreData} options={{ cutout: "80%" }} />
        </div>
      </div>
    </div>
  );
}
