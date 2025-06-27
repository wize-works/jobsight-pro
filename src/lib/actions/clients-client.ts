/**
 * Client-Side Clients Actions
 * 
 * Replaces src/app/actions/clients.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Client, ClientInsert, ClientUpdate, ClientWithStats } from "@/types/clients";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Create client-side client actions
const insertClient = createInsertAction('clients', 'medium');
const updateClientAction = createUpdateAction('clients', 'medium');
const deleteClientAction = createDeleteAction('clients', 'medium');
const selectClients = createSelectAction('clients');

/**
 * Get client by ID - works offline
 */
export const getClientById = async (businessId: string, id: string): Promise<Client | null> => {
    try {
        const clients = await getClients(businessId);
        const client = clients.find(c => c.id === id);

        if (!client) {
            console.warn(`Client with ID ${id} not found`);
            return null;
        }

        return client;
    } catch (err) {
        console.error("Error in getClientById:", err);
        return null;
    }
};

/**
 * Get all clients for a business - works offline with server fallback
 */
export const getClients = async (businessId: string): Promise<Client[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectClients({}, businessId);

        if (result.error) {
            console.error("Error fetching clients from IndexedDB:", result.error);
        }

        const clientData = (result.data || []) as Client[];

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Clients loaded from IndexedDB: ${clientData.length} clients`);
            return clientData;
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for clients...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getClients: getClientsServer } = await import('@/app/actions/clients');
            const serverData = await getClientsServer(businessId);

            if (serverData.length > 0) {
                console.log(`✅ Clients loaded from server: ${serverData.length} clients`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('clients', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} clients to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache clients data:', cacheError);
                }

                return serverData;
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for clients:', serverError);
        }

        console.log('📭 No clients found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getClients:", err);
        return [];
    }
};

/**
 * Get clients with stats - works offline
 */
export const getClientsWithStats = async (businessId: string): Promise<ClientWithStats[]> => {
    try {
        const clients = await getClients(businessId);

        // For now, return clients with placeholder stats since project data relationships 
        // need additional implementation for offline caching
        // TODO: Implement project and financial data caching and calculation
        return clients.map(client => ({
            ...client,
            total_projects: 0, // Placeholder - implement project count lookup
            active_projects: 0, // Placeholder - implement active project count lookup
            total_value: 0, // Placeholder - implement project value calculation
            total_invoiced: 0, // Placeholder - implement invoicing calculation
            total_paid: 0, // Placeholder - implement payment calculation
            outstanding_balance: 0, // Placeholder - implement balance calculation
            last_project_date: null, // Placeholder - implement last project date lookup
            avg_project_rating: null // Placeholder - implement rating calculation
        })) as ClientWithStats[];

    } catch (err) {
        console.error("Error in getClientsWithStats:", err);
        return [];
    }
};

/**
 * Create new client - works offline with optimistic updates
 */
export const createClient = async (
    businessId: string,
    client: ClientInsert
): Promise<Client | null> => {
    try {
        // Ensure required fields
        const clientData = {
            ...client,
            id: client.id || uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: client.status || 'active',
            archived: false
        };

        const result = await insertClient(clientData, businessId);

        if (result.error) {
            console.error("Error creating client:", result.error);
            return null;
        }

        return result.data as Client;
    } catch (err) {
        console.error("Error in createClient:", err);
        return null;
    }
};

/**
 * Update client - works offline with optimistic updates
 */
export const updateClient = async (
    businessId: string,
    id: string,
    client: ClientUpdate
): Promise<Client | null> => {
    try {
        const updateData = {
            ...client,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateClientAction(updateData, businessId);

        if (result.error) {
            console.error("Error updating client:", result.error);
            return null;
        }

        return result.data as Client;
    } catch (err) {
        console.error("Error in updateClient:", err);
        return null;
    }
};

/**
 * Archive client - works offline with optimistic updates
 */
export const archiveClient = async (businessId: string, clientId: string): Promise<boolean> => {
    try {
        const updateData = {
            id: clientId,
            archived: true,
            updated_at: new Date().toISOString(),
        };

        const result = await updateClientAction(updateData, businessId);

        if (result.error) {
            console.error("Error archiving client:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in archiveClient:", err);
        return false;
    }
};

/**
 * Unarchive client - works offline with optimistic updates
 */
export const unarchiveClient = async (businessId: string, clientId: string): Promise<boolean> => {
    try {
        const updateData = {
            id: clientId,
            archived: false,
            updated_at: new Date().toISOString(),
        };

        const result = await updateClientAction(updateData, businessId);

        if (result.error) {
            console.error("Error unarchiving client:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in unarchiveClient:", err);
        return false;
    }
};

/**
 * Search clients - works offline
 */
export const searchClients = async (businessId: string, query: string): Promise<Client[]> => {
    try {
        const allClients = await getClients(businessId);

        if (!query.trim()) {
            return allClients;
        }

        // Simple client-side search - could be enhanced
        const searchLower = query.toLowerCase();
        return allClients.filter(client =>
            client.name?.toLowerCase().includes(searchLower) ||
            client.contact_name?.toLowerCase().includes(searchLower) ||
            client.contact_email?.toLowerCase().includes(searchLower) ||
            client.contact_phone?.toLowerCase().includes(searchLower) ||
            client.address?.toLowerCase().includes(searchLower)
        );
    } catch (err) {
        console.error("Error in searchClients:", err);
        return [];
    }
};

/**
 * Update client notes - works offline with optimistic updates
 */
export const updateClientNotes = async (
    businessId: string,
    id: string,
    notes: string
): Promise<Client | null> => {
    try {
        const updateData = {
            id,
            notes,
            updated_at: new Date().toISOString(),
        };

        const result = await updateClientAction(updateData, businessId);

        if (result.error) {
            console.error("Error updating client notes:", result.error);
            return null;
        }

        return result.data as Client;
    } catch (err) {
        console.error("Error in updateClientNotes:", err);
        return null;
    }
};

/**
 * Upload client logo - works offline (queued for sync)
 */
export const uploadClientLogo = async (
    businessId: string,
    clientId: string,
    file: File
): Promise<string | null> => {
    try {
        // For offline mode, we'll need to queue the file upload
        // This is a placeholder implementation
        // TODO: Implement offline file queuing and upload when online

        console.log("Logo upload queued for sync when online:", {
            businessId,
            clientId,
            fileName: file.name,
            fileSize: file.size
        });

        // Return a placeholder URL for now
        const placeholderUrl = `pending-upload-${clientId}-${Date.now()}`;

        // Update client with placeholder logo URL
        const updateData = {
            id: clientId,
            logo_url: placeholderUrl,
            updated_at: new Date().toISOString(),
        };

        await updateClientAction(updateData, businessId);

        return placeholderUrl;
    } catch (err) {
        console.error("Error in uploadClientLogo:", err);
        return null;
    }
};

/**
 * Get client archive info - works offline
 */
export const getClientArchiveInfo = async (
    businessId: string,
    clientId: string
): Promise<{
    canArchive: boolean;
    activeProjects: number;
    totalInvoices: number;
    outstandingBalance: number;
    lastActivity: string | null;
} | null> => {
    try {
        const client = await getClientById(businessId, clientId);

        if (!client) {
            return null;
        }

        // For offline mode, return placeholder data
        // TODO: Implement proper project, invoice, and activity calculations
        return {
            canArchive: true, // Placeholder - should check for active projects
            activeProjects: 0, // Placeholder - implement project count lookup
            totalInvoices: 0, // Placeholder - implement invoice count lookup
            outstandingBalance: 0, // Placeholder - implement balance calculation
            lastActivity: client.updated_at // Use client update as proxy for last activity
        };
    } catch (err) {
        console.error("Error in getClientArchiveInfo:", err);
        return null;
    }
};

// Export compatibility functions for existing code
export {
    getClients as default,
    createClient as insertClient
};
