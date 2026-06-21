/**
 * StreakRiskBanner — warning shown after 6pm if streak is at risk.
 */

import { useState, useEffect } from "react";

export default function StreakRiskBanner({ currentStreak, onDismiss }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #2a0a0a, #1a0808)",
        border: "1px solid #ff3b3b30",
        padding: "10px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        animation: "fadeIn 0.3s ease both",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "16px", animation: "borderPulse 1.4s ease-in-out infinite" }}>🔥</span>
      <span
        style={{
          fontSize: "13px",
          color: "#ff8888",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Your <strong style={{ color: "#FFD700" }}>{currentStreak} day streak</strong> is at risk!
        Complete a task to keep it going
      </span>
      <span style={{ fontSize: "14px" }}>🔥</span>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: "none",
          border: "none",
          color: "#ffffff30",
          fontSize: "14px",
          cursor: "pointer",
          marginLeft: "8px",
          padding: "2px 6px",
        }}
      >
        ✕
      </button>
    </div>
  );
}
