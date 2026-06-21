/**
 * EditTaskModal — pre-filled modal for editing a task card.
 * Validates that name and task cannot be empty.
 */

import { useState, useEffect, useRef } from "react";
import { PRIORITIES } from "./PersonCard";

export default function EditTaskModal({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: item.name,
    task: item.task,
    priority: item.priority,
    deadline: item.deadline
      ? new Date(item.deadline).toISOString().slice(0, 16)
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const backdropRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.task.trim()) errs.task = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        task: form.task.trim(),
        priority: form.priority,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onCancel();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "#00000080",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
        animation: "fadeIn 0.2s ease both",
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #0f1117, #161b26)",
          border: "1px solid #ffffff14",
          borderRadius: "20px",
          padding: "28px 32px",
          width: "420px",
          maxWidth: "90vw",
          boxShadow: "0 16px 64px #00000080",
          animation: "cardIn 0.3s ease both",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ✏️ Edit Task
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff50",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>NAME</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (errors.name && e.target.value.trim()) setErrors((er) => ({ ...er, name: false }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              style={{
                ...inputStyle,
                borderColor: errors.name ? "#ff3b3b" : "#ffffff14",
              }}
              placeholder="Person's name"
            />
            {errors.name && (
              <span style={{ fontSize: "11px", color: "#ff3b3b", fontFamily: "'DM Mono', monospace" }}>
                Name cannot be empty
              </span>
            )}
          </div>

          {/* Task */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>TASK</label>
            <input
              type="text"
              value={form.task}
              onChange={(e) => {
                setForm((f) => ({ ...f, task: e.target.value }));
                if (errors.task && e.target.value.trim()) setErrors((er) => ({ ...er, task: false }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              style={{
                ...inputStyle,
                borderColor: errors.task ? "#ff3b3b" : "#ffffff14",
              }}
              placeholder="What needs to be done?"
            />
            {errors.task && (
              <span style={{ fontSize: "11px", color: "#ff3b3b", fontFamily: "'DM Mono', monospace" }}>
                Task description cannot be empty
              </span>
            )}
          </div>

          {/* Priority */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>PRIORITY</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              style={{
                ...inputStyle,
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

          {/* Deadline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>DEADLINE</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: "#ffffff0c",
              border: "1px solid #ffffff18",
              color: "#ffffff80",
              borderRadius: "10px",
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving
                ? "#ffffff14"
                : "linear-gradient(135deg, #ff3b3b, #ff6b35)",
              border: "none",
              color: "#fff",
              borderRadius: "10px",
              padding: "8px 24px",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              boxShadow: saving ? "none" : "0 4px 16px #ff3b3b30",
              transition: "all 0.2s ease",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: "10px",
  color: "#ffffff40",
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "1px",
};

const inputStyle = {
  background: "#ffffff08",
  border: "1px solid #ffffff14",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "#fff",
  fontSize: "13px",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border 0.2s",
};
