import React, { useEffect, useState } from "react";
import { useFeedbackPanelData } from "../context/FeedbackPanelContext";
import Image from "next/image";

export default function FeedbackPanel({ user }) {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState(null);
  const { data, refetch } = useFeedbackPanelData();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null); // Reset error state before fetching

        // Refetch if data is not available
        if (!data) {
          await refetch();
        }

        if (data) {
          console.log("Fetched Feedback Data:", data);

          const formattedSessions = [];

          // Format completed sessions
          data.completedSessions?.sessions?.forEach((session) => {
            formattedSessions.push({
              id: session.id || Math.floor(100000 + Math.random() * 900000),
              date: session.date || "N/A",
              status: "Complete",
              feedbackLink: session.report_link || "#",
            });
          });

          // Format incomplete sessions
          data.incompleteSessions?.sessions?.forEach((session) => {
            formattedSessions.push({
              id: session.id || Math.floor(100000 + Math.random() * 900000),
              date: session.date || "N/A",
              status: "Incomplete",
              feedbackLink: "--",
            });
          });

          setSessions(formattedSessions);
          setFilteredSessions(formattedSessions);
        } else {
          setError("Failed to fetch data.");
        }
      } catch (err) {
        console.error("Error fetching feedback data:", err);
        setError("An error occurred while fetching feedback data.");
      } finally {
        setIsLoading(false); // Set loading to false after data is processed
      }
    };

    fetchData();
  }, [user, data, refetch]);

  const parseDate = (dateStr) => {
    if (dateStr === "N/A") return new Date(0); // Handle "N/A" dates
    const [day, month, year] = dateStr.split("-");
    const fullYear = `20${year}`; // Assuming all dates are in the 2000s
    return new Date(`${fullYear}-${month}-${day}`);
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    const selectedStatus = event.target.value;
    setStatusFilter(selectedStatus);
    setFilteredSessions(
      selectedStatus === "All"
        ? sessions
        : sessions.filter((session) => session.status === selectedStatus)
    );
  };

  return (
    <div className="analytics-container">
      {/* Filter Section */}
      <div className="filter-container">
        {["All", "Complete", "Incomplete"].map((status) => (
          <label key={status} className="filter-label">
            <input
              type="radio"
              name="statusFilter"
              value={status}
              checked={statusFilter === status}
              onChange={handleFilterChange}
              className="filter-radio"
            />
            {status}
          </label>
        ))}
      </div>

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="analytics-spinner"></div>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : filteredSessions.length === 0 ? (
        <div className="no-data-container">
          <Image
            src="/no_data_available.png"
            width={100}
            height={100}
            alt="No data"
          />
          <p>No data available for Sessions Feedback</p>
        </div>
      ) : (
        <table className="feedback-table">
          <thead>
            <tr className="table-header">
              <th>Session ID</th>
              <th>Date</th>
              <th>Status</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session) => (
              <tr key={session.id}>
                <td>{session.id}</td>
                <td>{session.date}</td>
                <td>{session.status}</td>
                <td>
                  {session.status === "Incomplete" ? (
                    "--"
                  ) : (
                    <a
                      href={session.feedbackLink}
                      className="feedback-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Feedback
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
