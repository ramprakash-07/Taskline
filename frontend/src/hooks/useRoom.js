import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  fetchRoom, fetchRoomQueue, addRoomTask as apiAddTask,
  reorderRoomTasks, deleteRoomTask as apiDeleteTask,
  completeRoomTask as apiCompleteTask, updateRoomTask as apiUpdateTask,
} from "../api/api";

const WS_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/^http/, "ws");

export function useRoom(roomId) {
  const { getToken, isSignedIn } = useAuth();
  const [room, setRoom] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  // Fetch room + queue
  const refresh = useCallback(async () => {
    if (!isSignedIn || !roomId) return;
    try {
      setError(null);
      const [roomData, queueData] = await Promise.all([
        fetchRoom(getToken, roomId),
        fetchRoomQueue(getToken, roomId),
      ]);
      setRoom(roomData);
      setQueue(queueData);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load room");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, roomId, getToken]);

  useEffect(() => { refresh(); }, [refresh]);

  // WebSocket connection with auto-reconnect
  const connectWs = useCallback(async () => {
    if (!isSignedIn || !roomId) return;
    try {
      const token = await getToken();
      const ws = new WebSocket(`${WS_BASE}/ws/rooms/${roomId}?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("[WS]", msg.type, msg.data);
          // On any update, refresh the queue
          refresh();
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Auto-reconnect after 3 seconds
        reconnectRef.current = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => ws.close();
    } catch (err) {
      console.error("WS connection failed:", err);
    }
  }, [isSignedIn, roomId, getToken, refresh]);

  useEffect(() => {
    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWs]);

  const addTask = useCallback(async (data) => {
    const task = await apiAddTask(getToken, roomId, data);
    setQueue(q => [...q, task]);
    return task;
  }, [getToken, roomId]);

  const removeTask = useCallback(async (taskId) => {
    setQueue(q => q.filter(t => t.id !== taskId));
    await apiDeleteTask(getToken, roomId, taskId);
  }, [getToken, roomId]);

  const completeTask = useCallback(async (taskId) => {
    setQueue(q => q.filter(t => t.id !== taskId));
    const result = await apiCompleteTask(getToken, roomId, taskId);
    return result.name;
  }, [getToken, roomId]);

  const updateTask = useCallback(async (taskId, data) => {
    setQueue(q => q.map(t => t.id === taskId ? { ...t, ...data } : t));
    const updated = await apiUpdateTask(getToken, roomId, taskId, data);
    setQueue(q => q.map(t => t.id === taskId ? updated : t));
    return updated;
  }, [getToken, roomId]);

  const reorderTasks = useCallback(async (newQueue) => {
    setQueue(newQueue);
    const ids = newQueue.map(t => t.id);
    await reorderRoomTasks(getToken, roomId, ids);
  }, [getToken, roomId]);

  return { room, queue, loading, error, addTask, removeTask, completeTask, updateTask, reorderTasks, refresh };
}
