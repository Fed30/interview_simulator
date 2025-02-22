"use client";
import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userInitials, setUserInitials] = useState("");
  const [loading, setLoading] = useState(true); // 🚀 Loading state to block other contexts

  const triggerLoginAnimation = () => {
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
      loginBtn.classList.add("pulse");
      setTimeout(() => {
        loginBtn.classList.remove("pulse");
      }, 5000);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        setUser(firebaseUser);

        // Extract initials from display name or email
        const initials = firebaseUser.displayName
          ? firebaseUser.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : firebaseUser.email?.[0].toUpperCase() || "";

        setUserInitials(initials);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setUserInitials("");
      }
      setLoading(false); //Auth state resolved
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner">
          <img
            src="/logo.png"
            alt="Interview Simulator"
            className="logo w-8 h-8 rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        setIsLoggedIn,
        userInitials,
        triggerLoginAnimation,
      }}
    >
      {children} {/* Render children only after auth check */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
