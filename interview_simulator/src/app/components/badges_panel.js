import React, { useEffect, useState } from "react";
import { useBadgesPanelData } from "../context/BadgesPanelContext";
import BadgeDetailsModal from "../components/BadgeDetailModal";
import Image from "next/image";

export default function BadgesPanel({ user }) {
  const [error, setError] = useState(null);
  const { data, refetch } = useBadgesPanelData();
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Badge explanations mapping
  const badgeExplanations = {
    "Bronze Badge":
      "You have been awarded the Bronze Badge because you have completed two practice sessions.",
    "Silver Badge":
      "You have been awarded the Silver Badge for completing four practice sessions.",
    "Gold Badge":
      "You have been awarded the Gold Badge for completing six practice sessions.",
  };

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

  const handleBadgeClick = (badge) => {
    const explanation =
      badgeExplanations[badge.name] ||
      "No explanation available for this badge.";
    setSelectedBadge({ ...badge, explanation });
  };

  const renderBadge = (badge) => {
    console.log(badge.badge_link); // Log the badge link to verify it's correct
    return (
      <div key={badge.name} className="flip-card">
        <div className="flip-card-inner">
          {/* Front Side */}
          <div
            className="flip-card-front"
            /*onClick={() => handleBadgeClick(badge)}*/
          >
            <h3 className="badge-name">{badge.name}</h3>
            <Image
              src={badge.badge_link}
              alt={badge.name}
              width={200}
              height={200}
              className="badge-image"
            />
          </div>

          {/* Back Side */}
          <div className="flip-card-back">
            <h3 className="badge-name">{badge.name}</h3>
            <p className="badge-description">{explanation}</p>
          </div>
        </div>
      </div>
    );
  };
  const NoDataImage = ({ text }) => (
    <div className="no-data-container">
      <Image
        src="/no_data_available.png"
        width={80}
        height={80}
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

      {selectedBadge && (
        <BadgeDetailsModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}
