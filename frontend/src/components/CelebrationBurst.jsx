/**
 * CelebrationBurst — full-screen celebration animation
 * when a task is completed.
 */

export default function CelebrationBurst({ name }) {
  const emojis = ["🎉", "⭐", "✨", "🏆", "🎊", "💫"];
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          fontWeight: 900,
          color: "#FFD700",
          fontFamily: "'DM Sans', sans-serif",
          textShadow: "0 0 30px #FFD70080",
          animation: "celebFadeUp 1.8s ease forwards",
          letterSpacing: "-0.5px",
        }}
      >
        🏁 {name} crossed the finish line!
      </div>
      <div
        style={{
          display: "flex",
          gap: "16px",
          animation: "celebFadeUp 1.8s ease 0.1s forwards",
          opacity: 0,
        }}
      >
        {emojis.map((e, i) => (
          <span
            key={i}
            style={{
              fontSize: "28px",
              animation: `confettiBounce 0.6s ease ${i * 0.08}s both`,
            }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}
