import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "react-query";
import { useAuth } from "./AuthContext";

const BadgeAwardsContext = createContext({
  data: null,
  refetch: () => {},
});

export const BadgesAwardsProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  const {
    data: fetchedData,
    error,
    refetch,
  } = useQuery(
    "badgesAwardsData",
    async () => {
      if (!user) throw new Error("User not authenticated");

      const token = await user.getIdToken(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await fetch(
        "https://interview-simulator-ruddy.vercel.app/get_badges_awards_data",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch badges awards data");
      return await res.json();
    },
    {
      enabled: !!user, // Only fetch if user is authenticated
      refetchInterval: 150000, // Poll every 200 seconds (adjust as needed)
      refetchOnWindowFocus: true, // Re-fetch when window is focused
    }
  );

  useEffect(() => {
    if (fetchedData) setData(fetchedData); // Update state with fetched data
    console.log("Fetched Award:", fetchedData);
  }, [fetchedData]);

  useEffect(() => {
    if (error) console.error("Error fetching badges awards data:", error);
  }, [error]);

  return (
    <BadgeAwardsContext.Provider value={{ data, refetch }}>
      {children}
    </BadgeAwardsContext.Provider>
  );
};

export const useBadgeAwardsData = () => useContext(BadgeAwardsContext);
