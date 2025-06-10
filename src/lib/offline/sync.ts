"use server";
import { getSyncQueue, removeFromSyncQueue } from "./storage";
import { createServerClient } from "@/lib/supabase";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import {
    insertWithBusiness,
    updateWithBusinessCheck,
    deleteWithBusinessCheck,
} from "@/lib/db";

export interface SyncResult {
    success: boolean;
    error?: string;
    syncedItems?: string[];
    errorCount: number;
}

export async function syncQueueToServer(businessId: string): Promise<SyncResult> {
    try {
        const { business } = await withBusinessServer();

        if (business.id !== businessId) {
            throw new Error("Business ID mismatch");
        }

        const queue = await getSyncQueue(businessId);

        if (queue.length === 0) {
            return {
                success: true,
                syncedItems: [],
                errorCount: 0,
            };
        }

        let syncedItems: string[] = [];
        let errorCount = 0;

        // Process queue items one by one
        for (const item of queue) {
            try {
                await syncItem(item, businessId);
                syncedItems.push(item.id);
            } catch (error) {
                console.error("Failed to sync item:", item, error);
                errorCount++;

                // Update retry count
                item.retryCount = (item.retryCount || 0) + 1;

                // Remove items that have failed too many times
                if (item.retryCount >= 3) {
                    syncedItems.push(item.id); // Mark for removal
                    console.warn("Removing item after 3 failed attempts:", item);
                }
            }
        }

        return {
            success: true,
            syncedItems,
            errorCount,
        };
    } catch (error) {
        console.error("Sync operation failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown sync error",
            errorCount: 0,
        };
    }
}

async function syncItem(item: any, businessId: string) {
    const { table, operation, data } = item;

    switch (operation) {
        case "insert":
            const insertResult = await insertWithBusiness(table, data, businessId);
            if (insertResult.error) throw insertResult.error;
            break;

        case "update":
            const updateResult = await updateWithBusinessCheck(
                table,
                data.id,
                data,
                businessId,
            );
            if (updateResult.error) throw updateResult.error;
            break;

        case "delete":
            const deleteResult = await deleteWithBusinessCheck(
                table,
                data.id,
                businessId,
            );
            if (deleteResult.error) throw deleteResult.error;
            break;

        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}