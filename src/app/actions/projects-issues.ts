"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectIssue, ProjectIssueInsert, ProjectIssueUpdate, ProjectIssueWithDetails } from "@/types/projects-issues";
import { getUserBusiness } from "@/app/actions/business";
import { auth } from "@clerk/nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { Project } from "@/types/projects";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for project issue events
async function triggerProjectIssueNotification(
    businessId: string,
    issueId: string,
    issueTitle: string,
    projectName: string,
    eventType: string,
    priority?: string,
    status?: string,
    assignedTo?: string,
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
            case "reported":
                title = "New Project Issue Reported";
                message = `Issue "${issueTitle}" has been reported for project "${projectName}"${priority ? ` (Priority: ${priority})` : ''}.`;
                break;
            case "updated":
                title = "Project Issue Updated";
                message = `Issue "${issueTitle}" in project "${projectName}" has been updated${status ? ` (Status: ${status})` : ''}.`;
                break;
            case "assigned":
                title = "Project Issue Assigned";
                message = `Issue "${issueTitle}" in project "${projectName}" has been assigned${assignedTo ? ` to ${assignedTo}` : ''}.`;
                break;
            case "resolved":
                title = "Project Issue Resolved";
                message = `Issue "${issueTitle}" in project "${projectName}" has been resolved!`;
                break;
            case "closed":
                title = "Project Issue Closed";
                message = `Issue "${issueTitle}" in project "${projectName}" has been closed.`;
                break;
            case "deleted":
                title = "Project Issue Deleted";
                message = `Issue "${issueTitle}" has been removed from project "${projectName}".`;
                break;
            default:
                title = "Project Issue Modified";
                message = `Issue "${issueTitle}" in project "${projectName}" has been modified.`;
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
                link: `/dashboard/projects/${issueId}?tab=issues`,
                read: false,
                read_at: null,
                metadata: {
                    issueId,
                    issueTitle,
                    projectName,
                    eventType,
                    priority,
                    status,
                    assignedTo,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating project issue notification:", error);
    }
}

export const getProjectIssues = async (businessId: string): Promise<ProjectIssue[]> => {


    const { data, error } = await fetchByBusiness("project_issues", businessId);

    if (error) {
        console.error("Error fetching project issues:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getProjectIssueById = async (businessId: string, id: string): Promise<ProjectIssue> => {


    const { data, error } = await fetchByBusiness("project_issues", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching project issue by ID:", error);
        throw new Error("Failed to fetch project issue by ID");
    }

    if (data && data[0]) {
        return data[0];
    }

    throw new Error("Project issue not found");
};

export const createProjectIssue = async (businessId: string, issue: ProjectIssueInsert): Promise<ProjectIssue> => {


    issue = await applyCreated<ProjectIssueInsert>(issue);

    const { data, error } = await insertWithBusiness("project_issues", issue, businessId);

    if (error) {
        console.error("Error creating project issue:", error);
        throw new Error("Failed to create project issue");
    }

    // Notify about the new project issue
    await triggerProjectIssueNotification(businessId, data.id, data.title, data.project_id, "reported", data.priority, data.status, data.assigned_to, data.created_by);

    return data;
}

export const updateProjectIssue = async (businessId: string, id: string, issue: ProjectIssueUpdate): Promise<ProjectIssue> => {


    issue = await applyUpdated<ProjectIssueUpdate>(issue);

    const { data, error } = await updateWithBusinessCheck("project_issues", id, issue, businessId);

    if (error) {
        console.error("Error updating project issue:", error);
        throw new Error("Failed to update project issue");
    }

    // Notify about the project issue update
    await triggerProjectIssueNotification(businessId, id, data.title, data.project_id, "updated", data.priority, data.status, data.assigned_to, data.updated_by);

    return data;
}

export const deleteProjectIssue = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("project_issues", id, businessId);

    if (error) {
        console.error("Error deleting project issue:", error);
        return false;
    }

    // Notify about the project issue deletion
    await triggerProjectIssueNotification(businessId, id, "", "", "deleted", "", "", "", "");

    return true;
}

export const searchProjectIssues = async (businessId: string, query: string): Promise<ProjectIssue[]> => {


    const { data, error } = await fetchByBusiness("project_issues", businessId, "*", {
        filter: {
            or: [
                { title: { ilike: `%${query}%` } },
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching project issues:", error);
        return [];
    }

    return data as unknown as ProjectIssue[];
};

export const getProjectIssuesWithDetailsByProjectId = async (businessId: string, id: string): Promise<ProjectIssueWithDetails[]> => {


    const { data, error } = await fetchByBusiness("project_issues", businessId, "*", {
        filter: { project_id: id },
        orderBy: { column: "reported_date", ascending: false },
    });

    if (error) {
        console.error("Error fetching project issues:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    const assignedToIds = data.map(issue => issue.assigned_to).filter(Boolean);
    const projectIds = data.map(issue => issue.project_id).filter(Boolean);

    const { data: members, error: userError } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: assignedToIds },
    });

    if (userError) {
        console.error("Error fetching users:", userError);
        return data as ProjectIssueWithDetails[];
    }

    const issuesWithDetails = data.map(issue => {
        const assignedToUser = (members ?? []).find(member => member.id === issue.assigned_to);
        const projectName = projectIds.includes(issue.project_id) ? `Project ${issue.project_id}` : "Unknown Project";
        return {
            ...issue,
            assigned_to_name: assignedToUser ? `${assignedToUser.name}` : "Unassigned",
            project_name: projectName,
        };
    });

    return issuesWithDetails;
}
