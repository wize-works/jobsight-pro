/**
 * Client-Side Client Interactions Actions
 * 
 * Replaces src/app/actions/client-interactions.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from '@/types/supabase';
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from './client-action-factory';
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for client interactions
type ClientInteraction = Database['public']['Tables']['client_interactions']['Row'];
type ClientInteractionInsert = Database['public']['Tables']['client_interactions']['Insert'];
type ClientInteractionUpdate = Database['public']['Tables']['client_interactions']['Update'];

// Create client-side client interaction actions
const insertClientInteraction = createInsertAction('client_interactions', 'medium');
const updateClientInteraction = createUpdateAction('client_interactions', 'medium');
const deleteClientInteraction = createDeleteAction('client_interactions', 'medium');
const selectClientInteractions = createSelectAction('client_interactions');

/**
 * Get all client interactions for a business - works offline
 */
export const getClientInteractions = async (businessId: string, clientId?: string): Promise<ClientInteraction[]> => {
    try {
        const result = await selectClientInteractions({}, businessId);

        if (result.error) {
            console.error("Error fetching client interactions:", result.error);
            return [];
        }

        let interactions = (result.data || []) as ClientInteraction[];

        // Filter by client_id if provided
        if (clientId) {
            interactions = interactions.filter(interaction => interaction.client_id === clientId);
        }

        return interactions;
    } catch (err) {
        console.error("Error in getClientInteractions:", err);
        return [];
    }
};

/**
 * Create a new client interaction - works offline
 */
export const createClientInteraction = async (data: ClientInteractionInsert): Promise<ClientInteraction | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for client interaction');
        }

        const interactionData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertClientInteraction(interactionData, data.business_id);

        if (result.error) {
            console.error("Error creating client interaction:", result.error);
            return null;
        }

        return result.data as ClientInteraction;
    } catch (err) {
        console.error("Error in createClientInteraction:", err);
        return null;
    }
};

/**
 * Update a client interaction - works offline
 */
export const updateClientInteractionById = async (id: string, data: Partial<ClientInteractionUpdate>, businessId: string): Promise<ClientInteraction | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateClientInteraction(updateData, businessId);

        if (result.error) {
            console.error("Error updating client interaction:", result.error);
            return null;
        }

        return result.data as ClientInteraction;
    } catch (err) {
        console.error("Error in updateClientInteractionById:", err);
        return null;
    }
};

/**
 * Delete a client interaction - works offline
 */
export const removeClientInteraction = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteClientInteraction({ id }, businessId);

        if (result.error) {
            console.error("Error deleting client interaction:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeClientInteraction:", err);
        return false;
    }
};

/**
 * Get a client interaction by ID - works offline
 */
export const getClientInteractionById = async (id: string, businessId: string): Promise<ClientInteraction | null> => {
    try {
        const interactions = await getClientInteractions(businessId);
        return interactions.find(interaction => interaction.id === id) || null;
    } catch (err) {
        console.error("Error in getClientInteractionById:", err);
        return null;
    }
};

/**
 * Get interactions for specific client - works offline
 */
export const getInteractionsByClientId = async (businessId: string, clientId: string): Promise<ClientInteraction[]> => {
    return await getClientInteractions(businessId, clientId);
};

/**
 * Get interactions by type - works offline
 */
export const getInteractionsByType = async (businessId: string, type: string): Promise<ClientInteraction[]> => {
    try {
        const interactions = await getClientInteractions(businessId);
        return interactions.filter(interaction => interaction.type === type);
    } catch (err) {
        console.error("Error in getInteractionsByType:", err);
        return [];
    }
};

/**
 * Get interactions by staff member - works offline
 */
export const getInteractionsByStaff = async (businessId: string, staff: string): Promise<ClientInteraction[]> => {
    try {
        const interactions = await getClientInteractions(businessId);
        return interactions.filter(interaction => interaction.staff === staff);
    } catch (err) {
        console.error("Error in getInteractionsByStaff:", err);
        return [];
    }
};

/**
 * Get interactions requiring follow-up - works offline
 */
export const getInteractionsWithFollowUp = async (businessId: string): Promise<ClientInteraction[]> => {
    try {
        const interactions = await getClientInteractions(businessId);
        const now = new Date();

        return interactions.filter(interaction => {
            if (!interaction.follow_up_date) return false;
            const followUpDate = new Date(interaction.follow_up_date);
            return followUpDate <= now && interaction.follow_up_task;
        });
    } catch (err) {
        console.error("Error in getInteractionsWithFollowUp:", err);
        return [];
    }
};

