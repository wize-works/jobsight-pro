"use server"

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { ClientInsert, ClientUpdate, ClientInteractionInsert, ClientInteractionUpdate, ClientContactInsert, ClientContactUpdate } from "@/types/clients";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";

export async function getClients(businessId: string) {
    return await fetchByBusiness("clients", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
}

export async function getClientById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("clients", businessId, "*", {
        filter: { id },
    });

    return data && data[0] ? data[0] : null;
}

export async function createClient(client: Omit<ClientInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("clients", client, businessId);
}

export async function updateClient(id: string, client: ClientUpdate, businessId: string) {
    return await updateWithBusinessCheck("clients", id, client, businessId);
}

export async function deleteClient(id: string, businessId: string) {
    return await deleteWithBusinessCheck("clients", id, businessId);
}

export async function searchClients(query: string, businessId: string) {
    return await fetchByBusiness("clients", businessId, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { contact_name: { ilike: `%${query}%` } },
                { contact_email: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });
};

export async function getClientContacts(clientId: string, businessId: string) {
    return await fetchByBusiness("client_contacts", businessId, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "is_primary", ascending: false },
    });
};

export async function getClientContactById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("client_contacts", businessId, "*", {
        filter: { id },
    });
    return data && data[0] ? data[0] : null;
};

export async function updateClientContact(id: string, contact: ClientContactUpdate, businessId: string) {
    return await updateWithBusinessCheck("client_contacts", id, contact, businessId);
};

export async function deleteClientContact(id: string, businessId: string) {
    return await deleteWithBusinessCheck("client_contacts", id, businessId);
};

export async function createClientContact(clientId: string, contact: Omit<ClientContactInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("client_contacts", { ...contact, client_id: clientId }, businessId);
};

export async function getClientInteractions(clientId: string, businessId: string) {
    return await fetchByBusiness("client_interactions", businessId, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "date", ascending: false },
    });
}

export async function getClientInteractionById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("client_interactions", businessId, "*", {
        filter: { id },
    });
    return data && data[0] ? data[0] : null;
};

export async function updateClientInteraction(id: string, interaction: ClientInteractionUpdate, businessId: string) {
    return await updateWithBusinessCheck("client_interactions", id, interaction, businessId);
};

export async function deleteClientInteraction(id: string, businessId: string) {
    return await deleteWithBusinessCheck("client_interactions", id, businessId);
};

export async function createClientInteraction(interaction: Omit<ClientInteractionInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("client_interactions", { ...interaction }, businessId);
};

export async function updateClientNotes(id: string, notes: string, businessId: string) {
    return await updateWithBusinessCheck("clients", id, { notes }, businessId);
}