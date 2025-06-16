"use server";
import type { Project, ProjectInsert, ProjectUpdate, ProjectWithDetails } from "@/types/projects";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { Client } from "@/types/clients";


export const getProjects = async (businessId: string): Promise<Project[]> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Project[];
        }

        return data as unknown as Project[];
    } catch (err) {
        console.error("Error in getProjects:", err);
        return [];
    }
};

export const getProjectById = async (businessId: string, id: string): Promise<Project> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            filter: { id },
        });

        if (error) {
            console.error("Error fetching project by ID:", error);
            throw error;
        }

        if (data && data[0]) {
            return data[0];
        }

        throw new Error(`Project with ID ${id} not found`);
    } catch (err) {
        console.error("Error in getProjectById:", err);
        throw err;
    }
};

export const createProject = async (businessId: string, project: ProjectInsert): Promise<Project | null> => {
    try {
        project = await applyCreated<ProjectInsert>(project);

        const { data, error } = await insertWithBusiness("projects", project, businessId);

        if (error) {
            console.error("Error creating project:", error);
            return null;
        }

        return data as Project;
    } catch (err) {
        console.error("Error in createProject:", err);
        return null;
    }
};

export const updateProject = async (businessId: string, id: string, project: ProjectUpdate): Promise<Project | null> => {
    try {
        project = await applyUpdated<ProjectUpdate>(project);

        const { data, error } = await updateWithBusinessCheck("projects", id, project, businessId);

        if (error) {
            console.error("Error updating project:", error);
            return null;
        }

        return data as Project;
    } catch (err) {
        console.error("Error in updateProject:", err);
        return null;
    }
};

export const deleteProject = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const { error } = await deleteWithBusinessCheck("projects", id, businessId);

        if (error) {
            console.error("Error deleting project:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteProject:", err);
        return false;
    }
};

export const searchProjects = async (businessId: string, query: string): Promise<Project[]> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            filter: {
                or: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                ]
            },
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error searching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Project[];
        }

        return data as unknown as Project[];
    } catch (err) {
        console.error("Error in searchProjects:", err);
        return [];
    }
}

export const getProjectsByClientId = async (businessId: string, clientId: string): Promise<Project[]> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            filter: { client_id: clientId },
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Project[];
        }

        return data as unknown as Project[];
    } catch (err) {
        console.error("Error in getProjectsByClientId:", err);
        return [];
    }
};

export const setProjectLocation = async (project: ProjectUpdate): Promise<Project | null> => {
    try {
        project = await applyUpdated<ProjectUpdate>(project);

        const { data, error } = await updateWithBusinessCheck("projects", project.id, project, project.business_id);

        if (error) {
            console.error("Error creating project:", error);
            return null;
        }

        return data as Project;
    } catch (err) {
        console.error("Error in createProject:", err);
        return null;
    }
};

export const getProjectsWithDetails = async (businessId: string): Promise<ProjectWithDetails[]> => {
    try {


        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as ProjectWithDetails[];
        }

        // Ensure data is an array of ProjectWithDetails before accessing client_id
        const projectsWithDetails = data as unknown as ProjectWithDetails[];
        const clientIds = projectsWithDetails.map((project) => project.client_id).filter(Boolean);

        const { data: clients, error: clientError } = await fetchByBusiness("clients", businessId, ["id", "name"], {
            filter: { id: { in: clientIds } },
        });

        return projectsWithDetails.map((project) => {
            const client = (clients as unknown as Client[])?.find((c) => c.id === project.client_id);
            return {
                ...project,
                client_name: client ? client.name : "Unknown Client",
            };
        });

    } catch (err) {
        console.error("Error in getProjects:", err);
        return [];
    }
};

// Placeholder function for triggering project notifications.  This would need to be implemented.
async function triggerProjectNotification(projectId: string, projectName: string, eventType: string) {
    console.log(`Simulating push notification for project ${projectName} (${projectId}) - ${eventType}`);
}