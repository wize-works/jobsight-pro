"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentAssignment, EquipmentAssignmentInsert, EquipmentAssignmentUpdate } from "@/types/equipment-assignments";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { ProjectCrew } from "@/types/project-crews";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

export const getEquipmentAssignments = async (): Promise<EquipmentAssignment[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("equipment_assignments", business.id);

    if (error) {
        console.error("Error fetching equipment assignments:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentAssignment[];
    }

    return data as unknown as EquipmentAssignment[];
}

export const getEquipmentAssignmentById = async (id: string): Promise<EquipmentAssignment | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("equipment_assignments", business.id, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching equipment assignment by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentAssignment;
    }

    return null;
};

export const createEquipmentAssignment = async (assignment: EquipmentAssignmentInsert): Promise<EquipmentAssignment | null> => {
    const { business } = await ensureBusinessOrRedirect();

    assignment = await applyCreated<EquipmentAssignmentInsert>(assignment);

    const { data, error } = await insertWithBusiness("equipment_assignments", assignment, business.id);

    if (error) {
        console.error("Error creating equipment assignment:", error);
        return null;
    }

    return data as unknown as EquipmentAssignment;
}

export const updateEquipmentAssignment = async (id: string, assignment: EquipmentAssignmentUpdate): Promise<EquipmentAssignment | null> => {
    const { business } = await ensureBusinessOrRedirect();

    assignment = await applyUpdated<EquipmentAssignmentUpdate>(assignment);

    const { data, error } = await updateWithBusinessCheck("equipment_assignments", id, assignment, business.id);

    if (error) {
        console.error("Error updating equipment assignment:", error);
        return null;
    }

    return data as unknown as EquipmentAssignment;
}

export const deleteEquipmentAssignment = async (id: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const { error } = await deleteWithBusinessCheck("equipment_assignments", id, business.id);

    if (error) {
        console.error("Error deleting equipment assignment:", error);
        return false;
    }

    return true;
}

export const searchEquipmentAssignments = async (query: string): Promise<EquipmentAssignment[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("equipment_assignments", business.id, "*", {
        filter: {
            or: [
                { equipment_id: { ilike: `%${query}%` } },
                { assigned_to: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching equipment assignments:", error);
        return [];
    }

    return data as unknown as EquipmentAssignment[];
};

export const getEquipmentAssignmentsByEquipmentId = async (id: string): Promise<EquipmentAssignment[] | []> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data: assignData, error: assignError } = await fetchByBusiness("equipment_assignments", business.id, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "start_date", ascending: true },
    });

    if (assignError) {
        console.error("Error fetching equipment assignment by ID:", assignError);
        return [];
    }

    if (!assignData || assignData.length === 0) {
        return [];
    }

    const crewIds = assignData?.map((assignment) => assignment.crew_id).filter(Boolean) || [];

    let crewData: any[] = [];
    if (crewIds.length > 0) {
        const { data: crews } = await fetchByBusiness("crews", business.id, "*", {
            filter: { id: { in: crewIds } },
            orderBy: { column: "name", ascending: true },
        });
        crewData = crews || [];
    }

    let projectData: any[] = [];
    if (crewIds.length > 0) {
        const { data: projects } = await fetchByBusiness("project_crews", business.id, "*", {
            filter: { crew_id: { in: crewIds } },
            orderBy: { column: "start_date", ascending: true },
        });
        projectData = projects || [];
    }

    const projectIds = (projectData as unknown as ProjectCrew[])?.map((project) => project.project_id).filter(Boolean) || [];

    let projectDetails: any[] = [];
    if (projectIds.length > 0) {
        const { data: projects } = await fetchByBusiness("projects", business.id, "*", {
            filter: { id: { in: projectIds } },
            orderBy: { column: "start_date", ascending: true },
        });
        projectDetails = projects || [];
    } const data = assignData.map((assignment) => {
        const crew = crewData?.find((crew) => crew.id === assignment.crew_id);
        const projectCrew = projectData?.find((pc) => pc.crew_id === assignment.crew_id);
        const project = projectDetails?.find((proj) => proj.id === assignment.project_id);

        return {
            ...assignment,
            crew_name: crew ? crew.name : "Unknown Crew",
            project_name: project ? project.name : "Unknown Project",
        };
    });

    return data as unknown as EquipmentAssignment[];
};