/**
 * API client for TaskLine backend.
 * Supports both Clerk auth (getToken) and Guest mode (guestId).
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Build auth headers — Clerk Bearer token or Guest ID.
 * @param {Function|null} getToken - Clerk's getToken function (null for guests)
 * @param {string|null} guestId - Guest UUID (null for authenticated users)
 */
async function authHeaders(getToken, guestId) {
  if (guestId) {
    return { "X-Guest-ID": guestId };
  }
  if (getToken) {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  }
  throw new Error("No auth method provided");
}

/**
 * Fetch all queue items for the current user/guest.
 */
export async function fetchQueue(getToken, guestId = null) {
  const headers = await authHeaders(getToken, guestId);
  const res = await api.get("/api/queue", { headers });
  return res.data;
}

/**
 * Create a new queue item.
 * @param {Object} data - { name, task, priority, deadline }
 */
export async function createItem(getToken, data, guestId = null) {
  const headers = await authHeaders(getToken, guestId);
  const res = await api.post("/api/queue", data, { headers });
  return res.data;
}

/**
 * Delete a queue item by ID.
 */
export async function deleteItem(getToken, itemId, guestId = null) {
  const headers = await authHeaders(getToken, guestId);
  const res = await api.delete(`/api/queue/${itemId}`, { headers });
  return res.data;
}

/**
 * Mark a queue item as complete.
 * Returns { message, name } for celebration.
 */
export async function completeItem(getToken, itemId, guestId = null) {
  const headers = await authHeaders(getToken, guestId);
  const res = await api.post(`/api/queue/${itemId}/complete`, {}, { headers });
  return res.data;
}

/**
 * Reorder queue items.
 * @param {string[]} itemIds - Array of item IDs in desired order.
 */
export async function reorderQueue(getToken, itemIds, guestId = null) {
  const headers = await authHeaders(getToken, guestId);
  const res = await api.put("/api/queue/reorder", { item_ids: itemIds }, { headers });
  return res.data;
}

/**
 * Update a queue item's fields.
 * @param {Object} data - { name?, task?, priority?, deadline? }
 */
export async function updateItem(getToken, itemId, data, guestId = null) {
  const headers = await authHeaders(getToken, guestId);
  const res = await api.put(`/api/queue/${itemId}`, data, { headers });
  return res.data;
}

// ─── Guest-specific endpoints ───

/**
 * Create a new guest session.
 * Returns { guest_id, expires_at }
 */
export async function createGuestSession() {
  const res = await api.post("/api/guest/session");
  return res.data;
}

/**
 * Convert a guest queue to a permanent account.
 * Requires Clerk auth + guest_id.
 */
export async function convertGuestQueue(getToken, guestId) {
  const token = await getToken();
  const res = await api.post(
    "/api/guest/convert",
    { guest_id: guestId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

// ─── Streak endpoints ───

/**
 * Fetch the current user's streak data.
 */
export async function fetchStreak(getToken) {
  const token = await getToken();
  const res = await api.get("/api/streak", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Record a streak completion for today.
 * Returns { current_streak, longest_streak, last_completed_date, streak_increased }
 */
export async function completeStreak(getToken) {
  const token = await getToken();
  const res = await api.post("/api/streak/complete", {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ─── Room endpoints ───

export async function createRoom(getToken, data) {
  const token = await getToken();
  const res = await api.post("/api/rooms", data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function fetchRooms(getToken) {
  const token = await getToken();
  const res = await api.get("/api/rooms", { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function fetchRoom(getToken, roomId) {
  const token = await getToken();
  const res = await api.get(`/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function joinRoom(getToken, roomId) {
  const token = await getToken();
  const res = await api.post(`/api/rooms/${roomId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function deleteRoom(getToken, roomId) {
  const token = await getToken();
  const res = await api.delete(`/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function fetchRoomQueue(getToken, roomId) {
  const token = await getToken();
  const res = await api.get(`/api/rooms/${roomId}/queue`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function addRoomTask(getToken, roomId, data) {
  const token = await getToken();
  const res = await api.post(`/api/rooms/${roomId}/tasks`, data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function reorderRoomTasks(getToken, roomId, itemIds) {
  const token = await getToken();
  const res = await api.put(`/api/rooms/${roomId}/tasks/reorder`, { item_ids: itemIds }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function updateRoomTask(getToken, roomId, taskId, data) {
  const token = await getToken();
  const res = await api.put(`/api/rooms/${roomId}/tasks/${taskId}`, data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function deleteRoomTask(getToken, roomId, taskId) {
  const token = await getToken();
  const res = await api.delete(`/api/rooms/${roomId}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function completeRoomTask(getToken, roomId, taskId) {
  const token = await getToken();
  const res = await api.post(`/api/rooms/${roomId}/tasks/${taskId}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function setMemberName(getToken, roomId, displayName) {
  const token = await getToken();
  const res = await api.put(`/api/rooms/${roomId}/set-name`, { display_name: displayName }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

// ─── Briefing endpoints ───

export async function fetchBriefing(getToken) {
  const token = await getToken();
  const res = await api.get("/api/briefing", { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function fetchBriefingPreferences(getToken) {
  const token = await getToken();
  const res = await api.get("/api/briefing/preferences", { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function updateBriefingPreferences(getToken, data) {
  const token = await getToken();
  const res = await api.put("/api/briefing/preferences", data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function dismissBriefing(getToken) {
  const token = await getToken();
  const res = await api.post("/api/briefing/dismiss", {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
