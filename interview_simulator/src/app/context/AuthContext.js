"use client";
import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // Store the user object
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        setUser(firebaseUser); // Store the full user object

        // Extract user initials from display name or email
        let initials = "";
        if (firebaseUser.displayName) {
          initials = firebaseUser.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
        } else if (firebaseUser.email) {
          initials = firebaseUser.email[0].toUpperCase();
        }

        setUserInitials(initials);
      } else {
        setIsLoggedIn(false);
        setUser(null); // Clear user object when logged out
        setUserInitials("");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user, // Provide the user object
        setIsLoggedIn,
        userInitials,
        triggerLoginAnimation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
