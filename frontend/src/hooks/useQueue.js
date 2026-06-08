/**
 * Custom hook for queue state management.
 * Wraps all API calls and manages loading/error states.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  fetchQueue,
  createItem,
  deleteItem as apiDeleteItem,
  completeItem as apiCompleteItem,
  reorderQueue,
} from "../api/api";

export function useQueue() {
  const { getToken } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Fetch the queue from the API. */
  const refreshQueue = useCallback(async () => {
    try {
      setError(null);
      const items = await fetchQueue(getToken);
      setQueue(items);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
      setError("Failed to load queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  /** Load queue on mount. */
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  /** Add a new item to the queue. */
  const addItem = useCallback(
    async (data) => {
      try {
        setError(null);
        const newItem = await createItem(getToken, data);
        setQueue((q) => [...q, newItem]);
        return newItem;
      } catch (err) {
        console.error("Failed to create item:", err);
        setError("Failed to add item. Please try again.");
        throw err;
      }
    },
    [getToken]
  );

  /** Remove an item from the queue. */
  const removeItem = useCallback(
    async (itemId) => {
      try {
        setError(null);
        // Optimistic update
        setQueue((q) => q.filter((item) => item.id !== itemId));
        await apiDeleteItem(getToken, itemId);
      } catch (err) {
        console.error("Failed to delete item:", err);
        setError("Failed to delete item. Please try again.");
        await refreshQueue(); // Revert on failure
      }
    },
    [getToken, refreshQueue]
  );

  /** Complete an item (remove + return name for celebration). */
  const completeItemAction = useCallback(
    async (itemId) => {
      try {
        setError(null);
        const item = queue.find((i) => i.id === itemId);
        // Optimistic removal
        setQueue((q) => q.filter((i) => i.id !== itemId));
        const result = await apiCompleteItem(getToken, itemId);
        return result.name || item?.name;
      } catch (err) {
        console.error("Failed to complete item:", err);
        setError("Failed to complete item. Please try again.");
        await refreshQueue(); // Revert on failure
        return null;
      }
    },
    [getToken, queue, refreshQueue]
  );

  /** Reorder items (optimistic + API sync). */
  const reorderItems = useCallback(
    async (newQueue) => {
      try {
        setError(null);
        // Optimistic update
        setQueue(newQueue);
        const itemIds = newQueue.map((item) => item.id);
        await reorderQueue(getToken, itemIds);
      } catch (err) {
        console.error("Failed to reorder:", err);
        setError("Failed to reorder. Please try again.");
        await refreshQueue(); // Revert on failure
      }
    },
    [getToken, refreshQueue]
  );

  /** Sort by priority (optimistic + API sync). */
  const sortByPriority = useCallback(async () => {
    const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
    const sorted = [...queue].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
    );
    await reorderItems(sorted);
  }, [queue, reorderItems]);

  return {
    queue,
    loading,
    error,
    addItem,
    removeItem,
    completeItem: completeItemAction,
    reorderItems,
    sortByPriority,
    refreshQueue,
    clearError: () => setError(null),
  };
}
