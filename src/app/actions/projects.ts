"use server";
import type { Project, ProjectInsert, ProjectUpdate } from "@/types/projects";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getProjects = async (): Promise<Project[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("projects", business.id, "*", {
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

export const getProjectById = async (id: string): Promise<Project | null> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("projects", business.id, "*", {
            filter: { id },
        });

        if (error) {
            console.error("Error fetching project by ID:", error);
            return null;
        }

        if (data && data[0]) {
            return data[0] as unknown as Project;
        }

        return null;
    } catch (err) {
        console.error("Error in getProjectById:", err);
        return null;
    }
};

export const createProject = async (project: ProjectInsert): Promise<Project | null> => {
    try {
        const { business } = await withBusinessServer();

        project = await applyCreated<ProjectInsert>(project);

        const { data, error } = await insertWithBusiness("projects", project, business.id);

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

export const updateProject = async (id: string, project: ProjectUpdate): Promise<Project | null> => {
    try {
        const { business } = await withBusinessServer();

        project = await applyUpdated<ProjectUpdate>(project);

        const { data, error } = await updateWithBusinessCheck("projects", id, project, business.id);

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

export const deleteProject = async (id: string): Promise<boolean> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await deleteWithBusinessCheck("projects", id, business.id);

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

export const searchProjects = async (query: string): Promise<Project[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("projects", business.id, "*", {
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

export const getProjectsByClientId = async (clientId: string): Promise<Project[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("projects", business.id, "*", {
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