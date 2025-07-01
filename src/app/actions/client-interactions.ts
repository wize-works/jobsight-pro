"use server";
import { auth } from "@clerk/nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "@/lib/db";
import type { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from "@/types/client-interactions";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { NotificationInsert } from "@/types/notifications";

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
    interaction: ClientInteractionInsert,
    triggeredBy?: string
): Promise<ClientInteraction> => {
    interaction = await applyCreated<ClientInteractionInsert>(interaction);

    const { data, error } = await insertWithBusiness("client_interactions", { ...interaction }, businessId);

    if (error) {
        console.error("Error creating client interaction:", error);
        throw new Error("Failed to create client interaction");
    }

    const result = data;

    // Create notification for the new client interaction
    if (result) {
        await createClientInteractionNotification(businessId, result, "created", triggeredBy);
    }

    return result;
};

// Update an existing client interaction
export const updateClientInteraction = async (
    businessId: string,
    id: string,
    interaction: ClientInteractionUpdate,
    triggeredBy?: string
): Promise<ClientInteraction> => {
    interaction = await applyUpdated<ClientInteractionUpdate>(interaction);

    const { data, error } = await updateWithBusinessCheck("client_interactions", id, interaction, businessId);

    if (error) {
        console.error("Error updating client interaction:", error);
        throw new Error("Failed to update client interaction");
    }

    const result = data;

    // Create notification for the updated client interaction
    if (result) {
        await createClientInteractionNotification(businessId, result, "updated", triggeredBy);
    }

    return result;
};

// Delete a client interaction
export const deleteClientInteraction = async (businessId: string, id: string, triggeredBy?: string): Promise<boolean> => {
    // Get the interaction data before deletion for notification
    let interactionData = null;
    try {
        interactionData = await getClientInteractionById(businessId, id);
    } catch (error) {
        console.error("Error fetching client interaction before deletion:", error);
    }

    const { error } = await deleteWithBusinessCheck("client_interactions", id, businessId);

    if (error) {
        console.error("Error deleting client interaction:", error);
        return false;
    }

    // Create notification for the deleted client interaction
    if (interactionData) {
        await createClientInteractionNotification(businessId, interactionData, "deleted", triggeredBy);
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

// Helper function to create notifications for client interaction actions
const createClientInteractionNotification = async (
    businessId: string,
    interactionData: any,
    eventType: "created" | "updated" | "deleted",
    triggeredBy?: string
) => {
    try {
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business:", businessId);
            return;
        }

        // Get client info for context
        let clientName = "Unknown Client";

        if (interactionData.client_id) {
            try {
                const { data: clientData } = await fetchByBusiness("clients", businessId, "*", {
                    filter: { id: interactionData.client_id }
                });

                if (clientData && clientData[0]) {
                    clientName = clientData[0].name || "Unknown Client";
                }
            } catch (error) {
                console.error("Error fetching client info:", error);
            }
        }

        const interactionType = interactionData.interaction_type || "interaction";
        const interactionDate = interactionData.interaction_date ? new Date(interactionData.interaction_date).toLocaleDateString() : "";

        const title = eventType === "created"
            ? "Client Interaction Recorded"
            : eventType === "updated"
                ? "Client Interaction Updated"
                : "Client Interaction Removed";

        const message = eventType === "created"
            ? `New ${interactionType} interaction recorded for client ${clientName}${interactionDate ? ` on ${interactionDate}` : ""}.`
            : eventType === "updated"
                ? `${interactionType} interaction for client ${clientName} has been updated.`
                : `${interactionType} interaction for client ${clientName} has been removed.`;

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates", // Client interactions are business-related updates
                title,
                message,
                link: interactionData.client_id ? `/dashboard/clients/${interactionData.client_id}` : `/dashboard/clients`,
                read: false,
                read_at: null,
                metadata: {
                    clientInteractionId: interactionData.id,
                    clientId: interactionData.client_id,
                    interactionType,
                    interactionDate: interactionData.interaction_date,
                    interactionOutcome: interactionData.outcome,
                    clientName,
                    eventType,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

        console.log(`Notifications created for client interaction ${interactionData.id} - ${eventType} for ${users.length} users`);
    } catch (error) {
        console.error("Error creating client interaction notification:", error);
    }
}