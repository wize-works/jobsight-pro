"use server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/lib/business";
import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "@/lib/db";
import type { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from "@/types/client-interactions";

// Get all client interactions for the current business
export const getClientInteractions = async (): Promise<ClientInteraction[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch client interactions.");
        return [];
    }

    const { data, error } = await fetchByBusiness("client_interactions", businessId, "*", {
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching client interactions:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ClientInteraction[];
    }

    return data as unknown as ClientInteraction[];
};

// Get a single client interaction by ID
export const getClientInteractionById = async (id: string): Promise<ClientInteraction | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch client interaction by ID.");
        return null;
    }

    const { data, error } = await fetchByBusiness("client_interactions", businessId, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching client interaction by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as ClientInteraction;
    }

    return null;
};

// Create a new client interaction
export const createClientInteraction = async (
    interaction: ClientInteractionInsert
): Promise<ClientInteraction | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a client interaction.");
        return null;
    }

    const { data, error } = await insertWithBusiness("client_interactions", { ...interaction }, businessId);

    if (error) {
        console.error("Error creating client interaction:", error);
        return null;
    }

    return data as ClientInteraction;
};

// Update an existing client interaction
export const updateClientInteraction = async (
    id: string,
    interaction: ClientInteractionUpdate
): Promise<ClientInteraction | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a client interaction.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("client_interactions", id, interaction, businessId);

    if (error) {
        console.error("Error updating client interaction:", error);
        return null;
    }

    return data as ClientInteraction;
};

// Delete a client interaction
export const deleteClientInteraction = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a client interaction.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("client_interactions", id, businessId);

    if (error) {
        console.error("Error deleting client interaction:", error);
        return false;
    }

    return true;
};

export const getClientInteractionsByClientId = async (clientId: string): Promise<ClientInteraction[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch client interactions.");
        return [];
    }

    const { data, error } = await fetchByBusiness("client_interactions", businessId, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching client interactions:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ClientInteraction[];
    }

    return data as unknown as ClientInteraction[];
};