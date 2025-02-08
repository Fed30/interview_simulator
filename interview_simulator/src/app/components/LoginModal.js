"use client";
import React, { useState } from "react";
import { auth, signInWithEmailAndPassword } from "../firebase"; // Import Firebase auth functions
import ForgotPasswordModal from "./ForgotPasswordModal"; // Import ForgotPasswordModal
import { toast } from "react-toastify";
import { useLoading } from "../context/LoadingContext";
import { signOut } from "firebase/auth";

const LoginModal = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onSwitchToForgotPwd,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false); // State for ForgotPasswordModal
  const { setLoading } = useLoading();

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");

    // Basic validation for email and password
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // Firebase Authentication: Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken(true); // Get ID Token

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
        setTimeout(() => {
          toast.success("Login Successful!");
          onClose(); // Close the modal
          setLoading(false);
        }, 4000);
      } else {
        // Backend returned an error, sign out the user
        await signOut(auth); // Log the user out
        toast.error(data.error || "Authentication failed");
        setLoading(false);
      }
    } catch (error) {
      // Handle general errors (e.g., network issues or firebase issues)
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      toast.error("Invalid email or password. Please try again.");

      // If Firebase fails, ensure the user is logged out
      await signOut(auth); // Log the user out
    }
  };

  const handleForgotPasswordClick = () => {
    // Reset input fields and error messages
    setEmail("");
    setPassword("");
    setError("");
    setEmailError("");
    setPasswordError("");
    onSwitchToForgotPwd();
  };

  const handleSignUpClick = () => {
    // Reset input fields and error messages
    setEmail("");
    setPassword("");
    setError("");
    setEmailError("");
    setPasswordError("");
    onSwitchToSignUp();
  };

  const handleCloseForgotPasswordModal = () => {
    // Reset input fields and error messages
    setEmail("");
    setPassword("");
    setError("");
    setEmailError("");
    setPasswordError("");
    setIsForgotPasswordModalOpen(false); // Close the forgot password modal
  };

  const handleCloseModal = () => {
    onClose(); // Close the login modal
    // Reset input fields and error messages
    setEmail("");
    setPassword("");
    setError("");
    setEmailError("");
    setPasswordError("");
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 self-center bg-opacity-50 flex justify-center items-center z-50">
          <div className="modal-content p-8 rounded shadow-lg w-auto relative">
            {/* Close Button */}
            <span
              className="close cursor-pointer text-2xl absolute top-2 right-2"
              onClick={handleCloseModal} // Use the new close handler
            >
              &times;
            </span>
            <h4 className="text-center text-2xl font-semibold leading-tight text-shadow-lg">
              LOGIN
            </h4>
            <form id="loginForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="text-white ">
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
                {emailError && (
                  <span className="text-red-500 text-sm">{emailError}</span>
                )}
              </div>
              <div className="form-group mt-4">
                <label htmlFor="password" className="text-white">
                  Password:
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

              {error && (
                <span className="error-message text-red-500 block mt-2">
                  {error}
                </span>
              )}

              <button
                type="submit"
                className="btn loginModal-btn btn-block w-full text-white py-2 mt-4 rounded"
              >
                LOGIN
              </button>
            </form>

            {/* Forgot Password link */}
            <div className="form-group mt-3 text-center">
              <a
                href="#"
                className="links cursor-pointer"
                onClick={handleForgotPasswordClick} // Open Forgot Password modal
              >
                Forgot Password?
              </a>
            </div>

            <hr className="my-4" />

            {/* Switch to Sign Up link */}
            <div className="form-group mt-3 text-center">
              <p>
                Don't have an account?{" "}
                <span
                  className="links cursor-pointer"
                  onClick={handleSignUpClick} // Switch to Sign Up modal
                >
                  Sign Up
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={handleCloseForgotPasswordModal}
      />
    </>
  );
};

export default LoginModal;
