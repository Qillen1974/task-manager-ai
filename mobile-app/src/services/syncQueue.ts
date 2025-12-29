import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineService } from './offlineService';

export type SyncOperation = {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'task' | 'project';
  data: any;
  timestamp: number;
  retries: number;
};

const SYNC_QUEUE_KEY = '@sync_queue';
const MAX_RETRIES = 3;

class SyncQueue {
  private queue: SyncOperation[] = [];
  private isSyncing: boolean = false;
  private syncCallbacks: Map<string, (operation: SyncOperation) => Promise<void>> = new Map();

  constructor() {
    this.loadQueue();
    this.setupAutoSync();
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
      }
    } catch (error) {
      // Queue load failed - will start with empty queue
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      // Queue save failed - operations may be lost on app restart
    }
  }

  /**
   * Setup auto-sync when network is restored
   */
  private setupAutoSync() {
    offlineService.subscribe((isOnline) => {
      if (isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  /**
   * Add operation to queue
   */
  async addOperation(
    type: SyncOperation['type'],
    entity: SyncOperation['entity'],
    data: any
  ): Promise<string> {
    const operation: SyncOperation = {
      id: `${entity}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(operation);
    await this.saveQueue();

    // Try to sync immediately if online
    if (offlineService.getOnlineStatus()) {
      this.processQueue();
    }

    return operation.id;
  }

  /**
   * Register sync callback for an entity type
   */
  registerSyncCallback(
    key: string,
    callback: (operation: SyncOperation) => Promise<void>
  ) {
    this.syncCallbacks.set(key, callback);
  }

  /**
   * Process the sync queue
   */
  async processQueue() {
    if (this.isSyncing || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      // Wait for network if offline
      if (!offlineService.getOnlineStatus()) {
        await offlineService.waitForOnline();
      }

      // Process each operation
      const operations = [...this.queue];
      const failedOperations: SyncOperation[] = [];

      for (const operation of operations) {
        try {
          // Find the appropriate sync callback
          const callback = this.syncCallbacks.get(`${operation.entity}_${operation.type}`);

          if (callback) {
            await callback(operation);

            // Remove from queue on success
            this.queue = this.queue.filter((op) => op.id !== operation.id);
          } else {
            // Remove operations with no handler
            this.queue = this.queue.filter((op) => op.id !== operation.id);
          }
        } catch (error) {
          // Increment retry count
          operation.retries += 1;

          if (operation.retries >= MAX_RETRIES) {
            this.queue = this.queue.filter((op) => op.id !== operation.id);
          } else {
            failedOperations.push(operation);
          }
        }
      }

      // Update queue with failed operations
      this.queue = this.queue.filter((op) =>
        failedOperations.some((failed) => failed.id === op.id)
      );

      await this.saveQueue();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Get all pending operations
   */
  getQueue(): SyncOperation[] {
    return [...this.queue];
  }

  /**
   * Clear the queue (use with caution)
   */
  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Remove a specific operation from queue
   */
  async removeOperation(operationId: string) {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    await this.saveQueue();
  }
}

export const syncQueue = new SyncQueue();
