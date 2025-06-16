"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneUpdate } from "@/types/project_milestones";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";


export const getProjectMilestones = async (businessId: string): Promise<ProjectMilestone[]> => {


    const { data, error } = await fetchByBusiness("project_milestones", businessId);

    if (error) {
        console.error("Error fetching project milestones:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ProjectMilestone[];
    }

    return data as unknown as ProjectMilestone[];
}

export const getProjectMilestoneById = async (businessId: string, id: string): Promise<ProjectMilestone | null> => {


    const { data, error } = await fetchByBusiness("project_milestones", businessId, "*", {
        filter: { id }
    });

    if (error) {
        console.error("Error fetching project milestone by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as ProjectMilestone;
    }

    return null;
};

export const createProjectMilestone = async (businessId: string, milestone: ProjectMilestoneInsert): Promise<ProjectMilestone | null> => {


    milestone = await applyCreated<ProjectMilestoneInsert>(milestone);

    const { data, error } = await insertWithBusiness("project_milestones", milestone, businessId);

    if (error) {
        console.error("Error creating project milestone:", error);
        return null;
    }

    return data as unknown as ProjectMilestone;
}

export const updateProjectMilestone = async (businessId: string, id: string, milestone: ProjectMilestoneUpdate): Promise<ProjectMilestone | null> => {


    milestone = await applyUpdated<ProjectMilestoneUpdate>(milestone);

    const { data, error } = await updateWithBusinessCheck("project_milestones", id, milestone, businessId);

    if (error) {
        console.error("Error updating project milestone:", error);
        return null;
    }

    return data as unknown as ProjectMilestone;
}

export const deleteProjectMilestone = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("project_milestones", id, businessId);

    if (error) {
        console.error("Error deleting project milestone:", error);
        return false;
    }

    return true;
}

export const searchProjectMilestones = async (businessId: string, query: string): Promise<ProjectMilestone[]> => {


    const { data, error } = await fetchByBusiness("project_milestones", businessId, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching project milestones:", error);
        return [];
    }

    return data as unknown as ProjectMilestone[];
};

export const getProjectMilestonesByProjectId = async (businessId: string, id: string): Promise<ProjectMilestone[] | []> => {


    const { data, error } = await fetchByBusiness("project_milestones", businessId, "*", {
        filter: { project_id: id },
        orderBy: { column: "due_date", ascending: false },
    });

    if (error) {
        console.error("Error fetching project milestones:", error);
        return [];
    }
    if (!data || data.length === 0) {
        return [] as ProjectMilestone[];
    }
    return data as unknown as ProjectMilestone[];
};
