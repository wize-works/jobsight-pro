"use server";

import type { ClientContact, ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyUpdated } from "@/utils/apply-updated";

// Get all client contacts for the current business
export const getClientContacts = async (): Promise<ClientContact[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("client_contacts", business.id, "*", {
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching client contacts:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ClientContact[];
    }

    return data as unknown as ClientContact[];
};

// Get a single client contact by ID
export const getClientContactById = async (id: string): Promise<ClientContact | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("client_contacts", business.id, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching client contact:", error);
        return null;
    }

    if (data && data.length > 0) {
        return data[0] as unknown as ClientContact;
    }
    return null;
};

// Update a client contact
export const updateClientContact = async (
    id: string,
    contact: ClientContactUpdate
): Promise<ClientContact | null> => {
    const { business } = await withBusinessServer();

    contact = await applyUpdated<ClientContactUpdate>(contact);

    const { data, error } = await updateWithBusinessCheck("client_contacts", id, contact, business.id);

    if (error) {
        console.error("Error updating client contact:", error);
        return null;
    }

    return data as ClientContact;
};

// Create a new client contact
export const createClientContact = async (
    contact: ClientContactInsert
): Promise<ClientContact | null> => {
    const { business } = await withBusinessServer();

    contact = await applyUpdated<ClientContactInsert>(contact);

    const { data, error } = await insertWithBusiness("client_contacts", contact, business.id);

    if (error) {
        console.error("Error creating client contact:", error);
        return null;
    }

    return data as ClientContact;
};

// Delete a client contact by ID
export const deleteClientContactById = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("client_contacts", id, business.id);

    if (error) {
        console.error("Error deleting client contact:", error);
        return false;
    }

    return true;
};

// Search client contacts by query (name, email, etc.)
export const searchClientContacts = async (query: string): Promise<ClientContact[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("client_contacts", business.id, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { email: { ilike: `%${query}%` } },
                { phone: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error searching client contacts:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ClientContact[];
    }
    return data as unknown as ClientContact[];
};

export const getClientContactsByClientId = async (clientId: string): Promise<ClientContact[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("client_contacts", business.id, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching client contacts:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ClientContact[];
    }

    return data as unknown as ClientContact[];
};