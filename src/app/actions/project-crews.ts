"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate } from "@/types/project-crews";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";


export const getProjectCrews = async (businessId: string): Promise<ProjectCrew[]> => {


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

export const getProjectCrewById = async (businessId: string, id: string): Promise<ProjectCrew | null> => {


    const { data, error } = await fetchByBusiness("project_crews", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching project crew by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as ProjectCrew;
    }

    return null;
};

export const createProjectCrew = async (businessId: string, crew: ProjectCrewInsert): Promise<ProjectCrew | null> => {


    crew = await applyCreated<ProjectCrewInsert>(crew);

    const { data, error } = await insertWithBusiness("project_crews", crew, businessId);

    if (error) {
        console.error("Error creating project crew:", error);
        return null;
    }

    return data as unknown as ProjectCrew;
}

export const updateProjectCrew = async (businessId: string, id: string, crew: ProjectCrewUpdate): Promise<ProjectCrew | null> => {


    crew = await applyUpdated<ProjectCrewUpdate>(crew);

    const { data, error } = await updateWithBusinessCheck("project_crews", id, crew, businessId);

    if (error) {
        console.error("Error updating project crew:", error);
        return null;
    }

    return data as unknown as ProjectCrew;
}

export const deleteProjectCrew = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("project_crews", id, businessId);

    if (error) {
        console.error("Error deleting project crew:", error);
        return false;
    }

    return true;
}

export const searchProjectCrews = async (businessId: string, query: string): Promise<ProjectCrew[]> => {


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

export const addCrewToProject = async (businessId: string, projectId: string, crewId: string): Promise<ProjectCrew | null> => {


    let newCrew = {
        project_id: projectId,
        crew_id: crewId,
        business_id: businessId,
    } as ProjectCrewInsert;

    newCrew = await applyCreated<ProjectCrewInsert>(newCrew);

    const createdCrew = await createProjectCrew(businessId, newCrew);

    if (!createdCrew) {
        console.error("Failed to add crew to project");
        return null;
    }

    return createdCrew;
};

export const removeCrewFromProject = async (businessId: string, projectId: string, crewId: string): Promise<boolean> => {


    const { data, error } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { project_id: projectId, crew_id: crewId },
    }) as { data: ProjectCrew[], error: any };

    if (error) {
        console.error("Error fetching project crew for removal:", error);
        return false;
    }
    if (!data || data.length === 0) {
        console.warn("No crew found for the specified project and crew ID");
        return false;
    }
    if (data.length > 1) {
        console.warn("Multiple crews found for the specified project and crew ID, removing the first one");
    }

    const success = await deleteProjectCrew(businessId, data[0].id);

    if (!success) {
        console.error("Failed to remove crew from project");
        return false;
    }

    return true;
};