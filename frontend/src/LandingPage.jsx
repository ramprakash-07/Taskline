/**
 * LandingPage — entry point for unauthenticated users.
 * Offers Sign In or Try as Guest.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGuest } from "./contexts/GuestContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { startGuestSession } = useGuest();
  const [loading, setLoading] = useState(false);

  const handleGuest = async () => {
    setLoading(true);
    try {
      await startGuestSession();
      navigate("/");
    } catch (err) {
      console.error("Failed to start guest session:", err);
    } finally {
      setLoading(false);
    }
  };

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
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease both" }}>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "'DM Mono', monospace",
            color: "#ffffff40",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          PRIORITY QUEUE
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-1.5px",
            lineHeight: 1,
          }}
        >
          Task
          <span
            style={{
              background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Line
          </span>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: "16px",
          fontSize: "17px",
          color: "#ffffff60",
          textAlign: "center",
          maxWidth: "400px",
          lineHeight: 1.5,
          animation: "fadeIn 0.5s ease 0.1s both",
        }}
      >
        Your work lines up — so you always know what's next.
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "28px",
          flexWrap: "wrap",
          justifyContent: "center",
          animation: "fadeIn 0.5s ease 0.2s both",
        }}
      >
        {["🏁 Finish Line", "🌡️ Deadline Glow", "🖱️ Drag & Drop", "⇅ Priority Sort"].map(
          (label) => (
            <div
              key={label}
              style={{
                background: "#ffffff08",
                border: "1px solid #ffffff10",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "12px",
                color: "#ffffff50",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {label}
            </div>
          )
        )}
      </div>

      {/* CTAs */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginTop: "40px",
          alignItems: "center",
          animation: "slideUp 0.6s ease 0.3s both",
        }}
      >
        <button
          onClick={() => navigate("/sign-in")}
          style={{
            background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
            border: "none",
            color: "#fff",
            borderRadius: "12px",
            padding: "14px 48px",
            cursor: "pointer",
            fontSize: "15px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            boxShadow: "0 4px 24px #ff3b3b30",
            transition: "all 0.2s ease",
            width: "260px",
            letterSpacing: "0.3px",
          }}
        >
          Sign In
        </button>

        <button
          onClick={handleGuest}
          disabled={loading}
          style={{
            background: "#ffffff08",
            border: "1px solid #ffffff18",
            color: "#ffffff80",
            borderRadius: "12px",
            padding: "14px 48px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            transition: "all 0.2s ease",
            width: "260px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Starting..." : "Try as Guest"}
        </button>

        <div
          style={{
            fontSize: "11px",
            color: "#ffffff25",
            fontFamily: "'DM Mono', monospace",
            marginTop: "4px",
          }}
        >
          No account needed · 2 hour session
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          fontSize: "11px",
          color: "#ffffff15",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "1px",
        }}
      >
        BUILT WITH ❤️ BY RAMPRAKASH
      </div>
    </div>
  );
}
