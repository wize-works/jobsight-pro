"use server"

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { ClientInsert, ClientUpdate, Client } from "@/types/clients";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";
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
        // Use the new query builder to get clients with project statistics in a single query
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "clients",
            select: ["*"],
            aggregates: [
                { function: "count", table: "projects", alias: "total_projects" },
                { function: "count", table: "projects", alias: "active_projects", where: { status: "active" } },
                { function: "sum", table: "projects", column: "budget", alias: "total_budget" }
            ],
            orderBy: { column: "name", ascending: true }
        });

        if (error) {
            console.error("Error fetching clients with stats:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Map the results to ensure proper typing and handle potential null values
        return data.map((client: any) => ({
            ...client,
            total_projects: client.total_projects || 0,
            active_projects: client.active_projects || 0,
            total_budget: client.total_budget || 0,
        }));
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
        // Use the new query builder to get all counts in a single operation
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "clients",
            select: ["id"],
            aggregates: [
                { function: "count", table: "projects", alias: "project_count", where: { client_id: clientId } },
                { function: "count", table: "client_contacts", alias: "contact_count", where: { client_id: clientId } },
                { function: "count", table: "client_interactions", alias: "interaction_count", where: { client_id: clientId } },
                { function: "count", table: "invoices", alias: "invoice_count", where: { client_id: clientId } }
            ],
            where: { id: clientId }
        });

        if (error || !data || data.length === 0) {
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

        const clientData = data[0];
        const relatedData = {
            projectCount: clientData.project_count || 0,
            contactCount: clientData.contact_count || 0,
            interactionCount: clientData.interaction_count || 0,
            invoiceCount: clientData.invoice_count || 0,
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

export const getClientDetailsByID = async (businessId: string, clientId: string): Promise<{
    client: Client;
    projects: any[];
    contacts: any[];
    interactions: any[];
    stats: {
        totalProjects: number;
        activeProjects: number;
        totalBudget: number;
        totalContacts: number;
        totalInteractions: number;
        recentInteractions: number;
    };
} | null> => {
    try {
        // First, let's get the basic client data with simple joins using Supabase relationship syntax
        const { data: clientWithRelations, error: clientError } = await fetchByBusinessWithQuery(businessId, {
            from: "clients",
            select: ["*"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status", "budget", "start_date", "end_date", "description", "location", "type", "progress", "created_at", "updated_at"],
                    alias: "projects"
                },
                {
                    table: "client_contacts",
                    select: ["id", "name", "title", "email", "phone", "is_primary", "created_at", "updated_at"],
                    alias: "client_contacts" // Use the actual table name as alias
                },
                {
                    table: "client_interactions",
                    select: ["id", "type", "date", "summary", "staff", "follow_up_date", "follow_up_task", "created_at", "updated_at"],
                    alias: "client_interactions" // Use the actual table name as alias
                }
            ],
            where: { id: clientId }
        });

        // Get the aggregated stats separately for now since complex aggregations might not work well with joins
        const { data: statsData, error: statsError } = await fetchByBusinessWithQuery(businessId, {
            from: "clients",
            select: ["id"],
            aggregates: [
                { function: "count", table: "projects", alias: "total_projects", where: { client_id: clientId } },
                { function: "count", table: "projects", alias: "active_projects", where: { client_id: clientId, status: "active" } },
                { function: "sum", table: "projects", column: "budget", alias: "total_budget", where: { client_id: clientId } },
                { function: "count", table: "client_contacts", alias: "total_contacts", where: { client_id: clientId } },
                { function: "count", table: "client_interactions", alias: "total_interactions", where: { client_id: clientId } },
                {
                    function: "count",
                    table: "client_interactions",
                    alias: "recent_interactions",
                    where: {
                        client_id: clientId,
                        date: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
                        }
                    }
                }
            ],
            where: { id: clientId }
        });

        if (clientError) {
            console.error("Error fetching client details:", clientError);
            throw new Error("Failed to fetch client details");
        }

        if (!clientWithRelations || clientWithRelations.length === 0) {
            throw new Error("Client not found");
        }

        const clientData = clientWithRelations[0];
        const statsResult = statsData?.[0] || {};

        // Extract and structure the data
        const client: Client = {
            id: clientData.id,
            business_id: clientData.business_id,
            name: clientData.name,
            type: clientData.type,
            industry: clientData.industry,
            contact_name: clientData.contact_name,
            contact_email: clientData.contact_email,
            contact_phone: clientData.contact_phone,
            website: clientData.website,
            address: clientData.address,
            city: clientData.city,
            state: clientData.state,
            zip: clientData.zip,
            country: clientData.country,
            tax_id: clientData.tax_id,
            notes: clientData.notes,
            logo_url: clientData.logo_url,
            status: clientData.status,
            created_at: clientData.created_at,
            created_by: clientData.created_by,
            updated_at: clientData.updated_at,
            updated_by: clientData.updated_by
        }; const projects = clientData.projects || [];
        const contacts = clientData.client_contacts || []; // Use the correct property name
        const interactions = clientData.client_interactions || []; // Use the correct property name

        const stats = {
            totalProjects: statsResult.total_projects || 0,
            activeProjects: statsResult.active_projects || 0,
            totalBudget: statsResult.total_budget || 0,
            totalContacts: statsResult.total_contacts || 0,
            totalInteractions: statsResult.total_interactions || 0,
            recentInteractions: statsResult.recent_interactions || 0
        };

        return {
            client,
            projects,
            contacts,
            interactions,
            stats
        };
    } catch (err) {
        console.error("Error in getClientDetailsByID:", err);
        throw new Error("Failed to fetch client details");
    }
};