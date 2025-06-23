"use server";

import { AIContextCache } from "@/lib/ai/cache";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";
import { DailyLog, DailyLogInsert, DailyLogUpdate, DailyLogWithDetails } from "@/types/daily-logs";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for daily log events
async function triggerDailyLogNotification(
    businessId: string,
    dailyLogId: string,
    projectName: string,
    date: string,
    eventType: string,
    triggeredBy?: string
) {
    try {
        // Get all users in the business
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business to notify");
            return;
        }

        const title = eventType === "created" ? "New Daily Log Created"
            : eventType === "updated" ? "Daily Log Updated"
                : "Daily Log Deleted";

        const message = eventType === "created"
            ? `A new daily log has been created for ${projectName} on ${date}.`
            : eventType === "updated"
                ? `Daily log for ${projectName} on ${date} has been updated.`
                : `Daily log for ${projectName} on ${date} has been deleted.`;

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates", // Daily logs are project-related updates
                title,
                message,
                link: `/dashboard/daily-logs/${dailyLogId}`,
                read: false,
                read_at: null,
                metadata: {
                    dailyLogId,
                    projectName,
                    date,
                    eventType,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

        console.log(`Notifications created for daily log ${dailyLogId} - ${eventType} for ${users.length} users`);
    } catch (error) {
        console.error("Error creating daily log notification:", error);
    }
}

export const getDailyLogs = async (businessId: string): Promise<DailyLog[]> => {


    const { data, error } = await fetchByBusiness("daily_logs", businessId);

    if (error) {
        console.error("Error fetching daily logs:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getDailyLogById = async (businessId: string, id: string): Promise<DailyLog | null> => {


    const { data, error } = await fetchByBusiness("daily_logs", businessId, "*", {
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

export const createDailyLog = async (businessId: string, log: DailyLogInsert): Promise<DailyLog | null> => {
    log = await applyCreated<DailyLogInsert>(log);

    const { data, error } = await insertWithBusiness("daily_logs", log, businessId);
    console.log("Creating Daily Log:", log, data, error);
    if (error) {
        console.error("Error creating daily log:", error);
        return null;
    }

    const createdLog = data as unknown as DailyLog;

    // Get project name for notification and trigger notification
    try {
        let projectName = "Unknown Project";
        if (createdLog.project_id) {
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: createdLog.project_id }
            });
            if (projectData && projectData[0]) {
                projectName = projectData[0].name;
            }
        }

        await triggerDailyLogNotification(
            businessId,
            createdLog.id,
            projectName,
            createdLog.date || new Date().toISOString().split('T')[0],
            "created",
            createdLog.created_by || undefined);

        // Invalidate AI context cache after daily log creation
        AIContextCache.invalidateByEntity(businessId, 'daily_logs', 'create');
    } catch (notificationError) {
        console.error("Error creating notification for daily log:", notificationError);
        // Don't fail the daily log creation if notification fails
    }

    return createdLog;
}

export const updateDailyLog = async (businessId: string, id: string, log: DailyLogUpdate): Promise<DailyLog | null> => {
    log = await applyUpdated<DailyLogUpdate>(log);

    const { data, error } = await updateWithBusinessCheck("daily_logs", id, log, businessId);

    if (error) {
        console.error("Error updating daily log:", error);
        return null;
    }

    const updatedLog = data as unknown as DailyLog;

    // Get project name for notification and trigger notification
    try {
        let projectName = "Unknown Project";
        if (updatedLog.project_id) {
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: updatedLog.project_id }
            });
            if (projectData && projectData[0]) {
                projectName = projectData[0].name;
            }
        }

        await triggerDailyLogNotification(
            businessId,
            updatedLog.id,
            projectName,
            updatedLog.date || new Date().toISOString().split('T')[0],
            "updated",
            updatedLog.updated_by || undefined
        );
    } catch (notificationError) {
        console.error("Error creating notification for daily log update:", notificationError);
        // Don't fail the daily log update if notification fails
    }

    return updatedLog;
}

