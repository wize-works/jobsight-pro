"use server";
import type { Project, ProjectInsert, ProjectUpdate } from "@/types/projects";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "./business";


export const getProjects = async (): Promise<Project[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch projects.");
        return [];
    }

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
};

export const getProjectById = async (id: string): Promise<Project | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch project by ID.");
        return null;
    }

    const { data, error } = await fetchByBusiness("projects", businessId, "*", {
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
};

export const createProject = async (project: ProjectInsert): Promise<Project | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a project.");
        return null;
    }

    const { data, error } = await insertWithBusiness("projects", { ...project }, businessId);

    if (error) {
        console.error("Error creating project:", error);
        return null;
    }

    return data as Project;
};

export const updateProject = async (id: string, project: ProjectUpdate): Promise<Project | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a project.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("projects", id, project, businessId);

    if (error) {
        console.error("Error updating project:", error);
        return null;
    }

    return data as Project;
};

export const deleteProject = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a project.");
        return false;
    }

    const { data, error } = await deleteWithBusinessCheck("projects", id, businessId);

    if (error) {
        console.error("Error deleting project:", error);
        return false;
    }

    return true;
};

export const searchProjects = async (query: string): Promise<Project[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search projects.");
        return [];
    }

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
}

export const getProjectsByClientId = async (clientId: string): Promise<Project[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch projects.");
        return [];
    }

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
};