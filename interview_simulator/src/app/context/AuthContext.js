"use client"
import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase'; // Assuming firebase is set up correctly
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
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
        // Check the user's login state when the app loads
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
        });

        return () => unsubscribe();
    }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn , triggerLoginAnimation}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
