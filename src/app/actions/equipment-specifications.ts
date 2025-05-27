"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentSpecification, EquipmentSpecificationInsert, EquipmentSpecificationUpdate } from "@/types/equipment-specifications";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getEquipmentSpecifications = async (): Promise<EquipmentSpecification[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment specifications.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment_specifications", businessId);

    if (error) {
        console.error("Error fetching equipment specifications:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentSpecification[];
    }

    return data as unknown as EquipmentSpecification[];
}

export const getEquipmentSpecificationById = async (id: string): Promise<EquipmentSpecification | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment specifications.");
        return null;
    }

    const { data, error } = await fetchByBusiness("equipment_specifications", businessId, id);

    if (error) {
        console.error("Error fetching equipment specification by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentSpecification;
    }

    return null;
};

export const createEquipmentSpecification = async (spec: EquipmentSpecificationInsert): Promise<EquipmentSpecification | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create an equipment specification.");
        return null;
    }

    spec.created_at = new Date().toISOString();
    spec.created_by = user?.id || "";
    spec.updated_at = new Date().toISOString();
    spec.updated_by = user?.id || "";

    const { data, error } = await insertWithBusiness("equipment_specifications", spec, businessId);

    if (error) {
        console.error("Error creating equipment specification:", error);
        return null;
    }

    return data as unknown as EquipmentSpecification;
}

export const updateEquipmentSpecification = async (id: string, spec: EquipmentSpecificationUpdate): Promise<EquipmentSpecification | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update an equipment specification.");
        return null;
    }

    spec.updated_at = new Date().toISOString();
    spec.updated_by = user?.id || "";
    console.log("updated spec", spec);
    const { data, error } = await updateWithBusinessCheck("equipment_specifications", id, spec, businessId);

    if (error) {
        console.error("Error updating equipment specification:", error);
        return null;
    }

    return data as unknown as EquipmentSpecification;
}

export const deleteEquipmentSpecification = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete an equipment specification.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("equipment_specifications", id, businessId);

    if (error) {
        console.error("Error deleting equipment specification:", error);
        return false;
    }

    return true;
}

export const searchEquipmentSpecifications = async (query: string): Promise<EquipmentSpecification[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search equipment specifications.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment_specifications", businessId, "*", {
        filter: {
            or: [
                { specification: { ilike: `%${query}%` } },
                { value: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching equipment specifications:", error);
        return [];
    }

    return data as unknown as EquipmentSpecification[];
};

export const getEquipmentSpecificationsByEquipmentId = async (id: string): Promise<EquipmentSpecification[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment specifications.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment_specifications", businessId, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error fetching equipment specification by ID:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentSpecification[];
    }
    return data as unknown as EquipmentSpecification[];
};