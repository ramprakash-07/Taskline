/**
 * RoomsList — Full-page team queues listing.
 * Create, browse, and navigate to shared rooms.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { fetchRooms, createRoom, deleteRoom } from "../api/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function RoomsList() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRooms(getToken);
        setRooms(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      const newRoom = await createRoom(getToken, { name: roomName.trim() });
      setRooms((r) => [...r, newRoom]);
      setRoomName("");
      setShowCreate(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, roomId) => {
    e.stopPropagation();
    if (!confirm("Delete this room? This cannot be undone.")) return;
    try {
      await deleteRoom(getToken, roomId);
      setRooms((r) => r.filter((room) => room.id !== roomId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete room");
    }
  };

  const copyInvite = (e, roomId) => {
    e.stopPropagation();
    const link = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
        <div style={styles.loadingText}>LOADING TEAM QUEUES...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Error toast */}
      {error && (
        <div className="error-toast" onClick={() => setError(null)} style={{ cursor: "pointer" }}>
          ⚠ {error}
          <span style={{ marginLeft: "8px", opacity: 0.5, fontSize: "11px" }}>click to dismiss</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          ← Back
        </button>
        <div>
          <div style={styles.label}>TEAM QUEUES</div>
          <div style={styles.title}>Your Rooms</div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statBox}>
            <div style={styles.statVal}>{rooms.length}</div>
            <div style={styles.statLbl}>ROOMS</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Room cards grid */}
        <div style={styles.grid}>
          {rooms.map((room, i) => (
            <div
              key={room.id}
              onClick={() => navigate(`/rooms/${room.id}`)}
              style={{
                ...styles.roomCard,
                animation: `cardIn 0.4s cubic-bezier(.4,0,.2,1) both`,
                animationDelay: `${i * 0.06}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ffffff28";
                e.currentTarget.style.background = "#ffffff0c";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#ffffff14";
                e.currentTarget.style.background = "#ffffff08";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Room icon */}
              <div style={styles.roomIcon}>🚀</div>

              {/* Room name */}
              <div style={styles.roomName}>{room.name}</div>

              {/* Member count */}
              <div style={styles.memberCount}>
                <span style={styles.memberDot} />
                {room.member_count || room.members?.length || 1} member{(room.member_count || room.members?.length || 1) !== 1 ? "s" : ""}
              </div>

              {/* Actions row */}
              <div style={styles.cardActions}>
                <button
                  onClick={(e) => copyInvite(e, room.id)}
                  style={{
                    ...styles.inviteBtn,
                    background: copiedId === room.id ? "#00c9a720" : "#ffffff0c",
                    borderColor: copiedId === room.id ? "#00c9a7" : "#ffffff18",
                    color: copiedId === room.id ? "#00c9a7" : "#ffffff70",
                  }}
                >
                  {copiedId === room.id ? "✓ Copied!" : "🔗 Invite"}
                </button>
                {room.is_owner && (
                  <button
                    onClick={(e) => handleDelete(e, room.id)}
                    style={styles.deleteBtn}
                    title="Delete room"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Owner badge */}
              {room.is_owner && (
                <div style={styles.ownerBadge}>OWNER</div>
              )}
            </div>
          ))}

          {/* Create room card */}
          {!showCreate ? (
            <div
              onClick={() => setShowCreate(true)}
              style={{
                ...styles.roomCard,
                ...styles.createCard,
                animation: `cardIn 0.4s cubic-bezier(.4,0,.2,1) both`,
                animationDelay: `${rooms.length * 0.06}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ff3b3b55";
                e.currentTarget.style.background = "#ff3b3b0a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#ffffff14";
                e.currentTarget.style.background = "#ffffff04";
              }}
            >
              <div style={styles.createIcon}>+</div>
              <div style={styles.createText}>Create Room</div>
            </div>
          ) : (
            <div
              style={{
                ...styles.roomCard,
                ...styles.createFormCard,
                animation: "fadeIn 0.25s ease both",
              }}
            >
              <div style={styles.createFormTitle}>New Team Queue</div>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                style={styles.input}
              />
              <div style={styles.createFormActions}>
                <button
                  onClick={handleCreate}
                  disabled={creating || !roomName.trim()}
                  style={{
                    ...styles.submitBtn,
                    opacity: creating || !roomName.trim() ? 0.5 : 1,
                    cursor: creating || !roomName.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {creating ? "Creating..." : "Create →"}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setRoomName(""); }}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {rooms.length === 0 && !showCreate && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
            <div style={{ fontSize: "16px", color: "#ffffff40", fontFamily: "'DM Mono', monospace" }}>
              No team queues yet — create one to get started
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#080b12",
    backgroundImage:
      "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1a0a1a 0%, transparent 50%)",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  loadingContainer: {
    minHeight: "100vh",
    background: "#080b12",
    backgroundImage:
      "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1a0a1a 0%, transparent 50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
  },
  loadingText: {
    color: "#ffffff40",
    fontSize: "13px",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "1px",
  },
  header: {
    padding: "28px 40px 20px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
    borderBottom: "1px solid #ffffff08",
  },
  backBtn: {
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    color: "#ffffff60",
    borderRadius: "10px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  label: {
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    color: "#ffffff40",
    letterSpacing: "3px",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.5px",
    lineHeight: 1,
  },
  headerRight: {
    marginLeft: "auto",
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  statBox: { textAlign: "center" },
  statVal: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#fff",
    fontFamily: "'DM Mono', monospace",
  },
  statLbl: {
    fontSize: "10px",
    color: "#ffffff40",
    letterSpacing: "1px",
  },
  content: {
    flex: 1,
    padding: "40px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
    maxWidth: "1000px",
  },
  roomCard: {
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    borderRadius: "16px",
    padding: "24px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "relative",
  },
  roomIcon: {
    fontSize: "32px",
    lineHeight: 1,
  },
  roomName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.3,
  },
  memberCount: {
    fontSize: "12px",
    color: "#ffffff50",
    fontFamily: "'DM Mono', monospace",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  memberDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00c9a7",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
  },
  inviteBtn: {
    background: "#ffffff0c",
    border: "1px solid #ffffff18",
    color: "#ffffff70",
    borderRadius: "8px",
    padding: "5px 12px",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  deleteBtn: {
    background: "#ff3b3b14",
    border: "1px solid #ff3b3b33",
    color: "#ff3b3b",
    borderRadius: "8px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 700,
    transition: "all 0.2s ease",
  },
  ownerBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "#FFD70018",
    color: "#FFD700",
    fontSize: "9px",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "20px",
    border: "1px solid #FFD70033",
    letterSpacing: "1px",
  },
  createCard: {
    background: "#ffffff04",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "160px",
  },
  createIcon: {
    fontSize: "36px",
    fontWeight: 300,
    color: "#ffffff30",
    lineHeight: 1,
  },
  createText: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff40",
    fontFamily: "'DM Sans', sans-serif",
  },
  createFormCard: {
    background: "#0f1117",
    border: "1px solid #ffffff20",
    cursor: "default",
  },
  createFormTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "4px",
  },
  input: {
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border 0.2s",
  },
  createFormActions: {
    display: "flex",
    gap: "8px",
  },
  submitBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
    border: "none",
    color: "#fff",
    borderRadius: "8px",
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    boxShadow: "0 4px 16px #ff3b3b30",
    transition: "all 0.2s ease",
  },
  cancelBtn: {
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    color: "#ffffff60",
    borderRadius: "8px",
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    animation: "fadeIn 0.4s ease both",
  },
};
