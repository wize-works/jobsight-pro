"use client";

/**
 * Client Interactions Client Actions - Offline-First Implementation (Phase 4.4)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Cl      await db.syncQueue.add({
        id: crypto.randomUUID(),
        table: 'client_interactions',
        operation: 'insert',
        data: interaction,
        businessId: businessId,
        userId: userId,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
      });h0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { db } from "@/lib/offline/dexie-db";
import { createServerClient } from "@/lib/supabase";
import type {
    ClientInteraction,
    ClientInteractionInsert,
    ClientInteractionUpdate,
    ClientInteractionWithDetails
} from "@/types/client-interactions";

/**
 * Client Interactions - Offline-First Client Actions
 * 
 * This module provides offline-first CRUD operations for client interactions.
 * All operations work offline and sync with Supabase when online.
 * 
 * Features:
 * - Full offline CRUD operations
 * - Automatic sync with server when online
 * - User-scoped access control via business_id
 * - Type-safe operations
 * - Error handling and validation
 */

// ============================================================================
// READ OPERATIONS
// ============================================================================

export async function getClientInteractions(
    userId: string,
    businessId: string,
    filters?: {
        clientId?: string;
        type?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{
    data: ClientInteraction[];
    error: string | null;
    total: number;
}> {
    try {
        let query = db.clientInteractions
            .where('business_id')
            .equals(businessId);

        // Apply filters
        if (filters?.clientId) {
            query = query.and((interaction: ClientInteraction) => interaction.client_id === filters.clientId);
        }

        if (filters?.type) {
            query = query.and((interaction: ClientInteraction) => interaction.type === filters.type);
        }

        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            query = query.and((interaction: ClientInteraction) => {
                const summary = interaction.summary?.toLowerCase() || '';
                const followUpTask = interaction.follow_up_task?.toLowerCase() || '';
                const staff = interaction.staff?.toLowerCase() || '';

                return summary.includes(searchLower) ||
                    followUpTask.includes(searchLower) ||
                    staff.includes(searchLower);
            });
        }

        // Get total count for pagination
        const total = await query.count();

        // Apply pagination
        if (filters?.offset) {
            query = query.offset(filters.offset);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const interactions = await query
            .reverse()
            .sortBy('created_at');

        return {
            data: interactions,
            error: null,
            total
        };
    } catch (error) {
        console.error("Error getting client interactions:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to get client interactions",
            total: 0
        };
    }
}

export async function getClientInteraction(
    userId: string,
    businessId: string,
    id: string
): Promise<{
    data: ClientInteraction | null;
    error: string | null;
}> {
    try {
        const interaction = await db.clientInteractions
            .where('id')
            .equals(id)
            .and((interaction: ClientInteraction) => interaction.business_id === businessId)
            .first();

        if (!interaction) {
            return { data: null, error: "Client interaction not found" };
        }

        return { data: interaction, error: null };
    } catch (error) {
        console.error("Error getting client interaction:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to get client interaction"
        };
    }
}

export async function getClientInteractionsByClient(
    userId: string,
    businessId: string,
    clientId: string
): Promise<{
    data: ClientInteraction[];
    error: string | null;
}> {
    try {
        const interactions = await db.clientInteractions
            .where('client_id')
            .equals(clientId)
            .and((interaction: ClientInteraction) => interaction.business_id === businessId)
            .reverse()
            .sortBy('created_at');

        return { data: interactions, error: null };
    } catch (error) {
        console.error("Error getting client interactions by client:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to get client interactions"
        };
    }
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

export async function createClientInteraction(
    userId: string,
    businessId: string,
    data: Omit<ClientInteractionInsert, 'id' | 'business_id' | 'created_at' | 'updated_at'>
): Promise<{
    data: ClientInteraction | null;
    error: string | null;
}> {
    try {
        // Validate required fields
        if (!data.client_id) {
            return { data: null, error: "Client ID is required" };
        }

        if (!data.type) {
            return { data: null, error: "Interaction type is required" };
        }

        const now = new Date().toISOString();
        const interaction: ClientInteraction = {
            id: crypto.randomUUID(),
            business_id: businessId,
            ...data,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        };

        // Store in IndexedDB
        await db.clientInteractions.add(interaction);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('client_interactions')
                    .insert(interaction);

                if (serverError) {
                    console.warn("Failed to sync client interaction to server:", serverError);
                    // Mark for sync later
                    await db.syncQueue.add({
                        id: crypto.randomUUID(),
                        table: 'client_interactions',
                        operation: 'insert',
                        data: interaction,
                        businessId: businessId,
                        userId: userId,
                        timestamp: Date.now(),
                        retryCount: 0,
                        synced: false
                    });
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync client interaction later:", syncError);
            // Mark for sync when online
            await db.syncQueue.add({
                id: crypto.randomUUID(),
                table: 'client_interactions',
                operation: 'insert',
                data: interaction,
                businessId: businessId,
                userId: userId,
                timestamp: Date.now(),
                retryCount: 0,
                synced: false
            });
        }

        return { data: interaction, error: null };
    } catch (error) {
        console.error("Error creating client interaction:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to create client interaction"
        };
    }
}

export async function updateClientInteraction(
    userId: string,
    businessId: string,
    id: string,
    updates: Partial<ClientInteractionUpdate>
): Promise<{
    data: ClientInteraction | null;
    error: string | null;
}> {
    try {
        // Get existing interaction
        const existing = await db.clientInteractions
            .where('id')
            .equals(id)
            .and((interaction: ClientInteraction) => interaction.business_id === businessId)
            .first();

        if (!existing) {
            return { data: null, error: "Client interaction not found" };
        }

        const now = new Date().toISOString();
        const updatedInteraction = {
            ...existing,
            ...updates,
            updated_at: now,
            updated_by: userId,
        };

        // Update in IndexedDB
        await db.clientInteractions.put(updatedInteraction);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('client_interactions')
                    .update({ ...updates, updated_at: now, updated_by: userId })
                    .eq('id', id)
                    .eq('business_id', businessId);

                if (serverError) {
                    console.warn("Failed to sync client interaction update to server:", serverError);
                    // Mark for sync later
                    await db.syncQueue.add({
                        id: crypto.randomUUID(),
                        table: 'client_interactions',
                        operation: 'update',
                        data: { id, updates: { ...updates, updated_at: now, updated_by: userId } },
                        businessId: businessId,
                        userId: userId,
                        timestamp: Date.now(),
                        retryCount: 0,
                        synced: false
                    });
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync client interaction update later:", syncError);
            // Mark for sync when online
            await db.syncQueue.add({
                id: crypto.randomUUID(),
                table: 'client_interactions',
                operation: 'update',
                data: { id, updates: { ...updates, updated_at: now, updated_by: userId } },
                businessId: businessId,
                userId: userId,
                timestamp: Date.now(),
                retryCount: 0,
                synced: false
            });
        }

        return { data: updatedInteraction, error: null };
    } catch (error) {
        console.error("Error updating client interaction:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to update client interaction"
        };
    }
}

export async function deleteClientInteraction(
    userId: string,
    businessId: string,
    id: string
): Promise<{
    success: boolean;
    error: string | null;
}> {
    try {
        // Check if interaction exists and belongs to business
        const existing = await db.clientInteractions
            .where('id')
            .equals(id)
            .and((interaction: ClientInteraction) => interaction.business_id === businessId)
            .first();

        if (!existing) {
            return { success: false, error: "Client interaction not found" };
        }

        // Delete from IndexedDB
        await db.clientInteractions.delete(id);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('client_interactions')
                    .delete()
                    .eq('id', id)
                    .eq('business_id', businessId);

                if (serverError) {
                    console.warn("Failed to sync client interaction deletion to server:", serverError);
                    // Mark for sync later
                    await db.syncQueue.add({
                        id: crypto.randomUUID(),
                        table: 'client_interactions',
                        operation: 'delete',
                        data: { id },
                        businessId: businessId,
                        userId: userId,
                        timestamp: Date.now(),
                        retryCount: 0,
                        synced: false
                    });
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync client interaction deletion later:", syncError);
            // Mark for sync when online
            await db.syncQueue.add({
                id: crypto.randomUUID(),
                table: 'client_interactions',
                operation: 'delete',
                data: { id },
                businessId: businessId,
                userId: userId,
                timestamp: Date.now(),
                retryCount: 0,
                synced: false
            });
        }

        return { success: true, error: null };
    } catch (error) {
        console.error("Error deleting client interaction:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete client interaction"
        };
    }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function createClientInteractionsBulk(
    userId: string,
    businessId: string,
    interactionsData: Omit<ClientInteractionInsert, 'id' | 'business_id' | 'created_at' | 'updated_at'>[]
): Promise<{
    data: ClientInteraction[];
    error: string | null;
}> {
    try {
        const now = new Date().toISOString();
        const interactions: ClientInteraction[] = interactionsData.map(data => ({
            id: crypto.randomUUID(),
            business_id: businessId,
            ...data,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        }));

        // Store in IndexedDB
        await db.clientInteractions.bulkAdd(interactions);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('client_interactions')
                    .insert(interactions);

                if (serverError) {
                    console.warn("Failed to sync client interactions to server:", serverError);
                    // Mark for sync later
                    for (const interaction of interactions) {
                        await db.syncQueue.add({
                            id: crypto.randomUUID(),
                            table: 'client_interactions',
                            operation: 'insert',
                            data: interaction,
                            businessId: businessId,
                            userId: userId,
                            timestamp: Date.now(),
                            retryCount: 0,
                            synced: false
                        });
                    }
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync client interactions later:", syncError);
            // Mark for sync when online
            for (const interaction of interactions) {
                await db.syncQueue.add({
                    id: crypto.randomUUID(),
                    table: 'client_interactions',
                    operation: 'insert',
                    data: interaction,
                    businessId: businessId,
                    userId: userId,
                    timestamp: Date.now(),
                    retryCount: 0,
                    synced: false
                });
            }
        }

        return { data: interactions, error: null };
    } catch (error) {
        console.error("Error creating client interactions bulk:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to create client interactions"
        };
    }
}

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

export async function searchClientInteractions(
    userId: string,
    businessId: string,
    query: string,
    filters?: {
        clientId?: string;
        type?: string;
        limit?: number;
    }
): Promise<{
    data: ClientInteraction[];
    error: string | null;
}> {
    try {
        if (!query.trim()) {
            return { data: [], error: null };
        }

        const searchLower = query.toLowerCase();
        let dbQuery = db.clientInteractions
            .where('business_id')
            .equals(businessId)
            .and((interaction: ClientInteraction) => {
                const summary = interaction.summary?.toLowerCase() || '';
                const followUpTask = interaction.follow_up_task?.toLowerCase() || '';
                const staff = interaction.staff?.toLowerCase() || '';

                return summary.includes(searchLower) ||
                    followUpTask.includes(searchLower) ||
                    staff.includes(searchLower);
            });

        // Apply filters
        if (filters?.clientId) {
            dbQuery = dbQuery.and((interaction: ClientInteraction) => interaction.client_id === filters.clientId);
        }

        if (filters?.type) {
            dbQuery = dbQuery.and((interaction: ClientInteraction) => interaction.type === filters.type);
        }

        let results = await dbQuery.toArray();

        // Apply limit
        if (filters?.limit) {
            results = results.slice(0, filters.limit);
        }

        // Sort by relevance (exact matches first, then partial matches)
        results.sort((a, b) => {
            const aSummary = a.summary?.toLowerCase() || '';
            const bSummary = b.summary?.toLowerCase() || '';

            if (aSummary.includes(searchLower) && !bSummary.includes(searchLower)) return -1;
            if (!aSummary.includes(searchLower) && bSummary.includes(searchLower)) return 1;

            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        return { data: results, error: null };
    } catch (error) {
        console.error("Error searching client interactions:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to search client interactions"
        };
    }
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

export async function syncClientInteractions(
    userId: string,
    businessId: string
): Promise<{
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

export async function getClientInteractionsCount(
    userId: string,
    businessId: string,
    filters?: {
        clientId?: string;
        type?: string;
    }
): Promise<{
    count: number;
    error: string | null;
}> {
    try {
        let query = db.clientInteractions
            .where('business_id')
            .equals(businessId);

        // Apply filters
        if (filters?.clientId) {
            query = query.and((interaction: ClientInteraction) => interaction.client_id === filters.clientId);
        }

        if (filters?.type) {
            query = query.and((interaction: ClientInteraction) => interaction.type === filters.type);
        }

        const count = await query.count();

        return { count, error: null };
    } catch (error) {
        console.error("Error getting client interactions count:", error);
        return {
            count: 0,
            error: error instanceof Error ? error.message : "Failed to get client interactions count"
        };
    }
}
