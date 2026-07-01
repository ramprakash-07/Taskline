/**
 * JoinRoom — Invite landing page at /join/:roomId.
 * Auto-joins authenticated users; prompts sign-in for guests.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams, useNavigate } from "react-router-dom";
import { joinRoom } from "../api/api";

export default function JoinRoom() {
  const { roomId } = useParams();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | joining | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // Auto-join the room
      setStatus("joining");
      (async () => {
        try {
          await joinRoom(getToken, roomId);
          setStatus("success");
          setTimeout(() => navigate(`/rooms/${roomId}`), 800);
        } catch (err) {
          setStatus("error");
          setError(err.response?.data?.detail || "Failed to join room");
        }
      })();
    } else {
      // Store room ID for post-login redirect
      sessionStorage.setItem("taskline_join_room", roomId);
      setStatus("signin");
    }
  }, [isLoaded, isSignedIn, roomId, getToken, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Loading / Joining state */}
        {(status === "loading" || status === "joining") && (
          <div style={styles.centered}>
            <div className="spinner" />
            <div style={styles.statusText}>
              {status === "loading" ? "LOADING..." : "JOINING ROOM..."}
            </div>
          </div>
        )}

        {/* Success state */}
        {status === "success" && (
          <div style={styles.centered}>
            <div style={styles.successIcon}>✓</div>
            <div style={styles.successText}>You're in!</div>
            <div style={styles.redirectText}>Redirecting to room...</div>
          </div>
        )}

        {/* Sign-in prompt */}
        {status === "signin" && (
          <div style={styles.centered}>
            <div style={styles.inviteIcon}>🚀</div>
            <div style={styles.inviteTitle}>You've been invited!</div>
            <div style={styles.inviteSubtitle}>
              Join a TaskLine Team Queue and collaborate with your team in real-time.
            </div>
            <button
              onClick={() => navigate("/sign-in")}
              style={styles.signInBtn}
            >
              Sign In to Join
            </button>
            <button
              onClick={() => navigate("/sign-up")}
              style={styles.signUpBtn}
            >
              Create an Account
            </button>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div style={styles.centered}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorTitle}>Couldn't join room</div>
            <div style={styles.errorText}>{error}</div>
            <div style={styles.errorActions}>
              <button onClick={() => navigate("/")} style={styles.homeBtn}>
                Go Home
              </button>
              <button
                onClick={() => {
                  setStatus("joining");
                  setError(null);
                  (async () => {
                    try {
                      await joinRoom(getToken, roomId);
                      setStatus("success");
                      setTimeout(() => navigate(`/rooms/${roomId}`), 800);
                    } catch (err) {
                      setStatus("error");
                      setError(err.response?.data?.detail || "Failed to join room");
                    }
                  })();
                }}
                style={styles.retryBtn}
              >
                Try Again
              </button>
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
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    width: "440px",
    maxWidth: "90vw",
    background: "linear-gradient(145deg, #12151f, #0a0d14)",
    border: "1px solid #ffffff14",
    borderRadius: "24px",
    padding: "48px 40px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px #ffffff08 inset",
    animation: "slideUp 0.4s cubic-bezier(.4,0,.2,1) both",
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  statusText: {
    color: "#ffffff40",
    fontSize: "12px",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "2px",
    marginTop: "8px",
  },
  successIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00c9a7, #00a896)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: 800,
    color: "#fff",
    boxShadow: "0 0 24px #00c9a740",
    animation: "streakScaleUp 0.5s ease both",
  },
  successText: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#ffffff",
  },
  redirectText: {
    fontSize: "13px",
    color: "#ffffff40",
    fontFamily: "'DM Mono', monospace",
  },
  inviteIcon: {
    fontSize: "56px",
    lineHeight: 1,
    animation: "streakScaleUp 0.5s ease both",
  },
  inviteTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  inviteSubtitle: {
    fontSize: "14px",
    color: "#ffffff60",
    lineHeight: 1.6,
    maxWidth: "300px",
  },
  signInBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
    border: "none",
    color: "#fff",
    borderRadius: "12px",
    padding: "14px 24px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    boxShadow: "0 8px 32px #ff3b3b30",
    marginTop: "8px",
    transition: "all 0.2s ease",
  },
  signUpBtn: {
    width: "100%",
    background: "#ffffff08",
    border: "1px solid #ffffff18",
    color: "#ffffff80",
    borderRadius: "12px",
    padding: "12px 24px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  errorIcon: {
    fontSize: "48px",
    lineHeight: 1,
  },
  errorTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
  },
  errorText: {
    fontSize: "13px",
    color: "#ff8888",
    fontFamily: "'DM Mono', monospace",
    padding: "10px 16px",
    background: "#ff3b3b12",
    border: "1px solid #ff3b3b33",
    borderRadius: "10px",
    width: "100%",
    textAlign: "center",
  },
  errorActions: {
    display: "flex",
    gap: "12px",
    width: "100%",
    marginTop: "4px",
  },
  homeBtn: {
    flex: 1,
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    color: "#ffffff60",
    borderRadius: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  retryBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
    border: "none",
    color: "#fff",
    borderRadius: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    boxShadow: "0 4px 16px #ff3b3b30",
    transition: "all 0.2s ease",
  },
};
