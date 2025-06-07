"use client";

import { getSyncQueue, removeFromSyncQueue, addToSyncQueue } from "./storage";
import { syncQueueToServer } from "./client-actions";
import { useBusiness } from "@/hooks/use-business";

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
            let businessId = localStorage.getItem("currentBusinessId");
            if (!businessId) {
                // Try to get business ID from context
                const { business } = useBusiness();
                businessId = business?.id || "";
            }
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

            // Use server action to sync the queue
            const result = await syncQueueToServer(businessId);

            if (result.success) {
                // Remove successfully synced items from local queue
                for (const syncedItemId of result.syncedItems || []) {
                    await removeFromSyncQueue(syncedItemId);
                }

                const remainingQueue = await getSyncQueue(businessId);
                this.updateStatus({
                    isSyncing: false,
                    queueCount: remainingQueue.length,
                    lastSyncTime: new Date(),
                    syncError: result.errorCount > 0 ? `${result.errorCount} items failed to sync` : undefined,
                });
            } else {
                throw new Error(result.error || "Sync failed");
            }
        } catch (error) {
            console.error("Sync failed:", error);
            this.updateStatus({
                isSyncing: false,
                syncError: error instanceof Error ? error.message : "Sync failed",
            });
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