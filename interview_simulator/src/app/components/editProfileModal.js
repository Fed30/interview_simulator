"use client";
import React, { useState, useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database"; // Import Firebase Realtime Database functions
import { toast } from "react-toastify";
import { auth } from "../firebase"; // Import Firebase auth functions
import { useLoading } from "../context/LoadingContext";

const EditProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const { setLoading } = useLoading();

  useEffect(() => {
    if (isOpen) {
      // Fetch user data when the modal is opened
      const fetchUserData = async () => {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const db = getDatabase();
          const userRef = ref(db, "Users/" + userId);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setFirstName(data.firstName || "");
            setLastName(data.lastName || "");
            setEmail(data.email || "");
          } else {
            setError("No user data found.");
          }
        } else {
          setError("User is not logged in.");
        }
      };

      fetchUserData();
    }
  }, [isOpen]);

  const handleFirstNameInput = (e) => {
    const newValue = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
    setFirstName(newValue);
  };

  const handleLastNameInput = (e) => {
    const newValue = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
    setLastName(newValue);
  };

  // Function to reset all states to their initial values
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setError("");
    setEmailError("");
    setNameError("");
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

    //const auth = getAuth();
    const user = auth.currentUser;
    setLoading(true);
    if (user) {
      const idToken = await user.getIdToken();

      const updates = {
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        email: email,
      };

      const response = await fetch(
        "https://interview-simulator-iy3l.onrender.com/update_profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();
      if (response.ok) {
        onProfileUpdate(updates);
        setTimeout(() => {
          handleClose(); // Close the modal after saving
          setLoading(false);
          toast.success(result.message);
        }, 4000);
      } else {
        toast.error(result.message || "Failed to update profile.");
      }
    } else {
      toast.error("User is not logged in.");
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 self-center bg-opacity-50 flex justify-center items-center modal-blur">
          <div className="modal-content p-8 rounded shadow-lg relative">
            {/* Close Button */}
            <span
              className="close cursor-pointer text-2xl absolute top-2 right-2"
              onClick={handleClose}
            >
              x
            </span>
            <h4 className="text-center text-2xl font-semibold text-white leading-tight text-shadow-lg">
              EDIT PROFILE
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
                  disabled
                  required
                />
                {emailError && (
                  <span className="text-red-500 text-sm">{emailError}</span>
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
                SAVE
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfileModal;
