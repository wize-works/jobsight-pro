"use server"

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { ClientInsert, ClientUpdate, Client } from "@/types/clients";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Project } from "@/types/projects";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getClientById = async (id: string): Promise<Client> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("clients", business.id, "*", {
            filter: { id },
        });

        if (error) {
            console.error("Error fetching client by ID:", error);
            throw new Error("Failed to fetch client");
        }

        if (data && data.length > 0) {
            return data[0];
        }
        throw new Error("Client not found");
    } catch (err) {
        console.error("Error in getClientById:", err);
        throw new Error("Failed to fetch client by ID");
    }
}

export const getClients = async (): Promise<Client[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("clients", business.id, "*", {
            orderBy: { column: "name", ascending: true },
        });

        if (error) {
            console.error("Error fetching clients:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    } catch (err) {
        console.error("Error in getClients:", err);
        return [];
    }
}

export const getClientsWithStats = async (): Promise<Client[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data: clients, error: clientErrors } = await fetchByBusiness("clients", business.id, "*", {
            orderBy: { column: "name", ascending: true },
        });

        if (!clients) {
            return [];
        }

        const clientIds = clients.map((client) => client.id);

        const { data: projects } = await fetchByBusiness("projects", business.id, "*", {
            filter: { client_id: { in: clientIds } },
        });

        return clients.map((client) => {
            const clientProjects = projects?.filter((project: Project) => project.client_id === client.id) || [];
            const totalBudget = clientProjects.reduce((acc, project) => acc + (project.budget || 0), 0);
            const activeProjects = clientProjects.filter((project) => project.status === "active").length;

            return {
                ...client,
                total_projects: clientProjects.length,
                active_projects: activeProjects,
                total_budget: totalBudget,
            };
        });
    } catch (err) {
        console.error("Error in getClientsWithStats:", err);
        return [];
    }
}

export const createClient = async (client: ClientInsert): Promise<Client> => {
    try {
        const { business } = await withBusinessServer();

        client = await applyCreated<ClientInsert>(client);

        const { data, error } = await insertWithBusiness("clients", client, business.id);

        if (error) {
            console.error("Error creating client:", error);
            throw new Error("Failed to create client");
        }

        return data;
    } catch (err) {
        console.error("Error in createClient:", err);
        throw new Error("Failed to create client");
    }
}

export const updateClient = async (id: string, client: ClientUpdate): Promise<Client> => {
    try {
        const { business } = await withBusinessServer();

        client = await applyUpdated<ClientUpdate>(client);

        const { data, error } = await updateWithBusinessCheck("clients", id, client, business.id);

        if (error) {
            console.error("Error updating client:", error);
            throw new Error("Failed to update client");
        }

        return data;
    } catch (err) {
        console.error("Error in updateClient:", err);
        throw new Error("Failed to update client");
    }
}

export const deleteClient = async (id: string): Promise<boolean> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await deleteWithBusinessCheck("clients", id, business.id);

        if (error) {
            console.error("Error deleting client:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteClient:", err);
        return false;
    }
}

export const searchClients = async (query: string): Promise<Client[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("clients", business.id, "*", {
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
            return [];
        }

        return data;
    } catch (err) {
        console.error("Error in searchClients:", err);
        return [];
    }
};

export const updateClientNotes = async (id: string, notes: string): Promise<Client> => {
    try {
        const { business, userId } = await withBusinessServer();

        const { data, error } = await updateWithBusinessCheck(
            "clients",
            id,
            {
                notes,
                updated_at: new Date().toISOString(),
                updated_by: userId
            } as ClientUpdate,
            business.id
        );

        if (error) {
            console.error("Error updating client notes:", error);
            throw new Error("Failed to update client notes");
        }

        return data;
    } catch (err) {
        console.error("Error in updateClientNotes:", err);
        throw new Error("Failed to update client notes");
    }
};