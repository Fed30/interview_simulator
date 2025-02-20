"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "../context/LoadingContext";

const SessionEndModal = ({ isOpen, onClose, conversationSaved }) => {
  const [isConversationSaved, setIsConversationSaved] =
    useState(conversationSaved);
  const router = useRouter();
  const { setLoading } = useLoading();

  useEffect(() => {
    // Listen for changes in the conversationSaved prop and update the state
    if (conversationSaved) {
      setIsConversationSaved(true);
    }
  }, [conversationSaved]);

  const redirect = async () => {
    if (isConversationSaved) {
      setLoading(true); // Start loading before redirect
      await router.push("/"); // Wait for the redirect to complete
      setLoading(false); // Stop loading after redirect
      onClose(); // Close modal after redirect
    } else {
      setLoading(false); // Stop loading if conversation isn't saved
      console.log("Conversation not saved yet.");
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 self-center bg-opacity-50 flex justify-center w-full h-full items-center z-50 modal-blur">
          <div className="modal-content p-8 rounded items-center shadow-lg relative">
            <h4 className="text-center text-2xl font-semibold leading-tight text-shadow-lg">
              WELL DONE!
            </h4>
            <div className="flex justify-center mb-4">
              <img
                src="/practice_questions.png"
                alt="No data"
                className="no-data-image max-w-full max-h-64" // Ensure image doesn't stretch
              />
            </div>
            <p className="text-white text-base text-center break-normal mb-2">
              Great job! You've successfully completed your practice session.
              Your effort and dedication are truly commendable. Keep up the
              excellent work! We are saving the session, and your feedback
              report will be available shortly on your profile, so be sure to
              check it out!
            </p>
            <button
              onClick={redirect}
              className={`btn resetModal-btn btn-block w-full text-white py-2 mt-4 mb-4 rounded ${
                isConversationSaved ? "" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!isConversationSaved}
            >
              FINISH
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionEndModal;
