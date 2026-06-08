/**
 * App — Root component with ClerkProvider and routing.
 */

import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import QueueApp from "./QueueApp";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

function ClerkWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      navigate={(to) => navigate(to)}
      afterSignOutUrl="/sign-in"
    >
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <QueueApp />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
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
