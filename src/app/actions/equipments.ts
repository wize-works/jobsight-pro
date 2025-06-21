"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";
import { Equipment, EquipmentInsert, EquipmentStatus, EquipmentUpdate } from "@/types/equipment";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { triggerEquipmentNotification } from "@/lib/push/notification-triggers";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for equipment events
async function triggerEquipmentManagementNotification(
    businessId: string,
    equipmentId: string,
    equipmentName: string,
    eventType: string,
    status?: string,
    location?: string,
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
            case "created":
                title = "New Equipment Added";
                message = `Equipment "${equipmentName}" has been added to the system.`;
                break;
            case "updated":
                title = "Equipment Updated";
                message = `Equipment "${equipmentName}" has been updated${status ? ` (Status: ${status})` : ''}.`;
                break;
            case "deleted":
                title = "Equipment Removed";
                message = `Equipment "${equipmentName}" has been removed from the system.`;
                break;
            case "maintenance_scheduled":
                title = "Maintenance Scheduled";
                message = `Maintenance has been scheduled for equipment "${equipmentName}".`;
                break;
            case "status_changed":
                title = "Equipment Status Changed";
                message = `Equipment "${equipmentName}" status changed to ${status || 'unknown'}.`;
                break;
            default:
                title = "Equipment Modified";
                message = `Equipment "${equipmentName}" has been modified.`;
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
                link: `/dashboard/equipment/${equipmentId}`,
                read: false,
                read_at: null,
                metadata: {
                    equipmentId,
                    equipmentName,
                    eventType,
                    status,
                    location,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating equipment notification:", error);
    }
}

