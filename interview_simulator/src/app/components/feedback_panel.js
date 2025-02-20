import React, { useEffect, useState } from "react";

export default function FeedbackPanel({ user }) {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All"); // Default to "All"
  const [error, setError] = useState(null); // To track errors

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(
          "http://127.0.0.1:5000/get_feedback_panel_data",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        const data = await response.json();
        console.log("Fetched insights:", data);

        const formattedSessions = [];

        // Format completed sessions
        if (data.completedSessions?.sessions) {
          data.completedSessions.sessions.forEach((session, index) => {
            formattedSessions.push({
              id: session.id || Math.floor(100000 + Math.random() * 900000), // Use session id from API or generate a random one
              date: session.date,
              status: "Complete",
              feedbackLink: session.report_link || "#", // Placeholder or actual link
            });
          });
        }

        // Format incomplete sessions
        if (data.incompleteSessions?.sessions) {
          data.incompleteSessions.sessions.forEach((session, index) => {
            formattedSessions.push({
              id: session.id || Math.floor(100000 + Math.random() * 900000),
              date: session.date,
              status: "Incomplete",
              feedbackLink: "--", // Placeholder for incomplete sessions
            });
          });
        }

        setSessions(formattedSessions);
        setFilteredSessions(formattedSessions); // Initially, show all sessions
      } catch (error) {
        console.error("Error fetching insights:", error);
        setError("Failed to load session data. Please try again later."); // Set error message
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle the filter change
  const handleFilterChange = (event) => {
    const selectedStatus = event.target.value;
    setStatusFilter(selectedStatus);

    if (selectedStatus === "All") {
      setFilteredSessions(sessions); // Show all sessions
    } else {
      setFilteredSessions(
        sessions.filter((session) => session.status === selectedStatus)
      ); // Filter based on status
    }
  };

  return (
    <div className="analytics-container">
      {/* Filter Section with Squared Radio Buttons */}
      <div className="filter-container">
        <label className="filter-label">
          <input
            type="radio"
            name="statusFilter"
            value="All"
            checked={statusFilter === "All"}
            onChange={handleFilterChange}
            className="filter-radio"
          />
          All
        </label>
        <label className="filter-label">
          <input
            type="radio"
            name="statusFilter"
            value="Complete"
            checked={statusFilter === "Complete"}
            onChange={handleFilterChange}
            className="filter-radio"
          />
          Complete
        </label>
        <label className="filter-label">
          <input
            type="radio"
            name="statusFilter"
            value="Incomplete"
            checked={statusFilter === "Incomplete"}
            onChange={handleFilterChange}
            className="filter-radio"
          />
          Incomplete
        </label>
      </div>

      {isLoading ? (
        <div className="analytics-spinner"></div>
      ) : error ? (
        <p>{error}</p> // Display error if there is an issue fetching data
      ) : filteredSessions.length === 0 ? (
        <div className="no-data-container">
          <img
            src="/no_data_available.png"
            alt="No data"
            className="no-data-image"
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
                  {/* If session status is Incomplete, show "--", otherwise show the feedback link */}
                  {session.status === "Incomplete" ? (
                    "--"
                  ) : (
                    <a
                      href={session.feedbackLink}
                      className="feedback-link"
                      target="_blank" // Opens the link in a new tab
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
