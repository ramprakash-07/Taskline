/**
 * CelebrationBurst — cinematic completion animation.
 * Phase 1: Screen shake (150ms)
 * Phase 2: Radial particle burst + gold light ring (~500ms)
 * Phase 3: Streak celebration if streak increased
 * Optional pop sound via Web Audio API.
 */

import { useEffect, useRef, useState, useMemo } from "react";

/** Generate a short synth "pop" sound. */
function playPopSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);

    // Cleanup
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not supported — silently skip
  }
}

/** Generate random particles for the burst. */
function generateParticles(count = 24) {
  const colors = ["#FFD700", "#FFA500", "#ff3b3b", "#ff6b35", "#00c9a7", "#a855f7", "#f5c518", "#fff"];
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 80 + Math.random() * 120;
    const size = 4 + Math.random() * 8;
    const rotation = Math.random() * 360;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation,
      delay: Math.random() * 0.1,
      shape: Math.random() > 0.5 ? "circle" : "rect",
    };
  });
}

export default function CelebrationBurst({ name, streakIncreased, newStreak }) {
  const [phase, setPhase] = useState(0); // 0=shake, 1=burst, 2=fade
  const particles = useMemo(() => generateParticles(28), []);
  const didPlaySound = useRef(false);

  useEffect(() => {
    // Phase 0: Screen shake
    document.body.classList.add("screen-shake");
    if (!didPlaySound.current) {
      playPopSound();
      didPlaySound.current = true;
    }

    const t1 = setTimeout(() => {
      document.body.classList.remove("screen-shake");
      setPhase(1); // Burst
    }, 150);

    const t2 = setTimeout(() => setPhase(2), 900); // Start fade

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.classList.remove("screen-shake");
    };
  }, []);

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
        gap: "16px",
      }}
    >
      {/* Gold light ring */}
      <div
        style={{
          position: "absolute",
          width: "0px",
          height: "0px",
          borderRadius: "50%",
          border: "3px solid #FFD70080",
          boxShadow: "0 0 40px #FFD70040, inset 0 0 40px #FFD70020",
          animation: phase >= 1 ? "lightRingExpand 0.6s ease-out forwards" : "none",
        }}
      />

      {/* Confetti particles */}
      {phase >= 1 &&
        particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${p.size}px`,
              height: p.shape === "rect" ? `${p.size * 0.6}px` : `${p.size}px`,
              background: p.color,
              borderRadius: p.shape === "circle" ? "50%" : "2px",
              opacity: 0,
              animation: `particleBurst 0.7s ease-out ${p.delay}s forwards`,
              "--px": `${p.x}px`,
              "--py": `${p.y}px`,
              "--pr": `${p.rotation}deg`,
            }}
          />
        ))}

      {/* Name text */}
      <div
        style={{
          fontSize: "26px",
          fontWeight: 900,
          color: "#FFD700",
          fontFamily: "'DM Sans', sans-serif",
          textShadow: "0 0 30px #FFD70080",
          animation: phase >= 1 ? "celebFadeUp 1.6s ease forwards" : "none",
          opacity: phase >= 1 ? undefined : 0,
          letterSpacing: "-0.5px",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        🏁 {name} crossed the finish line!
      </div>

      {/* Streak celebration */}
      {streakIncreased && newStreak > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: phase >= 1 ? "streakScaleUp 0.8s ease 0.2s both" : "none",
            opacity: 0,
          }}
        >
          <span style={{ fontSize: "32px" }}>🔥</span>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#FFD700",
              fontFamily: "'DM Mono', monospace",
              textShadow: "0 0 20px #FFD70060",
            }}
          >
            {newStreak}
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "#ffffff80",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
          >
            day streak!
          </span>
        </div>
      )}
    </div>
  );
}
