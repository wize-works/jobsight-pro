/**
 * Client-Side Client Contacts Actions
 * 
 * Replaces src/app/actions/client-contacts.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for client contacts
type ClientContact = Database['public']['Tables']['client_contacts']['Row'];
type ClientContactInsert = Database['public']['Tables']['client_contacts']['Insert'];
type ClientContactUpdate = Partial<Database['public']['Tables']['client_contacts']['Update']> & { id: string };

// Create client-side client contact actions
const insertClientContact = createInsertAction('client_contacts', 'medium');
const updateClientContact = createUpdateAction('client_contacts', 'medium');
const deleteClientContact = createDeleteAction('client_contacts', 'medium');
const selectClientContacts = createSelectAction('client_contacts');

/**
 * Get all client contacts for a business - works offline
 */
export const getClientContacts = async (businessId: string): Promise<ClientContact[]> => {
    try {
        const result = await selectClientContacts({}, businessId);

        if (result.error) {
            console.error("Error fetching client contacts:", result.error);
            return [];
        }

        return (result.data || []) as ClientContact[];
    } catch (err) {
        console.error("Error in getClientContacts:", err);
        return [];
    }
};

/**
 * Get a client contact by ID - works offline
 */
export const getClientContactById = async (businessId: string, id: string): Promise<ClientContact | null> => {
    try {
        const result = await selectClientContacts({ id }, businessId);

        if (result.error) {
            console.error("Error fetching client contact:", result.error);
            return null;
        }

        const contacts = (result.data || []) as ClientContact[];
        return contacts.length > 0 ? contacts[0] : null;
    } catch (err) {
        console.error("Error in getClientContactById:", err);
        return null;
    }
};

/**
 * Create a new client contact - works offline
 */
export const createClientContact = async (
    businessId: string,
    contact: Omit<ClientContactInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<ClientContact | null> => {
    try {
        const newContact: ClientContactInsert = {
            ...contact,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertClientContact(newContact, businessId);

        if (result.error) {
            console.error("Error creating client contact:", result.error);
            return null;
        }

        return result.data as ClientContact;
    } catch (err) {
        console.error("Error in createClientContact:", err);
        return null;
    }
};

/**
 * Update a client contact - works offline
 */
export const updateClientContactById = async (
    businessId: string,
    id: string,
    updates: Partial<ClientContactUpdate>
): Promise<ClientContact | null> => {
    try {
        const updateData: ClientContactUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateClientContact(updateData, businessId);

        if (result.error) {
            console.error("Error updating client contact:", result.error);
            return null;
        }

        return result.data as ClientContact;
    } catch (err) {
        console.error("Error in updateClientContactById:", err);
        return null;
    }
};

/**
 * Delete a client contact - works offline
 */
export const deleteClientContactById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteClientContact({ id }, businessId);

        if (result.error) {
            console.error("Error deleting client contact:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteClientContactById:", err);
        return false;
    }
};

/**
 * Get client contacts by client ID - works offline
 */
export const getClientContactsByClientId = async (businessId: string, clientId: string): Promise<ClientContact[]> => {
    try {
        const allContacts = await getClientContacts(businessId);
        return allContacts.filter(contact => contact.client_id === clientId);
    } catch (err) {
        console.error("Error in getClientContactsByClientId:", err);
        return [];
    }
};

/**
 * Search client contacts by query - works offline
 */
export const searchClientContacts = async (businessId: string, query: string): Promise<ClientContact[]> => {
    try {
        const allContacts = await getClientContacts(businessId);
        const searchTerm = query.toLowerCase();

        return allContacts.filter((contact: ClientContact) =>
            contact.name?.toLowerCase().includes(searchTerm) ||
            contact.email?.toLowerCase().includes(searchTerm) ||
            contact.phone?.toLowerCase().includes(searchTerm)
        );
    } catch (err) {
        console.error("Error in searchClientContacts:", err);
        return [];
    }
};

/**
 * Get primary contact for a client - works offline
 */
export const getPrimaryClientContact = async (businessId: string, clientId: string): Promise<ClientContact | null> => {
    try {
        const contacts = await getClientContactsByClientId(businessId, clientId);
        return contacts.find(contact => contact.is_primary) || contacts[0] || null;
    } catch (err) {
        console.error("Error in getPrimaryClientContact:", err);
        return null;
    }
};

/**
 * Set a contact as primary for a client (and unset others) - works offline
 */
export const setPrimaryClientContact = async (businessId: string, contactId: string, clientId: string): Promise<boolean> => {
    try {
        // First, unset all other primary contacts for this client
        const allContacts = await getClientContactsByClientId(businessId, clientId);

        const updatePromises = allContacts.map(contact => {
            if (contact.id === contactId) {
                return updateClientContactById(businessId, contactId, { is_primary: true });
            } else if (contact.is_primary) {
                return updateClientContactById(businessId, contact.id, { is_primary: false });
            }
            return Promise.resolve(null);
        });

        await Promise.all(updatePromises);
        return true;
    } catch (err) {
        console.error("Error in setPrimaryClientContact:", err);
        return false;
    }
};

/**
 * Bulk create client contacts for a client - works offline
 */
export const bulkCreateClientContacts = async (
    businessId: string,
    clientId: string,
    contacts: Omit<ClientContactInsert, 'id' | 'client_id' | 'business_id' | 'created_at' | 'updated_at'>[]
): Promise<ClientContact[]> => {
    try {
        const createPromises = contacts.map(contact =>
            createClientContact(businessId, {
                ...contact,
                client_id: clientId,
                business_id: businessId
            })
        );

        const results = await Promise.all(createPromises);
        return results.filter(result => result !== null) as ClientContact[];
    } catch (err) {
        console.error("Error in bulkCreateClientContacts:", err);
        return [];
    }
};

/**
 * Validate client contact data
 */
export const validateClientContact = (contact: Partial<ClientContactInsert>): string[] => {
    const errors: string[] = [];

    if (!contact.name || contact.name.trim().length === 0) {
        errors.push('Contact name is required');
    }

    if (!contact.client_id) {
        errors.push('Client ID is required');
    }

    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        errors.push('Invalid email format');
    }

    if (contact.phone && contact.phone.length > 0 && !/^[\+]?[1-9][\d]{0,15}$/.test(contact.phone.replace(/\s|-|\(|\)/g, ''))) {
        errors.push('Invalid phone number format');
    }

    return errors;
};

/**
 * Get contact statistics for a client - works offline
 */
export const getClientContactStats = async (businessId: string, clientId: string): Promise<{
    total: number;
    primary: number;
    withEmail: number;
    withPhone: number;
}> => {
    try {
        const contacts = await getClientContactsByClientId(businessId, clientId);

        return {
            total: contacts.length,
            primary: contacts.filter(c => c.is_primary).length,
            withEmail: contacts.filter(c => c.email && c.email.trim().length > 0).length,
            withPhone: contacts.filter(c => c.phone && c.phone.trim().length > 0).length
        };
    } catch (err) {
        console.error("Error in getClientContactStats:", err);
        return { total: 0, primary: 0, withEmail: 0, withPhone: 0 };
    }
};
