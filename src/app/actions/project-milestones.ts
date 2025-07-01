"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneUpdate } from "@/types/project_milestones";
import { getUserBusiness } from "@/app/actions/business";
import { auth } from "@clerk/nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for project milestone events
async function triggerMilestoneNotification(
    businessId: string,
    milestoneId: string,
    milestoneName: string,
    projectName: string,
    eventType: string,
    dueDate?: string,
    status?: string,
    triggeredBy?: string
) {
    try {
        // Get all users in the business
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business to notify");
            return;
        }

        let title = "";
        let message = "";

        switch (eventType) {
            case "created":
                title = "Project Milestone Created";
                message = `New milestone "${milestoneName}" has been created for project "${projectName}"${dueDate ? ` (due ${dueDate})` : ''}.`;
                break;
            case "updated":
                title = "Project Milestone Updated";
                message = `Milestone "${milestoneName}" in project "${projectName}" has been updated${status ? ` (Status: ${status})` : ''}.`;
                break;
            case "completed":
                title = "Project Milestone Completed";
                message = `Milestone "${milestoneName}" in project "${projectName}" has been completed!`;
                break;
            case "overdue":
                title = "Project Milestone Overdue";
                message = `Milestone "${milestoneName}" in project "${projectName}" is now overdue.`;
                break;
            case "deleted":
                title = "Project Milestone Deleted";
                message = `Milestone "${milestoneName}" has been removed from project "${projectName}".`;
                break;
            default:
                title = "Project Milestone Modified";
                message = `Milestone "${milestoneName}" in project "${projectName}" has been modified.`;
        }

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates",
                title,
                message,
                link: `/dashboard/projects/${milestoneId}?tab=milestones`,
                read: false,
                read_at: null,
                metadata: {
                    milestoneId,
                    milestoneName,
                    projectName,
                    eventType,
                    dueDate,
                    status,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating milestone notification:", error);
    }
}

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
    try {
        milestone = await applyCreated<ProjectMilestoneInsert>(milestone);

        const { data, error } = await insertWithBusiness("project_milestones", milestone, businessId);

        if (error) {
            console.error("Error creating project milestone:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who created the milestone
            const { userId } = await auth();

            // Get project name for notification
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: data.project_id },
            });
            const projectName = projectData?.[0]?.name || "Unknown Project";

            // Trigger notification
            await triggerMilestoneNotification(
                businessId,
                data.id,
                data.name || "Unnamed Milestone",
                projectName,
                "created",
                data.due_date || undefined,
                data.status || undefined,
                userId || undefined
            );
        }

        return data as unknown as ProjectMilestone;
    } catch (err) {
        console.error("Error in createProjectMilestone:", err);
        return null;
    }
}

export const updateProjectMilestone = async (businessId: string, id: string, milestone: ProjectMilestoneUpdate): Promise<ProjectMilestone | null> => {
    try {
        milestone = await applyUpdated<ProjectMilestoneUpdate>(milestone);

        const { data, error } = await updateWithBusinessCheck("project_milestones", id, milestone, businessId);

        if (error) {
            console.error("Error updating project milestone:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who updated the milestone
            const { userId } = await auth();

            // Get project name for notification
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: data.project_id },
            });
            const projectName = projectData?.[0]?.name || "Unknown Project";

            // Determine event type based on status change
            const eventType = data.status === "completed" ? "completed" : "updated";

            // Trigger notification
            await triggerMilestoneNotification(
                businessId,
                data.id,
                data.name || "Unnamed Milestone",
                projectName,
                eventType,
                data.due_date || undefined,
                data.status || undefined,
                userId || undefined
            );
        }

        return data as unknown as ProjectMilestone;
    } catch (err) {
        console.error("Error in updateProjectMilestone:", err);
        return null;
    }
}

export const deleteProjectMilestone = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the milestone data before deletion for notification
        const { data: milestoneData } = await fetchByBusiness("project_milestones", businessId, "*", {
            filter: { id },
        });
        const milestone = milestoneData?.[0] as ProjectMilestone | undefined;

        const { error } = await deleteWithBusinessCheck("project_milestones", id, businessId);

        if (error) {
            console.error("Error deleting project milestone:", error);
            return false;
        }

        if (milestone) {
            // Get the current user session to identify who deleted the milestone
            const { userId } = await auth();

            // Get project name for notification
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: milestone.project_id },
            });
            const projectName = projectData?.[0]?.name || "Unknown Project";

            // Trigger notification
            await triggerMilestoneNotification(
                businessId,
                milestone.id,
                milestone.name || "Unnamed Milestone",
                projectName,
                "deleted",
                milestone.due_date || undefined,
                milestone.status || undefined,
                userId || undefined
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteProjectMilestone:", err);
        return false;
    }
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

