"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate } from "@/types/project-crews";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getProjectCrews = async (): Promise<ProjectCrew[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch project crews.");
        return [];
    }

    const { data, error } = await fetchByBusiness("project_crews", businessId);

    if (error) {
        console.error("Error fetching project crews:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ProjectCrew[];
    }

    return data as unknown as ProjectCrew[];
}

export const getProjectCrewById = async (id: string): Promise<ProjectCrew | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch project crews.");
        return null;
    }

    const { data, error } = await fetchByBusiness("project_crews", businessId, id);

    if (error) {
        console.error("Error fetching project crew by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as ProjectCrew;
    }

    return null;
};

export const createProjectCrew = async (crew: ProjectCrewInsert): Promise<ProjectCrew | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a project crew.");
        return null;
    }

    const { data, error } = await insertWithBusiness("project_crews", crew, businessId);

    if (error) {
        console.error("Error creating project crew:", error);
        return null;
    }

    return data as unknown as ProjectCrew;
}

export const updateProjectCrew = async (id: string, crew: ProjectCrewUpdate): Promise<ProjectCrew | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a project crew.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("project_crews", id, crew, businessId);

    if (error) {
        console.error("Error updating project crew:", error);
        return null;
    }

    return data as unknown as ProjectCrew;
}

export const deleteProjectCrew = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a project crew.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("project_crews", id, businessId);

    if (error) {
        console.error("Error deleting project crew:", error);
        return false;
    }

    return true;
}

export const searchProjectCrews = async (query: string): Promise<ProjectCrew[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search project crews.");
        return [];
    }

    const { data, error } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: {
            or: [
                { project_id: { ilike: `%${query}%` } },
                { crew_id: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching project crews:", error);
        return [];
    }

    return data as unknown as ProjectCrew[];
};
