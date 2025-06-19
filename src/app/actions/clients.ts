"use server"

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { ClientInsert, ClientUpdate, Client } from "@/types/clients";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Project } from "@/types/projects";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { generateUploadUrl } from "@/app/actions/media";
import { withBusinessServer } from "@/lib/auth/with-business-server";

export const getClientById = async (businessId: string, id: string): Promise<Client> => {
    try {
        const { data, error } = await fetchByBusiness("clients", businessId, "*", {
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
};

export const getClients = async (businessId: string): Promise<Client[]> => {
    try {
        const { data, error } = await fetchByBusiness("clients", businessId, "*", {
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

export const getClientsWithStats = async (businessId: string,): Promise<Client[]> => {
    try {

        const { data: clients, error: clientErrors } = await fetchByBusiness("clients", businessId, "*", {
            orderBy: { column: "name", ascending: true },
        });

        if (!clients) {
            return [];
        }

        const clientIds = clients.map((client) => client.id);

        const { data: projects } = await fetchByBusiness("projects", businessId, "*", {
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

export const createClient = async (businessId: string, client: ClientInsert): Promise<Client> => {
    try {


        client = await applyCreated<ClientInsert>(client);

        const { data, error } = await insertWithBusiness("clients", client, businessId);

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

export const updateClient = async (businessId: string, id: string, client: ClientUpdate): Promise<Client> => {
    try {
        client = await applyUpdated<ClientUpdate>(client);

        const { data, error } = await updateWithBusinessCheck("clients", id, client, businessId);

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

export const archiveClient = async (businessId: string, clientId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Get current client data first
        const currentClient = await getClientById(businessId, clientId);

        // Update client status to archived
        const updatedClient = {
            ...currentClient,
            status: "archived" as const,
            updated_at: new Date().toISOString(),
            updated_by: userId || null
        };

        const { data, error } = await updateWithBusinessCheck("clients", clientId, updatedClient, businessId);

        if (error) {
            console.error("Error archiving client:", error);
            throw new Error("Failed to archive client");
        }

        console.log(`Client ${clientId} successfully archived`);
        return true;
    } catch (err) {
        console.error("Error in archiveClient:", err);
        throw new Error("Failed to archive client");
    }
};

export const unarchiveClient = async (businessId: string, clientId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Get current client data first
        const currentClient = await getClientById(businessId, clientId);

        // Update client status to active
        const updatedClient = {
            ...currentClient,
            status: "active" as const,
            updated_at: new Date().toISOString(),
            updated_by: userId || null
        };

        const { data, error } = await updateWithBusinessCheck("clients", clientId, updatedClient, businessId);

        if (error) {
            console.error("Error unarchiving client:", error);
            throw new Error("Failed to unarchive client");
        }

        console.log(`Client ${clientId} successfully unarchived`);
        return true;
    } catch (err) {
        console.error("Error in unarchiveClient:", err);
        throw new Error("Failed to unarchive client");
    }
};

export const searchClients = async (businessId: string, query: string): Promise<Client[]> => {
    try {


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
            return [];
        }

        return data;
    } catch (err) {
        console.error("Error in searchClients:", err);
        return [];
    }
};

export const updateClientNotes = async (businessId: string, id: string, notes: string): Promise<Client> => {
    try {
        const { data, error } = await updateWithBusinessCheck(
            "clients",
            id,
            {
                notes,
                updated_at: new Date().toISOString(),
                updated_by: "system" // Replace with actual userId if available
            } as ClientUpdate,
            businessId
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

export const uploadClientLogo = async (businessId: string, clientId: string, file: File): Promise<string | null> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Generate upload URL for images
        const uploadData = await generateUploadUrl("images", file.name);

        if (!uploadData) {
            throw new Error("Failed to generate upload URL");
        }

        // Upload file to Azure Blob Storage
        const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const logoUrl = uploadData.fileUrl;

        // Update client with new logo URL
        await updateClient(businessId, clientId, { logo_url: logoUrl } as ClientUpdate);

        return logoUrl;
    } catch (error) {
        console.error("Error uploading client logo:", error);
        return null;
    }
};

export const getClientArchiveInfo = async (businessId: string, clientId: string): Promise<{
    relatedData: {
        projectCount: number;
        contactCount: number;
        interactionCount: number;
        invoiceCount: number;
    };
}> => {
    try {
        // Check for related data to show user what will be preserved
        const [projectsData, contactsData, interactionsData, invoicesData] = await Promise.all([
            fetchByBusiness("projects", businessId, ["id"], { filter: { client_id: clientId } }),
            fetchByBusiness("client_contacts", businessId, ["id"], { filter: { client_id: clientId } }),
            fetchByBusiness("client_interactions", businessId, ["id"], { filter: { client_id: clientId } }),
            fetchByBusiness("invoices", businessId, ["id"], { filter: { client_id: clientId } })
        ]);

        const relatedData = {
            projectCount: projectsData.data?.length || 0,
            contactCount: contactsData.data?.length || 0,
            interactionCount: interactionsData.data?.length || 0,
            invoiceCount: invoicesData.data?.length || 0,
        };

        return {
            relatedData
        };
    } catch (error) {
        console.error("Error getting client archive info:", error);
        return {
            relatedData: {
                projectCount: 0,
                contactCount: 0,
                interactionCount: 0,
                invoiceCount: 0,
            }
        };
    }
};