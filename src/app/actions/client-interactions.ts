"use server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "@/lib/db";
import type { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from "@/types/client-interactions";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

// Get all client interactions for the current business
export const getClientInteractions = async (): Promise<ClientInteraction[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("client_interactions", business.id, "*", {
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
export const getClientInteractionById = async (id: string): Promise<ClientInteraction> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("client_interactions", business.id, "*", {
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
    interaction: ClientInteractionInsert
): Promise<ClientInteraction> => {
    const { business } = await withBusinessServer();

    interaction = await applyCreated<ClientInteractionInsert>(interaction);

    const { data, error } = await insertWithBusiness("client_interactions", { ...interaction }, business.id);

    if (error) {
        console.error("Error creating client interaction:", error);
        throw new Error("Failed to create client interaction");
    }

    return data;
};

// Update an existing client interaction
export const updateClientInteraction = async (
    id: string,
    interaction: ClientInteractionUpdate
): Promise<ClientInteraction> => {
    const { business } = await withBusinessServer();

    interaction = await applyUpdated<ClientInteractionUpdate>(interaction);

    const { data, error } = await updateWithBusinessCheck("client_interactions", id, interaction, business.id);

    if (error) {
        console.error("Error updating client interaction:", error);
        throw new Error("Failed to update client interaction");
    }

    return data;
};

// Delete a client interaction
export const deleteClientInteraction = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("client_interactions", id, business.id);

    if (error) {
        console.error("Error deleting client interaction:", error);
        return false;
    }

    return true;
};

export const getClientInteractionsByClientId = async (clientId: string): Promise<ClientInteraction[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("client_interactions", business.id, "*", {
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