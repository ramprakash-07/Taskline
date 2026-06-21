/**
 * App — Root component with ClerkProvider, GuestProvider, and routing.
 * Supports authenticated users (Clerk) and guest sessions.
 */

import { ClerkProvider, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { GuestProvider, useGuest } from "./contexts/GuestContext";
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import QueueApp from "./QueueApp";
import LandingPage from "./LandingPage";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

/**
 * Protected route that handles 3 states:
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
    >
      <GuestProvider>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/*" element={<MainRoute />} />
        </Routes>
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
