"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectIssue, ProjectIssueInsert, ProjectIssueUpdate, ProjectIssueWithDetails } from "@/types/projects-issues";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { Project } from "@/types/projects";


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

    return data;
}

export const updateProjectIssue = async (businessId: string, id: string, issue: ProjectIssueUpdate): Promise<ProjectIssue> => {


    issue = await applyUpdated<ProjectIssueUpdate>(issue);

    const { data, error } = await updateWithBusinessCheck("project_issues", id, issue, businessId);

    if (error) {
        console.error("Error updating project issue:", error);
        throw new Error("Failed to update project issue");
    }

    return data;
}

export const deleteProjectIssue = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("project_issues", id, businessId);

    if (error) {
        console.error("Error deleting project issue:", error);
        return false;
    }

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
