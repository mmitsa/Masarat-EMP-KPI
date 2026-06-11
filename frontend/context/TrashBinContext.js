import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TrashBinContext = createContext();

export function TrashBinProvider({ children }) {
  const [trashItems, setTrashItems] = useState([]);
  const [restoreNotifications, setRestoreNotifications] = useState([]);
  const [showTrashDropdown, setShowTrashDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load trash items from the API
  const loadTrashItems = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.system) params.set('system', filters.system);
      if (filters.actionType) params.set('actionType', filters.actionType);
      if (filters.status) params.set('status', filters.status);
      if (filters.page) params.set('page', filters.page);
      if (filters.limit) params.set('limit', filters.limit);

      const query = params.toString();
      const url = query ? `/api/trash?${query}` : '/api/trash';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        setTrashItems([]);
        return;
      }
      const data = await res.json();
      // Support both { data: [] }, { items: [] } and plain array responses
      setTrashItems(Array.isArray(data) ? data : (data.data || data.items || []));
    } catch (err) {
      setTrashItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadTrashItems();
  }, [loadTrashItems]);

  // Derived counts (computed from local state for instant UI updates)
  const unreadCount = trashItems.filter(item =>
    (item.actionType || item.action) === 'rejected' && item.restoreStatus !== 'requested'
  ).length;

  const pendingRestoreRequests = restoreNotifications.filter(n =>
    n.status === 'pending' && !n.read
  ).length;

  // Add item to trash — POST /api/trash
  const addToTrash = useCallback(async (item) => {
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) return null;
      const created = await res.json();
      const newItem = created.data || created;
      setTrashItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      return null;
    }
  }, []);

  // Request restore — PUT /api/trash/[id]?action=request
  const requestRestore = useCallback(async (itemId, reason = '') => {
    try {
      const res = await fetch(`/api/trash/${itemId}?action=request`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) return false;
      const updated = await res.json();
      const updatedItem = updated.data || updated;
      setTrashItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  // Approve restore — PUT /api/trash/[id]?action=approve
  const approveRestore = useCallback(async (itemId, approverInfo) => {
    try {
      const res = await fetch(`/api/trash/${itemId}?action=approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverInfo }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      const updatedItem = updated.data || updated;
      setTrashItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      // Mark related notifications as approved
      setRestoreNotifications(prev => prev.map(n =>
        n.trashItemId === itemId ? { ...n, status: 'approved', read: true } : n
      ));
    } catch (err) {
      return;
    }
  }, []);

  // Reject restore — PUT /api/trash/[id]?action=reject
  const rejectRestore = useCallback(async (itemId, reason, rejecterInfo) => {
    try {
      const res = await fetch(`/api/trash/${itemId}?action=reject`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, rejecterInfo }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      const updatedItem = updated.data || updated;
      setTrashItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      // Mark related notifications as rejected
      setRestoreNotifications(prev => prev.map(n =>
        n.trashItemId === itemId ? { ...n, status: 'rejected', read: true } : n
      ));
    } catch (err) {
      return;
    }
  }, []);

  // Permanent delete — DELETE /api/trash/[id]
  const permanentDelete = useCallback(async (itemId) => {
    try {
      const res = await fetch(`/api/trash/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) return;
      setTrashItems(prev => prev.filter(item => item.id !== itemId));
      setRestoreNotifications(prev => prev.filter(n => n.trashItemId !== itemId));
    } catch (err) {
      return;
    }
  }, []);

  // Mark notification as read (local only — no dedicated API endpoint)
  const markNotificationRead = useCallback((notificationId) => {
    setRestoreNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
  }, []);

  // Filter helpers (operate on local state)
  const getItemsBySystem = useCallback((system) => {
    if (system === 'all') return trashItems;
    return trashItems.filter(item => (item.systemId || item.system) === system);
  }, [trashItems]);

  const getItemsByAction = useCallback((action) => {
    if (action === 'all') return trashItems;
    return trashItems.filter(item => (item.actionType || item.action) === action);
  }, [trashItems]);

  const value = {
    trashItems,
    restoreNotifications,
    unreadCount,
    pendingRestoreRequests,
    loading,
    showTrashDropdown,
    setShowTrashDropdown,
    loadTrashItems,
    addToTrash,
    requestRestore,
    approveRestore,
    rejectRestore,
    permanentDelete,
    markNotificationRead,
    getItemsBySystem,
    getItemsByAction,
  };

  return (
    <TrashBinContext.Provider value={value}>
      {children}
    </TrashBinContext.Provider>
  );
}

export function useTrashBin() {
  const context = useContext(TrashBinContext);
  if (!context) {
    throw new Error('useTrashBin must be used within a TrashBinProvider');
  }
  return context;
}

export default TrashBinContext;
