"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Equipment, EquipmentInsert, EquipmentUpdate } from "@/types/equipment";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getEquipments = async (): Promise<Equipment[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipments.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment", businessId);

    if (error) {
        console.error("Error fetching equipments:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Equipment[];
    }

    return data as unknown as Equipment[];
}

export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipments.");
        return null;
    }

    const { data, error } = await fetchByBusiness("equipment", businessId, "*", {
        filter: { id: id },
    });

    if (error) {
        console.error("Error fetching equipment by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Equipment;
    }

    return null;
};

export const createEquipment = async (equipment: EquipmentInsert): Promise<Equipment | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create an equipment.");
        return null;
    }

    const { data, error } = await insertWithBusiness("equipment", equipment, businessId);

    if (error) {
        console.error("Error creating equipment:", error);
        return null;
    }

    return data as unknown as Equipment;
}

export const updateEquipment = async (id: string, equipment: EquipmentUpdate): Promise<Equipment | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update an equipment.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("equipment", id, equipment, businessId);

    if (error) {
        console.error("Error updating equipment:", error);
        return null;
    }

    return data as unknown as Equipment;
}

export const deleteEquipment = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete an equipment.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("equipment", id, businessId);

    if (error) {
        console.error("Error deleting equipment:", error);
        return false;
    }

    return true;
}

export const searchEquipments = async (query: string): Promise<Equipment[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search equipments.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment", businessId, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error searching equipments:", error);
        return [];
    }

    return data as unknown as Equipment[];
};

