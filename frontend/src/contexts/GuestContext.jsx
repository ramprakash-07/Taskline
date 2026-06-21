/**
 * GuestContext — manages guest session state.
 * Stores guest_id in sessionStorage (cleared on tab close).
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createGuestSession } from "../api/api";

const GuestContext = createContext(null);

export function GuestProvider({ children }) {
  const [guestId, setGuestId] = useState(() => sessionStorage.getItem("taskline_guest_id"));
  const [expiresAt, setExpiresAt] = useState(() => {
    const stored = sessionStorage.getItem("taskline_guest_expires");
    return stored ? new Date(stored) : null;
  });

  const isGuest = !!guestId;

  /** Start a new guest session via the API. */
  const startGuestSession = useCallback(async () => {
    const session = await createGuestSession();
    setGuestId(session.guest_id);
    setExpiresAt(new Date(session.expires_at));
    sessionStorage.setItem("taskline_guest_id", session.guest_id);
    sessionStorage.setItem("taskline_guest_expires", session.expires_at);
    return session;
  }, []);

  /** Clear the guest session. */
  const clearGuest = useCallback(() => {
    setGuestId(null);
    setExpiresAt(null);
    sessionStorage.removeItem("taskline_guest_id");
    sessionStorage.removeItem("taskline_guest_expires");
  }, []);

  /** Check if session has expired. */
  useEffect(() => {
    if (!expiresAt) return;
    const now = new Date();
    if (now >= expiresAt) {
      clearGuest();
      return;
    }
    // Auto-clear when session expires
    const timeout = setTimeout(clearGuest, expiresAt - now);
    return () => clearTimeout(timeout);
  }, [expiresAt, clearGuest]);

  return (
    <GuestContext.Provider value={{ guestId, isGuest, expiresAt, startGuestSession, clearGuest }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}