export const getEquipments = async (businessId: string): Promise<Equipment[]> => {


    const { data, error } = await fetchByBusiness("equipment", businessId);

    if (error) {
        console.error("Error fetching equipments:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getEquipmentById = async (businessId: string, id: string): Promise<Equipment | null> => {


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

export const getEquipmentDetail = async (businessId: string, id: string) => {
    try {
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "equipment",
            select: ["id", "name", "type", "model", "serial_number", "status", "location", "description",
                "purchase_date", "warranty_date", "purchase_price", "current_value", "manufacturer"],
            joins: [
                {
                    table: "equipment_assignments",
                    select: ["id", "project_id", "crew_id", "start_date", "end_date", "status", "notes"],
                    alias: "assignments"
                },
                {
                    table: "equipment_maintenance",
                    select: ["id", "type", "date", "description", "cost", "next_maintenance", "technician", "notes"],
                    alias: "maintenance"
                },
                {
                    table: "equipment_usage",
                    select: ["id", "date", "hours_used", "location", "operator", "fuel_consumed", "notes", "project_id"],
                    alias: "usage"
                }
            ],
            aggregates: [
                { function: "count", table: "equipment_assignments", alias: "total_assignments" },
                {
                    function: "count", table: "equipment_assignments", alias: "active_assignments",
                    where: { status: "active" }
                },
                { function: "sum", table: "equipment_usage", alias: "total_hours", column: "hours_used" },
                { function: "sum", table: "equipment_maintenance", alias: "total_maintenance_cost", column: "cost" },
                { function: "avg", table: "equipment_usage", alias: "avg_daily_hours", column: "hours_used" },
                { function: "count", table: "equipment_maintenance", alias: "maintenance_count" },
                { function: "max", table: "equipment_usage", alias: "last_used_date", column: "date" },
                { function: "max", table: "equipment_maintenance", alias: "last_maintenance_date", column: "date" }
            ],
            where: { id },
            orderBy: { column: "updated_at", ascending: false }
        });

        if (error) {
            console.error("Error fetching equipment detail:", error);
            return null;
        }

        const equipment: any = data?.[0];
        if (!equipment) return null;

        // Enhance assignments with project and client information
        if (equipment.assignments && equipment.assignments.length > 0) {
            const projectIds = equipment.assignments
                .map((a: any) => a.project_id)
                .filter((id: any) => id);

            const crewIds = equipment.assignments
                .map((a: any) => a.crew_id)
                .filter((id: any) => id);

            // Get project details with client information
            if (projectIds.length > 0) {
                const { data: projects } = await fetchByBusiness("projects", businessId,
                    ["id", "name", "status", "client_id", "location"], {
                    filter: { id: { in: projectIds } }
                });

                if (projects && projects.length > 0) {
                    const clientIds = projects
                        .map((p: any) => p.client_id)
                        .filter((id: any) => id);

                    // Get client details
                    let clients: any[] = [];
                    if (clientIds.length > 0) {
                        const { data: clientData } = await fetchByBusiness("clients", businessId,
                            ["id", "name", "type", "industry"], {
                            filter: { id: { in: clientIds } }
                        });
                        clients = clientData || [];
                    }

                    // Enhance assignments with project and client data
                    equipment.assignments = equipment.assignments.map((assignment: any) => {
                        const project = projects.find((p: any) => p.id === assignment.project_id);
                        if (project) {
                            const client = clients.find((c: any) => c.id === project.client_id);
                            assignment.project = {
                                ...project,
                                client: client || null
                            };
                        }
                        return assignment;
                    });
                }
            }

            // Get crew details
            if (crewIds.length > 0) {
                const { data: crews } = await fetchByBusiness("crews", businessId,
                    ["id", "name", "specialty"], {
                    filter: { id: { in: crewIds } }
                });

                if (crews && crews.length > 0) {
                    equipment.assignments = equipment.assignments.map((assignment: any) => {
                        const crew = crews.find((c: any) => c.id === assignment.crew_id);
                        if (crew) {
                            assignment.crew = crew;
                        }
                        return assignment;
                    });
                }
            }
        }

        // Enhance usage records with project information
        if (equipment.usage && equipment.usage.length > 0) {
            const usageProjectIds = equipment.usage
                .map((u: any) => u.project_id)
                .filter((id: any) => id);

            if (usageProjectIds.length > 0) {
                const { data: projects } = await fetchByBusiness("projects", businessId,
                    ["id", "name", "status"], {
                    filter: { id: { in: usageProjectIds } }
                });

                if (projects && projects.length > 0) {
                    equipment.usage = equipment.usage.map((usage: any) => {
                        const project = projects.find((p: any) => p.id === usage.project_id);
                        if (project) {
                            usage.project = project;
                        }
                        return usage;
                    });
                }
            }
        }

        return equipment;
    } catch (error) {
        console.error("Error in getEquipmentDetail:", error);
        return null;
    }
}

export const createEquipment = async (businessId: string, equipment: EquipmentInsert): Promise<Equipment | null> => {
    try {
        equipment = await applyCreated<EquipmentInsert>(equipment);

        const { data, error } = await insertWithBusiness("equipment", equipment, businessId);

        if (error) {
            console.error("Error creating equipment:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who created the equipment
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Trigger notification
            await triggerEquipmentManagementNotification(
                businessId,
                data.id,
                data.name || "Unnamed Equipment",
                "created",
                data.status || undefined,
                data.location || undefined,
                user?.id
            );
        }

        return data as unknown as Equipment;
    } catch (err) {
        console.error("Error in createEquipment:", err);
        return null;
    }
}

export const updateEquipment = async (businessId: string, id: string, equipment: EquipmentUpdate): Promise<Equipment | null> => {
    try {
        equipment = await applyUpdated<EquipmentUpdate>(equipment);

        const { data, error } = await updateWithBusinessCheck("equipment", id, equipment, businessId);

        if (error) {
            console.error("Error updating equipment:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who updated the equipment
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Trigger notification
            await triggerEquipmentManagementNotification(
                businessId,
                data.id,
                data.name || "Unnamed Equipment",
                "updated",
                data.status || undefined,
                data.location || undefined,
                user?.id
            );
        }

        return data as unknown as Equipment;
    } catch (err) {
        console.error("Error in updateEquipment:", err);
        return null;
    }
}

export const deleteEquipment = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the equipment data before deletion for notification
        const { data: equipmentData } = await fetchByBusiness("equipment", businessId, "*", {
            filter: { id },
        });
        const equipment = equipmentData?.[0] as Equipment | undefined;

        const { error } = await deleteWithBusinessCheck("equipment", id, businessId);

        if (error) {
            console.error("Error deleting equipment:", error);
            return false;
        }

        if (equipment) {
            // Get the current user session to identify who deleted the equipment
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Trigger notification
            await triggerEquipmentManagementNotification(
                businessId,
                equipment.id,
                equipment.name || "Unnamed Equipment",
                "deleted",
                equipment.status || undefined,
                equipment.location || undefined,
                user?.id
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteEquipment:", err);
        return false;
    }
}

export const searchEquipments = async (businessId: string, query: string): Promise<Equipment[]> => {


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

export const setEquipmentStatus = async (businessId: string, id: string, status: EquipmentStatus): Promise<Equipment | null> => {


    const { data, error } = await updateWithBusinessCheck("equipment", id, { status } as EquipmentUpdate, businessId);

    if (error) {
        console.error("Error setting equipment status:", error);
        return null;
    }

    // Notify users about the status change
    triggerEquipmentManagementNotification(businessId, id, "", "status_changed", status);

    return data as unknown as Equipment;
}

export const setEquipmentLocation = async (businessId: string, equipment: EquipmentUpdate): Promise<Equipment | null> => {
    try {
        equipment = await applyUpdated<EquipmentUpdate>(equipment);

        const { data, error } = await updateWithBusinessCheck("equipment", equipment.id, equipment, businessId);

        if (error) {
            console.error("Error setting equipment location:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who updated the location
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Trigger notification for location change
            await triggerEquipmentManagementNotification(
                businessId,
                data.id,
                data.name || "Unnamed Equipment",
                "updated",
                data.status || undefined,
                data.location || undefined,
                user?.id
            );
        }

        return data as unknown as Equipment;
    } catch (err) {
        console.error("Error in setEquipmentLocation:", err);
        return null;
    }
}

export const getEquipmentDetailsByID = async (businessId: string, id: string) => {
    try {
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "equipment",
            select: ["id", "name", "type", "model", "serial_number", "status", "location", "description", "purchase_date", "warranty_date", "purchase_price", "current_value"],
            joins: [
                {
                    table: "equipment_assignments",
                    select: ["id", "project_id", "crew_id", "start_date", "end_date", "status"],
                    alias: "assignments"
                },
                {
                    table: "equipment_maintenance",
                    select: ["id", "type", "date", "description", "cost", "next_maintenance"],
                    alias: "maintenance"
                },
                {
                    table: "equipment_usage",
                    select: ["id", "date", "hours_used", "location", "operator", "fuel_consumed"],
                    alias: "usage"
                }
            ], aggregates: [
                { function: "count", table: "equipment_assignments", alias: "total_assignments" },
                {
                    function: "count", table: "equipment_assignments", alias: "active_assignments",
                    where: { status: "active" }
                },
                { function: "sum", table: "equipment_usage", alias: "total_hours", column: "hours_used" },
                { function: "sum", table: "equipment_maintenance", alias: "total_maintenance_cost", column: "cost" },
                { function: "avg", table: "equipment_usage", alias: "avg_daily_hours", column: "hours_used" }
            ],
            where: { id },
            orderBy: { column: "updated_at", ascending: false }
        });

        if (error) {
            console.error("Error fetching equipment details:", error);
            return null;
        }

        return data?.[0] || null;
    } catch (error) {
        console.error("Error in getEquipmentDetailsByID:", error);
        return null;
    }
};

export const getEquipmentsWithStats = async (businessId: string) => {
    try {
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "equipment",
            select: ["id", "name", "type", "model", "status", "location", "purchase_date", "current_value"],
            aggregates: [
                { function: "count", table: "equipment_assignments", alias: "total_assignments" },
                {
                    function: "count", table: "equipment_assignments", alias: "active_assignments",
                    where: { status: "active" }
                },
                { function: "sum", table: "equipment_usage", alias: "total_hours", column: "hours_used" },
                { function: "sum", table: "equipment_maintenance", alias: "maintenance_cost", column: "cost" },
                { function: "count", table: "equipment_maintenance", alias: "maintenance_count" },
                { function: "max", table: "equipment_usage", alias: "last_used", column: "date" },
                { function: "avg", table: "equipment_usage", alias: "avg_daily_hours", column: "hours_used" }
            ],
            where: { status: { neq: "retired" } },
            orderBy: { column: "name", ascending: true }
        });

        if (error) {
            console.error("Error fetching equipment with stats:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Error in getEquipmentsWithStats:", error);
        return [];
    }
};

export const getEquipmentUtilizationAnalytics = async (businessId: string, equipmentId?: string) => {
    try {
        let whereClause: Record<string, any> = {};
        if (equipmentId) {
            whereClause.id = equipmentId;
        }

        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "equipment",
            select: ["id", "name", "type", "status"],
            aggregates: [
                { function: "sum", table: "equipment_usage", alias: "total_hours_used", column: "hours_used" },
                { function: "avg", table: "equipment_usage", alias: "avg_hours_per_day", column: "hours_used" },
                { function: "sum", table: "equipment_maintenance", alias: "total_maintenance_cost", column: "cost" },
                { function: "count", table: "equipment_maintenance", alias: "maintenance_events" },
                { function: "sum", table: "equipment_usage", alias: "total_fuel_consumed", column: "fuel_consumed" },
                { function: "count", table: "equipment_assignments", alias: "assignment_count" },
                { function: "max", table: "equipment_usage", alias: "last_usage_date", column: "date" }
            ],
            where: whereClause,
            orderBy: { column: "name", ascending: true }
        });

        if (error) {
            console.error("Error fetching equipment utilization analytics:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Error in getEquipmentUtilizationAnalytics:", error);
        return [];
    }
};
