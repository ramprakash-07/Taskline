/**
 * App — Root component with ClerkProvider, GuestProvider, and routing.
 * Handles guest-to-account conversion automatically after sign-up.
 */

import { useState, useEffect } from "react";
import { ClerkProvider, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { GuestProvider, useGuest } from "./contexts/GuestContext";
import { convertGuestQueue } from "./api/api";
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import QueueApp from "./QueueApp";
import LandingPage from "./LandingPage";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

/**
 * GuestConversion — detects "signed in + guest session still active"
 * and auto-converts the guest queue to the authenticated user's account.
 */
function GuestConversion({ children }) {
  const { isSignedIn, getToken } = useAuth();
  const { guestId, isGuest, clearGuest } = useGuest();
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !isGuest || !guestId || converting) return;

    console.log("[TaskLine] Detected signed-in user with active guest session. Converting...");
    setConverting(true);

    (async () => {
      try {
        const result = await convertGuestQueue(getToken, guestId);
        console.log("[TaskLine] Guest conversion success:", result.message);
      } catch (err) {
        // Conversion may fail if guest session expired or had no items — that's OK
        console.warn("[TaskLine] Guest conversion failed (non-critical):", err.response?.data?.detail || err.message);
      } finally {
        clearGuest();
        setConverting(false);
        console.log("[TaskLine] Guest session cleared. User is fully authenticated.");
      }
    })();
  }, [isSignedIn, isGuest, guestId, getToken, clearGuest, converting]);

  if (converting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080b12",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div className="spinner" />
        <div
          style={{
            color: "#ffffff40",
            fontSize: "13px",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "1px",
          }}
        >
          CONVERTING YOUR GUEST QUEUE...
        </div>
      </div>
    );
  }

  return children;
}

/**
 * MainRoute — handles 3 states:
 * 1. Signed in → QueueApp (authenticated)
 * 2. Guest session active → QueueApp (guest mode)
 * 3. Neither → LandingPage
 */
function MainRoute() {
  const { isGuest } = useGuest();

  return (
    <>
      <SignedIn>
        <QueueApp />
      </SignedIn>
      <SignedOut>
        {isGuest ? <QueueApp /> : <LandingPage />}
      </SignedOut>
    </>
  );
}

function ClerkWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      navigate={(to) => navigate(to)}
      afterSignOutUrl="/"
      afterSignUpUrl="/"
      afterSignInUrl="/"
    >
      <GuestProvider>
        <GuestConversion>
          <Routes>
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/*" element={<MainRoute />} />
          </Routes>
        </GuestConversion>
      </GuestProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkWithRoutes />
    </BrowserRouter>
  );
}
