"use client";

/**
 * Client Contacts Client Actions - Offline-First Implementation (Phase 4.4)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { ClientContact, ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
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
 * Get all client contacts for a business - Offline-first implementation
 * @param businessId - The business ID to get client contacts for
 */
export async function getClientContacts(businessId: string): Promise<ClientContact[]> {
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
        const cachedContacts = await db.clientContacts
            .where('business_id')
            .equals(businessId)
            .sortBy('name');

        if (cachedContacts.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`clientContacts_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedContacts;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/client-contacts/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverContacts = await response.json();

                    if (serverContacts && Array.isArray(serverContacts)) {
                        // Update local cache
                        await db.clientContacts.bulkPut(serverContacts);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `clientContacts_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'clientContacts'
                        });

                        return serverContacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch client contacts from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedContacts;

    } catch (error) {
        console.error('Error getting client contacts:', error);
        return [];
    }
}

/**
 * Get client contact by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param contactId - The contact ID to get
 */
export async function getClientContactById(businessId: string, contactId: string): Promise<ClientContact | null> {
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
        const cachedContact = await db.clientContacts.get(contactId);

        if (cachedContact && cachedContact.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`clientContacts_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedContact;
                }
            } else {
                // If offline, return cached data
                return cachedContact;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/client-contacts/${contactId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverContact = await response.json();

                    if (serverContact) {
                        // Update local cache
                        await db.clientContacts.put(serverContact);

                        return serverContact;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch client contact from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedContact || null;

    } catch (error) {
        console.error('Error getting client contact by ID:', error);
        return null;
    }
}

/**
 * Create client contact - Offline-first implementation with authorization
 * @param businessId - The business ID to create contact for
 * @param contactData - The contact data to create
 */
export async function createClientContact(
    businessId: string,
    contactData: ClientContactInsert
): Promise<{ success: boolean; data?: ClientContact; error?: string }> {
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

        // Validate client exists and belongs to business if client_id is provided
        if (contactData.client_id) {
            const client = await db.clients.get(contactData.client_id);
            if (!client || client.business_id !== businessId) {
                return {
                    success: false,
                    error: "Invalid client or client does not belong to this business."
                };
            }
        }

        // If this is marked as primary, ensure no other contact for the same client is primary
        if (contactData.is_primary && contactData.client_id) {
            const existingPrimaryContacts = await db.clientContacts
                .where('client_id')
                .equals(contactData.client_id)
                .and(contact => contact.is_primary === true)
                .toArray();

            // Update existing primary contacts to not be primary
            for (const contact of existingPrimaryContacts) {
                await db.clientContacts.update(contact.id, { is_primary: false });
            }
        }

        const now = new Date().toISOString();
        const contactId = uuidv4();

        // Create contact object
        const newContact: ClientContact = {
            id: contactId,
            business_id: businessId,
            client_id: contactData.client_id || null,
            name: contactData.name || null,
            title: contactData.title || null,
            phone: contactData.phone || null,
            email: contactData.email || null,
            is_primary: contactData.is_primary || false,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.clientContacts.put(newContact);

        // Queue for sync with server
        await addToSyncQueue(
            'clientContacts',
            'insert',
            newContact,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/client-contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...contactData,
                        businessId,
                        id: contactId
                    }),
                });

                if (response.ok) {
                    const serverContact = await response.json();

                    // Update local data with server response
                    await db.clientContacts.put(serverContact);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('clientContacts')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `clientContacts_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'clientContacts'
                    });

                    return { success: true, data: serverContact };
                }
            } catch (error) {
                console.warn('Failed to sync client contact to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newContact };

    } catch (error) {
        console.error('Error creating client contact:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create client contact"
        };
    }
}

/**
 * Update client contact - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param contactId - The contact ID to update
 * @param contactData - The contact data to update
 */
