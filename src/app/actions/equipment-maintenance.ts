"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentMaintenance, EquipmentMaintenanceInsert, EquipmentMaintenanceUpdate } from "@/types/equipment-maintenance";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for equipment maintenance events
async function triggerMaintenanceNotification(
    businessId: string,
    maintenanceId: string,
    equipmentName: string,
    maintenanceType: string,
    eventType: string,
    scheduledDate?: string,
    completedDate?: string,
    triggeredBy?: string
) {
    try {
        // Get all users in the business
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business to notify");
            return;
        }

        let title = "";
        let message = "";

        switch (eventType) {
            case "scheduled":
                title = "Maintenance Scheduled";
                message = `${maintenanceType} maintenance has been scheduled for equipment "${equipmentName}"${scheduledDate ? ` on ${scheduledDate}` : ''}.`;
                break;
            case "updated":
                title = "Maintenance Updated";
                message = `Maintenance record for equipment "${equipmentName}" has been updated.`;
                break;
            case "completed":
                title = "Maintenance Completed";
                message = `${maintenanceType} maintenance for equipment "${equipmentName}" has been completed${completedDate ? ` on ${completedDate}` : ''}.`;
                break;
            case "deleted":
                title = "Maintenance Record Deleted";
                message = `Maintenance record for equipment "${equipmentName}" has been deleted.`;
                break;
            default:
                title = "Maintenance Modified";
                message = `Maintenance record for equipment "${equipmentName}" has been modified.`;
        }

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "equipmentAlerts",
                title,
                message,
                link: `/dashboard/equipment-maintenance/${maintenanceId}`,
                read: false,
                read_at: null,
                metadata: {
                    maintenanceId,
                    equipmentName,
                    maintenanceType,
                    eventType,
                    scheduledDate,
                    completedDate,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating maintenance notification:", error);
    }
}

export const getEquipmentMaintenances = async (businessId: string): Promise<EquipmentMaintenance[]> => {


    const { data, error } = await fetchByBusiness("equipment_maintenance", businessId);

    if (error) {
        console.error("Error fetching equipment maintenances:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentMaintenance[];
    }

    return data as unknown as EquipmentMaintenance[];
}

export const getEquipmentMaintenanceById = async (businessId: string, id: string): Promise<EquipmentMaintenance | null> => {


    const { data, error } = await fetchByBusiness("equipment_maintenance", businessId, "*", {
        filter: { id: id },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching equipment maintenance by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentMaintenance;
    }

    return null;
};

export const createEquipmentMaintenance = async (businessId: string, maintenance: EquipmentMaintenanceInsert): Promise<EquipmentMaintenance | null> => {
    try {
        maintenance = await applyCreated<EquipmentMaintenanceInsert>(maintenance);

        const { data, error } = await insertWithBusiness("equipment_maintenance", maintenance, businessId);

        if (error) {
            console.error("Error creating equipment maintenance:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who created the maintenance
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Get equipment name for notification
            const { data: equipmentData } = await fetchByBusiness("equipment", businessId, ["name"], {
                filter: { id: data.equipment_id },
            });
            const equipmentName = equipmentData?.[0]?.name || "Unknown Equipment";            // Trigger notification
            await triggerMaintenanceNotification(
                businessId,
                data.id,
                equipmentName,
                data.maintenance_type || "General",
                "scheduled",
                data.maintenance_date || undefined,
                undefined,
                user?.id
            );
        }

        return data as unknown as EquipmentMaintenance;
    } catch (err) {
        console.error("Error in createEquipmentMaintenance:", err);
        return null;
    }
}

export const updateEquipmentMaintenance = async (businessId: string, id: string, maintenance: EquipmentMaintenanceUpdate): Promise<EquipmentMaintenance | null> => {
    try {
        maintenance = await applyUpdated<EquipmentMaintenanceUpdate>(maintenance);

        const { data, error } = await updateWithBusinessCheck("equipment_maintenance", id, maintenance, businessId);

        if (error) {
            console.error("Error updating equipment maintenance:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who updated the maintenance
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Get equipment name for notification
            const { data: equipmentData } = await fetchByBusiness("equipment", businessId, ["name"], {
                filter: { id: data.equipment_id },
            });
            const equipmentName = equipmentData?.[0]?.name || "Unknown Equipment";            // Determine event type based on completion status
            const eventType = data.maintenance_status === "completed" ? "completed" : "updated";

            // Trigger notification
            await triggerMaintenanceNotification(
                businessId,
                data.id,
                equipmentName,
                data.maintenance_type || "General",
                eventType,
                data.maintenance_date || undefined,
                data.maintenance_status === "completed" ? data.maintenance_date || undefined : undefined,
                user?.id
            );
        }

        return data as unknown as EquipmentMaintenance;
    } catch (err) {
        console.error("Error in updateEquipmentMaintenance:", err);
        return null;
    }
}

export const deleteEquipmentMaintenance = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the maintenance data before deletion for notification
        const { data: maintenanceData } = await fetchByBusiness("equipment_maintenance", businessId, "*", {
            filter: { id },
        });
        const maintenance = maintenanceData?.[0] as EquipmentMaintenance | undefined;

        const { error } = await deleteWithBusinessCheck("equipment_maintenance", id, businessId);

        if (error) {
            console.error("Error deleting equipment maintenance:", error);
            return false;
        }

        if (maintenance) {
            // Get the current user session to identify who deleted the maintenance
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Get equipment name for notification
            const { data: equipmentData } = await fetchByBusiness("equipment", businessId, ["name"], {
                filter: { id: maintenance.equipment_id },
            });
            const equipmentName = equipmentData?.[0]?.name || "Unknown Equipment";            // Trigger notification
            await triggerMaintenanceNotification(
                businessId,
                maintenance.id,
                equipmentName,
                maintenance.maintenance_type || "General",
                "deleted",
                maintenance.maintenance_date || undefined,
                maintenance.maintenance_status === "completed" ? maintenance.maintenance_date || undefined : undefined,
                user?.id
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteEquipmentMaintenance:", err);
        return false;
    }
}

export const searchEquipmentMaintenances = async (businessId: string, query: string): Promise<EquipmentMaintenance[]> => {


    const { data, error } = await fetchByBusiness("equipment_maintenance", businessId, "*", {
        filter: {
            or: [
                { description: { ilike: `%${query}%` } },
                { maintenance_type: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching equipment maintenances:", error);
        return [];
    }

    return data as unknown as EquipmentMaintenance[];
};

export const getEquipmentMaintenancesByEquipmentId = async (businessId: string, id: string): Promise<EquipmentMaintenance[]> => {


    const { data, error } = await fetchByBusiness("equipment_maintenance", businessId, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching equipment maintenance by ID:", error);
        return [];
    }
    if (!data || data.length === 0) {
        return [] as EquipmentMaintenance[];
    }

    return data as unknown as EquipmentMaintenance[];
};