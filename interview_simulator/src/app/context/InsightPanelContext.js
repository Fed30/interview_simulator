import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "react-query";
import { useAuth } from "./AuthContext";

const InsightPanelContext = createContext({
  data: null,
  refetch: () => {},
});

export const InsightPanelProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  const {
    data: fetchedData,
    error,
    refetch,
  } = useQuery(
    "insightData",
    async () => {
      if (!user) throw new Error("User not authenticated");

      const token = await user.getIdToken(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await fetch(
        "https://interview-simulator-nu.vercel.app/get_insight_panel_data",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch insight data");
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
    if (error) console.error("Error fetching insight data:", error);
  }, [error]);

  return (
    <InsightPanelContext.Provider value={{ data, refetch }}>
      {children}
    </InsightPanelContext.Provider>
  );
};

export const useInsightPanelData = () => useContext(InsightPanelContext);
