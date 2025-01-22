"use client"
import React, { useState, useEffect } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import EditProfileModal from '../components/editProfileModal';
import ResetPasswordModal from '../components/resetPassword';
import { getDatabase, ref, get } from "firebase/database";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

const Profile = () => {
  const [activeTab, setActiveTab] = useState('activityContent');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true); // State to track loading
  const router = useRouter(); // Initialize the router

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
            firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() + " " +
            lastName.charAt(0).toUpperCase() + ".";

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
        setLoading(false); // Set loading to false once the user is fetched
      } else {
        console.log("User is not authenticated");
        setLoading(false); // Set loading to false
        router.push('/'); // Redirect to home page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleProfileUpdate = (updatedData) => {
    const firstName = updatedData.firstName || "N/A";
    const lastName = updatedData.lastName || "N/A";

    const formattedName =
      firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() + " " +
      lastName.charAt(0).toUpperCase() + ".";

    setUserName(formattedName);
  };

  if (loading) {
    return <p>Loading...</p>; // Show loading message while checking authentication
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-info">
        <div className="profile-header d-flex align-items-center">
          <div className="profile_icon">
            <i className="fas fa-user-circle fa-5x"></i>
          </div>
          <div className="ml-3">
            <h3 id="userName">{userName || "Loading..."}</h3>
          </div>
          <div className="button-wrapper ml-auto">
            <button className="btn editProfile-btn" id="editProfile" onClick={openModal}>
              Edit Profile
            </button>
            <button className="btn resetPwd-btn ml-3" id="resetPassword" onClick={openResetPwdModal}>
              Reset Password
            </button>
          </div>
        </div>
      </div>

      <EditProfileModal isOpen={isModalOpen} onClose={closeModal} onProfileUpdate={handleProfileUpdate} />

      <ResetPasswordModal isOpen={isResetPwdModalOpen} onClose={closeResetPwdModal} />

      <div className="tabs mt-4">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'activityContent' ? 'active' : ''}`}
              href="#"
              onClick={() => handleTabClick('activityContent')}
            >
              Activity
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'feedbackContent' ? 'active' : ''}`}
              href="#"
              onClick={() => handleTabClick('feedbackContent')}
            >
              Feedback
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'notificationContent' ? 'active' : ''}`}
              href="#"
              onClick={() => handleTabClick('notificationContent')}
            >
              Notification
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'analyticsContent' ? 'active' : ''}`}
              href="#"
              onClick={() => handleTabClick('analyticsContent')}
            >
              Analytics
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'badgesContent' ? 'active' : ''}`}
              href="#"
              onClick={() => handleTabClick('badgesContent')}
            >
              Badges
            </a>
          </li>
        </ul>
      </div>

      <div className="scrollable-content mt-4">
        <div id="activityContent" className={`tab-content ${activeTab === 'activityContent' ? 'active' : ''}`}>
          <p>Activity content goes here...</p>
        </div>
        <div id="feedbackContent" className={`tab-content ${activeTab === 'feedbackContent' ? 'active' : ''}`}>
          <p>Feedback content goes here...</p>
        </div>
        <div id="analyticsContent" className={`tab-content ${activeTab === 'analyticsContent' ? 'active' : ''}`}>
          <p>Analytics content goes here...</p>
        </div>
        <div id="notificationContent" className={`tab-content ${activeTab === 'notificationContent' ? 'active' : ''}`}>
          <p>Notification content goes here...</p>
        </div>
        <div id="badgesContent" className={`tab-content ${activeTab === 'badgesContent' ? 'active' : ''}`}>
          <p>Badges content goes here...</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
