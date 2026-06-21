/**
 * useStreak — hook for streak state management.
 * Only active for authenticated users (not guests).
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { fetchStreak, completeStreak as apiCompleteStreak } from "../api/api";

export function useStreak() {
  const { getToken, isSignedIn } = useAuth();
  const [streak, setStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
    last_completed_date: null,
  });
  const [loading, setLoading] = useState(true);

  /** Fetch streak data on mount. */
  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await fetchStreak(getToken);
        setStreak(data);
      } catch (err) {
        console.error("Failed to fetch streak:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, getToken]);

  /** Record a completion and return whether streak increased. */
  const recordCompletion = useCallback(async () => {
    if (!isSignedIn) return false;
    try {
      const data = await apiCompleteStreak(getToken);
      setStreak(data);
      return data.streak_increased;
    } catch (err) {
      console.error("Failed to complete streak:", err);
      return false;
    }
  }, [isSignedIn, getToken]);

  /** Check if the user is at risk of losing their streak. */
  const isAtRisk = useCallback(() => {
    if (!isSignedIn || streak.current_streak === 0) return false;
    const now = new Date();
    const hour = now.getHours();
    if (hour < 18) return false; // Before 6pm — no warning

    // Check if already completed today
    if (streak.last_completed_date) {
      const today = now.toISOString().slice(0, 10);
      if (streak.last_completed_date === today) return false;
    }
    return true;
  }, [isSignedIn, streak]);

  return {
    streak,
    loading,
    recordCompletion,
    isAtRisk,
  };
}
