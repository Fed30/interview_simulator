"use client";
import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitials, setUserInitials] = useState("");

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);

        // Extract user initials from display name or email
        let initials = "";
        if (user.displayName) {
          initials = user.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
        } else if (user.email) {
          initials = user.email[0].toUpperCase();
        }

        setUserInitials(initials);
      } else {
        setIsLoggedIn(false);
        setUserInitials("");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, userInitials, triggerLoginAnimation }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
