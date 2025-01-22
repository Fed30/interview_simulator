"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./firebase";
import { useAuth } from "./context/AuthContext";
import { toast } from 'react-toastify';
import { useLoading } from './context/LoadingContext';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { triggerLoginAnimation } = useAuth();
  const { setLoading } = useLoading();
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleStartClick = () => {
    setLoading(true);
    if (isLoggedIn) {
      setTimeout(() => {
        router.push("/chat");
        setLoading(false)
      }, 2000);
      
    } else {
      setLoading(false)
      triggerLoginAnimation();
      toast.error("Please Login");
    }
  };



  return (
    <div>

      <main>
        <div className="center-wrapper">
          <div className="welcome-message">
            <h1>WELCOME TO THE INTERVIEW SIMULATOR</h1>
            <p>Start practicing for your interview with our AI-powered simulator.</p>
          </div>

          <button
            className="btn start-btn"
            id="startBtn"
            onClick={handleStartClick}
          >
            Start Practicing
          </button>
        </div>

        
      </main>
    </div>
  );
};

export default Home;
