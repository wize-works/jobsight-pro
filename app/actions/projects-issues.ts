"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectIssue, ProjectIssueInsert, ProjectIssueUpdate } from "@/types/projects-issues";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getProjectIssues = async (): Promise<ProjectIssue[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch project issues.");
        return [];
    }

    const { data, error } = await fetchByBusiness("project_issues", businessId);

    if (error) {
        console.error("Error fetching project issues:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ProjectIssue[];
    }

    return data as unknown as ProjectIssue[];
}

export const getProjectIssueById = async (id: string): Promise<ProjectIssue | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch project issues.");
        return null;
    }

    const { data, error } = await fetchByBusiness("project_issues", businessId, id);

    if (error) {
        console.error("Error fetching project issue by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as ProjectIssue;
    }

    return null;
};

export const createProjectIssue = async (issue: ProjectIssueInsert): Promise<ProjectIssue | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a project issue.");
        return null;
    }

    const { data, error } = await insertWithBusiness("project_issues", issue, businessId);

    if (error) {
        console.error("Error creating project issue:", error);
        return null;
    }

    return data as unknown as ProjectIssue;
}

export const updateProjectIssue = async (id: string, issue: ProjectIssueUpdate): Promise<ProjectIssue | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a project issue.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("project_issues", id, issue, businessId);

    if (error) {
        console.error("Error updating project issue:", error);
        return null;
    }

    return data as unknown as ProjectIssue;
}

export const deleteProjectIssue = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a project issue.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("project_issues", id, businessId);

    if (error) {
        console.error("Error deleting project issue:", error);
        return false;
    }

    return true;
}

export const searchProjectIssues = async (query: string): Promise<ProjectIssue[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search project issues.");
        return [];
    }

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
