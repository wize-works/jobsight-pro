"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentUsage, EquipmentUsageInsert, EquipmentUsageUpdate, EquipmentUsageWithDetails } from "@/types/equipment_usage";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

export const getEquipmentUsages = async (): Promise<EquipmentUsage[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("equipment_usage", business.id);

    if (error) {
        console.error("Error fetching equipment usages:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentUsage[];
    }

    return data as unknown as EquipmentUsage[];
}

export const getEquipmentUsageById = async (id: string): Promise<EquipmentUsage | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("equipment_usage", business.id, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching equipment usage by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentUsage;
    }

    return null;
};

export const createEquipmentUsage = async (usage: EquipmentUsageInsert): Promise<EquipmentUsage | null> => {
    const { business } = await ensureBusinessOrRedirect();

    usage = await applyCreated<EquipmentUsageInsert>(usage);

    const { data, error } = await insertWithBusiness("equipment_usage", usage, business.id);

    if (error) {
        console.error("Error creating equipment usage:", error);
        return null;
    }

    return data as unknown as EquipmentUsage;
}

export const updateEquipmentUsage = async (id: string, usage: EquipmentUsageUpdate): Promise<EquipmentUsage | null> => {
    const { business } = await ensureBusinessOrRedirect();

    usage = await applyUpdated<EquipmentUsageUpdate>(usage);

    const { data, error } = await updateWithBusinessCheck("equipment_usage", id, usage, business.id);

    if (error) {
        console.error("Error updating equipment usage:", error);
        return null;
    }

    return data as unknown as EquipmentUsage;
}

export const deleteEquipmentUsage = async (id: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const { error } = await deleteWithBusinessCheck("equipment_usage", id, business.id);

    if (error) {
        console.error("Error deleting equipment usage:", error);
        return false;
    }

    return true;
}

export const searchEquipmentUsages = async (query: string): Promise<EquipmentUsage[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("equipment_usage", business.id, "*", {
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

export const getEquipmentUsagesByEquipmentId = async (id: string): Promise<EquipmentUsage[]> => {
    const businessAuth = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("equipment_usage", businessAuth.business.id, "*", {
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

export const getEquipmentUsagesWithDetailsByEquipmentId = async (id: string): Promise<EquipmentUsageWithDetails[]> => {
    const businessAuth = await ensureBusinessOrRedirect();
    const usages = await getEquipmentUsagesByEquipmentId(id);

    if (!usages || usages.length === 0) {
        return [];
    }

    const projectIds = usages.map(usage => usage.project_id).filter(Boolean);
    const crewIds = usages.map(usage => usage.crew_id).filter(Boolean);

    let projectData: any[] = [];
    if (projectIds.length > 0) {
        const { data: projects, error: projectError } = await fetchByBusiness("projects", businessAuth.business.id, "*", {
            filter: { id: { in: projectIds } },
        });
        projectData = projects || [];
    }

    let crewData: any[] = [];
    if (crewIds.length > 0) {
        const { data: crews, error: crewError } = await fetchByBusiness("crews", businessAuth.business.id, "*", {
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
