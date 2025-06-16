"use server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "@/lib/db";
import type { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from "@/types/client-interactions";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

// Get all client interactions for the current business
export const getClientInteractions = async (businessId: string): Promise<ClientInteraction[]> => {
    const { data, error } = await fetchByBusiness("client_interactions", businessId, "*", {
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching client interactions:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
};

// Get a single client interaction by ID
export const getClientInteractionById = async (businessId: string, id: string): Promise<ClientInteraction> => {
    const { data, error } = await fetchByBusiness("client_interactions", businessId, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching client interaction by ID:", error);
        throw new Error("Failed to fetch client interaction");
    }

    if (data && data[0]) {
        return data[0];
    }

    throw new Error("Client interaction not found");
};

// Create a new client interaction
export const createClientInteraction = async (
    businessId: string,
    interaction: ClientInteractionInsert
): Promise<ClientInteraction> => {
    interaction = await applyCreated<ClientInteractionInsert>(interaction);

    const { data, error } = await insertWithBusiness("client_interactions", { ...interaction }, businessId);

    if (error) {
        console.error("Error creating client interaction:", error);
        throw new Error("Failed to create client interaction");
    }

    return data;
};

// Update an existing client interaction
export const updateClientInteraction = async (
    businessId: string,
    id: string,
    interaction: ClientInteractionUpdate
): Promise<ClientInteraction> => {
    interaction = await applyUpdated<ClientInteractionUpdate>(interaction);

    const { data, error } = await updateWithBusinessCheck("client_interactions", id, interaction, businessId);

    if (error) {
        console.error("Error updating client interaction:", error);
        throw new Error("Failed to update client interaction");
    }

    return data;
};

// Delete a client interaction
export const deleteClientInteraction = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("client_interactions", id, businessId);

    if (error) {
        console.error("Error deleting client interaction:", error);
        return false;
    }

    return true;
};

export const getClientInteractionsByClientId = async (businessId: string, clientId: string): Promise<ClientInteraction[]> => {
    const { data, error } = await fetchByBusiness("client_interactions", businessId, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching client interactions:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
};