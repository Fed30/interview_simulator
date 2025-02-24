"use client";
import React from "react";
import { useLoading } from "../context/LoadingContext"; // Import the useLoading hook
import Image from "next/image";

const Spinner = () => {
  const { loading } = useLoading(); // Get loading state from context

  if (!loading) return null; // Don't render the spinner if not loading

  return (
    <div className="spinner-container">
      <div className="spinner">
        <Image
          src="/logo.png"
          alt="Chatbot"
          width={32}
          height={32}
          className="logo w-8 h-8 rounded-full"
        />
      </div>
    </div>
  );
};

export default Spinner;
