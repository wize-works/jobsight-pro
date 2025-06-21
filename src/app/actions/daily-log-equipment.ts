"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogEquipment, DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { NotificationInsert } from "@/types/notifications";
import { fetchByBusiness as fetchProjectById } from "@/lib/db";

export const getDailyLogEquipments = async (businessId: string): Promise<DailyLogEquipment[]> => {
    const { data, error } = await fetchByBusiness("daily_log_equipment", businessId);

    if (error) {
        console.error("Error fetching daily log equipments:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as DailyLogEquipment[];
    }

    return data as unknown as DailyLogEquipment[];
};

export const getDailyLogEquipmentById = async (businessId: string, id: string): Promise<DailyLogEquipment | null> => {
    const { data, error } = await fetchByBusiness("daily_log_equipment", businessId, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching daily log equipment by ID:", error);
        throw new Error("Failed to fetch daily log equipment");
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLogEquipment;
    }
    throw new Error("Daily log equipment not found");
};

export const createDailyLogEquipment = async (businessId: string, equipment: DailyLogEquipmentInsert, triggeredBy?: string): Promise<DailyLogEquipment | null> => {
    equipment = await applyCreated<DailyLogEquipmentInsert>(equipment);

    const { data, error } = await insertWithBusiness("daily_log_equipment", equipment, businessId);

    if (error) {
        console.error("Error creating daily log equipment:", error);
        return null;
    }

    const result = data as unknown as DailyLogEquipment;

    // Create notification for the new daily log equipment
    if (result) {
        await createDailyLogEquipmentNotification(businessId, result, "created", triggeredBy);
    }

    return result;
};

export const updateDailyLogEquipment = async (businessId: string, id: string, equipment: DailyLogEquipmentUpdate, triggeredBy?: string): Promise<DailyLogEquipment | null> => {
    equipment = await applyUpdated<DailyLogEquipmentUpdate>(equipment);

    const { data, error } = await updateWithBusinessCheck("daily_log_equipment", id, equipment, businessId);

    if (error) {
        console.error("Error updating daily log equipment:", error);
        return null;
    }

    const result = data as unknown as DailyLogEquipment;

    // Create notification for the updated daily log equipment
    if (result) {
        await createDailyLogEquipmentNotification(businessId, result, "updated", triggeredBy);
    }

    return result;
};

export const deleteDailyLogEquipment = async (businessId: string, id: string, triggeredBy?: string): Promise<boolean> => {
    // Get the equipment data before deletion for notification
    let equipmentData = null;
    try {
        equipmentData = await getDailyLogEquipmentById(businessId, id);
    } catch (error) {
        console.error("Error fetching daily log equipment before deletion:", error);
    }

    const { error } = await deleteWithBusinessCheck("daily_log_equipment", id, businessId);

    if (error) {
        console.error("Error deleting daily log equipment:", error);
        return false;
    }

    // Create notification for the deleted daily log equipment
    if (equipmentData) {
        await createDailyLogEquipmentNotification(businessId, equipmentData, "deleted", triggeredBy);
    }

    return true;
};

export const searchDailyLogEquipments = async (businessId: string, query: string): Promise<DailyLogEquipment[]> => {
    const { data, error } = await fetchByBusiness("daily_log_equipment", businessId, "*", {
        filter: {
            or: [
                { equipment_id: { ilike: `%${query}%` } },
                { notes: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily log equipments:", error);
        return [];
    }

    return data as unknown as DailyLogEquipment[];
};

// Helper function to create notifications for daily log equipment actions
const createDailyLogEquipmentNotification = async (
    businessId: string,
    equipmentData: any,
    eventType: "created" | "updated" | "deleted",
    triggeredBy?: string
) => {
    try {
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business:", businessId);
            return;
        }

        // Get daily log and project info for context
        let dailyLogInfo = null;
        let projectName = "Unknown Project";

        if (equipmentData.daily_log_id) {
            try {
                const { data: dailyLogData } = await fetchProjectById("daily_logs", businessId, "*", {
                    filter: { id: equipmentData.daily_log_id }
                });

                if (dailyLogData && dailyLogData[0]) {
                    dailyLogInfo = dailyLogData[0];

                    if (dailyLogInfo.project_id) {
                        const { data: projectData } = await fetchProjectById("projects", businessId, "*", {
                            filter: { id: dailyLogInfo.project_id }
                        });

                        if (projectData && projectData[0]) {
                            projectName = projectData[0].name || "Unknown Project";
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching daily log or project info:", error);
            }
        }

        const equipmentName = equipmentData.equipment_name ||
            equipmentData.equipment_id ||
            "equipment";

        const title = eventType === "created"
            ? "Daily Log Equipment Added"
            : eventType === "updated"
                ? "Daily Log Equipment Updated"
                : "Daily Log Equipment Removed";

        const message = eventType === "created"
            ? `Equipment "${equipmentName}" has been added to a daily log for ${projectName}.`
            : eventType === "updated"
                ? `Equipment "${equipmentName}" details have been updated in daily log for ${projectName}.`
                : `Equipment "${equipmentName}" has been removed from daily log for ${projectName}.`;

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates", // Daily log equipment is project-related
                title,
                message,
                link: dailyLogInfo ? `/dashboard/daily-logs/${dailyLogInfo.id}` : `/dashboard/daily-logs`,
                read: false,
                read_at: null,
                metadata: {
                    dailyLogEquipmentId: equipmentData.id,
                    dailyLogId: equipmentData.daily_log_id,
                    equipmentId: equipmentData.equipment_id,
                    equipmentName,
                    projectName,
                    eventType,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

        console.log(`Notifications created for daily log equipment ${equipmentData.id} - ${eventType} for ${users.length} users`);
    } catch (error) {
        console.error("Error creating daily log equipment notification:", error);
    }
}
