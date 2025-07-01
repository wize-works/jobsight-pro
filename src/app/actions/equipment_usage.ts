"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentUsage, EquipmentUsageInsert, EquipmentUsageUpdate, EquipmentUsageWithDetails } from "@/types/equipment_usage";
import { getUserBusiness } from "@/app/actions/business";
import { auth } from "@clerk/nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getEquipmentUsages = async (businessId: string): Promise<EquipmentUsage[]> => {


    const { data, error } = await fetchByBusiness("equipment_usage", businessId);

    if (error) {
        console.error("Error fetching equipment usages:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentUsage[];
    }

    return data as unknown as EquipmentUsage[];
}

export const getEquipmentUsageById = async (businessId: string, id: string): Promise<EquipmentUsage | null> => {


    const { data, error } = await fetchByBusiness("equipment_usage", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching equipment usage by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentUsage;
    }

    return null;
};

export const createEquipmentUsage = async (businessId: string, usage: EquipmentUsageInsert): Promise<EquipmentUsage | null> => {


    usage = await applyCreated<EquipmentUsageInsert>(usage);

    const { data, error } = await insertWithBusiness("equipment_usage", usage, businessId);

    if (error) {
        console.error("Error creating equipment usage:", error);
        return null;
    }

    return data as unknown as EquipmentUsage;
}

export const updateEquipmentUsage = async (businessId: string, id: string, usage: EquipmentUsageUpdate): Promise<EquipmentUsage | null> => {


    usage = await applyUpdated<EquipmentUsageUpdate>(usage);

    const { data, error } = await updateWithBusinessCheck("equipment_usage", id, usage, businessId);

    if (error) {
        console.error("Error updating equipment usage:", error);
        return null;
    }

    return data as unknown as EquipmentUsage;
}

export const deleteEquipmentUsage = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("equipment_usage", id, businessId);

    if (error) {
        console.error("Error deleting equipment usage:", error);
        return false;
    }

    return true;
}

export const searchEquipmentUsages = async (businessId: string, query: string): Promise<EquipmentUsage[]> => {


    const { data, error } = await fetchByBusiness("equipment_usage", businessId, "*", {
        filter: {
            or: [
                { notes: { ilike: `%${query}%` } },
                { usage_type: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching equipment usages:", error);
        return [];
    }

    return data as unknown as EquipmentUsage[];
};

export const getEquipmentUsagesByEquipmentId = async (businessId: string, id: string): Promise<EquipmentUsage[]> => {

    const { data, error } = await fetchByBusiness("equipment_usage", businessId, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "id", ascending: true }
    });


    if (error) {
        console.error("Error fetching equipment usage by ID:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentUsage[];
    }
    return data as unknown as EquipmentUsage[];
};

export const getEquipmentUsagesWithDetailsByEquipmentId = async (businessId: string, id: string): Promise<EquipmentUsageWithDetails[]> => {
    const usages = await getEquipmentUsagesByEquipmentId(businessId, id);

    if (!usages || usages.length === 0) {
        return [];
    }

    const projectIds = usages.map(usage => usage.project_id).filter(Boolean);
    const crewIds = usages.map(usage => usage.crew_id).filter(Boolean);

    let projectData: any[] = [];
    if (projectIds.length > 0) {
        const { data: projects, error: projectError } = await fetchByBusiness("projects", businessId, "*", {
            filter: { id: { in: projectIds } },
        });
        projectData = projects || [];
    }

    let crewData: any[] = [];
    if (crewIds.length > 0) {
        const { data: crews, error: crewError } = await fetchByBusiness("crews", businessId, "*", {
            filter: { id: { in: crewIds } },
        });
        crewData = crews || [];
    } let crews: any[] = [];
    if (Array.isArray(crewData)) {
        crews = crewData;
    }

    let projects: any[] = [];
    if (Array.isArray(projectData)) {
        projects = projectData;
    }

    const useagesWithProjectNames = usages.map(usage => {
        const project = projects.find((p: any) => p.id === usage.project_id);
        const crew = crews.find((c: any) => c.id === usage.crew_id);
        return {
            ...usage,
            project_name: project ? project.name : "No Project Assigned",
            crew_name: crew ? crew.name : "No Crew Assigned",
        };
    });

    return useagesWithProjectNames as unknown as EquipmentUsageWithDetails[];
};
