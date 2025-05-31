"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate } from "@/types/project-crews";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getProjectCrews = async (): Promise<ProjectCrew[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("project_crews", business.id);

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("project_crews", business.id, "*", { filter: { id: id } });

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
    const { business } = await withBusinessServer();

    crew = await applyCreated<ProjectCrewInsert>(crew);

    const { data, error } = await insertWithBusiness("project_crews", crew, business.id);

    if (error) {
        console.error("Error creating project crew:", error);
        return null;
    }

    return data as unknown as ProjectCrew;
}

export const updateProjectCrew = async (id: string, crew: ProjectCrewUpdate): Promise<ProjectCrew | null> => {
    const { business } = await withBusinessServer();

    crew = await applyUpdated<ProjectCrewUpdate>(crew);

    const { data, error } = await updateWithBusinessCheck("project_crews", id, crew, business.id);

    if (error) {
        console.error("Error updating project crew:", error);
        return null;
    }

    return data as unknown as ProjectCrew;
}

export const deleteProjectCrew = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("project_crews", id, business.id);

    if (error) {
        console.error("Error deleting project crew:", error);
        return false;
    }

    return true;
}

export const searchProjectCrews = async (query: string): Promise<ProjectCrew[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("project_crews", business.id, "*", {
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
