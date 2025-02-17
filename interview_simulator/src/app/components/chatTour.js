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
  }, []); // Only run on client mount

  const steps = [
    {
      target: "#answer_method",
      content:
        "Welcome to the Interview Practice Session! This section helps you structure your responses. Use it as your guide to answer the questions effectively.",
      placement: "top",
      disableBeacon: true,
    },
    {
      target: "#timer",
      content:
        "Here's the timer for your practice session. Keep an eye on it to stay on track and manage your time wisely!",
      disableBeacon: true,
    },
    {
      target: ".progress-bar",
      content:
        "This progress bar shows how far you've come in your session. It helps you visualize your journey as you answer each question.",
      disableBeacon: true,
    },
    {
      target: "#chatEnd",
      content:
        "This is where the chat takes place. Your responses and interactions with the Interview Simulator will be displayed here. Start typing your answers below!",
      placement: "top",
      disableBeacon: true,
    },
    {
      target: "#text",
      content:
        "You can type your answers in this text box. Take your time, and remember to stay clear and concise!",
      placement: "left",
      disableBeacon: true,
    },
    {
      target: ".sendMsg-btn",
      content:
        "Once you're ready, click this button or the Enter key on your keyboard to send your message. Don't worry - you can always go back and adjust your answer before sending.",
      disableBeacon: true,
    },
    {
      target: "body",
      content:
        "Congratulations, you're all set! Click below to start the session.",
      disableBeacon: true,
      placement: "center",
      locale: { last: "Start" },
    },
  ];

  if (!isClient) {
    return null; // Do not render on server-side
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      disableBeacon={true} // Disables the beacon
      disableCloseOnEsc={true} // Disables closing when pressing ESC
      disableOverlayClose={true} // Disables closing when clicking outside
      hideCloseButton
      styles={{
        options: {
          arrowColor: "#6D81F2", // A cool muted blue for the arrows
          backgroundColor: "#1E2A3A", // A dark navy blue
          spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.5)", // Subtle shadow for focus effect
          overlayColor: "rgba(24, 29, 41, 0.8)", // A cool, dark blue overlay with some opacity
          primaryColor: "#6D81F2", // A soft teal color for the progress bar and buttons
          textColor: "#E3F2F8", // Light text color for readability
          borderRadius: "5px", // Smooth corners
          zIndex: 1000,
        },
      }}
      continuous
      showProgress
      scrollToFirstStep
      callback={(data) => {
        if (data.status === "finished") {
          localStorage.setItem("chatTourCompleted", "true"); // Save the completion state
          onComplete();
        }
      }}
    />
  );
};

export default ChatTour;
