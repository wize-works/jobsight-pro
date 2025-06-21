"use client";

import { getSyncQueue, removeFromSyncQueue, addToSyncQueue } from "./storage";
import { syncQueueToServer } from "./client-actions";

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
    private onlineHandler!: () => void;
    private offlineHandler!: () => void;
    private messageHandler!: (event: MessageEvent) => void;
    private isInitialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeHandlers();
            this.setupEventListeners();
            this.setupServiceWorkerListeners();
            this.loadQueueCount();
            this.isInitialized = true;
        }
    }

    private initializeHandlers() {
        this.onlineHandler = () => {
            this.updateStatus({ isOnline: true, syncError: undefined });
            this.syncWhenOnline();
        };

        this.offlineHandler = () => {
            this.updateStatus({ isOnline: false, isSyncing: false });
        };

        this.messageHandler = (event: MessageEvent) => {
            const { type, items, error } = event.data;

            switch (type) {
                case 'SYNC_REQUIRED':
                    console.log('Service Worker requested sync for', items?.length || 0, 'items');
                    this.syncWhenOnline();
                    break;
                case 'SYNC_FAILED':
                    this.updateStatus({
                        syncError: `Background sync failed: ${error}`,
                        isSyncing: false
                    });
                    break;
            }
        };
    }

    private setupEventListeners() {
        if (!this.isInitialized) {
            window.addEventListener("online", this.onlineHandler, { passive: true });
            window.addEventListener("offline", this.offlineHandler, { passive: true });
        }
    }

    private setupServiceWorkerListeners() {
        if ('serviceWorker' in navigator && !this.isInitialized) {
            navigator.serviceWorker.addEventListener('message', this.messageHandler);
        }
    }

    // Clean up event listeners
    public destroy() {
        if (typeof window !== 'undefined') {
            window.removeEventListener("online", this.onlineHandler);
            window.removeEventListener("offline", this.offlineHandler);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', this.messageHandler);
        }

        this.listeners = [];
        this.isInitialized = false;
    } private async loadQueueCount() {
        try {
            // Get business ID from context or storage
            const businessId = localStorage.getItem("currentBusinessId");
            if (businessId) {
                const queue = await getSyncQueue(businessId);
                this.updateStatus({ queueCount: queue.length });
            } else {
                // No business ID available - set queue count to 0
                this.updateStatus({ queueCount: 0 });
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
    } public async syncWhenOnline() {
        if (typeof window === 'undefined' || !navigator.onLine || this.status.isSyncing) return;

        this.updateStatus({ isSyncing: true, syncError: undefined });

        try {
            let businessId = localStorage.getItem("currentBusinessId");

            if (!businessId) {
                // Handle missing business ID gracefully - this is a valid state
                // User might not be logged in or business context not set yet
                this.updateStatus({
                    isSyncing: false,
                    queueCount: 0,
                    syncError: undefined,
                });
                return;
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