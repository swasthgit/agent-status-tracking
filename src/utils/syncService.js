import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  getSyncQueue,
  updateSyncStatus,
  removeSyncOperation,
} from './snapshotUtils';

/**
 * Background sync service
 * Processes queued operations and syncs to Firestore when online
 */
class SyncService {
  constructor() {
    this.isProcessing = false;
    this.maxRetries = 5;
    this.baseDelay = 1000; // 1 second
  }

  /**
   * Start processing sync queue
   */
  async start() {
    if (this.isProcessing) {
      console.log('⏸️  Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('📴 Offline - sync will start when online');
      return;
    }

    console.log('🔄 Starting sync service...');
    await this.processQueue();
  }

  /**
   * Process all pending operations in queue
   */
  async processQueue() {
    this.isProcessing = true;

    try {
      const queue = getSyncQueue();
      const pending = queue.filter(
        item => item.status === 'pending' && item.retryCount < this.maxRetries
      );

      console.log(`📋 Found ${pending.length} pending sync operations`);

      for (const operation of pending) {
        if (!navigator.onLine) {
          console.log('📴 Went offline - pausing sync');
          break;
        }

        try {
          await this.executeOperation(operation);
          removeSyncOperation(operation.id);
          console.log(`✅ Synced: ${operation.id}`);
        } catch (error) {
          console.error(`❌ Sync failed: ${operation.id}`, error);

          // Update retry count
          updateSyncStatus(operation.id, 'pending', error.message);

          // Exponential backoff
          const delay = this.baseDelay * Math.pow(2, operation.retryCount);
          await this.sleep(delay);
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
      console.log('✅ Sync service completed');
    }
  }

  /**
   * Execute a single sync operation
   */
  async executeOperation(operation) {
    const { type, agentCollection, agentId, data } = operation;

    switch (type) {
      case 'trip_start':
        return await this.syncTripStart(agentCollection, agentId, data);

      case 'trip_end':
        return await this.syncTripEnd(agentCollection, agentId, data);

      case 'trip_add_stop':
        return await this.syncTripAddStop(agentCollection, agentId, data);

      case 'punch_in':
        return await this.syncPunchIn(agentCollection, agentId, data);

      case 'punch_out':
        return await this.syncPunchOut(agentCollection, agentId, data);

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Sync trip start to Firestore
   */
  async syncTripStart(agentCollection, agentId, data) {
    const tripData = {
      agentId,
      startLocation: data.startLocation,
      startTime: serverTimestamp(),
      status: 'active',
      stops: [],
      totalStops: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, agentCollection, agentId, 'trips'),
      tripData
    );

    console.log('✅ Trip started in Firestore:', docRef.id);
    return docRef.id;
  }

  /**
   * Sync trip end to Firestore
   */
  async syncTripEnd(agentCollection, agentId, data) {
    if (!data.tripId) {
      console.error('No tripId provided for trip_end');
      return;
    }

    const tripRef = doc(db, agentCollection, agentId, 'trips', data.tripId);

    await updateDoc(tripRef, {
      endLocation: data.endLocation,
      endTime: serverTimestamp(),
      totalDistance: data.totalDistance,
      totalDuration: data.totalDuration,
      status: 'completed',
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Trip ended in Firestore:', data.tripId);
  }

  /**
   * Sync trip stop addition to Firestore
   */
  async syncTripAddStop(agentCollection, agentId, data) {
    if (!data.tripId) {
      console.error('No tripId provided for trip_add_stop');
      return;
    }

    const tripRef = doc(db, agentCollection, agentId, 'trips', data.tripId);

    await updateDoc(tripRef, {
      stops: data.stops,
      totalStops: data.stops.length,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Stop added in Firestore:', data.tripId);
  }

  /**
   * Sync punch in to Firestore
   */
  async syncPunchIn(agentCollection, agentId, data) {
    const punchData = {
      agentId,
      punchInLocation: data.punchInLocation,
      punchInTime: serverTimestamp(),
      status: 'active',
      createdAt: serverTimestamp(),
    };

    // Use 'active' as document ID for active punch (only one active at a time)
    const punchRef = doc(db, agentCollection, agentId, 'activePunch', 'active');

    await updateDoc(punchRef, punchData).catch(async () => {
      // If document doesn't exist, create it
      await addDoc(
        collection(db, agentCollection, agentId, 'activePunch'),
        punchData
      );
    });

    console.log('✅ Punch in synced to Firestore');
  }

  /**
   * Sync punch out to Firestore
   */
  async syncPunchOut(agentCollection, agentId, data) {
    const punchRef = doc(db, agentCollection, agentId, 'activePunch', 'active');

    await updateDoc(punchRef, {
      punchOutLocation: data.punchOutLocation,
      punchOutTime: serverTimestamp(),
      totalDuration: data.totalDuration,
      status: 'completed',
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Punch out synced to Firestore');
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const syncService = new SyncService();

// Auto-start sync when app becomes online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Online - starting sync...');
    syncService.start();
  });

  window.addEventListener('offline', () => {
    console.log('📴 Offline - sync paused');
  });
}
