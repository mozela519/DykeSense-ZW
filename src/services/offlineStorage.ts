/**
 * DykeSense-ZW Offline Storage & Sync Queue
 * Allows field surveyors on the Great Dyke to log stations completely offline,
 * queuing readings locally in IndexedDB / LocalStorage, and syncing seamlessly
 * when connectivity (Econet / NetOne LTE or Hub Wi-Fi) is restored.
 */

import { MagnetometerReading } from '../types';

const STORAGE_KEY_QUEUE = 'dykesense_readings_queue';
const STORAGE_KEY_LOCAL_SURVEYS = 'dykesense_local_surveys';

export class OfflineSyncService {
  private static instance: OfflineSyncService;

  private constructor() {}

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Get all queued readings awaiting sync
   */
  public getQueuedReadings(): MagnetometerReading[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read queue from localStorage', e);
      return [];
    }
  }

  /**
   * Enqueue a new magnetometer reading taken in the field
   */
  public enqueueReading(reading: MagnetometerReading): void {
    const queue = this.getQueuedReadings();
    queue.push(reading);
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to enqueue reading', e);
    }
  }

  /**
   * Remove synchronized items from the queue
   */
  public clearSynced(syncedIds: string[]): void {
    const idSet = new Set(syncedIds);
    const queue = this.getQueuedReadings().filter(r => !idSet.has(r.id));
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
  }

  /**
   * Sync pending queue with backend API
   */
  public async syncPendingQueue(apiBaseUrl: string = ''): Promise<{
    success: boolean;
    syncedCount: number;
    error?: string;
  }> {
    const queue = this.getQueuedReadings();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/surveys/sync-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings: queue }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      const resData = await response.json();
      const syncedIds = queue.map(q => q.id);
      this.clearSynced(syncedIds);

      return {
        success: true,
        syncedCount: resData.syncedCount || queue.length,
      };
    } catch (err: any) {
      console.warn('Sync attempt failed, staying in offline queue', err);
      return {
        success: false,
        syncedCount: 0,
        error: err.message || 'Network unreachable',
      };
    }
  }
}

export const offlineSync = OfflineSyncService.getInstance();
