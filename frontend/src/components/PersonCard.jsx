/**
 * PersonCard — individual queue card with avatar, priority badge,
 * deadline urgency, drag-to-reorder, and action buttons.
 */

export const PRIORITIES = {
  CRITICAL: { label: "Critical", color: "#ff3b3b", bg: "#2a0a0a", order: 0 },
  HIGH:     { label: "High",     color: "#ff8c00", bg: "#2a1500", order: 1 },
  NORMAL:   { label: "Normal",   color: "#00c9a7", bg: "#002a22", order: 2 },
  LOW:      { label: "Low",      color: "#7b8cde", bg: "#0d1030", order: 3 },
};

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "#e8445a", "#f7931e", "#29abe2", "#00c9a7",
  "#a855f7", "#ec4899", "#84cc16", "#f59e0b",
];

function avatarColor(name) {
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getDeadlineUrgency(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  const hoursLeft = (due - now) / (1000 * 60 * 60);
  if (hoursLeft < 0)  return { level: 4, label: "OVERDUE",   color: "#ff0040", pulse: true  };
  if (hoursLeft < 6)  return { level: 3, label: "DUE SOON",  color: "#ff3b3b", pulse: true  };
  if (hoursLeft < 24) return { level: 2, label: "TODAY",     color: "#ff8c00", pulse: false };
  if (hoursLeft < 72) return { level: 1, label: "THIS WEEK", color: "#f5c518", pulse: false };
  return                     { level: 0, label: "ON TRACK",  color: "#00c9a7", pulse: false };
}

function DeadlineGlow({ urgency }) {
  if (!urgency) return null;
  const colors = [null, "#f5c51840", "#ff8c0050", "#ff3b3b60", "#ff004070"];
  const shadows = [
    null,
    "0 0 20px #f5c51830",
    "0 0 28px #ff8c0040",
    "0 0 36px #ff3b3b55",
    "0 0 44px #ff004066",
  ];
  if (urgency.level === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: "-3px",
        borderRadius: "19px",
        border: `2px solid ${colors[urgency.level]}`,
        boxShadow: shadows[urgency.level],
        animation: urgency.pulse ? "borderPulse 1.4s ease-in-out infinite" : "none",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

function FinishRibbon({ onComplete }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "-18px",
        right: "-18px",
        zIndex: 10,
        cursor: "pointer",
      }}
      onClick={onComplete}
      title="Mark as done!"
    >
      <div
        style={{
          background: "linear-gradient(135deg, #FFD700, #FFA500)",
          color: "#000",
          fontSize: "9px",
          fontWeight: 900,
          fontFamily: "'DM Mono', monospace",
          padding: "3px 7px 3px 10px",
          borderRadius: "2px 4px 4px 2px",
          letterSpacing: "0.5px",
          boxShadow: "0 2px 8px #FFD70060",
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)",
          whiteSpace: "nowrap",
          animation: "ribbonWave 2s ease-in-out infinite",
        }}
      >
        ✓ DONE
      </div>
      <div
        style={{
          width: "2px",
          height: "14px",
          background: "linear-gradient(180deg, #FFD700, #B8860B)",
          margin: "0 auto",
          borderRadius: "1px",
        }}
      />
    </div>
  );
}

function btnStyle(bg, color = "#ffffff80") {
  return {
    flex: 1,
    background: bg,
    border: "none",
    borderRadius: "8px",
    color,
    fontSize: "12px",
    padding: "5px 0",
    cursor: "pointer",
    transition: "background 0.2s",
    fontFamily: "inherit",
  };
}

