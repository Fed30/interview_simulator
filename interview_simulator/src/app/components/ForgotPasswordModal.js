"use client";
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth"; // Firebase function for password reset
import { auth } from "../firebase"; // Firebase auth import
import { toast } from "react-toastify";
import { useLoading } from "../context/LoadingContext";

const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { setLoading } = useLoading();

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);

      setTimeout(() => {
        handleClose(); // Close the modal after saving
        setLoading(false);
        toast.success("Password reset link sent! Check your email.");
      }, 4000);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
      toast.error("Failed to send reset email. Please try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail(""); // Clear the email input
    setError(""); // Clear the error message
    setMessage(""); // Clear the success message
    onClose(); // Close the modal
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center w-full h-[100vh]">
          <div className="modal-content p-8 rounded shadow-lg relative">
            {/* Close Button */}
            <span
              className="close cursor-pointer text-2xl absolute top-2 right-2"
              onClick={handleClose} // Use handleClose to clear inputs and close the modal
            >
              &times;
            </span>
            <h4 className="text-center text-2xl font-semibold leading-tight text-shadow-lg">
              FORGOT PASSWORD
            </h4>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="text-white">
                  Email:
                </label>
                <input
                  type="email"
                  className="form-control w-full p-2 text-black border mt-2 rounded"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                />
              </div>

              {error && <span className="text-red-500 text-sm">{error}</span>}
              {message && (
                <span className="text-green-500 text-sm">{message}</span>
              )}

              <button
                type="submit"
                className="btn resetModal-btn btn-block w-full text-white py-2 mt-4 mb-4 rounded"
              >
                SEND RESET LINK
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ForgotPasswordModal;
