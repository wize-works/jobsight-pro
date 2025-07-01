"use server";

import type { ClientContact, ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { NotificationInsert } from "@/types/notifications";

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
    contact: ClientContactUpdate,
    triggeredBy?: string
): Promise<ClientContact> => {
    contact = await applyUpdated<ClientContactUpdate>(contact);

    const { data, error } = await updateWithBusinessCheck("client_contacts", id, contact, businessId);

    if (error) {
        console.error("Error updating client contact:", error);
        throw new Error("Failed to update client contact");
    }

    const result = data;

    // Create notification for the updated client contact
    if (result) {
        await createClientContactNotification(businessId, result, "updated", triggeredBy);
    }

    return result;
};

// Create a new client contact
export const createClientContact = async (
    businessId: string,
    contact: ClientContactInsert,
    triggeredBy?: string
): Promise<ClientContact> => {
    contact = await applyUpdated<ClientContactInsert>(contact);

    const { data, error } = await insertWithBusiness("client_contacts", contact, businessId);

    if (error) {
        console.error("Error creating client contact:", error);
        throw new Error("Failed to create client contact");
    }

    const result = data;

    // Create notification for the new client contact
    if (result) {
        await createClientContactNotification(businessId, result, "created", triggeredBy);
    }

    return result;
};

// Delete a client contact by ID
export const deleteClientContactById = async (businessId: string, id: string, triggeredBy?: string): Promise<boolean> => {
    // Get the contact data before deletion for notification
    let contactData = null;
    try {
        contactData = await getClientContactById(businessId, id);
    } catch (error) {
        console.error("Error fetching client contact before deletion:", error);
    }

    const { error } = await deleteWithBusinessCheck("client_contacts", id, businessId);

    if (error) {
        console.error("Error deleting client contact:", error);
        return false;
    }

    // Create notification for the deleted client contact
    if (contactData) {
        await createClientContactNotification(businessId, contactData, "deleted", triggeredBy);
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

// Helper function to create notifications for client contact actions
const createClientContactNotification = async (
    businessId: string,
    contactData: any,
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

        if (contactData.client_id) {
            try {
                const { data: clientData } = await fetchByBusiness("clients", businessId, "*", {
                    filter: { id: contactData.client_id },
                });

                if (clientData && clientData[0]) {
                    clientName = clientData[0].name || "Unknown Client";
                }
            } catch (error) {
                console.error("Error fetching client info:", error);
            }
        }

        const contactName = contactData.name || "contact";

        const title =
            eventType === "created"
                ? "Client Contact Added"
                : eventType === "updated"
                    ? "Client Contact Updated"
                    : "Client Contact Removed";

        const message =
            eventType === "created"
                ? `New contact "${contactName}" has been added to client ${clientName}.`
                : eventType === "updated"
                    ? `Contact "${contactName}" for client ${clientName} has been updated.`
                    : `Contact "${contactName}" has been removed from client ${clientName}.`;

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates", // Client contacts are business-related updates
                title,
                message,
                link: contactData.client_id ? `/dashboard/clients/${contactData.client_id}` : `/dashboard/clients`,
                read: false,
                read_at: null,
                metadata: {
                    clientContactId: contactData.id,
                    clientId: contactData.client_id,
                    contactName,
                    contactEmail: contactData.email,
                    contactPhone: contactData.phone,
                    clientName,
                    eventType,
                    triggeredBy,
                },
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

        console.log(
            `Notifications created for client contact ${contactData.id} - ${eventType} for ${users.length} users`
        );
    } catch (error) {
        console.error("Error creating client contact notification:", error);
    }
};