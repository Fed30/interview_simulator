"use client"
import React, { createContext, useState, useContext } from 'react';

// Create Context for loading state
const LoadingContext = createContext();

// Create a provider component
export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook to use the loading context
export const useLoading = () => useContext(LoadingContext);
