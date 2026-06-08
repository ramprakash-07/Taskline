/**
 * API client for TaskLine backend.
 * All functions accept a getToken function from Clerk's useAuth().
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Helper to build auth headers using Clerk's getToken.
 */
async function authHeaders(getToken) {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetch all queue items for the current user.
 */
export async function fetchQueue(getToken) {
  const headers = await authHeaders(getToken);
  const res = await api.get("/api/queue", { headers });
  return res.data;
}

/**
 * Create a new queue item.
 * @param {Object} data - { name, task, priority, deadline }
 */
export async function createItem(getToken, data) {
  const headers = await authHeaders(getToken);
  const res = await api.post("/api/queue", data, { headers });
  return res.data;
}

/**
 * Delete a queue item by ID.
 */
export async function deleteItem(getToken, itemId) {
  const headers = await authHeaders(getToken);
  const res = await api.delete(`/api/queue/${itemId}`, { headers });
  return res.data;
}

/**
 * Mark a queue item as complete.
 * Returns { message, name } for celebration.
 */
export async function completeItem(getToken, itemId) {
  const headers = await authHeaders(getToken);
  const res = await api.post(`/api/queue/${itemId}/complete`, {}, { headers });
  return res.data;
}

/**
 * Reorder queue items.
 * @param {string[]} itemIds - Array of item IDs in desired order.
 */
export async function reorderQueue(getToken, itemIds) {
  const headers = await authHeaders(getToken);
  const res = await api.put("/api/queue/reorder", { item_ids: itemIds }, { headers });
  return res.data;
}

/**
 * Update a queue item's fields.
 * @param {Object} data - { name?, task?, priority?, deadline? }
 */
export async function updateItem(getToken, itemId, data) {
  const headers = await authHeaders(getToken);
  const res = await api.put(`/api/queue/${itemId}`, data, { headers });
  return res.data;
}