export async function updateClientContact(
    businessId: string,
    contactId: string,
    contactData: ClientContactUpdate
): Promise<{ success: boolean; data?: ClientContact; error?: string }> {
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

        // Get current contact
        const currentContact = await db.clientContacts.get(contactId);
        if (!currentContact) {
            return {
                success: false,
                error: "Client contact not found."
            };
        }

        // Verify the contact belongs to the business
        if (currentContact.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Contact does not belong to this business."
            };
        }

        // If updating to primary, ensure no other contact for the same client is primary
        if (contactData.is_primary && currentContact.client_id) {
            const existingPrimaryContacts = await db.clientContacts
                .where('client_id')
                .equals(currentContact.client_id)
                .and(contact => contact.is_primary === true && contact.id !== contactId)
                .toArray();

            // Update existing primary contacts to not be primary
            for (const contact of existingPrimaryContacts) {
                await db.clientContacts.update(contact.id, { is_primary: false });
            }
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<ClientContact> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from contactData
        if (contactData.name !== undefined) updateData.name = contactData.name;
        if (contactData.title !== undefined) updateData.title = contactData.title;
        if (contactData.phone !== undefined) updateData.phone = contactData.phone;
        if (contactData.email !== undefined) updateData.email = contactData.email;
        if (contactData.is_primary !== undefined) updateData.is_primary = contactData.is_primary;

        // Update locally first (optimistic update)
        const updatedContact = { ...currentContact, ...updateData };
        await db.clientContacts.put(updatedContact);

        // Queue for sync with server
        await addToSyncQueue(
            'clientContacts',
            'update',
            updatedContact,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/client-contacts/${contactId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverContact = await response.json();

                    // Update local data with server response
                    await db.clientContacts.put(serverContact);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('clientContacts')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `clientContacts_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'clientContacts'
                    });

                    return { success: true, data: serverContact };
                }
            } catch (error) {
                console.warn('Failed to sync client contact update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedContact };

    } catch (error) {
        console.error('Error updating client contact:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update client contact"
        };
    }
}

/**
 * Delete client contact - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param contactId - The contact ID to delete
 */
export async function deleteClientContact(
    businessId: string,
    contactId: string
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

        // Get current contact to verify it exists and belongs to business
        const currentContact = await db.clientContacts.get(contactId);
        if (!currentContact) {
            return {
                success: false,
                error: "Client contact not found."
            };
        }

        // Verify the contact belongs to the business
        if (currentContact.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Contact does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.clientContacts.delete(contactId);

        // Queue for sync with server
        await addToSyncQueue(
            'clientContacts',
            'delete',
            { id: contactId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/client-contacts/${contactId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('clientContacts')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === contactId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `clientContacts_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'clientContacts'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync client contact deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting client contact:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete client contact"
        };
    }
}

/**
 * Get contacts by client ID - Offline-first implementation
 * @param businessId - The business ID
 * @param clientId - The client ID to get contacts for
 */
export async function getContactsByClientId(businessId: string, clientId: string): Promise<ClientContact[]> {
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

        // Get contacts from cache
        const contacts = await db.clientContacts
            .where('client_id')
            .equals(clientId)
            .and(contact => contact.business_id === businessId)
            .sortBy('name');

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/client-contacts/client/${clientId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverContacts = await response.json();

                    if (serverContacts && Array.isArray(serverContacts)) {
                        // Update local cache
                        await db.clientContacts.bulkPut(serverContacts);

                        return serverContacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch contacts by client from server, using cache:', error);
            }
        }

        return contacts;

    } catch (error) {
        console.error('Error getting contacts by client ID:', error);
        return [];
    }
}

/**
 * Search client contacts - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchClientContacts(businessId: string, searchQuery: string): Promise<ClientContact[]> {
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

        // Get all contacts from cache first
        const allContacts = await db.clientContacts
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allContacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allContacts.filter(contact =>
                (contact.name && contact.name.toLowerCase().includes(query)) ||
                (contact.email && contact.email.toLowerCase().includes(query)) ||
                (contact.phone && contact.phone.includes(query)) ||
                (contact.title && contact.title.toLowerCase().includes(query))
            ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/client-contacts/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverContacts = await response.json();

                if (serverContacts && Array.isArray(serverContacts)) {
                    // Update local cache
                    await db.clientContacts.bulkPut(serverContacts);

                    return serverContacts;
                }
            }
        } catch (error) {
            console.warn('Failed to search client contacts on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allContacts.filter(contact =>
            (contact.name && contact.name.toLowerCase().includes(query)) ||
            (contact.email && contact.email.toLowerCase().includes(query)) ||
            (contact.phone && contact.phone.includes(query)) ||
            (contact.title && contact.title.toLowerCase().includes(query))
        ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    } catch (error) {
        console.error('Error searching client contacts:', error);
        return [];
    }
}

/**
 * Get primary contact for a client - Offline-first implementation
 * @param businessId - The business ID
 * @param clientId - The client ID to get primary contact for
 */
export async function getPrimaryContact(businessId: string, clientId: string): Promise<ClientContact | null> {
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

        // Get primary contact from cache
        const primaryContact = await db.clientContacts
            .where('client_id')
            .equals(clientId)
            .and(contact => contact.business_id === businessId && contact.is_primary === true)
            .first();

        return primaryContact || null;

    } catch (error) {
        console.error('Error getting primary contact:', error);
        return null;
    }
}

/**
 * Set primary contact for a client - Offline-first implementation
 * @param businessId - The business ID
 * @param clientId - The client ID
 * @param contactId - The contact ID to set as primary
 */
export async function setPrimaryContact(
    businessId: string,
    clientId: string,
    contactId: string
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

        // Get all contacts for this client
        const clientContacts = await db.clientContacts
            .where('client_id')
            .equals(clientId)
            .and(contact => contact.business_id === businessId)
            .toArray();

        // Update all contacts - set the specified one as primary, others as not primary
        for (const contact of clientContacts) {
            const isPrimary = contact.id === contactId;
            await db.clientContacts.update(contact.id, {
                is_primary: isPrimary,
                updated_at: new Date().toISOString(),
                updated_by: currentUserAuthId
            });

            // Queue for sync
            await addToSyncQueue(
                'clientContacts',
                'update',
                { ...contact, is_primary: isPrimary },
                businessId,
                currentUserAuthId
            );
        }

        return { success: true };

    } catch (error) {
        console.error('Error setting primary contact:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to set primary contact"
        };
    }
}
