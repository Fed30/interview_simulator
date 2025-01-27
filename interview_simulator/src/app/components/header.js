"use client";
import React, { useState, useEffect, useRef} from "react";
import Link from "next/link";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";
import ForgotPwd from "./ForgotPasswordModal";
import { useAuth } from "../context/AuthContext"; // Import useAuth
import { auth, firebaseSignOut } from "../firebase";
import { toast } from 'react-toastify';
import { useRouter } from "next/navigation";
import '@fortawesome/fontawesome-free/css/all.min.css'; 
import { useLoading } from '../context/LoadingContext';


const Header = () => {
  const { isLoggedIn, setIsLoggedIn } = useAuth(); // Get the logged-in state from context
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isForgotPwdModalOpen, setIsForgotPwdModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const dropdownRef = useRef(null); // Reference to the dropdown container
  const router = useRouter();
  const { setLoading } = useLoading();

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false); // Close the dropdown if clicking outside
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleSignUpClick = () => {
    setIsSignUpModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleCloseSignUpModal = () => {
    setIsSignUpModalOpen(false);
  };

  const handleCloseForgotPwdModal = () => {
    setIsForgotPwdModalOpen(false);
  };

  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  const handleSwitchToForgotPwd = () => {
    setIsLoginModalOpen(false);
    setIsForgotPwdModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleSwitchTFromForgotPwdToLogin = () => {
    setIsForgotPwdModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen(prevState => !prevState); // Toggle dropdown visibility
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    setLoading(true);
    await firebaseSignOut(auth);
    setTimeout(() => {
        toast.success("Logout Successful!");
        setIsLoggedIn(false); // Update login state in context
        router.push("/"); // Redirect to home
        setIsDropdownOpen(false); // Close the dropdown
        setLoading(false);
    }, 1000);
    
    
  };

  const handleProfileNav = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/profile");
      setIsDropdownOpen(false); // Close the dropdown
      setLoading(false);
  }, 1000);
    
  };

  return (
    <header className="flex justify-center items-center p-4 text-white">
      <div className="logo">
        <Link href="/">
          <img
            src='/logo.png'
            className="rounded-full w-16 h-16"
            alt="Logo"
          />
        </Link>
      </div>

      {/* Conditional Rendering */}
      {isLoggedIn ? (
        <div className="flex space-x-4">
          <button className="btn notification-icon">
            <i className="fas fa-bell text-white text-xl mr-3"></i>
          </button>
          <button
            className="btn profile-icon"
            onClick={handleToggleDropdown} // Toggle dropdown visibility
          >
            <i className="fas fa-user-circle text-white text-4xl mr-3"></i>
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div ref={dropdownRef} className="absolute right-7 mt-12 dropdown-menu rounded w-48">
              <ul>
                <li>
                  <button
                    onClick={handleProfileNav}
                    className="block px-4 py-2 text-sm w-full text-left"
                  >
                    Your Account
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm w-full text-left"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex space-x-4">
          <button
            className="btn login-button rounded"
            id="loginBtn"
            onClick={handleLoginClick}
          >
            LOGIN
          </button>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onSwitchToSignUp={handleSwitchToSignUp}
        onSwitchToForgotPwd={handleSwitchToForgotPwd}
      />

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={handleCloseSignUpModal}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {/* Forgot Password Modal */}
      <ForgotPwd
        isOpen={isForgotPwdModalOpen}
        onClose={handleCloseForgotPwdModal}
        onSwitchToLogin={handleSwitchTFromForgotPwdToLogin}
      />
    </header>
  );
};

export default Header;