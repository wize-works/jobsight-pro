"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { NotificationInsert } from "@/types/notifications";

export const getDailyLogMaterials = async (businessId: string): Promise<DailyLogMaterial[]> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId);

    if (error) {
        console.error("Error fetching daily log materials:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getDailyLogMaterialById = async (businessId: string, id: string): Promise<DailyLogMaterial | null> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId, "*", {
        filter: { id: id }
    });

    if (error) {
        console.error("Error fetching daily log material by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0];
    }

    return null;
};

export const createDailyLogMaterial = async (businessId: string, material: DailyLogMaterialInsert, triggeredBy?: string): Promise<DailyLogMaterial | null> => {


    material = await applyCreated<DailyLogMaterialInsert>(material);

    const { data, error } = await insertWithBusiness("daily_log_materials", material, businessId);

    if (error) {
        console.error("Error creating daily log material:", error);
        return null;
    }

    const result = data;

    // Create notification for the new daily log material
    if (result) {
        await createDailyLogMaterialNotification(businessId, result, "created", triggeredBy);
    }

    return result;
}

export const updateDailyLogMaterial = async (businessId: string, id: string, material: DailyLogMaterialUpdate, triggeredBy?: string): Promise<DailyLogMaterial | null> => {


    material = await applyUpdated<DailyLogMaterialUpdate>(material);

    const { data, error } = await updateWithBusinessCheck("daily_log_materials", id, material, businessId);

    if (error) {
        console.error("Error updating daily log material:", error);
        return null;
    }

    const result = data;

    // Create notification for the updated daily log material
    if (result) {
        await createDailyLogMaterialNotification(businessId, result, "updated", triggeredBy);
    }

    return result;
}

export const deleteDailyLogMaterial = async (businessId: string, id: string, triggeredBy?: string): Promise<boolean> => {

    // Get the material data before deletion for notification
    let materialData = null;
    try {
        materialData = await getDailyLogMaterialById(businessId, id);
    } catch (error) {
        console.error("Error fetching daily log material before deletion:", error);
    }

    const { error } = await deleteWithBusinessCheck("daily_log_materials", id, businessId);

    if (error) {
        console.error("Error deleting daily log material:", error);
        return false;
    }

    // Create notification for the deleted daily log material
    if (materialData) {
        await createDailyLogMaterialNotification(businessId, materialData, "deleted", triggeredBy);
    }

    return true;
}

export const searchDailyLogMaterials = async (businessId: string, query: string): Promise<DailyLogMaterial[]> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId, "*", {
        filter: {
            or: [
                { material_name: { ilike: `%${query}%` } },
                { notes: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily log materials:", error);
        return [];
    }

    return data as DailyLogMaterial[];
};

export const getDailyLogMaterialsWithDetailsByLogId = async (businessId: string, id: string): Promise<DailyLogMaterial[]> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId, "*", {
        filter: { daily_log_id: id },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching daily log materials:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

// Helper function to create notifications for daily log material actions
const createDailyLogMaterialNotification = async (
    businessId: string,
    materialData: any,
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

        if (materialData.daily_log_id) {
            try {
                const { data: dailyLogData } = await fetchByBusiness("daily_logs", businessId, "*", {
                    filter: { id: materialData.daily_log_id }
                });

                if (dailyLogData && dailyLogData[0]) {
                    dailyLogInfo = dailyLogData[0];

                    if (dailyLogInfo.project_id) {
                        const { data: projectData } = await fetchByBusiness("projects", businessId, "*", {
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

        const materialName = materialData.material_name || "material";

        const title = eventType === "created"
            ? "Daily Log Material Added"
            : eventType === "updated"
                ? "Daily Log Material Updated"
                : "Daily Log Material Removed";

        const message = eventType === "created"
            ? `Material "${materialName}" has been added to a daily log for ${projectName}.`
            : eventType === "updated"
                ? `Material "${materialName}" details have been updated in daily log for ${projectName}.`
                : `Material "${materialName}" has been removed from daily log for ${projectName}.`;

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates", // Daily log materials are project-related
                title,
                message,
                link: dailyLogInfo ? `/dashboard/daily-logs/${dailyLogInfo.id}` : `/dashboard/daily-logs`,
                read: false,
                read_at: null,
                metadata: {
                    dailyLogMaterialId: materialData.id,
                    dailyLogId: materialData.daily_log_id,
                    materialName,
                    quantity: materialData.quantity,
                    unit: materialData.unit,
                    projectName,
                    eventType,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

        console.log(`Notifications created for daily log material ${materialData.id} - ${eventType} for ${users.length} users`);
    } catch (error) {
        console.error("Error creating daily log material notification:", error);
    }
}