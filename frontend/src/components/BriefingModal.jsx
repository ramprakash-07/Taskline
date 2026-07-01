/**
 * BriefingModal — Full-screen morning briefing overlay.
 * Shows task count, up-next preview, streak, and urgent warnings.
 */

export default function BriefingModal({ briefing, onDismiss }) {
  if (!briefing) return null;

  const upNext = briefing.up_next;
  const PRIORITIES = {
    CRITICAL: { label: "Critical", color: "#ff3b3b", bg: "#2a0a0a" },
    HIGH:     { label: "High",     color: "#ff8c00", bg: "#2a1500" },
    NORMAL:   { label: "Normal",   color: "#00c9a7", bg: "#002a22" },
    LOW:      { label: "Low",      color: "#7b8cde", bg: "#0d1030" },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Sun emoji */}
        <div style={styles.sunEmoji}>☀️</div>

        {/* Greeting */}
        <div style={styles.greeting}>Good morning!</div>

        {/* Task count */}
        <div style={styles.taskCount}>
          <span style={styles.countNumber}>{briefing.task_count}</span>{" "}
          task{briefing.task_count !== 1 ? "s" : ""} in your queue
        </div>

        {/* Up Next preview */}
        {upNext && (
          <div style={styles.upNextCard}>
            <div style={styles.upNextLabel}>▶ UP NEXT</div>
            <div style={styles.upNextName}>{upNext.name}</div>
            <div style={styles.upNextTask}>{upNext.task}</div>
            <div style={styles.upNextMeta}>
              {upNext.priority && PRIORITIES[upNext.priority] && (
                <span
                  style={{
                    background: PRIORITIES[upNext.priority].bg,
                    color: PRIORITIES[upNext.priority].color,
                    fontSize: "10px",
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    border: `1px solid ${PRIORITIES[upNext.priority].color}44`,
                  }}
                >
                  {PRIORITIES[upNext.priority].label.toUpperCase()}
                </span>
              )}
              {upNext.deadline && (
                <span style={styles.deadlineTag}>
                  ⏰ {new Date(upNext.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Streak display */}
        {briefing.streak > 0 && (
          <div style={styles.streakRow}>
            <span style={{ fontSize: "20px" }}>🔥</span>
            <span style={styles.streakText}>{briefing.streak} day streak</span>
          </div>
        )}

        {/* Urgent warning */}
        {briefing.urgent_count > 0 && (
          <div style={styles.urgentBanner}>
            ⚠️ <strong>{briefing.urgent_count}</strong> urgent task{briefing.urgent_count !== 1 ? "s" : ""} need attention
          </div>
        )}

        {/* Dismiss button */}
        <button onClick={onDismiss} style={styles.dismissBtn}>
          Let's go 🏁
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.35s ease both",
  },
  card: {
    width: "480px",
    maxWidth: "90vw",
    background: "linear-gradient(145deg, #12151f, #0a0d14)",
    border: "1px solid #ffffff14",
    borderRadius: "24px",
    padding: "40px 36px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px #ffffff08 inset",
    animation: "slideUp 0.4s cubic-bezier(.4,0,.2,1) both",
    animationDelay: "0.1s",
  },
  sunEmoji: {
    fontSize: "56px",
    lineHeight: 1,
    animation: "streakScaleUp 0.5s ease both",
    animationDelay: "0.2s",
  },
  greeting: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#ffffff",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "-0.5px",
  },
  taskCount: {
    fontSize: "16px",
    color: "#ffffff80",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
  },
  countNumber: {
    color: "#FFD700",
    fontWeight: 800,
    fontSize: "20px",
    fontFamily: "'DM Mono', monospace",
  },
  upNextCard: {
    width: "100%",
    background: "linear-gradient(145deg, #1a0a0a, #2a0f0f)",
    border: "1.5px solid #ff3b3b55",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 0 30px #ff3b3b15",
    marginTop: "4px",
  },
  upNextLabel: {
    fontSize: "10px",
    fontFamily: "'DM Mono', monospace",
    color: "#ff3b3b",
    fontWeight: 700,
    letterSpacing: "1px",
  },
  upNextName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#ffffff",
    fontFamily: "'DM Sans', sans-serif",
  },
  upNextTask: {
    fontSize: "13px",
    color: "#ffffff80",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.4,
  },
  upNextMeta: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  deadlineTag: {
    fontSize: "10px",
    fontFamily: "'DM Mono', monospace",
    color: "#ffffff50",
    fontWeight: 600,
  },
  streakRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "#FFD70010",
    border: "1px solid #FFD70025",
    borderRadius: "12px",
    width: "100%",
    justifyContent: "center",
  },
  streakText: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#FFD700",
    fontFamily: "'DM Sans', sans-serif",
  },
  urgentBanner: {
    width: "100%",
    textAlign: "center",
    padding: "10px 16px",
    background: "#ff3b3b12",
    border: "1px solid #ff3b3b33",
    borderRadius: "12px",
    color: "#ff8888",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
  },
  dismissBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
    border: "none",
    color: "#fff",
    borderRadius: "14px",
    padding: "14px 24px",
    cursor: "pointer",
    fontSize: "16px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 800,
    boxShadow: "0 8px 32px #ff3b3b40",
    marginTop: "8px",
    transition: "all 0.2s ease",
    letterSpacing: "0.3px",
  },
};
