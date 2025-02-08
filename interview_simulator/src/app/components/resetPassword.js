"use client";
import React, { useState } from "react";
import { updatePassword } from "firebase/auth"; // Import updatePassword from Firebase Auth
import { toast } from "react-toastify"; // Import toast for notifications
import { useLoading } from "../context/LoadingContext";
import { auth, firebaseSignOut } from "../firebase";
import { useRouter } from "next/navigation";

const ResetPwdModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const { setLoading } = useLoading();
  const router = useRouter();

  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const validatePassword = (password) => password.length >= 6;
  const validateConfirmPassword = (password, confirmPassword) =>
    password === confirmPassword;

  // Function to reset all states to their initial values
  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  // Use the resetForm function inside onClose to clear the fields
  const handleClose = () => {
    resetForm(); // Reset the form state
    onClose(); // Close the modal
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    // Ensure the password includes additional complexity
    const complexityRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!complexityRegex.test(password)) {
      setPasswordError(
        "Password must include at least one uppercase letter, one number, and one special character."
      );
      return;
    }

    // Validate confirm password
    if (!validateConfirmPassword(password, confirmPassword)) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    // Reset errors
    setPasswordError("");
    setConfirmPasswordError("");

    try {
      setLoading(true);
      const currentUser = auth.currentUser; // Get the current authenticated user

      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        // Send the ID token to the Flask backend for verification
        const response = await fetch("http://localhost:5000/verify_token", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`, // Pass the ID token
          },
          body: JSON.stringify({ idToken }),
        });

        const data = await response.json();

        if (data.message === "User authenticated successfully") {
          await updatePassword(currentUser, password); // Update the password
          setTimeout(() => {
            toast.success("Password reset successful!"); // Show success toast
            handleClose(); // Close the modal
            setLoading(false);
          }, 4000);
        } else {
          // Backend returned an error, sign out the user
          await signOut(auth); // Log the user out
          toast.error(data.error || "Authentication failed");
          setLoading(false);
        }
      }
    } catch (error) {
      //console.error("Error resetting password:", error);
      setLoading(false);
      // Handle Firebase-specific errors
      switch (error.code) {
        case "auth/requires-recent-login":
          toast.error(
            "Your session has expired. Please log in again to reset your password."
          );
          await firebaseSignOut(auth);
          setLoading(true);
          router.push("/");
          setLoading(false);
          break;
        case "auth/weak-password":
          setPasswordError(
            "The password is too weak. Please choose a stronger password."
          );
          break;
        case "auth/network-request-failed":
          toast.error(
            "Network error. Please check your internet connection and try again."
          );
          break;
        default:
          toast.error("Failed to reset password. Please try again later.");
      }
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 self-center bg-opacity-50 flex justify-center items-center z-50">
          <div className="modal-content p-8 rounded shadow-lg relative">
            {/* Close Button */}
            <span
              className="close cursor-pointer text-2xl absolute top-2 right-2"
              onClick={handleClose}
            >
              &times;
            </span>
            <h4 className="text-center text-2xl font-semibold text-white leading-tight text-shadow-lg">
              RESET PASSWORD
            </h4>
            <form id="signUpForm" onSubmit={handleSubmit}>
              <div className="form-group mt-4">
                <label htmlFor="password" className="text-white">
                  New Password:
                </label>
                <input
                  type="password"
                  className="form-control text-black w-full p-2 border mt-2 rounded"
                  id="password"
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                {passwordError && (
                  <span className="text-red-500 text-sm">{passwordError}</span>
                )}
              </div>
              <div className="form-group mt-4">
                <label htmlFor="confirmPassword" className="text-white">
                  Confirm New Password:
                </label>
                <input
                  type="password"
                  className="form-control text-black w-full p-2 border mt-2 rounded"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                />
                {confirmPasswordError && (
                  <span className="text-red-500 text-sm">
                    {confirmPasswordError}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="btn signUpModal-btn btn-block w-full text-white py-2 mt-4 mb-4 rounded"
              >
                RESET
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ResetPwdModal;
