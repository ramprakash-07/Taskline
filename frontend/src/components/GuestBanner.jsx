/**
 * GuestBanner — countdown banner shown in guest mode.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGuest } from "../contexts/GuestContext";

function formatTimeLeft(ms) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function GuestBanner() {
  const { expiresAt } = useGuest();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt) - new Date();
      setTimeLeft(formatTimeLeft(ms));
      setUrgent(ms < 30 * 60 * 1000); // < 30 min
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <div
      style={{
        background: urgent
          ? "linear-gradient(90deg, #2a0a0a, #1a0505)"
          : "linear-gradient(90deg, #2a1800, #1a0f00)",
        border: `1px solid ${urgent ? "#ff3b3b44" : "#f5a62344"}`,
        padding: "10px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        animation: "fadeIn 0.3s ease both",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          color: urgent ? "#ff8888" : "#f5c518",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span style={{ fontSize: "16px" }}>👤</span>
        You're using <strong>Guest Mode</strong> — your queue will be deleted in{" "}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontWeight: 700,
            color: urgent ? "#ff3b3b" : "#FFD700",
            animation: urgent ? "borderPulse 1.4s ease-in-out infinite" : "none",
          }}
        >
          {timeLeft}
        </span>
      </div>

      <div style={{ fontSize: "13px", color: "#ffffff50" }}>·</div>

      <div
        style={{
          fontSize: "13px",
          color: urgent ? "#ff8888" : "#f5c518",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Sign up to save it permanently.
      </div>

      <button
        onClick={() => navigate("/sign-up")}
        style={{
          background: "linear-gradient(135deg, #FFD700, #FFA500)",
          border: "none",
          color: "#000",
          borderRadius: "8px",
          padding: "6px 16px",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          boxShadow: "0 2px 12px #FFD70030",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        Sign Up →
      </button>
    </div>
  );
}
