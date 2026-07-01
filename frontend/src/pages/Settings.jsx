/**
 * Settings — User settings page.
 * Manages morning briefing preferences (toggle, time, email).
 */

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { fetchBriefingPreferences, updateBriefingPreferences } from "../api/api";

export default function Settings() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [enabled, setEnabled] = useState(true);
  const [briefingTime, setBriefingTime] = useState("08:00");
  const [email, setEmail] = useState("");

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    (async () => {
      try {
        const prefs = await fetchBriefingPreferences(getToken);
        setEnabled(prefs.enabled ?? true);
        setBriefingTime(prefs.briefing_time || "08:00");
        setEmail(prefs.email || "");
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateBriefingPreferences(getToken, {
        enabled,
        briefing_time: briefingTime,
        timezone,
        email: email.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
        <div style={styles.loadingText}>LOADING SETTINGS...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Success toast */}
      {saved && (
        <div style={styles.successToast}>
          ✓ Settings saved successfully
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="error-toast" onClick={() => setError(null)} style={{ cursor: "pointer" }}>
          ⚠ {error}
        </div>
      )}

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate("/")} style={styles.backBtn}>
            ←
          </button>
          <div>
            <div style={styles.headerLabel}>SETTINGS</div>
            <div style={styles.headerTitle}>⚙️ Settings</div>
          </div>
        </div>

        {/* Daily Morning Briefing Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>☀️</div>
            <div>
              <div style={styles.sectionTitle}>Daily Morning Briefing</div>
              <div style={styles.sectionDesc}>
                Get a quick overview of your queue every morning
              </div>
            </div>
          </div>

          {/* Enable toggle */}
          <div style={styles.row}>
            <div style={styles.rowLabel}>
              <div style={styles.rowTitle}>Enabled</div>
              <div style={styles.rowDesc}>Show briefing popup when you open TaskLine</div>
            </div>
            <div
              onClick={() => setEnabled(!enabled)}
              style={{
                ...styles.toggle,
                background: enabled
                  ? "linear-gradient(135deg, #ff3b3b, #ff6b35)"
                  : "#ffffff14",
                boxShadow: enabled ? "0 0 12px #ff3b3b30" : "none",
              }}
            >
              <div
                style={{
                  ...styles.toggleKnob,
                  transform: enabled ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </div>
          </div>

          {/* Briefing time */}
          <div style={styles.row}>
            <div style={styles.rowLabel}>
              <div style={styles.rowTitle}>Briefing Time</div>
              <div style={styles.rowDesc}>When to show your daily briefing</div>
            </div>
            <input
              type="time"
              value={briefingTime}
              onChange={(e) => setBriefingTime(e.target.value)}
              disabled={!enabled}
              style={{
                ...styles.timeInput,
                opacity: enabled ? 1 : 0.4,
                cursor: enabled ? "pointer" : "not-allowed",
              }}
            />
          </div>

          {/* Timezone */}
          <div style={styles.row}>
            <div style={styles.rowLabel}>
              <div style={styles.rowTitle}>Timezone</div>
              <div style={styles.rowDesc}>Auto-detected from your system</div>
            </div>
            <div style={styles.timezoneValue}>{timezone}</div>
          </div>

          {/* Email */}
          <div style={styles.row}>
            <div style={styles.rowLabel}>
              <div style={styles.rowTitle}>Email Briefing</div>
              <div style={styles.rowDesc}>Optional — receive briefing via email too</div>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={!enabled}
              style={{
                ...styles.emailInput,
                opacity: enabled ? 1 : 0.4,
                cursor: enabled ? "text" : "not-allowed",
              }}
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveBtn,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
        </button>
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
    justifyContent: "center",
    padding: "40px 20px",
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
  container: {
    width: "600px",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #ffffff08",
  },
  backBtn: {
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    color: "#ffffff60",
    borderRadius: "10px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease",
  },
  headerLabel: {
    fontSize: "10px",
    fontFamily: "'DM Mono', monospace",
    color: "#ffffff40",
    letterSpacing: "3px",
    marginBottom: "4px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  section: {
    background: "#0f1117",
    border: "1px solid #ffffff10",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    animation: "cardIn 0.4s cubic-bezier(.4,0,.2,1) both",
  },
  sectionHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    paddingBottom: "20px",
    borderBottom: "1px solid #ffffff0a",
    marginBottom: "4px",
  },
  sectionIcon: {
    fontSize: "28px",
    lineHeight: 1,
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#ffffff",
  },
  sectionDesc: {
    fontSize: "12px",
    color: "#ffffff50",
    marginTop: "2px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 0",
    borderBottom: "1px solid #ffffff08",
    gap: "16px",
  },
  rowLabel: {
    flex: 1,
  },
  rowTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffffd0",
  },
  rowDesc: {
    fontSize: "11px",
    color: "#ffffff40",
    marginTop: "3px",
    fontFamily: "'DM Sans', sans-serif",
  },
  toggle: {
    width: "48px",
    height: "28px",
    borderRadius: "14px",
    padding: "4px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    flexShrink: 0,
    position: "relative",
  },
  toggleKnob: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
  },
  timeInput: {
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    borderRadius: "10px",
    padding: "8px 14px",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "'DM Mono', monospace",
    outline: "none",
    colorScheme: "dark",
    transition: "border 0.2s",
  },
  timezoneValue: {
    fontSize: "13px",
    color: "#ffffff50",
    fontFamily: "'DM Mono', monospace",
    background: "#ffffff08",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid #ffffff0a",
  },
  emailInput: {
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    borderRadius: "10px",
    padding: "8px 14px",
    color: "#fff",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "200px",
    transition: "border 0.2s",
  },
  saveBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #ff3b3b, #ff6b35)",
    border: "none",
    color: "#fff",
    borderRadius: "14px",
    padding: "14px 24px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 800,
    boxShadow: "0 8px 32px #ff3b3b30",
    transition: "all 0.2s ease",
    letterSpacing: "0.3px",
    animation: "cardIn 0.4s cubic-bezier(.4,0,.2,1) both",
    animationDelay: "0.1s",
  },
  successToast: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: "linear-gradient(135deg, #002a22, #001a14)",
    border: "1px solid #00c9a744",
    color: "#00c9a7",
    padding: "12px 20px",
    borderRadius: "12px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    boxShadow: "0 4px 24px #00c9a720",
    animation: "slideUp 0.3s ease both",
    zIndex: 1000,
  },
};
