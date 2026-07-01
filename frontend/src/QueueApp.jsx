/**
 * QueueApp — Main queue management page.
 * Supports auth/guest, streak tracking, edit modal, cinematic completion.
 */

import { useState, useRef } from "react";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import PersonCard, { PRIORITIES, getDeadlineUrgency } from "./components/PersonCard";
import CelebrationBurst from "./components/CelebrationBurst";
import EditTaskModal from "./components/EditTaskModal";
import GuestBanner from "./components/GuestBanner";
import StreakRiskBanner from "./components/StreakRiskBanner";
import ShareStreakCard from "./components/ShareStreakCard";
import BriefingModal from "./components/BriefingModal";
import { useQueue } from "./hooks/useQueue";
import { useStreak } from "./hooks/useStreak";
import { useBriefing } from "./hooks/useBriefing";
import { useGuest } from "./contexts/GuestContext";

export default function QueueApp() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const { guestId, isGuest } = useGuest();
  const navigate = useNavigate();

  const {
    queue,
    loading,
    error,
    addItem,
    removeItem,
    completeItem,
    updateItem,
    reorderItems,
    sortByPriority,
    clearError,
  } = useQueue(isGuest ? guestId : null);

  const { streak, recordCompletion, isAtRisk } = useStreak();
  const { briefing, showModal: showBriefing, dismiss: dismissBriefing } = useBriefing();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", task: "", priority: "NORMAL", deadline: "" });
  const [dragIdx, setDragIdx] = useState(null);
  const [sorted, setSorted] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [bouncingId, setBouncingId] = useState(null);
  const [streakCelebration, setStreakCelebration] = useState(null);
  const scrollRef = useRef(null);

  const addPerson = async () => {
    if (!form.name.trim() || !form.task.trim()) return;
    setSubmitting(true);
    try {
      const data = {
        name: form.name.trim(),
        task: form.task.trim(),
        priority: form.priority,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };
      await addItem(data);
      setForm({ name: "", task: "", priority: "NORMAL", deadline: "" });
      setShowForm(false);
      setTimeout(
        () => scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" }),
        100
      );
    } catch {
      // Error handled by useQueue
    } finally {
      setSubmitting(false);
    }
  };

  const moveFirst = (idx) => {
    const n = [...queue];
    n.unshift(n.splice(idx, 1)[0]);
    reorderItems(n);
  };

  const moveLast = (idx) => {
    const n = [...queue];
    n.push(n.splice(idx, 1)[0]);
    reorderItems(n);
  };

  const remove = (idx) => {
    removeItem(queue[idx].id);
  };

  /** Cinematic completion flow */
  const complete = async (idx) => {
    const item = queue[idx];
    const isUpNext = idx === 0;

    // Phase 1: Start card launch animation
    setCompletingId(item.id);

    // Phase 2: After card animation, trigger celebration
    setTimeout(async () => {
      const name = await completeItem(item.id);

      // Record streak if it's the UP NEXT task (index 0)
      let streakIncreased = false;
      let newStreak = 0;
      if (isUpNext && isSignedIn) {
        streakIncreased = await recordCompletion();
        newStreak = streak.current_streak + (streakIncreased ? 1 : 0);
      }

      setCompletingId(null);

      if (name) {
        setCelebration({ name, streakIncreased, newStreak });
        setTimeout(() => setCelebration(null), 2000);
      }

      // Bounce-settle the new first card
      if (queue.length > 1) {
        const nextCard = queue[idx === 0 ? 1 : 0];
        setBouncingId(nextCard.id);
        setTimeout(() => setBouncingId(null), 600);
      }
    }, 700);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleEditSave = async (data) => {
    const result = await updateItem(editingItem.id, data);
    if (result) {
      setHighlightedId(editingItem.id);
      setTimeout(() => setHighlightedId(null), 1500);
    }
    setEditingItem(null);
  };

  const handleSort = async () => {
    await sortByPriority();
    setSorted(true);
    setTimeout(() => setSorted(false), 1500);
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragEnd = () => setDragIdx(null);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    const n = [...queue];
    const [item] = n.splice(dragIdx, 1);
    n.splice(idx, 0, item);
    reorderItems(n);
    setDragIdx(null);
  };

  const handleGuestSignUp = () => navigate("/sign-up");

  const totalTime = queue.length * 25;

  // Loading state
  if (loading) {
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
          gap: "20px",
        }}
      >
        <div className="spinner" />
        <div
          style={{
            color: "#ffffff40",
            fontSize: "13px",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "1px",
          }}
        >
          LOADING YOUR QUEUE...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080b12",
        backgroundImage:
          "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1a0a1a 0%, transparent 50%)",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Banners */}
      {isGuest && <GuestBanner />}
      {!isGuest && isAtRisk() && (
        <StreakRiskBanner currentStreak={streak.current_streak} />
      )}

      {/* Morning Briefing Modal */}
      {!isGuest && showBriefing && briefing && (
        <BriefingModal briefing={briefing} onDismiss={dismissBriefing} />
      )}

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationBurst
          name={celebration.name}
          streakIncreased={celebration.streakIncreased}
          newStreak={celebration.newStreak}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditTaskModal
          item={editingItem}
          onSave={handleEditSave}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {/* Error toast */}
      {error && (
        <div className="error-toast" onClick={clearError} style={{ cursor: "pointer" }}>
          ⚠ {error}
          <span style={{ marginLeft: "8px", opacity: 0.5, fontSize: "11px" }}>click to dismiss</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          padding: "28px 40px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #ffffff08",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "'DM Mono', monospace",
              color: "#ffffff40",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            PRIORITY QUEUE
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              lineHeight: 1,
            }}
          >
            TaskLine
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {/* Stats */}
          {[
            { val: queue.length, lbl: "IN QUEUE" },
            { val: `~${totalTime}m`, lbl: "EST. TIME" },
            {
              val: queue.filter((p) => {
                const u = getDeadlineUrgency(p.deadline);
                return u && u.level >= 3;
              }).length,
              lbl: "URGENT",
            },
          ].map(({ val, lbl }, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: lbl === "URGENT" && val > 0 ? "#ff3b3b" : "#fff",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: "10px", color: "#ffffff40", letterSpacing: "1px" }}>{lbl}</div>
            </div>
          ))}

          {/* Streak display (authenticated only) */}
          {!isGuest && (
            <>
              <div style={{ width: "1px", height: "32px", background: "#ffffff10" }} />
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: streak.current_streak > 0 ? "#FFD700" : "#ffffff30",
                    fontFamily: "'DM Mono', monospace",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>🔥</span>
                  {streak.current_streak}
                </div>
                <div style={{ fontSize: "10px", color: "#ffffff40", letterSpacing: "1px" }}>STREAK</div>
              </div>
              <ShareStreakCard
                currentStreak={streak.current_streak}
                longestStreak={streak.longest_streak}
              />
            </>
          )}

          <div style={{ width: "1px", height: "32px", background: "#ffffff10" }} />

          {/* Team Queues + Settings (auth only) */}
          {!isGuest && (
            <>
              <button
                onClick={() => navigate("/rooms")}
                style={{
                  background: "#a855f710",
                  border: "1px solid #a855f730",
                  color: "#a855f7",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                  transition: "all 0.3s ease",
                }}
              >
                👥 Teams
              </button>
              <button
                onClick={() => navigate("/settings")}
                title="Settings"
                style={{
                  background: "#ffffff08",
                  border: "1px solid #ffffff14",
                  color: "#ffffff50",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                }}
              >
                ⚙️
              </button>
            </>
          )}

          <button
            onClick={handleSort}
            style={{
              background: sorted ? "#00c9a720" : "#ffffff0c",
              border: `1px solid ${sorted ? "#00c9a7" : "#ffffff18"}`,
              color: sorted ? "#00c9a7" : "#ffffff80",
              borderRadius: "10px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              letterSpacing: "0.5px",
              transition: "all 0.3s ease",
            }}
          >
            {sorted ? "✓ SORTED" : "⇅ SORT"}
          </button>

          <button
            onClick={() => setShowForm((s) => !s)}
            style={{
              background: showForm ? "#ff3b3b" : "linear-gradient(135deg, #ff3b3b, #ff6b35)",
              border: "none",
              color: "#fff",
              borderRadius: "10px",
              padding: "8px 18px",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              boxShadow: "0 4px 16px #ff3b3b30",
              transition: "all 0.2s ease",
            }}
          >
            {showForm ? "✕ Cancel" : "+ Add Person"}
          </button>

          {/* User section */}
          <div style={{ width: "1px", height: "32px", background: "#ffffff10" }} />

          {isGuest ? (
            <button
              onClick={handleGuestSignUp}
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                border: "none",
                color: "#000",
                borderRadius: "10px",
                padding: "8px 18px",
                cursor: "pointer",
                fontSize: "13px",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                boxShadow: "0 2px 12px #FFD70030",
                transition: "all 0.2s ease",
              }}
            >
              Sign Up
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "2px solid #ffffff18",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#a855f7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#fff",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {(user?.firstName || "U")[0]}
                </div>
              )}
              <button
                onClick={() => signOut()}
                title="Sign out"
                style={{
                  background: "#ffffff08",
                  border: "1px solid #ffffff14",
                  color: "#ffffff60",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div
          style={{
            padding: "16px 40px",
            borderBottom: "1px solid #ffffff08",
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            animation: "fadeIn 0.25s ease both",
            background: "#ffffff04",
          }}
        >
          {[
            { label: "Name", key: "name", placeholder: "Person's name", w: "180px", type: "text" },
            { label: "Task", key: "task", placeholder: "What needs to be done?", w: "280px", type: "text" },
          ].map(({ label, key, placeholder, w, type }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "10px",
                  color: "#ffffff40",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "1px",
                }}
              >
                {label.toUpperCase()}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                onKeyDown={(e) => e.key === "Enter" && addPerson()}
                style={{
                  background: "#ffffff08",
                  border: "1px solid #ffffff14",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#fff",
                  fontSize: "13px",
                  fontFamily: "'DM Sans', sans-serif",
                  width: w,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border 0.2s",
                }}
              />
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "10px",
                color: "#ffffff40",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "1px",
              }}
            >
              PRIORITY
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              style={{
                background: "#0f1117",
                border: "1px solid #ffffff14",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <option key={k} value={k} style={{ background: "#1a1a2e" }}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "10px",
                color: "#ffffff40",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "1px",
              }}
            >
              DEADLINE
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              style={{
                background: "#0f1117",
                border: "1px solid #ffffff14",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                colorScheme: "dark",
              }}
            />
          </div>

          <button
            onClick={addPerson}
            disabled={submitting}
            style={{
              background: submitting
                ? "#ffffff14"
                : "linear-gradient(135deg, #ff3b3b, #ff6b35)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px 20px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              height: "36px",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Adding..." : "Add →"}
          </button>
        </div>
      )}

      {/* Queue */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "20px 0 40px",
        }}
      >
        {queue.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#ffffff20",
              fontSize: "16px",
              fontFamily: "'DM Mono', monospace",
              animation: "fadeIn 0.4s ease both",
            }}
          >
            Queue is empty — add someone to get started
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "0 40px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "'DM Mono', monospace",
                  color: "#ffffff30",
                  letterSpacing: "2px",
                }}
              >
                FRONT OF QUEUE
              </div>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "linear-gradient(90deg, #ffffff10, transparent)",
                }}
              />
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "'DM Mono', monospace",
                  color: "#ffffff30",
                  letterSpacing: "2px",
                }}
              >
                BACK
              </div>
            </div>

            <div
              ref={scrollRef}
              style={{
                overflowX: "auto",
                overflowY: "visible",
                padding: "20px 40px 20px",
                display: "flex",
                gap: "28px",
                alignItems: "flex-end",
                minHeight: "240px",
              }}
            >
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
                  onEdit={() => handleEdit(person)}
                  isDragging={dragIdx === idx}
                  isHighlighted={highlightedId === person.id}
                  isCompleting={completingId === person.id}
                  isBouncing={bouncingId === person.id}
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                />
              ))}
            </div>

            {/* Legend */}
            <div
              style={{
                padding: "16px 40px 0",
                display: "flex",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#ffffff25",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "1px",
                }}
              >
                PRIORITY:
              </div>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: v.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#ffffff40",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {v.label}
                  </span>
                </div>
              ))}
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: "10px",
                  color: "#ffffff25",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                🏁 CLICK RIBBON TO COMPLETE · ✏ EDIT · DRAG TO REORDER
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
