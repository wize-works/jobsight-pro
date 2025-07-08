/**
 * Client Extensions Sync Service (Phase 4.4)
 * 
 * Handles synchronized operations for client contacts and client interactions
 * between IndexedDB and Supabase.
 */

import { createServerClient } from "@/lib/supabase";
import { db } from "@/lib/offline/dexie-db";
import type { ClientContact } from "@/types/client-contacts";
import type { ClientInteraction } from "@/types/client-interactions";

/**
 * Sync client contacts for a business
 */
export async function syncClientContacts(businessId: string): Promise<{
    success: boolean;
    error: string | null;
    synced: number;
}> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            return { success: false, error: "Supabase client not available", synced: 0 };
        }

        // Get all local contacts for this business
        const localContacts = await db.clientContacts
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Get server contacts
        const { data: serverContacts, error: fetchError } = await supabase
            .from('client_contacts')
            .select('*')
            .eq('business_id', businessId);

        if (fetchError) {
            throw fetchError;
        }

        // Create maps for comparison
        const localMap = new Map(localContacts.map((contact: ClientContact) => [contact.id, contact]));
        const serverMap = new Map((serverContacts || []).map((contact: ClientContact) => [contact.id, contact]));

        let syncedCount = 0;

        // Sync server contacts to local (download)
        for (const serverContact of serverContacts || []) {
            const localContact = localMap.get(serverContact.id);

            if (!localContact ||
                new Date(serverContact.updated_at || '').getTime() > new Date(localContact.updated_at || '').getTime()) {
                await db.clientContacts.put(serverContact);
                syncedCount++;
            }
        }

        // Sync local contacts to server (upload)
        for (const localContact of localContacts) {
            const serverContact = serverMap.get(localContact.id);

            if (!serverContact ||
                new Date(localContact.updated_at || '').getTime() > new Date(serverContact.updated_at || '').getTime()) {
                const { error: upsertError } = await supabase
                    .from('client_contacts')
                    .upsert(localContact);

                if (upsertError) {
                    console.warn(`Failed to sync contact ${localContact.id}:`, upsertError);
                } else {
                    syncedCount++;
                }
            }
        }

        return { success: true, error: null, synced: syncedCount };
    } catch (error) {
        console.error("Error syncing client contacts:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to sync client contacts",
            synced: 0
        };
    }
}

/**
 * Sync client interactions for a business
 */
export async function syncClientInteractions(businessId: string): Promise<{
    success: boolean;
    error: string | null;
    synced: number;
}> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            return { success: false, error: "Supabase client not available", synced: 0 };
        }

        // Get all local interactions for this business
        const localInteractions = await db.clientInteractions
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Get server interactions
        const { data: serverInteractions, error: fetchError } = await supabase
            .from('client_interactions')
            .select('*')
            .eq('business_id', businessId);

        if (fetchError) {
            throw fetchError;
        }

        // Create maps for comparison
        const localMap = new Map(localInteractions.map((interaction: ClientInteraction) => [interaction.id, interaction]));
        const serverMap = new Map((serverInteractions || []).map((interaction: ClientInteraction) => [interaction.id, interaction]));

        let syncedCount = 0;

        // Sync server interactions to local (download)
        for (const serverInteraction of serverInteractions || []) {
            const localInteraction = localMap.get(serverInteraction.id);

            if (!localInteraction ||
                new Date(serverInteraction.updated_at || '').getTime() > new Date(localInteraction.updated_at || '').getTime()) {
                await db.clientInteractions.put(serverInteraction);
                syncedCount++;
            }
        }

        // Sync local interactions to server (upload)
        for (const localInteraction of localInteractions) {
            const serverInteraction = serverMap.get(localInteraction.id);

            if (!serverInteraction ||
                new Date(localInteraction.updated_at || '').getTime() > new Date(serverInteraction.updated_at || '').getTime()) {
                const { error: upsertError } = await supabase
                    .from('client_interactions')
                    .upsert(localInteraction);

                if (upsertError) {
                    console.warn(`Failed to sync interaction ${localInteraction.id}:`, upsertError);
                } else {
                    syncedCount++;
                }
            }
        }

        return { success: true, error: null, synced: syncedCount };
    } catch (error) {
        console.error("Error syncing client interactions:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to sync client interactions",
            synced: 0
        };
    }
}

/**
 * Sync all client extension entities for a business
 */
export async function syncClientExtensions(businessId: string): Promise<{
    success: boolean;
    error: string | null;
    results: {
        contacts: { synced: number; error?: string };
        interactions: { synced: number; error?: string };
    };
}> {
    try {
        // Sync client contacts
        const contactsResult = await syncClientContacts(businessId);

        // Sync client interactions
        const interactionsResult = await syncClientInteractions(businessId);

        const allSuccess = contactsResult.success && interactionsResult.success;
        const overallError = !allSuccess
            ? `Sync issues: ${[contactsResult.error, interactionsResult.error].filter(Boolean).join(', ')}`
            : null;

        return {
            success: allSuccess,
            error: overallError,
            results: {
                contacts: {
                    synced: contactsResult.synced,
                    error: contactsResult.error || undefined
                },
                interactions: {
                    synced: interactionsResult.synced,
                    error: interactionsResult.error || undefined
                }
            }
        };
    } catch (error) {
        console.error("Error syncing client extensions:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to sync client extensions",
            results: {
                contacts: { synced: 0, error: "Sync failed" },
                interactions: { synced: 0, error: "Sync failed" }
            }
        };
    }
}

/**
 * Get sync statistics for client extensions
 */
export async function getClientExtensionsSyncStats(businessId: string): Promise<{
    contacts: {
        local: number;
        needsSync: number;
    };
    interactions: {
        local: number;
        needsSync: number;
    };
}> {
    try {
        // Get local counts
        const [
            localContactsCount,
            localInteractionsCount,
            contactsSyncQueue,
            interactionsSyncQueue
        ] = await Promise.all([
            db.clientContacts.where('business_id').equals(businessId).count(),
            db.clientInteractions.where('business_id').equals(businessId).count(),
            db.syncQueue.where(['table', 'businessId']).equals(['client_contacts', businessId]).and(item => !item.synced).count(),
            db.syncQueue.where(['table', 'businessId']).equals(['client_interactions', businessId]).and(item => !item.synced).count()
        ]);

        return {
            contacts: {
                local: localContactsCount,
                needsSync: contactsSyncQueue
            },
            interactions: {
                local: localInteractionsCount,
                needsSync: interactionsSyncQueue
            }
        };
    } catch (error) {
        console.error("Error getting client extensions sync stats:", error);
        return {
            contacts: { local: 0, needsSync: 0 },
            interactions: { local: 0, needsSync: 0 }
        };
    }
}
