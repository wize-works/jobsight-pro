"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentUsage, EquipmentUsageInsert, EquipmentUsageUpdate } from "@/types/equipment_usage";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getEquipmentUsages = async (): Promise<EquipmentUsage[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment usages.");
        return [];
    }

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

export const getEquipmentUsageById = async (id: string): Promise<EquipmentUsage | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment usages.");
        return null;
    }

    const { data, error } = await fetchByBusiness("equipment_usage", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create an equipment usage.");
        return null;
    }

    const { data, error } = await insertWithBusiness("equipment_usage", usage, businessId);

    if (error) {
        console.error("Error creating equipment usage:", error);
        return null;
    }

    return data as unknown as EquipmentUsage;
}

export const updateEquipmentUsage = async (id: string, usage: EquipmentUsageUpdate): Promise<EquipmentUsage | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update an equipment usage.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("equipment_usage", id, usage, businessId);

    if (error) {
        console.error("Error updating equipment usage:", error);
        return null;
    }

    return data as unknown as EquipmentUsage;
}

export const deleteEquipmentUsage = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete an equipment usage.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("equipment_usage", id, businessId);

    if (error) {
        console.error("Error deleting equipment usage:", error);
        return false;
    }

    return true;
}

export const searchEquipmentUsages = async (query: string): Promise<EquipmentUsage[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search equipment usages.");
        return [];
    }

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

export const getEquipmentUsagesByEquipmentId = async (id: string): Promise<EquipmentUsage[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment usages.");
        return [];
    }

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
