"use client";
import { useEffect, useState } from "react";
import { useBadgeAwardsData } from "../context/BadgeAwardsContext";

const BadgeAwardsModal = () => {
  const { data, refetch } = useBadgeAwardsData();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log("New Badge awarded:", data);
    if (data?.new_badge && data?.badge_awarded_at) {
      console.log("Opening modal");
      setIsOpen(true);
    }
  }, [data?.badge_awarded_at]);

  const handleClose = () => {
    console.log("Closing modal");
    setIsOpen(false);
    refetch(); // Refetch data to clear new badge after closing
  };

  const redirect = () => {
    handleClose();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    console.log("Modal not open");
    return null;
  }

  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center modal-blur">
      <div className="modal-content p-8 rounded items-center shadow-lg relative bg-gray-800">
        {/* Close Button */}
        <span
          className="close cursor-pointer text-2xl absolute top-2 right-2"
          onClick={handleCloseModal}
        >
          x
        </span>
        <h4 className="text-center text-2xl font-semibold leading-tight text-shadow-lg text-white">
          🎉 Hurray!!! 🎉
        </h4>
        <p className="text-white text-lg text-center mb-4">
          You&apos;ve earned the <strong>{data?.new_badge}</strong> !
        </p>
        <div className="flex justify-center mb-4">
          <img
            src={data.badge_link}
            alt={data?.new_badge ?? "Badge"}
            className="max-w-full max-h-40 transition duration-300 hover:scale-110"
          />
        </div>
        <p className="text-white text-md text-center mb-4">
          The Badge is now available in your Profile Section.
        </p>
        <button
          onClick={redirect}
          className={`btn resetModal-btn w-full text-white py-2 rounded `}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default BadgeAwardsModal;
