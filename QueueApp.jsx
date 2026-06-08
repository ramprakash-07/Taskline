import { useState, useRef } from "react";

const PRIORITIES = {
  CRITICAL: { label: "Critical", color: "#ff3b3b", bg: "#2a0a0a", order: 0 },
  HIGH:     { label: "High",     color: "#ff8c00", bg: "#2a1500", order: 1 },
  NORMAL:   { label: "Normal",   color: "#00c9a7", bg: "#002a22", order: 2 },
  LOW:      { label: "Low",      color: "#7b8cde", bg: "#0d1030", order: 3 },
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "#e8445a","#f7931e","#29abe2","#00c9a7","#a855f7","#ec4899","#84cc16","#f59e0b"
];

function avatarColor(name) {
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Returns urgency level 0-3 based on hours remaining
function getDeadlineUrgency(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  const hoursLeft = (due - now) / (1000 * 60 * 60);
  if (hoursLeft < 0)   return { level: 4, label: "OVERDUE",    color: "#ff0040", pulse: true  };
  if (hoursLeft < 6)   return { level: 3, label: "DUE SOON",   color: "#ff3b3b", pulse: true  };
  if (hoursLeft < 24)  return { level: 2, label: "TODAY",      color: "#ff8c00", pulse: false };
  if (hoursLeft < 72)  return { level: 1, label: "THIS WEEK",  color: "#f5c518", pulse: false };
  return                      { level: 0, label: "ON TRACK",   color: "#00c9a7", pulse: false };
}

function DeadlineGlow({ urgency }) {
  if (!urgency) return null;
  const colors = [null, "#f5c51840", "#ff8c0050", "#ff3b3b60", "#ff004070"];
  const shadows = [null,
    "0 0 20px #f5c51830",
    "0 0 28px #ff8c0040",
    "0 0 36px #ff3b3b55",
    "0 0 44px #ff004066",
  ];
  if (urgency.level === 0) return null;
  return (
    <div style={{
      position: "absolute",
      inset: "-3px",
      borderRadius: "19px",
      border: `2px solid ${colors[urgency.level]}`,
      boxShadow: shadows[urgency.level],
      animation: urgency.pulse ? "borderPulse 1.4s ease-in-out infinite" : "none",
      pointerEvents: "none",
      zIndex: 1,
    }} />
  );
}

function FinishRibbon({ onComplete }) {
  return (
    <div style={{
      position: "absolute",
      top: "-18px",
      right: "-18px",
      zIndex: 10,
      cursor: "pointer",
    }} onClick={onComplete} title="Mark as done!">
      {/* Ribbon flag */}
      <div style={{
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
      }}>
        ✓ DONE
      </div>
      {/* Ribbon pole */}
      <div style={{
        width: "2px",
        height: "14px",
        background: "linear-gradient(180deg, #FFD700, #B8860B)",
        margin: "0 auto",
        borderRadius: "1px",
      }} />
    </div>
  );
}

function CelebrationBurst({ name }) {
  const emojis = ["🎉","⭐","✨","🏆","🎊","💫"];
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "12px",
    }}>
      <div style={{
        fontSize: "28px",
        fontWeight: 900,
        color: "#FFD700",
        fontFamily: "'DM Sans', sans-serif",
        textShadow: "0 0 30px #FFD70080",
        animation: "celebFadeUp 1.8s ease forwards",
        letterSpacing: "-0.5px",
      }}>
        🏁 {name} crossed the finish line!
      </div>
      <div style={{ display: "flex", gap: "16px", animation: "celebFadeUp 1.8s ease 0.1s forwards", opacity: 0 }}>
        {emojis.map((e, i) => (
          <span key={i} style={{
            fontSize: "28px",
            animation: `confettiBounce 0.6s ease ${i * 0.08}s both`,
          }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

function PersonCard({ person, index, total, onMoveFirst, onMoveLast, onDelete, onComplete, isDragging, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const isFirst = index === 0;
  const p = PRIORITIES[person.priority];
  const urgency = getDeadlineUrgency(person.deadline);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        cursor: "grab",
        opacity: isDragging ? 0.35 : 1,
        transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
        animation: "cardIn 0.4s cubic-bezier(.4,0,.2,1) both",
        animationDelay: `${index * 0.06}s`,
        position: "relative",
      }}
    >
      {/* Connector line */}
      {index < total - 1 && (
        <div style={{
          position: "absolute",
          right: "-28px",
          top: "38px",
          width: "28px",
          height: "2px",
          background: "linear-gradient(90deg, #ffffff18, #ffffff08)",
          zIndex: 0,
        }} />
      )}

      {/* Finish ribbon — only on first card */}
      {isFirst && <FinishRibbon onComplete={onComplete} />}

      {/* Position badge */}
      <div style={{
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
      }}>
        {isFirst ? "▶ UP NEXT" : `#${index + 1}`}
      </div>

      {/* Card wrapper with glow */}
      <div style={{ position: "relative", marginTop: "12px" }}>
        <DeadlineGlow urgency={urgency} />
        <div style={{
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
        }}>
          {/* Avatar */}
          <div style={{
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
          }}>
            {getInitials(person.name)}
          </div>

          {/* Name */}
          <div style={{
            color: "#ffffff",
            fontSize: isFirst ? "14px" : "12px",
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            textAlign: "center",
            lineHeight: 1.2,
          }}>
            {person.name}
          </div>

          {/* Task */}
          <div style={{
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
          }}>
            {person.task}
          </div>

          {/* Priority badge */}
          <div style={{
            background: p.bg,
            color: p.color,
            fontSize: "10px",
            fontFamily: "'DM Mono', monospace",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "20px",
            border: `1px solid ${p.color}44`,
            letterSpacing: "0.5px",
          }}>
            {p.label.toUpperCase()}
          </div>

          {/* Deadline urgency tag */}
          {urgency && (
            <div style={{
              background: `${urgency.color}18`,
              color: urgency.color,
              fontSize: "9px",
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "20px",
              border: `1px solid ${urgency.color}33`,
              letterSpacing: "0.5px",
              animation: urgency.pulse ? "borderPulse 1.4s ease-in-out infinite" : "none",
            }}>
              ⏰ {urgency.label}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "6px", width: "100%" }}>
            <button onClick={onMoveFirst} title="Move to front" style={btnStyle("#ffffff14")}>⏮</button>
            <button onClick={onMoveLast} title="Move to back" style={btnStyle("#ffffff14")}>⏭</button>
            <button onClick={onDelete} title="Remove" style={btnStyle("#ff3b3b18", "#ff3b3b")}>✕</button>
          </div>
        </div>
      </div>
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

export default function QueueApp() {
  const [queue, setQueue] = useState([
    { id: generateId(), name: "Alex Chen",    task: "Deploy hotfix to prod",   priority: "CRITICAL", deadline: new Date(Date.now() + 3 * 3600000).toISOString() },
    { id: generateId(), name: "Jordan Kim",   task: "Review pull request",     priority: "HIGH",     deadline: new Date(Date.now() + 20 * 3600000).toISOString() },
    { id: generateId(), name: "Sam Rivera",   task: "Write unit tests",        priority: "NORMAL",   deadline: new Date(Date.now() + 50 * 3600000).toISOString() },
    { id: generateId(), name: "Taylor Scott", task: "Update documentation",    priority: "LOW",      deadline: new Date(Date.now() + 120 * 3600000).toISOString() },
  ]);

  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name: "", task: "", priority: "NORMAL", deadline: "" });
  const [dragIdx, setDragIdx]     = useState(null);
  const [sorted, setSorted]       = useState(false);
  const [celebration, setCelebration] = useState(null);
  const scrollRef = useRef(null);

  const addPerson = () => {
    if (!form.name.trim() || !form.task.trim()) return;
    setQueue(q => [...q, { id: generateId(), ...form }]);
    setForm({ name: "", task: "", priority: "NORMAL", deadline: "" });
    setShowForm(false);
    setTimeout(() => scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" }), 100);
  };

  const moveFirst  = (idx) => setQueue(q => { const n=[...q]; n.unshift(n.splice(idx,1)[0]); return n; });
  const moveLast   = (idx) => setQueue(q => { const n=[...q]; n.push(n.splice(idx,1)[0]); return n; });
  const remove     = (idx) => setQueue(q => q.filter((_,i) => i!==idx));

  const complete = (idx) => {
    const name = queue[idx].name;
    setCelebration(name);
    setTimeout(() => setCelebration(null), 2200);
    setTimeout(() => remove(idx), 400);
  };

  const sortByPriority = () => {
    setQueue(q => [...q].sort((a,b) => PRIORITIES[a.priority].order - PRIORITIES[b.priority].order));
    setSorted(true);
    setTimeout(() => setSorted(false), 1500);
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragEnd   = ()    => setDragIdx(null);
  const handleDragOver  = (e)   => e.preventDefault();
  const handleDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    setQueue(q => {
      const n = [...q];
      const [item] = n.splice(dragIdx, 1);
      n.splice(idx, 0, item);
      return n;
    });
    setDragIdx(null);
  };

  const totalTime = queue.length * 25;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b12",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1a0a1a 0%, transparent 50%)",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;700;800&display=swap');
        @keyframes cardIn {
          from { opacity:0; transform:translateY(24px) scale(0.92); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes borderPulse {
          0%,100% { opacity:1; } 50% { opacity:0.35; }
        }
        @keyframes ribbonWave {
          0%,100% { transform: rotate(-1deg); }
          50%     { transform: rotate(1deg); }
        }
        @keyframes celebFadeUp {
          0%   { opacity:0; transform:translateY(20px); }
          20%  { opacity:1; transform:translateY(0); }
          80%  { opacity:1; transform:translateY(0); }
          100% { opacity:0; transform:translateY(-20px); }
        }
        @keyframes confettiBounce {
          0%   { opacity:0; transform:scale(0) rotate(-20deg); }
          60%  { transform:scale(1.3) rotate(10deg); }
          100% { opacity:1; transform:scale(1) rotate(0deg); }
        }
        ::-webkit-scrollbar { height:4px; background:#ffffff08; }
        ::-webkit-scrollbar-thumb { background:#ffffff18; border-radius:4px; }
        button:hover { filter:brightness(1.25); }
        input::placeholder { color:#ffffff30; }
        input:focus { border-color:#ffffff30 !important; }
      `}</style>

      {/* Celebration overlay */}
      {celebration && <CelebrationBurst name={celebration} />}

      {/* Header */}
      <div style={{ padding:"28px 40px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #ffffff08" }}>
        <div>
          <div style={{ fontSize:"11px", fontFamily:"'DM Mono',monospace", color:"#ffffff40", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"4px" }}>
            PRIORITY QUEUE
          </div>
          <div style={{ fontSize:"28px", fontWeight:800, color:"#ffffff", letterSpacing:"-0.5px", lineHeight:1 }}>
            TaskLine
          </div>
        </div>

        <div style={{ display:"flex", gap:"24px", alignItems:"center" }}>
          {[
            { val: queue.length, lbl: "IN QUEUE" },
            { val: `~${totalTime}m`, lbl: "EST. TIME" },
            { val: queue.filter(p => { const u=getDeadlineUrgency(p.deadline); return u && u.level >= 3; }).length, lbl: "URGENT" },
          ].map(({ val, lbl }, i) => (
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"24px", fontWeight:800, color: lbl==="URGENT" && val>0 ? "#ff3b3b" : "#fff", fontFamily:"'DM Mono',monospace" }}>{val}</div>
              <div style={{ fontSize:"10px", color:"#ffffff40", letterSpacing:"1px" }}>{lbl}</div>
            </div>
          ))}

          <div style={{ width:"1px", height:"32px", background:"#ffffff10" }} />

          <button onClick={sortByPriority} style={{
            background: sorted ? "#00c9a720" : "#ffffff0c",
            border:`1px solid ${sorted?"#00c9a7":"#ffffff18"}`,
            color: sorted ? "#00c9a7" : "#ffffff80",
            borderRadius:"10px", padding:"8px 16px", cursor:"pointer",
            fontSize:"12px", fontFamily:"'DM Mono',monospace", fontWeight:700,
            letterSpacing:"0.5px", transition:"all 0.3s ease",
          }}>
            {sorted ? "✓ SORTED" : "⇅ SORT"}
          </button>

          <button onClick={() => setShowForm(s => !s)} style={{
            background: showForm ? "#ff3b3b" : "linear-gradient(135deg,#ff3b3b,#ff6b35)",
            border:"none", color:"#fff", borderRadius:"10px", padding:"8px 18px",
            cursor:"pointer", fontSize:"13px", fontFamily:"'DM Sans',sans-serif",
            fontWeight:700, boxShadow:"0 4px 16px #ff3b3b30", transition:"all 0.2s ease",
          }}>
            {showForm ? "✕ Cancel" : "+ Add Person"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{
          padding:"16px 40px", borderBottom:"1px solid #ffffff08",
          display:"flex", gap:"12px", alignItems:"flex-end",
          animation:"fadeIn 0.25s ease both", background:"#ffffff04",
        }}>
          {[
            { label:"Name", key:"name", placeholder:"Person's name", w:"180px", type:"text" },
            { label:"Task", key:"task", placeholder:"What needs to be done?", w:"280px", type:"text" },
          ].map(({ label, key, placeholder, w, type }) => (
            <div key={key} style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              <label style={{ fontSize:"10px", color:"#ffffff40", fontFamily:"'DM Mono',monospace", letterSpacing:"1px" }}>{label.toUpperCase()}</label>
              <input
                type={type} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                onKeyDown={e => e.key==="Enter" && addPerson()}
                style={{ background:"#ffffff08", border:"1px solid #ffffff14", borderRadius:"8px", padding:"8px 12px", color:"#fff", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", width:w, outline:"none", boxSizing:"border-box", transition:"border 0.2s" }}
              />
            </div>
          ))}

          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            <label style={{ fontSize:"10px", color:"#ffffff40", fontFamily:"'DM Mono',monospace", letterSpacing:"1px" }}>PRIORITY</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              style={{ background:"#0f1117", border:"1px solid #ffffff14", borderRadius:"8px", padding:"8px 12px", color:"#fff", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", outline:"none", cursor:"pointer" }}>
              {Object.entries(PRIORITIES).map(([k,v]) => (
                <option key={k} value={k} style={{ background:"#1a1a2e" }}>{v.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            <label style={{ fontSize:"10px", color:"#ffffff40", fontFamily:"'DM Mono',monospace", letterSpacing:"1px" }}>DEADLINE</label>
            <input type="datetime-local" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              style={{ background:"#0f1117", border:"1px solid #ffffff14", borderRadius:"8px", padding:"8px 12px", color:"#fff", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", outline:"none", colorScheme:"dark" }}
            />
          </div>

          <button onClick={addPerson} style={{
            background:"linear-gradient(135deg,#ff3b3b,#ff6b35)", border:"none", color:"#fff",
            borderRadius:"8px", padding:"8px 20px", cursor:"pointer", fontSize:"13px",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, height:"36px",
          }}>
            Add →
          </button>
        </div>
      )}

      {/* Queue */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"20px 0 40px" }}>
        {queue.length === 0 ? (
          <div style={{ textAlign:"center", color:"#ffffff20", fontSize:"16px", fontFamily:"'DM Mono',monospace" }}>
            Queue is empty — add someone to get started
          </div>
        ) : (
          <>
            <div style={{ padding:"0 40px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ fontSize:"10px", fontFamily:"'DM Mono',monospace", color:"#ffffff30", letterSpacing:"2px" }}>FRONT OF QUEUE</div>
              <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,#ffffff10,transparent)" }} />
              <div style={{ fontSize:"10px", fontFamily:"'DM Mono',monospace", color:"#ffffff30", letterSpacing:"2px" }}>BACK</div>
            </div>

            <div ref={scrollRef} style={{
              overflowX:"auto", overflowY:"visible",
              padding:"20px 40px 20px",
              display:"flex", gap:"28px", alignItems:"flex-end", minHeight:"240px",
            }}>
              {queue.map((person, idx) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  index={idx}
                  total={queue.length}
                  onMoveFirst={() => moveFirst(idx)}
                  onMoveLast={() => moveLast(idx)}
                  onDelete={() => remove(idx)}
                  onComplete={() => complete(idx)}
                  isDragging={dragIdx === idx}
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                />
              ))}
            </div>

            {/* Legend */}
            <div style={{ padding:"16px 40px 0", display:"flex", gap:"20px", alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ fontSize:"10px", color:"#ffffff25", fontFamily:"'DM Mono',monospace", letterSpacing:"1px" }}>PRIORITY:</div>
              {Object.entries(PRIORITIES).map(([k,v]) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:v.color }} />
                  <span style={{ fontSize:"10px", color:"#ffffff40", fontFamily:"'DM Mono',monospace" }}>{v.label}</span>
                </div>
              ))}
              <div style={{ marginLeft:"auto", fontSize:"10px", color:"#ffffff25", fontFamily:"'DM Mono',monospace" }}>
                🏁 CLICK RIBBON TO COMPLETE · DRAG TO REORDER
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
