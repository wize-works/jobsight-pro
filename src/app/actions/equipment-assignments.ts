"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentAssignment, EquipmentAssignmentInsert, EquipmentAssignmentUpdate } from "@/types/equipment-assignments";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { ProjectCrew } from "@/types/project-crews";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getEquipmentAssignments = async (): Promise<EquipmentAssignment[]> => {
    const { business } = await withBusinessServer();

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment_assignments", business.id, id);

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
    const { business } = await withBusinessServer();

    assignment = await applyCreated<EquipmentAssignmentInsert>(assignment);

    const { data, error } = await insertWithBusiness("equipment_assignments", assignment, business.id);

    if (error) {
        console.error("Error creating equipment assignment:", error);
        return null;
    }

    return data as unknown as EquipmentAssignment;
}

export const updateEquipmentAssignment = async (id: string, assignment: EquipmentAssignmentUpdate): Promise<EquipmentAssignment | null> => {
    const { business } = await withBusinessServer();

    assignment = await applyUpdated<EquipmentAssignmentUpdate>(assignment);

    const { data, error } = await updateWithBusinessCheck("equipment_assignments", id, assignment, business.id);

    if (error) {
        console.error("Error updating equipment assignment:", error);
        return null;
    }

    return data as unknown as EquipmentAssignment;
}

export const deleteEquipmentAssignment = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("equipment_assignments", id, business.id);

    if (error) {
        console.error("Error deleting equipment assignment:", error);
        return false;
    }

    return true;
}

export const searchEquipmentAssignments = async (query: string): Promise<EquipmentAssignment[]> => {
    const { business } = await withBusinessServer();

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
    const { business } = await withBusinessServer();

    const { data: assignData, error: assignError } = await fetchByBusiness("equipment_assignments", business.id, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "id", ascending: true },
    });

    if (assignError) {
        console.error("Error fetching equipment assignment by ID:", assignError);
        return [] as EquipmentAssignment[];
    }

    const crewIds = (assignData as unknown as EquipmentAssignment[])?.map((assignment) => assignment.crew_id) || [];

    const { data: crewData } = await fetchByBusiness("crews", business.id, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "name", ascending: true },
    });

    const { data: projectData } = await fetchByBusiness("project_crews", business.id, "*", {
        filter: { crew_id: { in: crewIds } },
        orderBy: { column: "start_date", ascending: true },
    });

    const projectIds = (projectData as unknown as ProjectCrew[])?.map((project) => project.project_id) || [];

    const { data: projectDetails } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
        orderBy: { column: "start_date", ascending: true },
    });

    const data = (assignData as unknown as EquipmentAssignment[]).map((assignment) => {
        const crew = (crewData as unknown as Crew[])?.find((crew) => crew.id === assignment.crew_id);
        const projectCrew = (projectData as unknown as ProjectCrew[])?.find((pc) => pc.crew_id === assignment.crew_id);
        const project = (projectDetails as unknown as Project[])?.find((proj) => proj.id === projectCrew?.project_id);

        return {
            ...assignment,
            crew_name: crew ? crew.name : "Unknown Crew",
            project_name: project ? project.name : "Unknown Project",
        };
    });

    if (data && data.length > 0) {
        return data as unknown as EquipmentAssignment[];
    }

    return [] as EquipmentAssignment[];
};