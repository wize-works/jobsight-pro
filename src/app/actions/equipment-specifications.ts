"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentSpecification, EquipmentSpecificationInsert, EquipmentSpecificationUpdate } from "@/types/equipment-specifications";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getEquipmentSpecifications = async (businessId: string): Promise<EquipmentSpecification[]> => {


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

export const getEquipmentSpecificationById = async (businessId: string, id: string): Promise<EquipmentSpecification | null> => {


    const { data, error } = await fetchByBusiness("equipment_specifications", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching equipment specification by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentSpecification;
    }

    return null;
};

export const createEquipmentSpecification = async (businessId: string, spec: EquipmentSpecificationInsert): Promise<EquipmentSpecification | null> => {


    spec = await applyCreated<EquipmentSpecificationInsert>(spec);

    const { data, error } = await insertWithBusiness("equipment_specifications", spec, businessId);

    if (error) {
        console.error("Error creating equipment specification:", error);
        return null;
    }

    return data as unknown as EquipmentSpecification;
}

export const updateEquipmentSpecification = async (businessId: string, id: string, spec: EquipmentSpecificationUpdate): Promise<EquipmentSpecification | null> => {


    spec = await applyUpdated<EquipmentSpecificationUpdate>(spec);

    const { data, error } = await updateWithBusinessCheck("equipment_specifications", id, spec, businessId);

    if (error) {
        console.error("Error updating equipment specification:", error);
        return null;
    }

    return data as unknown as EquipmentSpecification;
}

export const deleteEquipmentSpecification = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("equipment_specifications", id, businessId);

    if (error) {
        console.error("Error deleting equipment specification:", error);
        return false;
    }

    return true;
}

export const searchEquipmentSpecifications = async (businessId: string, query: string): Promise<EquipmentSpecification[]> => {


    const { data, error } = await fetchByBusiness("equipment_specifications", businessId, "*", {
        filter: {
            or: [
                { specification: { ilike: `%${query}%` } },
                { value: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "created_at", ascending: true },
    });

    if (error) {
        console.error("Error searching equipment specifications:", error);
        return [];
    }

    return data as unknown as EquipmentSpecification[];
};

export const getEquipmentSpecificationsByEquipmentId = async (businessId: string, id: string): Promise<EquipmentSpecification[]> => {


    const { data, error } = await fetchByBusiness("equipment_specifications", businessId, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "created_at", ascending: true },
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