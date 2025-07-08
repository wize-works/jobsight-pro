"use client";

/**
 * Clients Client Actions - Offline-First Implementation (Phase 3)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { Client, ClientInsert, ClientUpdate, ClientWithStats } from "@/types/clients";
import { db } from "@/lib/offline/dexie-db";
import { initializeAuthState } from "./business";
import { v4 as uuidv4 } from "uuid";

// Global auth state for client actions (imported from business actions)
declare let currentClerkUser: { id: string } | null;
declare let authStateInitialized: boolean;

// Check if we're online
function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get current authenticated user ID (auth_id) from auth system
async function getCurrentUserId(): Promise<string | null> {
    // First priority: Use initialized Clerk user state (when online and available)
    if (authStateInitialized && currentClerkUser?.id) {
        return currentClerkUser.id;
    }

    // Second priority: Get from cached auth_id (for offline scenarios)
    if (typeof window !== 'undefined') {
        const cachedAuthId = window.localStorage.getItem('cached_auth_id');
        if (cachedAuthId) {
            return cachedAuthId;
        }
    }

    // If no auth state available, return null (user needs to authenticate)
    console.warn('No authenticated user found. Ensure initializeAuthState() is called from a React component.');
    return null;
}

// Validate that user has access to the specified business (using auth_id)
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business (using auth_id)
        const userBusinessId = await db.userBusinessMappings.get(userAuthId);
        if (userBusinessId?.businessId === businessId) {
            return true;
        }

        // If no mapping found locally, check with business table
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            // Create the mapping for future use
            await db.userBusinessMappings.put({
                userId: userAuthId,
                businessId: businessId,
                role: 'owner',
                lastUpdated: Date.now()
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error validating business access:', error);
        return false;
    }
}

// Helper function to add sync operation to queue
async function addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    businessId: string,
    userId?: string
): Promise<void> {
    const syncItem = {
        id: uuidv4(),
        table,
        operation,
        data,
        businessId,
        userId,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    };

    await db.syncQueue.add(syncItem);
}

/**
 * Get all clients for a business - Offline-first implementation
 * @param businessId - The business ID to get clients for
 */
export async function getClients(businessId: string): Promise<Client[]> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return [];
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return [];
        }

        // Try to get from local cache first
        const cachedClients = await db.clients
            .where('business_id')
            .equals(businessId)
            .sortBy('name');

        if (cachedClients.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`clients_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedClients;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/clients/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverClients = await response.json();

                    if (serverClients && Array.isArray(serverClients)) {
                        // Update local cache
                        await db.clients.bulkPut(serverClients);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `clients_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'clients'
                        });

                        return serverClients.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch clients from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedClients;

    } catch (error) {
        console.error('Error getting clients:', error);
        return [];
    }
}

/**
 * Get client by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param clientId - The client ID to get
 */
export async function getClientById(businessId: string, clientId: string): Promise<Client | null> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return null;
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return null;
        }

        // Try to get from local cache first
        const cachedClient = await db.clients.get(clientId);

        if (cachedClient && cachedClient.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`clients_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedClient;
                }
            } else {
                // If offline, return cached data
                return cachedClient;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/clients/${clientId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverClient = await response.json();

                    if (serverClient) {
                        // Update local cache
                        await db.clients.put(serverClient);

                        return serverClient;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch client from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedClient || null;

    } catch (error) {
        console.error('Error getting client by ID:', error);
        return null;
    }
}

/**
 * Create client - Offline-first implementation with authorization
 * @param businessId - The business ID to create client for
 * @param clientData - The client data to create
 */
export async function createClient(
    businessId: string,
    clientData: ClientInsert
): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        const now = new Date().toISOString();
        const clientId = uuidv4();

        // Create client object
        const newClient: Client = {
            id: clientId,
            business_id: businessId,
            name: clientData.name,
            type: clientData.type || null,
            address: clientData.address || null,
            city: clientData.city || null,
            state: clientData.state || null,
            zip: clientData.zip || null,
            country: clientData.country || null,
            contact_email: clientData.contact_email || null,
            contact_name: clientData.contact_name || null,
            contact_phone: clientData.contact_phone || null,
            logo_url: clientData.logo_url || null,
            status: clientData.status || 'active',
            website: clientData.website || null,
            industry: clientData.industry || null,
            tax_id: clientData.tax_id || null,
            notes: clientData.notes || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.clients.put(newClient);

        // Queue for sync with server
        await addToSyncQueue(
            'clients',
            'insert',
            newClient,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...clientData,
                        businessId,
                        id: clientId
                    }),
                });

                if (response.ok) {
                    const serverClient = await response.json();

                    // Update local data with server response
                    await db.clients.put(serverClient);

                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['clients', businessId, 'insert'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `clients_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'clients'
                    });

                    return { success: true, data: serverClient };
                }
            } catch (error) {
                console.warn('Failed to sync client to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newClient };

    } catch (error) {
        console.error('Error creating client:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create client"
        };
    }
}