export default function PersonCard({
  person,
  index,
  total,
  onMoveFirst,
  onMoveLast,
  onDelete,
  onComplete,
  onEdit,
  isDragging,
  isHighlighted,
  isCompleting,
  isBouncing,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const isFirst = index === 0;
  const p = PRIORITIES[person.priority] || PRIORITIES.NORMAL;
  const urgency = getDeadlineUrgency(person.deadline);

  // Determine animation
  let anim = "cardIn 0.4s cubic-bezier(.4,0,.2,1) both";
  let animDelay = `${index * 0.06}s`;
  if (isCompleting) {
    anim = "completeCardLaunch 0.7s ease forwards";
    animDelay = "0s";
  } else if (isHighlighted) {
    anim = "editHighlight 1.5s ease both";
    animDelay = "0s";
  } else if (isBouncing) {
    anim = "bounceSettle 0.5s ease both";
    animDelay = "0s";
  }

  return (
    <div
      draggable={!isCompleting}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        cursor: isCompleting ? "default" : "grab",
        opacity: isDragging ? 0.35 : 1,
        transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
        animation: anim,
        animationDelay: animDelay,
        position: "relative",
      }}
    >
      {/* Connector line */}
      {index < total - 1 && (
        <div
          style={{
            position: "absolute",
            right: "-28px",
            top: "38px",
            width: "28px",
            height: "2px",
            background: "linear-gradient(90deg, #ffffff18, #ffffff08)",
            zIndex: 0,
          }}
        />
      )}

      {/* Finish ribbon — only on first card */}
      {isFirst && <FinishRibbon onComplete={onComplete} />}

      {/* Position badge */}
      <div
        style={{
          position: "absolute",
          top: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          background: isFirst ? "#ff3b3b" : "#ffffff14",
          color: isFirst ? "#fff" : "#ffffff60",
          fontSize: "10px",
          fontFamily: "'DM Mono', monospace",
          fontWeight: 700,
          borderRadius: "20px",
          padding: "2px 8px",
          letterSpacing: "0.5px",
          zIndex: 2,
          whiteSpace: "nowrap",
        }}
      >
        {isFirst ? "▶ UP NEXT" : `#${index + 1}`}
      </div>

      {/* Card wrapper with glow */}
      <div style={{ position: "relative", marginTop: "12px" }}>
        <DeadlineGlow urgency={urgency} />
        <div
          style={{
            background: isFirst
              ? "linear-gradient(145deg, #1a0a0a, #2a0f0f)"
              : "linear-gradient(145deg, #0f1117, #161b26)",
            border: isFirst
              ? "1.5px solid #ff3b3b55"
              : "1.5px solid #ffffff10",
            borderRadius: "16px",
            padding: "18px 14px 14px",
            width: isFirst ? "160px" : "140px",
            transition: "all 0.35s ease",
            boxShadow: isFirst
              ? "0 0 30px #ff3b3b22, 0 8px 24px #00000060"
              : "0 4px 16px #00000040",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: isFirst ? "56px" : "48px",
              height: isFirst ? "56px" : "48px",
              borderRadius: "50%",
              background: avatarColor(person.name),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isFirst ? "20px" : "17px",
              fontWeight: 800,
              color: "#fff",
              fontFamily: "'DM Mono', monospace",
              boxShadow: `0 0 0 3px #00000040, 0 0 12px ${avatarColor(person.name)}44`,
              flexShrink: 0,
            }}
          >
            {getInitials(person.name)}
          </div>

          {/* Name */}
          <div
            style={{
              color: "#ffffff",
              fontSize: isFirst ? "14px" : "12px",
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {person.name}
          </div>

          {/* Task */}
          <div
            style={{
              color: "#ffffff90",
              fontSize: "11px",
              fontFamily: "'DM Sans', sans-serif",
              textAlign: "center",
              lineHeight: 1.4,
              padding: "6px 8px",
              background: "#ffffff08",
              borderRadius: "8px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {person.task}
          </div>

          {/* Priority badge */}
          <div
            style={{
              background: p.bg,
              color: p.color,
              fontSize: "10px",
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "20px",
              border: `1px solid ${p.color}44`,
              letterSpacing: "0.5px",
            }}
          >
            {p.label.toUpperCase()}
          </div>

          {/* Deadline urgency tag */}
          {urgency && (
            <div
              style={{
                background: `${urgency.color}18`,
                color: urgency.color,
                fontSize: "9px",
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "20px",
                border: `1px solid ${urgency.color}33`,
                letterSpacing: "0.5px",
                animation: urgency.pulse
                  ? "borderPulse 1.4s ease-in-out infinite"
                  : "none",
              }}
            >
              ⏰ {urgency.label}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "6px", width: "100%" }}>
            <button onClick={onMoveFirst} title="Move to front" style={btnStyle("#ffffff14")}>⏮</button>
            <button onClick={onMoveLast} title="Move to back" style={btnStyle("#ffffff14")}>⏭</button>
            <button onClick={onEdit} title="Edit" style={btnStyle("#f5c51818", "#f5c518")}>✏</button>
            <button onClick={onDelete} title="Remove" style={btnStyle("#ff3b3b18", "#ff3b3b")}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}
