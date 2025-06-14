"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectIssue, ProjectIssueInsert, ProjectIssueUpdate, ProjectIssueWithDetails } from "@/types/projects-issues";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { Project } from "@/types/projects";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

export const getProjectIssues = async (): Promise<ProjectIssue[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("project_issues", business.id);

    if (error) {
        console.error("Error fetching project issues:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getProjectIssueById = async (id: string): Promise<ProjectIssue> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("project_issues", business.id, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching project issue by ID:", error);
        throw new Error("Failed to fetch project issue by ID");
    }

    if (data && data[0]) {
        return data[0];
    }

    throw new Error("Project issue not found");
};

export const createProjectIssue = async (issue: ProjectIssueInsert): Promise<ProjectIssue> => {
    const { business } = await ensureBusinessOrRedirect();

    issue = await applyCreated<ProjectIssueInsert>(issue);

    const { data, error } = await insertWithBusiness("project_issues", issue, business.id);

    if (error) {
        console.error("Error creating project issue:", error);
        throw new Error("Failed to create project issue");
    }

    return data;
}

export const updateProjectIssue = async (id: string, issue: ProjectIssueUpdate): Promise<ProjectIssue> => {
    const { business } = await ensureBusinessOrRedirect();

    issue = await applyUpdated<ProjectIssueUpdate>(issue);

    const { data, error } = await updateWithBusinessCheck("project_issues", id, issue, business.id);

    if (error) {
        console.error("Error updating project issue:", error);
        throw new Error("Failed to update project issue");
    }

    return data;
}

export const deleteProjectIssue = async (id: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const { error } = await deleteWithBusinessCheck("project_issues", id, business.id);

    if (error) {
        console.error("Error deleting project issue:", error);
        return false;
    }

    return true;
}

export const searchProjectIssues = async (query: string): Promise<ProjectIssue[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("project_issues", business.id, "*", {
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

export const getProjectIssuesWithDetailsByProjectId = async (id: string): Promise<ProjectIssueWithDetails[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("project_issues", business.id, "*", {
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

    const { data: members, error: userError } = await fetchByBusiness("crew_members", business.id, "*", {
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
