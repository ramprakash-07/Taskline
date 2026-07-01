/**
 * TeamQueue — Shared room queue view with real-time WebSocket sync.
 * Owner can reorder/delete/complete any task.
 * Members can only complete/edit their own assigned tasks.
 */

import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import PersonCard, { PRIORITIES, getDeadlineUrgency } from "../components/PersonCard";
import CelebrationBurst from "../components/CelebrationBurst";
import EditTaskModal from "../components/EditTaskModal";
import { useRoom } from "../hooks/useRoom";

const AVATAR_COLORS = ["#a855f7", "#3b82f6", "#ef4444", "#f97316", "#10b981", "#ec4899", "#6366f1", "#14b8a6"];

function getMemberColor(memberId) {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) hash = memberId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getMemberInitials(memberId) {
  return memberId.slice(-2).toUpperCase();
}

export default function TeamQueue() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { userId } = useAuth();

  const {
    room, queue, loading, error,
    addTask, removeTask, completeTask, updateTask, reorderTasks,
  } = useRoom(roomId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", task: "", priority: "NORMAL", deadline: "", assigned_to: "" });
  const [dragIdx, setDragIdx] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);

  const isOwner = room?.owner_id === userId;

  const copyInvite = () => {
    if (room?.invite_link) {
      navigator.clipboard.writeText(room.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddTask = async () => {
    if (!form.name.trim() || !form.task.trim() || !form.assigned_to) return;
    setSubmitting(true);
    try {
      await addTask({
        name: form.name.trim(),
        task: form.task.trim(),
        priority: form.priority,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        assigned_to: form.assigned_to,
      });
      setForm({ name: "", task: "", priority: "NORMAL", deadline: "", assigned_to: "" });
      setShowForm(false);
      setTimeout(() => scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" }), 100);
    } finally {
      setSubmitting(false);
    }
  };

  const moveFirst = (idx) => {
    if (!isOwner) return;
    const n = [...queue];
    n.unshift(n.splice(idx, 1)[0]);
    reorderTasks(n);
  };

  const moveLast = (idx) => {
    if (!isOwner) return;
    const n = [...queue];
    n.push(n.splice(idx, 1)[0]);
    reorderTasks(n);
  };

  const handleComplete = async (idx) => {
    const item = queue[idx];
    if (!isOwner && item.assigned_to !== userId) return;
    const name = await completeTask(item.id);
    if (name) {
      setCelebration({ name });
      setTimeout(() => setCelebration(null), 2000);
    }
  };

  const handleDelete = (idx) => {
    if (!isOwner) return;
    removeTask(queue[idx].id);
  };

  const handleEdit = (item) => {
    if (!isOwner && item.assigned_to !== userId) return;
    setEditingItem(item);
  };

  const handleEditSave = async (data) => {
    const result = await updateTask(editingItem.id, data);
    if (result) {
      setHighlightedId(editingItem.id);
      setTimeout(() => setHighlightedId(null), 1500);
    }
    setEditingItem(null);
  };

  const handleDragStart = (idx) => { if (isOwner) setDragIdx(idx); };
  const handleDragEnd = () => setDragIdx(null);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (idx) => {
    if (!isOwner || dragIdx === null || dragIdx === idx) return;
    const n = [...queue];
    const [item] = n.splice(dragIdx, 1);
    n.splice(idx, 0, item);
    reorderTasks(n);
    setDragIdx(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080b12",
        backgroundImage: "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1a0a1a 0%, transparent 50%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px",
      }}>
        <div className="spinner" />
        <div style={{ color: "#ffffff40", fontSize: "13px", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>
          LOADING TEAM QUEUE...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080b12",
        backgroundImage: "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px",
      }}>
        <div style={{ fontSize: "48px" }}>😵</div>
        <div style={{ color: "#ff3b3b", fontSize: "16px", fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
        <button onClick={() => navigate("/rooms")} style={{
          background: "#ffffff0c", border: "1px solid #ffffff18", color: "#ffffff80", borderRadius: "10px",
          padding: "8px 20px", cursor: "pointer", fontSize: "13px", fontFamily: "'DM Mono', monospace",
        }}>← Back to Rooms</button>
      </div>
    );
  }

  const totalTime = queue.length * 25;

  return (
    <div style={{
      minHeight: "100vh", background: "#080b12",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1a0a1a 0%, transparent 50%)",
      fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {celebration && <CelebrationBurst name={celebration.name} />}
      {editingItem && <EditTaskModal item={editingItem} onSave={handleEditSave} onCancel={() => setEditingItem(null)} />}

      {/* Header */}
      <div style={{
        padding: "28px 40px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid #ffffff08",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate("/rooms")} style={{
            background: "#ffffff08", border: "1px solid #ffffff14", color: "#ffffff60", borderRadius: "8px",
            padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontFamily: "'DM Mono', monospace",
          }}>← Back</button>
          <div>
            <div style={{
              fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#a855f7",
              letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px",
            }}>TEAM QUEUE</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1 }}>
              🚀 {room?.room_name || "Room"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {/* Stats */}
          {[
            { val: queue.length, lbl: "IN QUEUE" },
            { val: `~${totalTime}m`, lbl: "EST. TIME" },
          ].map(({ val, lbl }, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#fff", fontFamily: "'DM Mono', monospace" }}>{val}</div>
              <div style={{ fontSize: "10px", color: "#ffffff40", letterSpacing: "1px" }}>{lbl}</div>
            </div>
          ))}

          <div style={{ width: "1px", height: "32px", background: "#ffffff10" }} />

          {/* Members */}
          <div style={{ display: "flex", alignItems: "center", gap: "-4px" }}>
            {(room?.member_ids || []).slice(0, 6).map((mid, i) => (
              <div key={mid} style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: getMemberColor(mid), display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: 800, color: "#fff", fontFamily: "'DM Mono', monospace",
                border: "2px solid #080b12", marginLeft: i > 0 ? "-6px" : 0, zIndex: 10 - i,
                outline: mid === userId ? "2px solid #FFD700" : "none",
              }}>
                {getMemberInitials(mid)}
              </div>
            ))}
            {(room?.member_ids || []).length > 6 && (
              <div style={{ fontSize: "11px", color: "#ffffff40", fontFamily: "'DM Mono', monospace", marginLeft: "4px" }}>
                +{room.member_ids.length - 6}
              </div>
            )}
            <div style={{ fontSize: "10px", color: "#ffffff30", fontFamily: "'DM Mono', monospace", marginLeft: "8px" }}>
              {room?.member_ids?.length || 0} members
            </div>
          </div>

          <div style={{ width: "1px", height: "32px", background: "#ffffff10" }} />

          {/* Invite link */}
          <button onClick={copyInvite} style={{
            background: copied ? "#00c9a720" : "#ffffff0c",
            border: `1px solid ${copied ? "#00c9a7" : "#ffffff18"}`,
            color: copied ? "#00c9a7" : "#ffffff80", borderRadius: "10px",
            padding: "8px 16px", cursor: "pointer", fontSize: "12px",
            fontFamily: "'DM Mono', monospace", fontWeight: 700, transition: "all 0.3s ease",
          }}>
            {copied ? "✓ Copied!" : "🔗 Invite"}
          </button>

          {isOwner && (
            <button onClick={() => setShowForm(s => !s)} style={{
              background: showForm ? "#ff3b3b" : "linear-gradient(135deg, #ff3b3b, #ff6b35)",
              border: "none", color: "#fff", borderRadius: "10px", padding: "8px 18px",
              cursor: "pointer", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700, boxShadow: "0 4px 16px #ff3b3b30",
            }}>
              {showForm ? "✕ Cancel" : "+ Add Task"}
            </button>
          )}

          {!isOwner && (
            <div style={{
              fontSize: "10px", color: "#ffffff30", fontFamily: "'DM Mono', monospace",
              background: "#ffffff08", padding: "6px 12px", borderRadius: "8px", border: "1px solid #ffffff10",
            }}>
              MEMBER
            </div>
          )}
        </div>
      </div>

      {/* Add Form (owner only) */}
      {showForm && isOwner && (
        <div style={{
          padding: "16px 40px", borderBottom: "1px solid #ffffff08",
          display: "flex", gap: "12px", alignItems: "flex-end", animation: "fadeIn 0.25s ease both", background: "#ffffff04",
        }}>
          {[
            { label: "Name", key: "name", placeholder: "Person's name", w: "160px", type: "text" },
            { label: "Task", key: "task", placeholder: "What needs to be done?", w: "240px", type: "text" },
          ].map(({ label, key, placeholder, w, type }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "10px", color: "#ffffff40", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>
                {label.toUpperCase()}
              </label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} onKeyDown={e => e.key === "Enter" && handleAddTask()}
                style={{
                  background: "#ffffff08", border: "1px solid #ffffff14", borderRadius: "8px",
                  padding: "8px 12px", color: "#fff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                  width: w, outline: "none", boxSizing: "border-box",
                }} />
            </div>
          ))}

          {/* Assign to dropdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", color: "#ffffff40", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>
              ASSIGN TO
            </label>
            <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
              style={{
                background: "#0f1117", border: "1px solid #ffffff14", borderRadius: "8px",
                padding: "8px 12px", color: "#fff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                outline: "none", cursor: "pointer", minWidth: "140px",
              }}>
              <option value="" style={{ background: "#1a1a2e" }}>Select member...</option>
              {(room?.member_ids || []).map(mid => (
                <option key={mid} value={mid} style={{ background: "#1a1a2e" }}>
                  {mid === userId ? "Me" : mid.slice(-6)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", color: "#ffffff40", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>PRIORITY</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              style={{
                background: "#0f1117", border: "1px solid #ffffff14", borderRadius: "8px",
                padding: "8px 12px", color: "#fff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer",
              }}>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <option key={k} value={k} style={{ background: "#1a1a2e" }}>{v.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", color: "#ffffff40", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>DEADLINE</label>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              style={{
                background: "#0f1117", border: "1px solid #ffffff14", borderRadius: "8px",
                padding: "8px 12px", color: "#fff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                outline: "none", colorScheme: "dark",
              }} />
          </div>

          <button onClick={handleAddTask} disabled={submitting} style={{
            background: submitting ? "#ffffff14" : "linear-gradient(135deg, #ff3b3b, #ff6b35)",
            border: "none", color: "#fff", borderRadius: "8px", padding: "8px 20px",
            cursor: submitting ? "not-allowed" : "pointer", fontSize: "13px",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, height: "36px",
          }}>
            {submitting ? "Adding..." : "Add →"}
          </button>
        </div>
      )}

      {/* Queue */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 0 40px" }}>
        {queue.length === 0 ? (
          <div style={{
            textAlign: "center", color: "#ffffff20", fontSize: "16px",
            fontFamily: "'DM Mono', monospace", animation: "fadeIn 0.4s ease both",
          }}>
            {isOwner ? "Team queue is empty — add a task to get started" : "Team queue is empty — waiting for tasks"}
          </div>
        ) : (
          <>
            <div style={{ padding: "0 40px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#ffffff30", letterSpacing: "2px" }}>
                FRONT OF QUEUE
              </div>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #ffffff10, transparent)" }} />
              <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#ffffff30", letterSpacing: "2px" }}>BACK</div>
            </div>

            <div ref={scrollRef} style={{
              overflowX: "auto", overflowY: "visible", padding: "20px 40px 20px",
              display: "flex", gap: "28px", alignItems: "flex-end", minHeight: "240px",
            }}>
              {queue.map((task, idx) => {
                const canComplete = isOwner || task.assigned_to === userId;
                const canEdit = isOwner || task.assigned_to === userId;
                return (
                  <div key={task.id} style={{ position: "relative" }}>
                    {/* Assignee badge */}
                    <div style={{
                      position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                      background: getMemberColor(task.assigned_to), borderRadius: "10px",
                      padding: "2px 8px", fontSize: "9px", fontWeight: 800, color: "#fff",
                      fontFamily: "'DM Mono', monospace", zIndex: 2, border: "2px solid #080b12",
                      whiteSpace: "nowrap",
                    }}>
                      {task.assigned_to === userId ? "ME" : getMemberInitials(task.assigned_to)}
                    </div>
                    <PersonCard
                      person={task}
                      index={idx}
                      total={queue.length}
                      onMoveFirst={isOwner ? () => moveFirst(idx) : undefined}
                      onMoveLast={isOwner ? () => moveLast(idx) : undefined}
                      onDelete={isOwner ? () => handleDelete(idx) : undefined}
                      onComplete={canComplete ? () => handleComplete(idx) : undefined}
                      onEdit={canEdit ? () => handleEdit(task) : undefined}
                      isDragging={dragIdx === idx}
                      isHighlighted={highlightedId === task.id}
                      onDragStart={isOwner ? () => handleDragStart(idx) : undefined}
                      onDragEnd={isOwner ? handleDragEnd : undefined}
                      onDragOver={isOwner ? handleDragOver : undefined}
                      onDrop={isOwner ? () => handleDrop(idx) : undefined}
                    />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ padding: "16px 40px 0", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: "10px", color: "#ffffff25", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>PRIORITY:</div>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: v.color }} />
                  <span style={{ fontSize: "10px", color: "#ffffff40", fontFamily: "'DM Mono', monospace" }}>{v.label}</span>
                </div>
              ))}
              <div style={{
                marginLeft: "auto", fontSize: "10px", color: "#ffffff25", fontFamily: "'DM Mono', monospace",
              }}>
                {isOwner ? "🏁 COMPLETE · ✏ EDIT · DRAG TO REORDER" : "🏁 COMPLETE YOUR TASKS · ✏ EDIT YOUR TASKS"}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