/**
 * Update client - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param clientId - The client ID to update
 * @param clientData - The client data to update
 */
export async function updateClient(
    businessId: string,
    clientId: string,
    clientData: ClientUpdate
): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        // Get current client
        const currentClient = await db.clients.get(clientId);
        if (!currentClient) {
            return {
                success: false,
                error: "Client not found."
            };
        }

        // Verify the client belongs to the business
        if (currentClient.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Client does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data - be explicit about types
        const updateData: Partial<Client> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from clientData that match Client schema
        if (clientData.name !== undefined) updateData.name = clientData.name;
        if (clientData.type !== undefined) updateData.type = clientData.type;
        if (clientData.address !== undefined) updateData.address = clientData.address;
        if (clientData.city !== undefined) updateData.city = clientData.city;
        if (clientData.state !== undefined) updateData.state = clientData.state;
        if (clientData.zip !== undefined) updateData.zip = clientData.zip;
        if (clientData.country !== undefined) updateData.country = clientData.country;
        if (clientData.contact_email !== undefined) updateData.contact_email = clientData.contact_email;
        if (clientData.contact_name !== undefined) updateData.contact_name = clientData.contact_name;
        if (clientData.contact_phone !== undefined) updateData.contact_phone = clientData.contact_phone;
        if (clientData.logo_url !== undefined) updateData.logo_url = clientData.logo_url;
        if (clientData.status !== undefined) updateData.status = clientData.status;
        if (clientData.website !== undefined) updateData.website = clientData.website;
        if (clientData.industry !== undefined) updateData.industry = clientData.industry;
        if (clientData.tax_id !== undefined) updateData.tax_id = clientData.tax_id;
        if (clientData.notes !== undefined) updateData.notes = clientData.notes;

        // Update locally first (optimistic update)
        const updatedClient = { ...currentClient, ...updateData };
        await db.clients.put(updatedClient);

        // Queue for sync with server
        await addToSyncQueue(
            'clients',
            'update',
            updatedClient,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/clients/${clientId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverClient = await response.json();

                    // Update local data with server response
                    await db.clients.put(serverClient);

                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['clients', businessId, 'update'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `clients_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'clients'
                    });

                    return { success: true, data: serverClient };
                }
            } catch (error) {
                console.warn('Failed to sync client update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedClient };

    } catch (error) {
        console.error('Error updating client:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update client"
        };
    }
}

/**
 * Archive client - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param clientId - The client ID to archive
 */
export async function archiveClient(
    businessId: string,
    clientId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        return await updateClient(businessId, clientId, { status: 'archived' } as ClientUpdate);
    } catch (error) {
        console.error('Error archiving client:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to archive client"
        };
    }
}

/**
 * Unarchive client - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param clientId - The client ID to unarchive
 */
export async function unarchiveClient(
    businessId: string,
    clientId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        return await updateClient(businessId, clientId, { status: 'active' } as ClientUpdate);
    } catch (error) {
        console.error('Error unarchiving client:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to unarchive client"
        };
    }
}

/**
 * Search clients - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchClients(businessId: string, searchQuery: string): Promise<Client[]> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return [];
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return [];
        }

        // Get all clients from cache first
        const allClients = await db.clients
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allClients.sort((a, b) => a.name.localeCompare(b.name));
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allClients.filter(client =>
                client.name.toLowerCase().includes(query) ||
                (client.contact_name && client.contact_name.toLowerCase().includes(query)) ||
                (client.contact_email && client.contact_email.toLowerCase().includes(query)) ||
                (client.industry && client.industry.toLowerCase().includes(query)) ||
                (client.city && client.city.toLowerCase().includes(query))
            ).sort((a, b) => a.name.localeCompare(b.name));
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/clients/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverClients = await response.json();

                if (serverClients && Array.isArray(serverClients)) {
                    // Update local cache
                    await db.clients.bulkPut(serverClients);

                    return serverClients;
                }
            }
        } catch (error) {
            console.warn('Failed to search clients on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allClients.filter(client =>
            client.name.toLowerCase().includes(query) ||
            (client.contact_name && client.contact_name.toLowerCase().includes(query)) ||
            (client.contact_email && client.contact_email.toLowerCase().includes(query)) ||
            (client.industry && client.industry.toLowerCase().includes(query)) ||
            (client.city && client.city.toLowerCase().includes(query))
        ).sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error('Error searching clients:', error);
        return [];
    }
}

/**
 * Update client notes - Offline-first implementation
 * @param businessId - The business ID
 * @param clientId - The client ID
 * @param notes - The notes to update
 */
export async function updateClientNotes(
    businessId: string,
    clientId: string,
    notes: string
): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
        return await updateClient(businessId, clientId, { notes } as ClientUpdate);
    } catch (error) {
        console.error('Error updating client notes:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update client notes"
        };
    }
}

/**
 * Get clients with statistics - Offline-first implementation
 * @param businessId - The business ID to get clients with stats for
 */
export async function getClientsWithStats(businessId: string): Promise<ClientWithStats[]> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return [];
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return [];
        }

        // Get clients and projects from local cache
        const clients = await db.clients
            .where('business_id')
            .equals(businessId)
            .toArray();

        const projects = await db.projects
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Calculate stats for each client
        const clientsWithStats: ClientWithStats[] = clients.map(client => {
            const clientProjects = projects.filter(p => p.client_id === client.id);
            const activeProjects = clientProjects.filter(p =>
                p.status === 'active' || p.status === 'in_progress' || p.status === 'planned'
            );

            const totalBudget = clientProjects.reduce((sum, p) => {
                return sum + (p.budget || 0);
            }, 0);

            return {
                ...client,
                total_projects: clientProjects.length,
                active_projects: activeProjects.length,
                total_budget: totalBudget
            };
        });

        // If online, try to fetch updated stats from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/clients/business/${businessId}/stats`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverClientsWithStats = await response.json();

                    if (serverClientsWithStats && Array.isArray(serverClientsWithStats)) {
                        // Extract just the base client data to update local cache
                        const baseClients = serverClientsWithStats.map(clientWithStats => {
                            const { total_projects, active_projects, total_budget, ...baseClient } = clientWithStats;
                            return baseClient;
                        });

                        // Update local cache with base client data
                        await db.clients.bulkPut(baseClients);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `clients_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'clients'
                        });

                        return serverClientsWithStats.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch clients with stats from server, using local calculation:', error);
            }
        }

        // Return locally calculated stats
        return clientsWithStats.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error('Error getting clients with stats:', error);
        return [];
    }
}

/**
 * Delete client - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param clientId - The client ID to delete
 */
export async function deleteClient(
    businessId: string,
    clientId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        // Get current client to verify it exists and belongs to business
        const currentClient = await db.clients.get(clientId);
        if (!currentClient) {
            return {
                success: false,
                error: "Client not found."
            };
        }

        // Verify the client belongs to the business
        if (currentClient.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Client does not belong to this business."
            };
        }

        // Check if client has active projects - prevent deletion if they do
        const activeProjects = await db.projects
            .where('client_id')
            .equals(clientId)
            .and(project => project.status === 'active' || project.status === 'in_progress')
            .count();

        if (activeProjects > 0) {
            return {
                success: false,
                error: "Cannot delete client with active projects. Please complete or reassign projects first."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.clients.delete(clientId);

        // Queue for sync with server
        await addToSyncQueue(
            'clients',
            'delete',
            { id: clientId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/clients/${clientId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('clients')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === clientId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `clients_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'clients'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync client deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting client:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete client"
        };
    }
}
