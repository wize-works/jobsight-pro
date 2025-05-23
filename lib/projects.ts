import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "./db";
import { createServerClient } from "../lib/supabase";
import { ProjectInsert, ProjectUpdate } from "@/types/projects";

// Fetch all projects for a business
export async function getProjects(businessId: string) {
    return await fetchByBusiness("projects", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
}

// Fetch a single project by ID
export async function getProjectById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id },
    });

    return {
        data: data?.[0] || null,
        error,
    };
}

// Create a new project
export async function createProject(project: Omit<ProjectInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("projects", project, businessId);
}

// Update an existing project
export async function updateProject(id: string, project: ProjectUpdate, businessId: string) {
    return await updateWithBusinessCheck("projects", id, project, businessId);
}

// Delete a project
export async function deleteProject(id: string, businessId: string) {
    return await deleteWithBusinessCheck("projects", id, businessId);
}

// Get projects by client
export async function getProjectsByClient(clientId: string, businessId: string) {
    return await fetchByBusiness("projects", businessId, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "name", ascending: true },
    });
}

// Get projects by status
export async function getProjectsByStatus(status: string, businessId: string) {
    return await fetchByBusiness("projects", businessId, "*", {
        filter: { status },
        orderBy: { column: "name", ascending: true },
    });
}

// Search projects by name or location
export async function searchProjects(query: string, businessId: string) {
    const supabase = createServerClient();
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") };
    }

    return await supabase
        .from("projects")
        .select("*")
        .eq("business_id", businessId)
        .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
        .order("name");
}

// Get project statistics
export async function getProjectStatistics(businessId: string) {
    const supabase = createServerClient();
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") };
    }

    // Get total projects
    const { data: totalData, error: totalError } = await supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("business_id", businessId);

    if (totalError) {
        return { data: null, error: totalError };
    }

    // Get active projects
    const { data: activeData, error: activeError } = await supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("business_id", businessId)
        .eq("status", "active");

    if (activeError) {
        return { data: null, error: activeError };
    }

    // Get completed projects
    const { data: completedData, error: completedError } = await supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("business_id", businessId)
        .eq("status", "completed");

    if (completedError) {
        return { data: null, error: completedError };
    }

    // Get on hold projects
    const { data: onHoldData, error: onHoldError } = await supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("business_id", businessId)
        .eq("status", "on_hold");

    if (onHoldError) {
        return { data: null, error: onHoldError };
    }

    return {
        data: {
            total: totalData.count || 0,
            active: activeData.count || 0,
            completed: completedData.count || 0,
            on_hold: onHoldData.count || 0,
        },
        error: null,
    };
}
