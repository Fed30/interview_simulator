"use client";
import React, { useState } from "react";
import {
  auth,
  createUserWithEmailAndPassword,
  firebaseSignOut,
} from "../firebase"; // Import Firebase auth functions
import { getDatabase, ref, set } from "firebase/database"; // Import Firebase Realtime Database functions
import { toast } from "react-toastify";
import { useLoading } from "../context/LoadingContext";
import { EyeIcon, EyeOffIcon } from "@heroicons/react/solid";

const SignUpModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const { setLoading } = useLoading();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  const handleFirstNameInput = (e) => {
    const newValue = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
    setFirstName(newValue);
  };

  const handleLastNameInput = (e) => {
    const newValue = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
    setLastName(newValue);
  };
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;
  const validateName = (firstName, lastName) => firstName && lastName;

  // Function to reset all states to their initial values
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setError("");
    setEmailError("");
    setPasswordError("");
    setNameError("");
  };
  const handleLoginClick = () => {
    resetForm(); // Reset the form state
    onSwitchToLogin();
  };

  // Use the resetForm function inside onClose to clear the fields
  const handleClose = () => {
    resetForm(); // Reset the form state
    onClose(); // Close the modal
  };

  const capitalize = (string) => {
    if (!string) return string;
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setNameError("");

    if (!validateName(firstName, lastName)) {
      setNameError("Please enter both first name and last name.");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    const formattedFirstName = capitalize(firstName);
    const formattedLastName = capitalize(lastName);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const idToken = await userCredential.user.getIdToken(); // Get ID token

      // Send the ID token to the Flask backend
      const response = await fetch(
        "https://interview-simulator-iy3l.onrender.com/verify_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await response.json();

      if (data.message === "User authenticated successfully") {
        // Proceed with saving user data and other operations
        const db = getDatabase();
        await set(ref(db, "Users/" + userCredential.user.uid), {
          firstName: formattedFirstName,
          lastName: formattedLastName,
          email,
        });

        // Log out the user immediately after successful sign-up
        await firebaseSignOut(auth);
        setTimeout(() => {
          toast.success("Sign Up Successful!");
          handleClose();
          setLoading(false);
        }, 3000);
        // Clear any previous error messages
        setError("");

        // Switch to login modal after sign-up, but wait for auth state to update
        auth.onAuthStateChanged((user) => {
          if (!user) {
            setTimeout(() => {
              resetForm(); // Reset the form state
              onSwitchToLogin(); // Trigger opening of LoginModal only after auth state updates
            }, 500); // Delay to ensure the modal closes properly before opening the login modal
          }
        });
      } else {
        await firebaseSignOut(auth);
        toast.error("Server Authentication error");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      await firebaseSignOut(auth);
      setLoading(false);
      setError("Error signing up. Please try again.");
      toast.error("Error signing up. Please try again.");
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center  w-full h-[100vh]">
          <div className="modal-content p-8 rounded shadow-lg relative">
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 hover:text-[#F25E86] text-white rounded-full p-2 transition-transform transform hover:scale-110"
              onClick={handleClose}
            >
              ✖
            </button>
            <h4 className="text-center text-2xl font-semibold text-white leading-tight text-shadow-lg">
              SIGN UP
            </h4>
            <form id="signUpForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="firstName" className="text-white">
                  First Name:
                </label>
                <input
                  type="text"
                  className="form-control w-full p-2 text-black border mt-2 rounded"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={handleFirstNameInput}
                  required
                />
              </div>

              <div className="form-group mt-4">
                <label htmlFor="lastName" className="text-white">
                  Last Name:
                </label>
                <input
                  type="text"
                  className="form-control w-full p-2 text-black border mt-2 rounded"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={handleLastNameInput}
                  required
                />
              </div>

              <div className="form-group mt-4">
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
                {emailError && (
                  <span className="text-red-500 text-sm">{emailError}</span>
                )}
              </div>

              <div className="form-group mt-4">
                <label htmlFor="password" className="text-white">
                  Password:
                </label>
                <div className="relative w-full">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    className="form-control text-black w-full p-2 pr-10 border mt-2 rounded"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/4 text-white hover:text-white"
                  >
                    {isPasswordVisible ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <span className="text-red-500 text-sm">{passwordError}</span>
                )}
              </div>

              {nameError && (
                <span className="text-red-500 text-sm">{nameError}</span>
              )}

              {error && (
                <span className="error-message text-red-500 block mt-2">
                  {error}
                </span>
              )}

              <button
                type="submit"
                className="btn signUpModal-btn btn-block w-full text-white py-2 mt-4 mb-4 rounded"
              >
                SIGN UP
              </button>
            </form>
            <hr className="my-4" />
            {/* Switch to Sign Up link */}
            <div className="form-group mt-3 text-center">
              <p>
                Already have an account?{" "}
                <span
                  className="links cursor-pointer"
                  onClick={handleLoginClick} // Switch to Login modal
                >
                  Login
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignUpModal;
