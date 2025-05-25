"use server"

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { ClientInsert, ClientUpdate, Client } from "@/types/clients";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Project } from "@/types/projects";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "./business";

export const getClientById = async (id: string): Promise<Client | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch client by ID.");
        return null;
    }

    const { data, error } = await fetchByBusiness("clients", businessId, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching client by ID:", error);
        return null;
    }

    if (data && data.length > 0) {
        return data[0] as unknown as Client;
    }
    return null;
}

export const getClients = async (): Promise<Client[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch clients.");
        return [];
    }

    const { data, error } = await fetchByBusiness("clients", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching clients:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Client[];
    }

    return data as unknown as Client[];
}

export const getClientsWithStats = async (): Promise<Client[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch clients with stats.");
        return [];
    }

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

export const createClient = async (client: ClientInsert): Promise<Client | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a client.");
        return null;
    }

    const { data, error } = await insertWithBusiness("clients", { ...client }, businessId);

    if (error) {
        console.error("Error creating client:", error);
        return null;
    }

    return data as Client;
}

export const updateClient = async (id: string, client: ClientUpdate): Promise<Client | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a client.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("clients", id, client, businessId);

    if (error) {
        console.error("Error updating client:", error);
        return null;
    }

    return data as Client;
}

export const deleteClient = async (id: string): Promise<boolean> => {

    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a client.");
        return false;
    }

    const { data, error } = await deleteWithBusinessCheck("clients", id, businessId);

    if (error) {
        console.error("Error deleting client:", error);
        return false;
    }

    return true;
}

export const searchClients = async (query: string): Promise<Client[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a client.");
        return [];
    }

    const { data, error } = await fetchByBusiness("clients", businessId, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { contact_name: { ilike: `%${query}%` } },
                { contact_email: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error searching clients:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Client[];
    }

    return data as unknown as Client[];
};

export const updateClientNotes = async (id: string, notes: string): Promise<Client | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update client notes.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("clients", id, { notes } as ClientUpdate, businessId);

    if (error) {
        console.error("Error updating client notes:", error);
        return null;
    }

    return data as Client;
};