/**
 * SignUpPage — Clerk sign-up with dark theme matching TaskLine aesthetic.
 */

import { SignUp } from "@clerk/clerk-react";

const clerkAppearance = {
  variables: {
    colorBackground: "#0f1117",
    colorPrimary: "#ff3b3b",
    colorText: "#ffffff",
    colorTextSecondary: "#ffffff80",
    colorInputBackground: "#ffffff08",
    colorInputText: "#ffffff",
    borderRadius: "12px",
    fontFamily: "'DM Sans', sans-serif",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      background: "linear-gradient(145deg, #0f1117, #161b26)",
      border: "1px solid #ffffff10",
      boxShadow: "0 8px 48px #00000080, 0 0 80px #ff3b3b08",
      borderRadius: "20px",
    },
    socialButtonsBlockButton: {
      background: "#ffffff08",
      border: "1px solid #ffffff14",
      color: "#ffffff",
      borderRadius: "12px",
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
    },
    formFieldInput: {
      background: "#ffffff08",
      border: "1px solid #ffffff14",
      color: "#ffffff",
      borderRadius: "10px",
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
      border: "none",
      borderRadius: "10px",
      fontWeight: 700,
      boxShadow: "0 4px 16px #ff3b3b30",
    },
  },
};

export default function SignUpPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080b12",
        backgroundImage:
          "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1a0a1a 0%, transparent 50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ marginBottom: "32px", textAlign: "center", animation: "fadeIn 0.5s ease both" }}>
        <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#ffffff40", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "6px" }}>
          PRIORITY QUEUE
        </div>
        <div style={{ fontSize: "36px", fontWeight: 800, color: "#ffffff", letterSpacing: "-1px", lineHeight: 1 }}>
          Task<span style={{ background: "linear-gradient(135deg, #ff3b3b, #ff6b35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Line</span>
        </div>
        <div style={{ marginTop: "12px", fontSize: "14px", color: "#ffffff50" }}>
          Create your account
        </div>
      </div>

      <div style={{ animation: "slideUp 0.6s ease 0.15s both" }}>
        <SignUp
          appearance={clerkAppearance}
          routing="path"
          path="/sign-up"
          afterSignUpUrl="/"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
