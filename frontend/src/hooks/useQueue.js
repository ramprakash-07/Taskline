/**
 * Custom hook for queue state management.
 * Supports both Clerk auth and Guest mode.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  fetchQueue,
  createItem,
  deleteItem as apiDeleteItem,
  completeItem as apiCompleteItem,
  reorderQueue,
  updateItem as apiUpdateItem,
} from "../api/api";

export function useQueue(guestId = null) {
  const { getToken, isSignedIn } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use Clerk getToken for authenticated users, null for guests
  const tokenFn = isSignedIn ? getToken : null;

  /** Fetch the queue from the API. */
  const refreshQueue = useCallback(async () => {
    try {
      setError(null);
      const items = await fetchQueue(tokenFn, guestId);
      setQueue(items);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
      setError("Failed to load queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [tokenFn, guestId]);

  /** Load queue on mount. */
  useEffect(() => {
    if (isSignedIn || guestId) {
      refreshQueue();
    } else {
      setLoading(false);
    }
  }, [refreshQueue, isSignedIn, guestId]);

  /** Add a new item to the queue. */
  const addItem = useCallback(
    async (data) => {
      try {
        setError(null);
        const newItem = await createItem(tokenFn, data, guestId);
        setQueue((q) => [...q, newItem]);
        return newItem;
      } catch (err) {
        console.error("Failed to create item:", err);
        const detail = err.response?.data?.detail;
        setError(detail || "Failed to add item. Please try again.");
        throw err;
      }
    },
    [tokenFn, guestId]
  );

  /** Remove an item from the queue. */
  const removeItem = useCallback(
    async (itemId) => {
      try {
        setError(null);
        // Optimistic update
        setQueue((q) => q.filter((item) => item.id !== itemId));
        await apiDeleteItem(tokenFn, itemId, guestId);
      } catch (err) {
        console.error("Failed to delete item:", err);
        setError("Failed to delete item. Please try again.");
        await refreshQueue(); // Revert on failure
      }
    },
    [tokenFn, guestId, refreshQueue]
  );

  /** Complete an item (remove + return name for celebration). */
  const completeItemAction = useCallback(
    async (itemId) => {
      try {
        setError(null);
        const item = queue.find((i) => i.id === itemId);
        // Optimistic removal
        setQueue((q) => q.filter((i) => i.id !== itemId));
        const result = await apiCompleteItem(tokenFn, itemId, guestId);
        return result.name || item?.name;
      } catch (err) {
        console.error("Failed to complete item:", err);
        setError("Failed to complete item. Please try again.");
        await refreshQueue(); // Revert on failure
        return null;
      }
    },
    [tokenFn, guestId, queue, refreshQueue]
  );

  /** Update an item in-place (preserving position). */
  const updateItemAction = useCallback(
    async (itemId, data) => {
      try {
        setError(null);
        // Optimistic update — merge changes in-place
        setQueue((q) =>
          q.map((item) =>
            item.id === itemId ? { ...item, ...data } : item
          )
        );
        const updated = await apiUpdateItem(tokenFn, itemId, data, guestId);
        // Replace with server response to ensure consistency
        setQueue((q) =>
          q.map((item) => (item.id === itemId ? updated : item))
        );
        return updated;
      } catch (err) {
        console.error("Failed to update item:", err);
        setError("Failed to update item. Please try again.");
        await refreshQueue(); // Revert on failure
        return null;
      }
    },
    [tokenFn, guestId, refreshQueue]
  );

  /** Reorder items (optimistic + API sync). */
  const reorderItems = useCallback(
    async (newQueue) => {
      try {
        setError(null);
        // Optimistic update
        setQueue(newQueue);
        const itemIds = newQueue.map((item) => item.id);
        await reorderQueue(tokenFn, itemIds, guestId);
      } catch (err) {
        console.error("Failed to reorder:", err);
        setError("Failed to reorder. Please try again.");
        await refreshQueue(); // Revert on failure
      }
    },
    [tokenFn, guestId, refreshQueue]
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
    updateItem: updateItemAction,
    reorderItems,
    sortByPriority,
    refreshQueue,
    clearError: () => setError(null),
  };
}
