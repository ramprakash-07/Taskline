import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { fetchBriefing, dismissBriefing as apiDismiss } from "../api/api";

export function useBriefing() {
  const { getToken, isSignedIn } = useAuth();
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { setLoading(false); return; }
    (async () => {
      try {
        const data = await fetchBriefing(getToken);
        setBriefing(data);
        // Show modal if not dismissed today and it's after briefing time
        if (!data.dismissed_today && data.task_count > 0) {
          // Check if already shown this session
          const lastShown = sessionStorage.getItem("taskline_briefing_shown");
          const today = new Date().toISOString().slice(0, 10);
          if (lastShown !== today) {
            setShowModal(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch briefing:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, getToken]);

  const dismiss = useCallback(async () => {
    setShowModal(false);
    sessionStorage.setItem("taskline_briefing_shown", new Date().toISOString().slice(0, 10));
    try {
      await apiDismiss(getToken);
    } catch {}
  }, [getToken]);

  return { briefing, loading, showModal, dismiss };
}
