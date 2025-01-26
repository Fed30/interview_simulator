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
      toast.info("Please Login to Start Practising");
    }
  };



  return (
    <div className="font-mono">
      {/* Section 1: Main Section */}
      <section 
        className="relative py-24 bg-cover bg-center text-white h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold leading-tight">WELCOME TO THE INTERVIEW SIMULATOR</h1>
          <p className="text-lg mt-4 opacity-80">
            Start practicing for your interview with our AI-powered simulator. Get ready to ace your technical and behavioral interviews with personalized feedback.
          </p>
          <button
            className="btn start-btn mt-8 bg-blue-700 text-white px-8 py-4 rounded-lg hover:bg-blue-800 transition ease-in-out duration-300"
            id="startBtn"
            onClick={handleStartClick}
          >
            Start Practicing
          </button>
        </div>
      </section>

      {/* Section 2: Practice Industry Questions */}
      <section 
        className="py-20 bg-cover bg-center text-white h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/secondary_background.webp')",
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat', 
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold">Practice 500+ Industry-Standard Questions</h2>
          <p className="mt-4 text-lg opacity-80">
            Our curated collection of computer science interview questions will help you prepare for top tech companies. Enhance your skills with real-world problems.
          </p>
        </div>
      </section>

      {/* Section 3: Tailored Feedback */}
      <section 
        className="relative py-20 bg-cover bg-center text-white h-screen flex items-center justify-center"
        style={{ backgroundImage: "url('/feedback_background')" }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div> {/* Dark overlay */}
        
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          {/* Left Side: Text */}
          <div className="w-1/2 text-center pr-8">
            <h2 className="text-3xl font-semibold">Get Tailored Feedback</h2>
            <p className="mt-4 text-lg opacity-80">
              Receive customized insights and recommendations on your interview responses to help you improve. Focus on your weak points and get actionable advice.
            </p>
          </div>
          {/* Right Side: Image */}
          <img 
            src="https://hbr.org/resources/images/products/5678O_500.png" 
            alt="STAR Method" 
            className="w-1/2 h-full object-cover"
          />
        </div>
      </section>

      {/* Section 4: Analytics */}
      <section 
        className="py-20 bg-cover bg-center text-white h-screen flex items-center justify-center"
        style={{ 
          backgroundImage: "url('/analytics_background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold">Access Tailored Analytics</h2>
          <p className="mt-4 text-lg opacity-80">
            Track your progress and performance with detailed analytics to identify strengths and areas for improvement. Visualize your growth as you practice more.
          </p>
        </div>
      </section>

      {/* Section 5: STAR Method */}
      <section 
        className="relative py-20 bg-cover bg-center text-white h-screen flex items-center justify-center"
        style={{ backgroundImage: "url('/secondary_background.webp')" }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div> {/* Dark overlay */}
        
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          {/* Left Side: Image */}
          <img 
            src="/star_method_img.png" 
            alt="STAR Method" 
            className="w-1/2 h-full object-cover"
          />
          
          {/* Right Side: Text */}
          <div className="w-1/2 text-center pl-8">
            <h2 className="text-3xl font-semibold">Practice the STAR Method</h2>
            <p className="mt-4 text-lg opacity-80">
              Learn and practice the STAR method to confidently answer behavioral interview questions. Build your storytelling skills with structured examples.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
