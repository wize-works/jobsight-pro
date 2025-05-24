"use server"

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { ClientInsert, ClientUpdate, ClientInteractionInsert, ClientInteractionUpdate, ClientContactInsert, ClientContactUpdate, Client } from "@/types/clients";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Project } from "@/types/projects";

export async function getClients(businessId: string) {
    return await fetchByBusiness("clients", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
}

export async function getClientsWithStats(businessId: string) {
    const { data: clients, error: clientErrors } = await fetchByBusiness("clients", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });

    if (!clients) {
        return [];
    }

    const clientIds = (clients as unknown as Client[]).map((client) => client.id);

    const { data: projects } = await fetchByBusiness("projects", businessId, "*", {
        filter: { client_id: { in: clientIds } },
    });

    return (clients as unknown as Client[]).map((client) => {
        const clientProjects = (projects as unknown as Project[])?.filter((project: Project) => project.client_id === client.id) || [];
        const totalBudget = clientProjects.reduce((acc, project) => acc + (project.budget || 0), 0);
        const activeProjects = clientProjects.filter((project) => project.status === "active").length;

        return {
            ...client,
            total_projects: clientProjects.length,
            active_projects: activeProjects,
            total_budget: totalBudget,
        };
    });

}

export async function getClientById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("clients", businessId, "*", {
        filter: { id },
    });

    return data && data[0] ? data[0] : null;
}

export async function createClient(client: Omit<ClientInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("clients", { ...client, business_id: businessId }, businessId);
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