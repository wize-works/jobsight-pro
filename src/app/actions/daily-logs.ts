"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLog, DailyLogInsert, DailyLogUpdate, DailyLogWithDetails } from "@/types/daily-logs";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getDailyLogs = async (): Promise<DailyLog[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id);

    if (error) {
        console.error("Error fetching daily logs:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getDailyLogById = async (id: string): Promise<DailyLog | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id, "*", {
        filter: { id: id }
    });

    if (error) {
        console.error("Error fetching daily log by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLog;
    }

    return null;
};

export const createDailyLog = async (log: DailyLogInsert): Promise<DailyLog | null> => {
    const { business } = await withBusinessServer();

    log = await applyCreated<DailyLogInsert>(log);

    const { data, error } = await insertWithBusiness("daily_logs", log, business.id);

    if (error) {
        console.error("Error creating daily log:", error);
        return null;
    }

    return data as unknown as DailyLog;
}

export const updateDailyLog = async (id: string, log: DailyLogUpdate): Promise<DailyLog | null> => {
    const { business } = await withBusinessServer();

    log = await applyUpdated<DailyLogUpdate>(log);

    const { data, error } = await updateWithBusinessCheck("daily_logs", id, log, business.id);

    if (error) {
        console.error("Error updating daily log:", error);
        return null;
    }

    return data as unknown as DailyLog;
}

export const deleteDailyLog = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("daily_logs", id, business.id);

    if (error) {
        console.error("Error deleting daily log:", error);
        return false;
    }

    return true;
}

export const searchDailyLogs = async (query: string): Promise<DailyLog[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id, "*", {
        filter: {
            or: [
                { notes: { ilike: `%${query}%` } },
                { weather: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily logs:", error);
        return [];
    }

    return data as unknown as DailyLog[];
};

export const getDailyLogsWithDetails = async (): Promise<DailyLogWithDetails[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id, "*", {
        orderBy: { column: "date", ascending: false },
    });

    if (error) {
        console.error("Error fetching daily logs with details:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    const logIds = data.map(log => log.id);
    const crewIds = data.map(log => log.crew_id).filter(id => id !== null);
    const projectIds = data.map(log => log.project_id);

    const { data: materialData, error: materialError } = await fetchByBusiness("daily_log_materials", business.id, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: equipmentData, error: equipmentError } = await fetchByBusiness("daily_log_equipment", business.id, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const equipmentIds = equipmentData?.map(equip => equip.equipment_id) || [];
    const { data: equipmentInfoData, error: equipmentInfoError } = await fetchByBusiness("equipment", business.id, "*", {
        filter: { id: { in: equipmentIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: crewData, error: crewError } = await fetchByBusiness("crews", business.id, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: projectData, error: projectError } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const clientIds = projectData?.map(p => p.client_id) || [];
    const { data: clientData, error: clientError } = await fetchByBusiness("clients", business.id, "*", {
        filter: { id: { in: clientIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const dataWithDetails = data.map(log => {
        const materials = materialData?.filter(material => material.daily_log_id === log.id) || [];
        const equipment = equipmentData?.filter(equip => equip.daily_log_id === log.id) || [];
        const crew = crewData?.find(c => c.id === log.crew_id) || null;
        const project = projectData?.find(p => p.id === log.project_id) || null;
        const client = clientData?.find(c => c.id === project?.client_id) || null;

        return {
            ...log,
            client: {
                id: client?.id || "",
                name: client?.name || null,
                contact_name: client?.contact_name || null,
                contact_email: client?.contact_email || null,
                contact_phone: client?.contact_phone || null,
            },
            materials: materials.map(material => ({
                id: material.id,
                name: material.name,
                quantity: material.quantity,
                cost_per_unit: material.cost,
            })),
            equipment: equipment.map(equip => ({
                id: equip.id,
                name: equipmentInfoData?.find(info => info.id === equip.equipment_id)?.name || equip.name,
                hours: equip.hours || 0,
            })),
            crew: crew ? { id: crew.id, name: crew.name } : null,
            project: project ? { id: project.id, name: project.name, description: project.description } : null,
        } as unknown as DailyLogWithDetails;
    });

    return dataWithDetails;
}

export const getDailyLogWithDetailsById = async (id: string): Promise<DailyLogWithDetails> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id, "*", {
        filter: { id: id },
        orderBy: { column: "date", ascending: false },
    });

    if (error) {
        console.error("Error fetching daily logs with details:", error);
        throw new Error("Failed to fetch daily log details");
    }

    if (!data || data.length === 0) {
        throw new Error("Daily log not found");
    }

    const logIds = data.map(log => log.id);
    const crewIds = data.map(log => log.crew_id).filter(id => id !== null);
    const projectIds = data.map(log => log.project_id);

    const { data: materialData, error: materialError } = await fetchByBusiness("daily_log_materials", business.id, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: equipmentData, error: equipmentError } = await fetchByBusiness("daily_log_equipment", business.id, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const equipmentIds = equipmentData?.map(equip => equip.equipment_id) || [];
    const { data: equipmentInfoData, error: equipmentInfoError } = await fetchByBusiness("equipment", business.id, "*", {
        filter: { id: { in: equipmentIds } },
        orderBy: { column: "created_at", ascending: true },
    });
    console.log("Equipment Info Data:", equipmentData, equipmentInfoData, equipmentIds);

    const { data: crewData, error: crewError } = await fetchByBusiness("crews", business.id, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: projectData, error: projectError } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: clientData, error: clientError } = await fetchByBusiness("clients", business.id, "*", {
        filter: { id: { in: projectData?.map(p => p.client_id) || [] } },
        orderBy: { column: "created_at", ascending: true },
    });

    let log = data[0] as DailyLog;


    const materials = materialData?.filter(material => material.daily_log_id === log.id) || [];
    console.log("Materials Data:", materials);
    const equipment = equipmentData?.filter(equip => equip.daily_log_id === log.id) || [];
    const crew = crewData?.find(c => c.id === log.crew_id) || null;
    const project = projectData?.find(p => p.id === log.project_id) || null;
    const client = clientData?.find(c => c.id === project?.client_id) || null;

    return {
        ...log,
        materials: materials.map(material => ({
            id: material.id,
            name: material.name,
            supplier: material.supplier,
            quantity: material.quantity,
            cost: material.cost,
        })),
        equipment: equipment.map(equip => ({
            id: equip.id,
            name: equipmentInfoData?.find(info => info.id === equip.equipment_id)?.name || equip.name,
            operator: equip.operator || null,
            hours: equip.hours || 0,
            condition: equip.condition || null,
        })),
        crew: crew ? { id: crew.id, name: crew.name } : null,
        project: project ? { id: project.id, name: project.name, description: project.description } : null,
        client: client ? {
            id: client.id,
            name: client.name,
            contact_name: client.contact_name,
            contact_email: client.contact_email,
            contact_phone: client.contact_phone
        } : {
            id: "",
            name: null,
            contact_name: null,
            contact_email: null,
            contact_phone: null
        }
    } as DailyLogWithDetails;

}