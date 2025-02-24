"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  startTransition,
} from "react";
import Joyride from "react-joyride";
import { useAuth } from "../context/AuthContext";

const ChatTour = ({ onComplete }) => {
  const [runTour, setRunTour] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    } else {
      setIsClient(true);
      const hasCompletedTour = localStorage.getItem("chatTourCompleted");
      if (!hasCompletedTour) setRunTour(true);
    }
  }, [user]);

  const handleComplete = useCallback(
    (data) => {
      if (data.status === "finished") {
        localStorage.setItem("chatTourCompleted", "true");

        // Ensure startTransition is used correctly
        startTransition(() => {
          onComplete();
        });
      }
    },
    [onComplete]
  );

  if (!isClient) return null;

  const steps = [
    {
      target: "#answer_method",
      content:
        "Welcome to the Interview Practice Session! This section helps you structure your responses.",
      placement: "top",
      disableBeacon: true,
    },
    {
      target: "#timer",
      content: "Here's the timer for your practice session.",
      disableBeacon: true,
    },
    {
      target: ".progress-bar",
      content: "This progress bar shows how far you've come in your session.",
      disableBeacon: true,
    },
    {
      target: "#chatEnd",
      content:
        "This is where the chat takes place. Start typing your answers below!",
      placement: "top",
      disableBeacon: true,
    },
    {
      target: "#text",
      content: "You can type your answers in this text box.",
      placement: "left",
      disableBeacon: true,
    },
    {
      target: ".sendMsg-btn",
      content: "Click this button or press Enter to send your message.",
      disableBeacon: true,
    },
    {
      target: "body",
      content:
        "Congratulations, you're all set! Click below to start the session.",
      placement: "center",
      disableBeacon: true,
      locale: { last: "Start" },
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={runTour}
      disableBeacon
      disableCloseOnEsc
      disableOverlayClose
      hideCloseButton
      continuous
      showProgress
      spotlightClicks={true}
      disableScrolling={true}
      scrollToFirstStep={false}
      styles={{
        options: {
          arrowColor: "#6D81F2",
          backgroundColor: "#1E2A3A",
          spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.5)",
          overlayColor: "rgba(24, 29, 41, 0.8)",
          primaryColor: "#6D81F2",
          textColor: "#E3F2F8",
          borderRadius: "5px",
          zIndex: 1000,
        },
      }}
      callback={handleComplete}
    />
  );
};

export default ChatTour;
