"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBadgeAwardsData } from "../context/BadgeAwardsContext";
import { useLoading } from "../context/LoadingContext";

const BadgeAwardsModal = () => {
  const router = useRouter();
  const { setLoading } = useLoading();
  const { data, refetch } = useBadgeAwardsData();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (data?.new_badge && data?.badge_awarded_at) {
      setIsOpen(true); // Open modal if a new badge is awarded
    }
  }, [data?.badge_awarded_at]);

  const handleClose = () => {
    setIsOpen(false);
    refetch(); // Refetch data to clear new badge after closing
  };

  const redirect = () => {
    //setLoading(true);
    handleClose();
    //router.push("/profile");
    //setLoading(false);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null; // Don’t render modal if not open

  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center modal-blur">
      <div className="modal-content p-8 rounded items-center shadow-lg relative bg-gray-800">
        {/* Close Button */}
        <span
          className="close cursor-pointer text-2xl absolute top-2 right-2"
          onClick={handleCloseModal}
        >
          &times;
        </span>
        <h4 className="text-center text-2xl font-semibold leading-tight text-shadow-lg text-white">
          🎉 Hurray!!! 🎉
        </h4>
        <p className="text-white text-lg text-center mb-4">
          You've earned the <strong>{data?.new_badge}</strong> !
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