export const deleteDailyLog = async (businessId: string, id: string): Promise<boolean> => {
    // Get daily log details before deletion for notification
    let projectName = "Unknown Project";
    let logDate = new Date().toISOString().split('T')[0];

    try {
        const { data: logData } = await fetchByBusiness("daily_logs", businessId, ["project_id", "date"], {
            filter: { id }
        });

        if (logData && logData[0]) {
            logDate = logData[0].date || logDate;

            if (logData[0].project_id) {
                const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                    filter: { id: logData[0].project_id }
                });
                if (projectData && projectData[0]) {
                    projectName = projectData[0].name;
                }
            }
        }
    } catch (error) {
        console.warn("Could not fetch daily log details for notification:", error);
    }

    const { error } = await deleteWithBusinessCheck("daily_logs", id, businessId);

    if (error) {
        console.error("Error deleting daily log:", error);
        return false;
    }

    // Create notification for daily log deletion
    try {
        await triggerDailyLogNotification(businessId, id, projectName, logDate, "deleted");
    } catch (notificationError) {
        console.error("Error creating notification for daily log deletion:", notificationError);
        // Don't fail the deletion if notification fails
    }

    return true;
}

export const searchDailyLogs = async (businessId: string, query: string): Promise<DailyLog[]> => {


    const { data, error } = await fetchByBusiness("daily_logs", businessId, "*", {
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

export const getDailyLogsWithDetails = async (businessId: string): Promise<DailyLogWithDetails[]> => {
    console.log("Fetching daily logs with details for businessId:", businessId);

    const { data, error } = await fetchByBusiness("daily_logs", businessId, "*", {
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

    const { data: materialData, error: materialError } = await fetchByBusiness("daily_log_materials", businessId, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: equipmentData, error: equipmentError } = await fetchByBusiness("daily_log_equipment", businessId, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const equipmentIds = equipmentData?.map(equip => equip.equipment_id) || [];
    const { data: equipmentInfoData, error: equipmentInfoError } = await fetchByBusiness("equipment", businessId, "*", {
        filter: { id: { in: equipmentIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: crewData, error: crewError } = await fetchByBusiness("crews", businessId, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: projectData, error: projectError } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const clientIds = projectData?.map(p => p.client_id) || [];
    const { data: clientData, error: clientError } = await fetchByBusiness("clients", businessId, "*", {
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

export const getDailyLogWithDetailsById = async (businessId: string, id: string): Promise<DailyLogWithDetails> => {


    const { data, error } = await fetchByBusiness("daily_logs", businessId, "*", {
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

    const { data: materialData, error: materialError } = await fetchByBusiness("daily_log_materials", businessId, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: equipmentData, error: equipmentError } = await fetchByBusiness("daily_log_equipment", businessId, "*", {
        filter: { daily_log_id: { in: logIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const equipmentIds = equipmentData?.map(equip => equip.equipment_id) || [];
    const { data: equipmentInfoData, error: equipmentInfoError } = await fetchByBusiness("equipment", businessId, "*", {
        filter: { id: { in: equipmentIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: crewData, error: crewError } = await fetchByBusiness("crews", businessId, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: projectData, error: projectError } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
        orderBy: { column: "created_at", ascending: true },
    });

    const { data: clientData, error: clientError } = await fetchByBusiness("clients", businessId, "*", {
        filter: { id: { in: projectData?.map(p => p.client_id) || [] } },
        orderBy: { column: "created_at", ascending: true },
    });

    let log = data[0] as DailyLog;


    const materials = materialData?.filter(material => material.daily_log_id === log.id) || [];
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

export const getDailyLogDetailsByID = async (businessId: string, id: string) => {
    try {
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "daily_logs",
            select: ["id", "date", "project_id", "crew_id", "author_id", "work_completed", "work_planned",
                "start_time", "end_time", "hours_worked", "overtime", "weather", "safety",
                "quality", "delays", "notes", "created_at", "updated_at"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "description", "status", "client_id", "location"],
                    alias: "project"
                },
                {
                    table: "crews",
                    select: ["id", "name", "type", "size"],
                    alias: "crew"
                },
                {
                    table: "daily_log_materials",
                    select: ["id", "material_id", "quantity", "unit", "cost"],
                    alias: "materials"
                },
                {
                    table: "daily_log_equipment",
                    select: ["id", "equipment_id", "hours_used", "condition"],
                    alias: "equipment_usage"
                },
                {
                    table: "daily_log_labor",
                    select: ["id", "crew_member_id", "hours_worked", "overtime", "task"],
                    alias: "labor"
                }
            ],
            aggregates: [
                { function: "sum", table: "daily_log_materials", alias: "total_material_cost", column: "cost" },
                { function: "sum", table: "daily_log_equipment", alias: "total_equipment_hours", column: "hours_used" },
                { function: "sum", table: "daily_log_labor", alias: "total_labor_hours", column: "hours_worked" },
                { function: "count", table: "daily_log_materials", alias: "material_count" },
                { function: "count", table: "daily_log_equipment", alias: "equipment_count" },
                { function: "count", table: "daily_log_labor", alias: "labor_count" }
            ],
            where: { id },
            orderBy: { column: "created_at", ascending: false }
        });

        if (error) {
            console.error("Error fetching daily log details:", error);
            return null;
        }

        return data?.[0] || null;
    } catch (error) {
        console.error("Error in getDailyLogDetailsByID:", error);
        return null;
    }
};

export const getDailyLogsWithStats = async (businessId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    projectId?: string;
    crewId?: string;
}) => {
    try {
        let whereClause: Record<string, any> = {};

        if (filters?.dateFrom) {
            whereClause.date = { gte: filters.dateFrom };
        }
        if (filters?.dateTo) {
            whereClause.date = { ...whereClause.date, lte: filters.dateTo };
        }
        if (filters?.projectId) {
            whereClause.project_id = filters.projectId;
        }
        if (filters?.crewId) {
            whereClause.crew_id = filters.crewId;
        }

        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "daily_logs",
            select: ["id", "date", "project_id", "crew_id", "work_completed", "hours_worked",
                "overtime", "weather", "safety", "quality", "delays"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status", "client_id"],
                    alias: "project"
                },
                {
                    table: "crews",
                    select: ["id", "name", "type"],
                    alias: "crew"
                },
                {
                    table: "clients",
                    select: ["id", "name"],
                    alias: "client"
                }
            ],
            aggregates: [
                { function: "sum", table: "daily_log_materials", alias: "material_cost", column: "cost" },
                { function: "sum", table: "daily_log_equipment", alias: "equipment_hours", column: "hours_used" },
                { function: "sum", table: "daily_log_labor", alias: "labor_hours", column: "hours_worked" },
                { function: "count", table: "daily_log_materials", alias: "material_entries" },
                { function: "count", table: "daily_log_equipment", alias: "equipment_entries" }
            ],
            where: whereClause,
            orderBy: { column: "date", ascending: false }
        });

        if (error) {
            console.error("Error fetching daily logs with stats:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Error in getDailyLogsWithStats:", error);
        return [];
    }
};

export const getDailyLogAnalytics = async (businessId: string, projectId?: string) => {
    try {
        let whereClause: Record<string, any> = {};
        if (projectId) {
            whereClause.project_id = projectId;
        }

        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "daily_logs",
            select: ["id", "date", "project_id", "hours_worked", "overtime"],
            aggregates: [
                { function: "count", table: "daily_logs", alias: "total_logs" },
                { function: "sum", table: "daily_logs", alias: "total_hours", column: "hours_worked" },
                { function: "sum", table: "daily_logs", alias: "total_overtime", column: "overtime" },
                { function: "avg", table: "daily_logs", alias: "avg_hours_per_day", column: "hours_worked" },
                { function: "sum", table: "daily_log_materials", alias: "total_material_cost", column: "cost" },
                { function: "sum", table: "daily_log_equipment", alias: "total_equipment_hours", column: "hours_used" }
            ],
            where: whereClause,
            orderBy: { column: "date", ascending: false }
        });

        if (error) {
            console.error("Error fetching daily log analytics:", error);
            return null;
        }

        return data?.[0] || null;
    } catch (error) {
        console.error("Error in getDailyLogAnalytics:", error);
        return null;
    }
};