"use server";

import type { ClientContact, ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/lib/business";

// Get all client contacts for the current business
export const getClientContacts = async (): Promise<ClientContact[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to get client contacts.");
        return [];
    }

    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to get a client contact.");
        return null;
    }

    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a client contact.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("client_contacts", id, contact, businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a client contact.");
        return null;
    }

    const { data, error } = await insertWithBusiness("client_contacts", contact, businessId);

    if (error) {
        console.error("Error creating client contact:", error);
        return null;
    }

    return data as ClientContact;
};

// Delete a client contact by ID
export const deleteClientContactById = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a client contact.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("client_contacts", id, businessId);

    if (error) {
        console.error("Error deleting client contact:", error);
        return false;
    }

    return true;
};

// Search client contacts by query (name, email, etc.)
export const searchClientContacts = async (query: string): Promise<ClientContact[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search client contacts.");
        return [];
    }

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
        return [] as ClientContact[];
    }
    return data as unknown as ClientContact[];
};

export const getClientContactsByClientId = async (clientId: string): Promise<ClientContact[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to get client contacts.");
        return [];
    }

    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
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