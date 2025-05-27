"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentAssignment, EquipmentAssignmentInsert, EquipmentAssignmentUpdate } from "@/types/equipment-assignments";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { ProjectCrew } from "@/types/project-crews";

export const getEquipmentAssignments = async (): Promise<EquipmentAssignment[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment assignments.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment_assignments", businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment assignments.");
        return null;
    }

    const { data, error } = await fetchByBusiness("equipment_assignments", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create an equipment assignment.");
        return null;
    }

    const { data, error } = await insertWithBusiness("equipment_assignments", assignment, businessId);

    if (error) {
        console.error("Error creating equipment assignment:", error);
        return null;
    }

    return data as unknown as EquipmentAssignment;
}

export const updateEquipmentAssignment = async (id: string, assignment: EquipmentAssignmentUpdate): Promise<EquipmentAssignment | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update an equipment assignment.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("equipment_assignments", id, assignment, businessId);

    if (error) {
        console.error("Error updating equipment assignment:", error);
        return null;
    }

    return data as unknown as EquipmentAssignment;
}

export const deleteEquipmentAssignment = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete an equipment assignment.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("equipment_assignments", id, businessId);

    if (error) {
        console.error("Error deleting equipment assignment:", error);
        return false;
    }

    return true;
}

export const searchEquipmentAssignments = async (query: string): Promise<EquipmentAssignment[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search equipment assignments.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment_assignments", businessId, "*", {
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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment assignments.");
        return [] as EquipmentAssignment[];
    }

    const { data: assignData, error: assignError } = await fetchByBusiness("equipment_assignments", businessId, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "id", ascending: true },
    });

    if (assignError) {
        console.error("Error fetching equipment assignment by ID:", assignError);
        return [] as EquipmentAssignment[];
    }

    const crewIds = (assignData as unknown as EquipmentAssignment[])?.map((assignment) => assignment.crew_id) || [];

    const { data: crewData } = await fetchByBusiness("crews", businessId, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "name", ascending: true },
    });

    const { data: projectData } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: { in: crewIds } },
        orderBy: { column: "start_date", ascending: true },
    });

    const projectIds = (projectData as unknown as ProjectCrew[])?.map((project) => project.project_id) || [];

    const { data: projectDetails } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
        orderBy: { column: "start_date", ascending: true },
    });
    console.log("crew Ids:", crewIds);
    console.log("crews Data:", crewData);
    const data = (assignData as unknown as EquipmentAssignment[]).map((assignment) => {
        const crew = (crewData as unknown as Crew[])?.find((crew) => crew.id === assignment.crew_id);
        const projectCrew = (projectData as unknown as ProjectCrew[])?.find((pc) => pc.crew_id === assignment.crew_id);
        const project = (projectDetails as unknown as Project[])?.find((proj) => proj.id === projectCrew?.project_id);
        console.log("Crew Data:", crew);
        return {
            ...assignment,
            crew_name: crew ? crew.name : "Unknown Crew",
            project_name: project ? project.name : "Unknown Project",
        };
    });

    console.log("Equipment Assignments Data:", data);

    if (data && data.length > 0) {
        return data as unknown as EquipmentAssignment[];
    }

    return [] as EquipmentAssignment[];
};