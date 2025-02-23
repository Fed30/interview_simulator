import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "react-query";
import { useAuth } from "./AuthContext";

const AnalyticsPanelContext = createContext({
  data: null,
  refetch: () => {},
});

export const AnalyticsPanelProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  const {
    data: fetchedData,
    error,
    refetch,
  } = useQuery(
    "analyticsData",
    async () => {
      if (!user) throw new Error("User not authenticated");

      const token = await user.getIdToken(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await fetch(
        "http://127.0.0.1:5000/get_analytics_panel_data",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch analytics data");
      return await res.json();
    },
    {
      enabled: !!user, // Only fetch if user is authenticated
      refetchInterval: 60000, // Poll every 60 seconds (adjust as needed)
      refetchOnWindowFocus: true, // Re-fetch when window is focused
    }
  );

  useEffect(() => {
    if (fetchedData) setData(fetchedData); // Update state with fetched data
  }, [fetchedData]);

  useEffect(() => {
    if (error) console.error("Error fetching analytics data:", error);
  }, [error]);

  return (
    <AnalyticsPanelContext.Provider value={{ data, refetch }}>
      {children}
    </AnalyticsPanelContext.Provider>
  );
};

export const useAnalyticsPanelData = () => useContext(AnalyticsPanelContext);
