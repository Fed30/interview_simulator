import React, { useEffect, useState } from "react";
import { useBadgesPanelData } from "../context/BadgesPanelContext";

export default function BadgesPanel({ user }) {
  const [error, setError] = useState(null);
  const { data, refetch } = useBadgesPanelData();
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setError(null);

        if (!data) {
          await refetch();
        }
      } catch (err) {
        console.error("Error fetching badges data:", err);
        setError("An error occurred while fetching badges data.");
      } finally {
        setIsLoadingCompleted(false);
      }
    };

    fetchData();
  }, [user, data, refetch]);

  const renderBadge = (badge) => {
    console.log(badge.badge_link); // Log the badge link to verify it's correct
    return (
      <div key={badge.name} className="badge-item earned">
        <h3 className="badge-name">{badge.name}</h3>
        <img src={badge.badge_link} alt={badge.name} className="badge-image" />
      </div>
    );
  };
  const NoDataImage = ({ text }) => (
    <div className="no-data-container">
      <img
        src="/no_data_available.png"
        alt="No data"
        className="no-data-image"
      />
      <p>{text}</p>
    </div>
  );

  const LoadingSpinner = () => <div className="analytics-spinner"></div>;

  return (
    <div className="badges-container">
      {isLoadingCompleted ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : data && data.Badges && data.Badges.length > 0 ? (
        <div className="badges-grid">{data.Badges.map(renderBadge)}</div>
      ) : (
        <NoDataImage text="No Badges Rewarded available" />
      )}
    </div>
  );
}
