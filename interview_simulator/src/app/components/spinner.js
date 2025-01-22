"use client"
import React from 'react';
import { useLoading } from '../context/LoadingContext'; // Import the useLoading hook

const Spinner = () => {
  const { loading } = useLoading(); // Get loading state from context

  if (!loading) return null; // Don't render the spinner if not loading

  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
};

export default Spinner;
