
"use client";

import { getSyncQueue, removeFromSyncQueue, addToSyncQueue } from "./storage";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueCount: number;
  lastSyncTime?: Date;
  syncError?: string;
}

class SyncManager {
  private listeners: ((status: SyncStatus) => void)[] = [];
  private status: SyncStatus = {
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    queueCount: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.loadQueueCount();
    }
  }

  private setupEventListeners() {
    window.addEventListener("online", () => {
      this.updateStatus({ isOnline: true, syncError: undefined });
      this.syncWhenOnline();
    });

    window.addEventListener("offline", () => {
      this.updateStatus({ isOnline: false, isSyncing: false });
    });
  }

  private async loadQueueCount() {
    try {
      // Get business ID from context or storage
      const businessId = localStorage.getItem("currentBusinessId");
      if (businessId) {
        const queue = await getSyncQueue(businessId);
        this.updateStatus({ queueCount: queue.length });
      }
    } catch (error) {
      console.error("Failed to load queue count:", error);
    }
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.status = { ...this.status, ...updates };
    this.listeners.forEach((listener) => listener(this.status));
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.status); // Send current status immediately

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async syncWhenOnline() {
    if (typeof window === 'undefined' || !navigator.onLine || this.status.isSyncing) return;

    this.updateStatus({ isSyncing: true, syncError: undefined });

    try {
      const businessId = localStorage.getItem("currentBusinessId");
      if (!businessId) {
        throw new Error("No business ID found");
      }

      const queue = await getSyncQueue(businessId);

      if (queue.length === 0) {
        this.updateStatus({
          isSyncing: false,
          queueCount: 0,
          lastSyncTime: new Date(),
        });
        return;
      }

      const supabase = createClientComponentClient();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      let syncedCount = 0;
      let errorCount = 0;

      // Process queue items one by one
      for (const item of queue) {
        try {
          await this.syncItem(supabase, item);
          await removeFromSyncQueue(item.id);
          syncedCount++;
        } catch (error) {
          console.error("Failed to sync item:", item, error);
          errorCount++;

          // Update retry count
          item.retryCount = (item.retryCount || 0) + 1;

          // Remove items that have failed too many times
          if (item.retryCount >= 3) {
            await removeFromSyncQueue(item.id);
            console.warn("Removing item after 3 failed attempts:", item);
          }
        }
      }

      const remainingQueue = await getSyncQueue(businessId);
      this.updateStatus({
        isSyncing: false,
        queueCount: remainingQueue.length,
        lastSyncTime: new Date(),
        syncError:
          errorCount > 0 ? `${errorCount} items failed to sync` : undefined,
      });
    } catch (error) {
      console.error("Sync failed:", error);
      this.updateStatus({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }

  private async syncItem(supabase: any, item: any) {
    const { table, operation, data } = item;

    switch (operation) {
      case "insert":
        const { error: insertError } = await supabase.from(table).insert(data);
        if (insertError) throw insertError;
        break;

      case "update":
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq("id", data.id)
          .eq("business_id", item.businessId);
        if (updateError) throw updateError;
        break;

      case "delete":
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq("id", data.id)
          .eq("business_id", item.businessId);
        if (deleteError) throw deleteError;
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  public async queueOperation(
    table: string,
    operation: "insert" | "update" | "delete",
    data: any,
    businessId: string,
    userId?: string,
  ) {
    await addToSyncQueue(table, operation, data, businessId, userId);
    await this.loadQueueCount();
  }

  public getStatus(): SyncStatus {
    return this.status;
  }
}

export const syncManager = new SyncManager();
