"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";
import ForgotPwd from "./ForgotPasswordModal";
import { useAuth } from "../context/AuthContext";
import { auth, firebaseSignOut } from "../firebase";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useLoading } from "../context/LoadingContext";
import Image from "next/image";

const Header = () => {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const { userInitials } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isForgotPwdModalOpen, setIsForgotPwdModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrollingUp, setScrollingUp] = useState(true); // Track scroll direction
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { setLoading } = useLoading();

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Track the scroll position and detect scrolling direction
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const isScrollable =
        document.documentElement.scrollHeight > window.innerHeight;

      if (!isScrollable) {
        // If the page is not scrollable, keep the header visible
        setScrollingUp(true);
        return;
      }

      // If the page is scrollable, detect the scroll direction
      if (window.scrollY > lastScrollY) {
        setScrollingUp(false); // Scrolling down
      } else {
        setScrollingUp(true); // Scrolling up
      }

      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
    document.body.classList.add("modal-open");
  };

  const handleSignUpClick = () => {
    setIsSignUpModalOpen(true);
    document.body.classList.add("modal-open");
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
    document.body.classList.remove("modal-open");
  };

  const handleCloseSignUpModal = () => {
    setIsSignUpModalOpen(false);
    document.body.classList.remove("modal-open");
  };

  const handleCloseForgotPwdModal = () => {
    setIsForgotPwdModalOpen(false);
    document.body.classList.remove("modal-open");
  };

  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
    document.body.classList.add("modal-open");
  };

  const handleSwitchToForgotPwd = () => {
    setIsLoginModalOpen(false);
    setIsForgotPwdModalOpen(true);
    document.body.classList.add("modal-open");
  };

  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
    document.body.classList.add("modal-open");
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    setLoading(true);
    await firebaseSignOut(auth);
    setTimeout(() => {
      toast.success("Logout Successful!");
      setIsLoggedIn(false);
      router.push("/");
      setLoading(false);
    }, 1000);
  };

  const handleProfileNav = async (e) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    setLoading(true);
    setTimeout(() => {
      router.push("/profile");
      setLoading(false);
    }, 1000);
  };

  return (
    <header
      className={`flex justify-between items-center p-4 text-white ${
        !scrollingUp ? "header-hidden" : "header-visible"
      }`}
    >
      {/* Logo + Navigation Links */}
      <div className="flex items-center space-x-8">
        <Link href="/">
          <Image
            src="/logo.png"
            width={32}
            height={32}
            className="rounded w-7 h-7 transition duration-300 hover:scale-110"
            alt="Logo"
          />
        </Link>

        {/* Navigation Links */}
        {isLoggedIn && (
          <nav className="flex space-x-6 text-sm">
            <Link
              href="/"
              className="hover:text-[#6D81F2] hover:scale-110 transition"
            >
              HOME
            </Link>
            <Link
              href="/chat"
              className="hover:text-[#6D81F2] hover:scale-110 transition"
            >
              PRACTICE
            </Link>
          </nav>
        )}
      </div>

      {/* User Section */}
      {isLoggedIn ? (
        <div className="flex space-x-4">
          <button
            className="transition duration-300 hover:scale-110"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <div className="w-7 h-7 flex items-center justify-center bg-[#6D81F2] text-white font-bold rounded text-lg">
              {userInitials}
            </div>
          </button>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-7 mt-12 dropdown-menu rounded w-48 bg-gray-800 shadow-lg"
            >
              <ul>
                <li>
                  <button
                    onClick={handleProfileNav}
                    className="block px-4 py-2 text-sm w-full text-left"
                  >
                    My Profile
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
            onClick={() => handleLoginClick()}
          >
            LOGIN
          </button>
        </div>
      )}

      {/* Modals */}
      <LoginModal
        onSwitchToSignUp={handleSwitchToSignUp}
        onSwitchToForgotPwd={handleSwitchToForgotPwd}
        isOpen={isLoginModalOpen}
        onClose={() => handleCloseLoginModal()}
      />
      <SignUpModal
        onSwitchToLogin={handleSwitchToLogin}
        isOpen={isSignUpModalOpen}
        onClose={() => handleCloseSignUpModal()}
      />
      <ForgotPwd
        isOpen={isForgotPwdModalOpen}
        onClose={() => handleCloseForgotPwdModal()}
      />
    </header>
  );
};

export default Header;
