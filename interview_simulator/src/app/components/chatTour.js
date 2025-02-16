"use client";
import React, { useState, useEffect } from "react";
import Joyride from "react-joyride";

const ChatTour = ({ onComplete }) => {
  const [runTour, setRunTour] = useState(false); // Controls whether the tour runs
  const [isClient, setIsClient] = useState(false); // State to determine if we are on the client side

  useEffect(() => {
    // This will only run on the client side
    setIsClient(true);
    console.log("Running on client side");

    // Check if the user has already completed the tour
    const hasCompletedTour = localStorage.getItem("chatTourCompleted");

    if (!hasCompletedTour) {
      // If not completed, start the tour immediately
      setRunTour(true);
    }
  }, []);

  const handleTourEnd = () => {
    // Set in localStorage that the tour is completed
    localStorage.setItem("chatTourCompleted", "true");
    setRunTour(false); // Stop the tour after completion
    onComplete();
  };

  const steps = [
    {
      target: "#notice",
      content:
        "This is the STAR method booklet section. Use this method to answer the questions",
      placement: "top",
    },
    {
      target: "#timer",
      content:
        "This is the chat header where you'll see the timer for your practice session",
    },
    {
      target: ".progress-bar",
      content:
        "This is your progress bar. It shows how far you are in the session.",
    },
    {
      target: "#chatEnd",
      content:
        "Here, you'll see the chat messages. You'll interact with the bot here.",
      placement: "top",
    },
    {
      target: "#text",
      content: "Write your answers here",
      placement: "left",
    },
    {
      target: ".sendMsg-btn",
      content: "Click this button to send your message.",
    },
  ];

  if (!isClient) {
    return null; // Do not render on server-side
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      styles={{
        options: {
          arrowColor: "#2A2A40",
          backgroundColor: "#2A2A40",
          spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.5)",
          overlayColor: "rgba(79, 26, 0, 0.4)",
          primaryColor: "#6D81F2",
          textColor: "white",
          zIndex: 1000,
        },
      }}
      continuous
      showProgress
      scrollToFirstStep
      callback={(data) => {
        if (data.status === "finished") {
          handleTourEnd(); // Call when tour finishes
        }
      }}
    />
  );
};

export default ChatTour;
