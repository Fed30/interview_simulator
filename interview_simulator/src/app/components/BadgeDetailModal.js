"use client";
import React from "react";

const BadgeDetailsModal = ({ badge, onClose }) => {
  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center modal-blur">
      <div className="modal-content p-8 rounded items-center shadow-lg relative bg-gray-800">
        {/* Close Button */}
        <span
          className="close cursor-pointer text-2xl absolute top-2 right-2"
          onClick={onClose}
        >
          &times;
        </span>
        <h4 className="text-center text-2xl font-semibold leading-tight text-shadow-lg text-white">
          {badge.name}
        </h4>

        <div className="flex justify-center mb-4">
          <img
            src={badge.badge_link}
            alt={badge.name}
            className="max-w-full max-h-40 transition duration-300 hover:scale-110"
          />
        </div>
        <p className="text-white text-md text-center mb-4">
          {badge.explanation}
        </p>
        <p className="text-white text-lg text-center mt-4 font-semibold">
          Keep pushing forward, greatness awaits!
        </p>
      </div>
    </div>
  );
};

export default BadgeDetailsModal;
