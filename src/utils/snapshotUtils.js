/**
 * Snapshot-based state management utilities
 * Stores active trips/punches in localStorage for instant access
 * Eliminates need for continuous Firestore listeners
 */

// Storage keys
const STORAGE_KEYS = {
  ACTIVE_TRIP: 'dc_active_trip',
  ACTIVE_PUNCH: 'dc_active_punch',
  SYNC_QUEUE: 'dc_sync_queue',
};

// ==================== Active Trip Management ====================

/**
 * Save active trip to localStorage
 */
export const saveActiveTrip = (agentId, tripData) => {
  try {
    const key = `${STORAGE_KEYS.ACTIVE_TRIP}_${agentId}`;
    localStorage.setItem(key, JSON.stringify({
      ...tripData,
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error('Error saving active trip:', error);
    return false;
  }
};

/**
 * Get active trip from localStorage
 */
export const getActiveTrip = (agentId) => {
  try {
    const key = `${STORAGE_KEYS.ACTIVE_TRIP}_${agentId}`;
    const data = localStorage.getItem(key);

    if (!data) return null;

    const trip = JSON.parse(data);

    // Validate trip data
    if (!trip.startTime || trip.status !== 'active') {
      // Clear invalid data
      clearActiveTrip(agentId);
      return null;
    }

    return trip;
  } catch (error) {
    console.error('Error getting active trip:', error);
    return null;
  }
};

/**
 * Clear active trip from localStorage
 */
export const clearActiveTrip = (agentId) => {
  try {
    const key = `${STORAGE_KEYS.ACTIVE_TRIP}_${agentId}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error clearing active trip:', error);
    return false;
  }
};

// ==================== Active Punch Management ====================

/**
 * Save active punch to localStorage
 */
export const saveActivePunch = (agentId, punchData) => {
  try {
    const key = `${STORAGE_KEYS.ACTIVE_PUNCH}_${agentId}`;
    localStorage.setItem(key, JSON.stringify({
      ...punchData,
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error('Error saving active punch:', error);
    return false;
  }
};

/**
 * Get active punch from localStorage
 */
export const getActivePunch = (agentId) => {
  try {
    const key = `${STORAGE_KEYS.ACTIVE_PUNCH}_${agentId}`;
    const data = localStorage.getItem(key);

    if (!data) return null;

    const punch = JSON.parse(data);

    // Validate punch data
    if (!punch.punchInTime || punch.status !== 'active') {
      // Clear invalid data
      clearActivePunch(agentId);
      return null;
    }

    return punch;
  } catch (error) {
    console.error('Error getting active punch:', error);
    return null;
  }
};

/**
 * Clear active punch from localStorage
 */
export const clearActivePunch = (agentId) => {
  try {
    const key = `${STORAGE_KEYS.ACTIVE_PUNCH}_${agentId}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error clearing active punch:', error);
    return false;
  }
};

// ==================== Sync Queue Management ====================

/**
 * Add operation to sync queue
 */
export const queueSync = (operation) => {
  try {
    const queue = getSyncQueue();

    const queueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...operation,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    queue.push(queueItem);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

    console.log('✅ Queued sync operation:', queueItem.id);
    return queueItem.id;
  } catch (error) {
    console.error('Error queuing sync:', error);
    return null;
  }
};

/**
 * Get all pending sync operations
 */
export const getSyncQueue = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

/**
 * Update sync operation status
 */
export const updateSyncStatus = (syncId, status, error = null) => {
  try {
    const queue = getSyncQueue();
    const index = queue.findIndex(item => item.id === syncId);

    if (index === -1) return false;

    queue[index].status = status;
    queue[index].updatedAt = new Date().toISOString();

    if (error) {
      queue[index].error = error;
      queue[index].retryCount = (queue[index].retryCount || 0) + 1;
    }

    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Error updating sync status:', error);
    return false;
  }
};

/**
 * Remove completed sync operation from queue
 */
export const removeSyncOperation = (syncId) => {
  try {
    const queue = getSyncQueue();
    const filtered = queue.filter(item => item.id !== syncId);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing sync operation:', error);
    return false;
  }
};

/**
 * Clear all completed sync operations
 */
export const clearCompletedSyncs = () => {
  try {
    const queue = getSyncQueue();
    const pending = queue.filter(item => item.status === 'pending' || item.status === 'syncing');
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(pending));
    return true;
  } catch (error) {
    console.error('Error clearing completed syncs:', error);
    return false;
  }
};

// ==================== Utility Functions ====================

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get localStorage usage estimate (in KB)
 */
export const getStorageUsage = () => {
  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2); // KB
  } catch (error) {
    return 0;
  }
};
