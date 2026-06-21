/**
 * ShareStreakCard — generates a downloadable PNG streak card via HTML Canvas.
 */

import { useCallback } from "react";

export default function ShareStreakCard({ currentStreak, longestStreak }) {
  const generateAndDownload = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, "#080b12");
    grad.addColorStop(0.5, "#0d1f3c");
    grad.addColorStop(1, "#1a0a1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Subtle radial glow
    const radial = ctx.createRadialGradient(300, 200, 0, 300, 200, 300);
    radial.addColorStop(0, "rgba(255,59,59,0.08)");
    radial.addColorStop(1, "transparent");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 600, 400);

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    ctx.roundRect(8, 8, 584, 384, 20);
    ctx.stroke();

    // Top label
    ctx.font = "500 11px 'DM Mono', monospace, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.fillText("PRIORITY QUEUE", 300, 50);

    // TaskLine title
    ctx.font = "800 32px 'DM Sans', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("TaskLine", 300, 85);

    // Divider line
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 105);
    ctx.lineTo(400, 105);
    ctx.stroke();

    // Fire emoji (text)
    ctx.font = "60px sans-serif";
    ctx.fillText("🔥", 300, 180);

    // Current streak number
    ctx.font = "800 64px 'DM Sans', sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD70060";
    ctx.shadowBlur = 30;
    ctx.fillText(String(currentStreak), 300, 250);
    ctx.shadowBlur = 0;

    // "day streak" label
    ctx.font = "500 16px 'DM Mono', monospace, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(currentStreak === 1 ? "day streak" : "day streak", 300, 278);

    // Longest streak
    ctx.font = "500 13px 'DM Mono', monospace, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(`Longest: ${longestStreak} days`, 300, 315);

    // Bottom branding
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(150, 345);
    ctx.lineTo(450, 345);
    ctx.stroke();

    ctx.font = "500 12px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillText("Your work lines up — so you always know what's next", 300, 370);

    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskline-streak-${currentStreak}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [currentStreak, longestStreak]);

  if (currentStreak <= 0) return null;

  return (
    <button
      onClick={generateAndDownload}
      title="Download streak card"
      style={{
        background: "#ffffff08",
        border: "1px solid #ffffff14",
        color: "#ffffff50",
        borderRadius: "8px",
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: "11px",
        fontFamily: "'DM Mono', monospace",
        fontWeight: 600,
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      📤 Share
    </button>
  );
}
