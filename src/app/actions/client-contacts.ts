"use server";

import type { ClientContact, ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { applyUpdated } from "@/utils/apply-updated";

// Get all client contacts for the current business
export const getClientContacts = async (businessId: string): Promise<ClientContact[]> => {
    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching client contacts:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
};

// Get a single client contact by ID
export const getClientContactById = async (businessId: string, id: string): Promise<ClientContact> => {
    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching client contact:", error);
        throw new Error("Failed to fetch client contact");
    }

    if (data && data.length > 0) {
        return data[0];
    }
    throw new Error("Client contact not found");
};

// Update a client contact
export const updateClientContact = async (
    businessId: string,
    id: string,
    contact: ClientContactUpdate
): Promise<ClientContact> => {
    contact = await applyUpdated<ClientContactUpdate>(contact);

    const { data, error } = await updateWithBusinessCheck("client_contacts", id, contact, businessId);

    if (error) {
        console.error("Error updating client contact:", error);
        throw new Error("Failed to update client contact");
    }

    return data;
};

// Create a new client contact
export const createClientContact = async (
    businessId: string,
    contact: ClientContactInsert
): Promise<ClientContact> => {
    contact = await applyUpdated<ClientContactInsert>(contact);

    const { data, error } = await insertWithBusiness("client_contacts", contact, businessId);

    if (error) {
        console.error("Error creating client contact:", error);
        throw new Error("Failed to create client contact");
    }

    return data;
};

// Delete a client contact by ID
export const deleteClientContactById = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("client_contacts", id, businessId);

    if (error) {
        console.error("Error deleting client contact:", error);
        return false;
    }

    return true;
};

// Search client contacts by query (name, email, etc.)
export const searchClientContacts = async (businessId: string, query: string): Promise<ClientContact[]> => {
    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
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
        return [];
    }
    return data;
};

export const getClientContactsByClientId = async (businessId: string, clientId: string): Promise<ClientContact[]> => {
    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching client contacts:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
};