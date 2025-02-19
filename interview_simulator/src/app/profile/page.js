"use client";
import React, { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import EditProfileModal from "../components/editProfileModal";
import AnalyticsPanel from "../components/analytics_panel";
import ResetPasswordModal from "../components/resetPassword";
import { getDatabase, ref, get } from "firebase/database";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import InsightPanel from "../components/insight_panel";
import FeedbackPanel from "../components/feedback_panel";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("analyticsContent");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter(); // Initialize the router
  const [user, setUser] = useState(null);
  const { userInitials } = useAuth();
  const [pageLoaded, setPageLoaded] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openResetPwdModal = () => {
    setIsResetPwdModalOpen(true);
  };

  const closeResetPwdModal = () => {
    setIsResetPwdModalOpen(false);
  };

  const fetchUserData = (user) => {
    const db = getDatabase();
    const userRef = ref(db, `Users/${user.uid}`);
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const firstName = userData.firstName || "N/A";
          const lastName = userData.lastName || "N/A";

          const formattedName =
            firstName.charAt(0).toUpperCase() +
            firstName.slice(1).toLowerCase() +
            " " +
            lastName.charAt(0).toUpperCase() +
            ".";

          setUserName(formattedName);
        } else {
          console.log("No user data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  };

  useEffect(() => {
    setPageLoaded(true);
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Refresh token before making authenticated requests
          const idToken = await authUser.getIdToken(true);
          console.log("Refreshed Token:", idToken);
          setTimeout(() => {
            setUser(authUser); // Store user
            fetchUserData(authUser);
          }, 1000);
        } catch (error) {
          console.error("Error refreshing token:", error);
          router.push("/"); // Redirect if token refresh fails
        }
      } else {
        console.log("User is not authenticated");
        router.push("/"); // Redirect if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleProfileUpdate = (updatedData) => {
    const firstName = updatedData.firstName || "N/A";
    const lastName = updatedData.lastName || "N/A";

    const formattedName =
      firstName.charAt(0).toUpperCase() +
      firstName.slice(1).toLowerCase() +
      " " +
      lastName.charAt(0).toUpperCase() +
      ".";

    setUserName(formattedName);
  };

  return (
    <div
      className={`profile-page page-transition ${pageLoaded ? "loaded" : ""}`}
    >
      <div className="dashboard-container">
        {/* Profile Section on the Left */}
        <div className="profile-wrapper">
          <div className="profile-info">
            <div className="profile-header d-flex align-items-center">
              <button className="transition duration-300 hover:scale-110">
                <div className="w-7 h-7 flex items-center justify-center bg-[#6D81F2] text-white font-bold rounded text-lg">
                  {userInitials}
                </div>
              </button>
              <div className="ml-3 mb-3">
                <h3 id="userName">{userName || "Loading..."}</h3>
              </div>
              <div className="button-wrapper ml-auto">
                <button className="btn editProfile-btn" onClick={openModal}>
                  Edit Profile
                </button>
                <button
                  className="btn resetPwd-btn ml-3"
                  onClick={openResetPwdModal}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
          <EditProfileModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onProfileUpdate={handleProfileUpdate}
          />

          <ResetPasswordModal
            isOpen={isResetPwdModalOpen}
            onClose={closeResetPwdModal}
          />
          {/* Tabs for Profile */}
          <div className="tabs mt-4">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    activeTab === "analyticsContent" ? "active" : ""
                  }`}
                  href="#"
                  onClick={() => handleTabClick("analyticsContent")}
                >
                  Analytics
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    activeTab === "feedbackContent" ? "active" : ""
                  }`}
                  href="#"
                  onClick={() => handleTabClick("feedbackContent")}
                >
                  Feedback
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    activeTab === "badgesContent" ? "active" : ""
                  }`}
                  href="#"
                  onClick={() => handleTabClick("badgesContent")}
                >
                  Badges
                </a>
              </li>
            </ul>
          </div>

          {/* Tab Content */}
          <div className="scrollable-content mt-4">
            {/* Always render all tab content, but show the active one */}
            <div
              style={{
                display: activeTab === "analyticsContent" ? "block" : "none",
              }}
            >
              <AnalyticsPanel user={user} />
            </div>
            <div
              style={{
                display: activeTab === "feedbackContent" ? "block" : "none",
              }}
            >
              <FeedbackPanel user={user} />
            </div>
            <div
              style={{
                display: activeTab === "badgesContent" ? "block" : "none",
              }}
            >
              <p>Badges content goes here...</p>
            </div>
          </div>
        </div>
        {/* Insight Panel on the Right */}
        <InsightPanel user={user} />
      </div>
    </div>
  );
}
