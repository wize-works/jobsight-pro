"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneUpdate } from "@/types/project_milestones";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getProjectMilestones = async (): Promise<ProjectMilestone[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("project_milestones", business.id);

    if (error) {
        console.error("Error fetching project milestones:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ProjectMilestone[];
    }

    return data as unknown as ProjectMilestone[];
}

export const getProjectMilestoneById = async (id: string): Promise<ProjectMilestone | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("project_milestones", business.id, id);

    if (error) {
        console.error("Error fetching project milestone by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as ProjectMilestone;
    }

    return null;
};

export const createProjectMilestone = async (milestone: ProjectMilestoneInsert): Promise<ProjectMilestone | null> => {
    const { business } = await withBusinessServer();

    milestone = await applyCreated<ProjectMilestoneInsert>(milestone);

    const { data, error } = await insertWithBusiness("project_milestones", milestone, business.id);

    if (error) {
        console.error("Error creating project milestone:", error);
        return null;
    }

    return data as unknown as ProjectMilestone;
}

export const updateProjectMilestone = async (id: string, milestone: ProjectMilestoneUpdate): Promise<ProjectMilestone | null> => {
    const { business } = await withBusinessServer();

    milestone = await applyUpdated<ProjectMilestoneUpdate>(milestone);

    const { data, error } = await updateWithBusinessCheck("project_milestones", id, milestone, business.id);

    if (error) {
        console.error("Error updating project milestone:", error);
        return null;
    }

    return data as unknown as ProjectMilestone;
}

export const deleteProjectMilestone = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("project_milestones", id, business.id);

    if (error) {
        console.error("Error deleting project milestone:", error);
        return false;
    }

    return true;
}

export const searchProjectMilestones = async (query: string): Promise<ProjectMilestone[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("project_milestones", business.id, "*", {
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