/**
 * Get overdue follow-ups - works offline
 */
export const getOverdueFollowUps = async (businessId: string): Promise<ClientInteraction[]> => {
    try {
        const interactions = await getClientInteractions(businessId);
        const now = new Date();

        return interactions.filter(interaction => {
            if (!interaction.follow_up_date) return false;
            const followUpDate = new Date(interaction.follow_up_date);
            return followUpDate < now && interaction.follow_up_task;
        });
    } catch (err) {
        console.error("Error in getOverdueFollowUps:", err);
        return [];
    }
};

// Bulk operations for client interactions
export const createMultipleInteractions = async (interactions: ClientInteractionInsert[]): Promise<ClientInteraction[]> => {
    const results: ClientInteraction[] = [];
    for (const interaction of interactions) {
        try {
            const result = await createClientInteraction(interaction);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating client interaction:', error);
        }
    }
    return results;
};

export const deleteInteractionsByClientId = async (businessId: string, clientId: string): Promise<boolean[]> => {
    const interactions = await getInteractionsByClientId(businessId, clientId);
    const deletePromises = interactions.map(interaction => removeClientInteraction(interaction.id, businessId));
    return await Promise.all(deletePromises);
};

// Mark follow-up as complete
export const completeFollowUp = async (businessId: string, interactionId: string, userId?: string): Promise<ClientInteraction | null> => {
    return await updateClientInteractionById(interactionId, {
        follow_up_date: null,
        follow_up_task: null,
        updated_by: userId || null,
    }, businessId);
};

// Analytics and reporting functions
export const getInteractionStats = async (businessId: string): Promise<{
    totalInteractions: number;
    interactionsByType: Record<string, number>;
    interactionsByStaff: Record<string, number>;
    pendingFollowUps: number;
    overdueFollowUps: number;
    averageInteractionsPerClient: number;
    recentActivity: number;
}> => {
    try {
        const interactions = await getClientInteractions(businessId);
        const followUpsWithFollowUp = await getInteractionsWithFollowUp(businessId);
        const overdueFollowUps = await getOverdueFollowUps(businessId);

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentInteractions = interactions.filter(interaction => {
            if (!interaction.created_at) return false;
            return new Date(interaction.created_at) >= thirtyDaysAgo;
        });

        const stats = {
            totalInteractions: interactions.length,
            interactionsByType: {} as Record<string, number>,
            interactionsByStaff: {} as Record<string, number>,
            pendingFollowUps: followUpsWithFollowUp.length,
            overdueFollowUps: overdueFollowUps.length,
            averageInteractionsPerClient: 0,
            recentActivity: recentInteractions.length,
        };

        // Group by type and staff
        interactions.forEach(interaction => {
            const type = interaction.type || 'Unknown';
            const staff = interaction.staff || 'Unknown';

            stats.interactionsByType[type] = (stats.interactionsByType[type] || 0) + 1;
            stats.interactionsByStaff[staff] = (stats.interactionsByStaff[staff] || 0) + 1;
        });

        // Calculate average interactions per client
        const uniqueClients = new Set(interactions.map(i => i.client_id)).size;
        stats.averageInteractionsPerClient = uniqueClients > 0 ? interactions.length / uniqueClients : 0;

        return stats;
    } catch (error) {
        console.error('Failed to get interaction stats:', error);
        return {
            totalInteractions: 0,
            interactionsByType: {},
            interactionsByStaff: {},
            pendingFollowUps: 0,
            overdueFollowUps: 0,
            averageInteractionsPerClient: 0,
            recentActivity: 0,
        };
    }
};

// Get interactions for date range
export const getInteractionsByDateRange = async (businessId: string, startDate: string, endDate: string): Promise<ClientInteraction[]> => {
    try {
        const interactions = await getClientInteractions(businessId);
        return interactions.filter(interaction => {
            if (!interaction.date) return false;
            const interactionDate = new Date(interaction.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return interactionDate >= start && interactionDate <= end;
        });
    } catch (err) {
        console.error("Error in getInteractionsByDateRange:", err);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    getClientInteractions as getAllClientInteractions,
    createClientInteraction as addClientInteraction,
    removeClientInteraction as deleteClientInteraction,
    getClientInteractionById as fetchClientInteraction,
};
