"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./firebase";
import { useAuth } from "./context/AuthContext";
import { toast } from 'react-toastify';
import { useLoading } from './context/LoadingContext';
import Image from "next/image";


const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { triggerLoginAnimation } = useAuth();
  const { setLoading } = useLoading();
  const [pageLoaded, setPageLoaded] = useState(false);
  

  useEffect(() => {
    setPageLoaded(true);
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
    <div className={` ${pageLoaded ? 'loaded' : ''}`} >
      {/* Section 1: Main Section */}
      <section
        className="relative py-24 text-white h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/challenges.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <h1 className="text-4xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2] leading-tight text-shadow-lg text-animated">
            WELCOME TO THE INTERVIEW SIMULATOR
          </h1>
          <p className="text-lg mt-4 opacity-90 text-shadow-md text-animated animate__animated animate__fadeIn animate__delay-1s">
            Start practicing for your interview with our AI-powered simulator. Get ready to ace your behavioral interviews with personalized feedback.
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
      <section className="relative py-20 text-white h-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>

        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 px-4">
          {/* Left Side: Image */}
          <Image
            src="/practice_questions.png"
            alt="Practice questions"
            width={400} 
            height={400}
            className="w-full sm:w-1/2 h-full object-cover image-hover mb-8 sm:mb-0"
          />

          {/* Right Side: Text */}
          <div className="w-full sm:w-1/2 text-center pr-8">
          <h2 className="lg:text-4xl text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2] relative pb-2">
            Practice 500+ Industry-Standard Questions
          </h2>

            <p className="text-lg mt-4 opacity-90 text-shadow-md text-animated animate__animated animate__fadeIn animate__delay-1s">
              Our curated collection of computer science interview questions will help you prepare for top tech companies. Enhance your skills with real-world problems.
            </p>

            {/* Skills Section */}
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="section-style p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
                  <h4 className="text-xl font-medium">Communication & Networking</h4>
                  <p className="mt-2 text-sm opacity-80">
                    Effective communication and networking are essential in every tech role to work collaboratively and build professional relationships.
                  </p>
                </div>

                <div className="section-style p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
                  <h4 className="text-xl font-medium">Teamwork & Collaboration</h4>
                  <p className="mt-2 text-sm opacity-80">
                    Being able to work in a team and collaborate efficiently is crucial in solving complex problems and achieving common goals.
                  </p>
                </div>

                <div className="section-style p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
                  <h4 className="text-xl font-medium">Analytical and Problem Solving</h4>
                  <p className="mt-2 text-sm opacity-80">
                    Analytical skills help you break down complex problems into manageable tasks and find efficient solutions.
                  </p>
                </div>

                <div className="section-style p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
                  <h4 className="text-xl font-medium">Creativity and Critical Thinking</h4>
                  <p className="mt-2 text-sm opacity-80">
                    Creativity helps generate unique solutions, while critical thinking ensures logical evaluation and informed decision-making.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Tailored Feedback */}
      <section
        className="relative py-20 bg-cover bg-center text-white h-auto flex items-center justify-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 px-4">
          {/* Left Side: Text */}
          <div className="w-full sm:w-1/2 text-center pr-8">
          <h2 className="lg:text-4xl text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2] relative pb-2">
            Get Tailored Feedback
          </h2>
            <p className="text-lg mt-4 opacity-90 text-shadow-md text-animated animate__animated animate__fadeIn animate__delay-1s">
              Receive customized insights and recommendations on your interview responses to help you improve. Focus on your weak points and get actionable advice.
            </p>
            <button
              className="btn start-btn mt-8 bg-blue-700 text-white px-8 py-4 rounded-lg hover:bg-blue-800 transition ease-in-out duration-300"
              id="startBtn"
              onClick={handleStartClick}
            >
              Start Practicing
            </button>
          </div>

          {/* Right Side: Image */}
          <Image
            src="/feedback.png"
            alt="Feedback"
            width={400} 
            height={400}
            className="w-full sm:w-1/2 h-full object-cover image-hover"
          />
        </div>
      </section>

      {/* Section 4: Analytics */}
      <section
        className="py-20 bg-cover bg-center text-white h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: "url('/collaboration.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center left',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <h2 className="lg:text-4xl text-2xl font-semibold text-shadow-lg">
            Access Tailored Analytics
          </h2>
          <p className="text-lg mt-4 opacity-90 text-shadow-md text-animated animate__animated animate__fadeIn animate__delay-1s">
            Track your progress and performance with detailed analytics to identify strengths and areas for improvement. Visualize your growth as you practice more.
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

      {/* Section 5: STAR Method */}
      <section className="relative py-20 text-white h-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>

        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 px-4">
          {/* Left Side: Image */}
          <Image
            src="/star_method.png"
            alt="STAR Method"
            width={400} 
            height={400}
            className="w-full sm:w-1/2 h-full object-cover image-hover mb-8 sm:mb-0"
          />

          {/* Right Side: Text & Interactive Content */}
          <div className="w-full sm:w-1/2 text-center pl-8">
            <h2 className="lg:text-4xl text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2] relative pb-2">
              Practice the STAR method
            </h2>
            <p className="text-lg mt-4 opacity-90 text-shadow-md text-animated animate__animated animate__fadeIn animate__delay-1s">
              Learn and practice the STAR method to confidently answer behavioral interview questions. Build your storytelling skills with structured examples.
            </p>

            {/* Real-Life Example */}
            <div className="mt-4">
              <h3 className="text-2xl font-semibold">Real-Life Example</h3>
              <div className="mt-6 section-style p-6 rounded-lg shadow-lg">
                <p className="text-lg opacity-80">
                  <strong>Situation:</strong> Describe a challenging situation you faced at work. <br />
                  <strong>Task:</strong> Explain the task you were given. <br />
                  <strong>Action:</strong> Describe the actions you took to overcome the challenge. <br />
                  <strong>Result:</strong> Share the positive results of your actions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

  );
};

export default Home;
