"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentAssignment, EquipmentAssignmentInsert, EquipmentAssignmentUpdate } from "@/types/equipment-assignments";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { ProjectCrew } from "@/types/project-crews";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { auth } from "@clerk/nextjs/server";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for equipment assignment events
async function triggerAssignmentNotification(
    businessId: string,
    assignmentId: string,
    equipmentName: string,
    projectName: string,
    crewName: string,
    eventType: string,
    assignedDate?: string,
    returnDate?: string,
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
            case "assigned":
                title = "Equipment Assigned";
                message = `Equipment "${equipmentName}" has been assigned to ${crewName} for project "${projectName}"${assignedDate ? ` starting ${assignedDate}` : ''}.`;
                break;
            case "updated":
                title = "Equipment Assignment Updated";
                message = `Assignment of equipment "${equipmentName}" to ${crewName} for project "${projectName}" has been updated.`;
                break;
            case "returned":
                title = "Equipment Returned";
                message = `Equipment "${equipmentName}" has been returned from ${crewName} (project "${projectName}")${returnDate ? ` on ${returnDate}` : ''}.`;
                break;
            case "deleted":
                title = "Equipment Assignment Removed";
                message = `Assignment of equipment "${equipmentName}" to ${crewName} for project "${projectName}" has been removed.`;
                break;
            default:
                title = "Equipment Assignment Modified";
                message = `Assignment of equipment "${equipmentName}" has been modified.`;
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
                link: `/dashboard/equipment-assignments/${assignmentId}`,
                read: false,
                read_at: null,
                metadata: {
                    assignmentId,
                    equipmentName,
                    projectName,
                    crewName,
                    eventType,
                    assignedDate,
                    returnDate,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating assignment notification:", error);
    }
}

export const getEquipmentAssignments = async (businessId: string): Promise<EquipmentAssignment[]> => {


    const { data, error } = await fetchByBusiness("equipment_assignments", businessId);

    if (error) {
        console.error("Error fetching equipment assignments:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentAssignment[];
    }

    return data as unknown as EquipmentAssignment[];
}

export const getEquipmentAssignmentById = async (businessId: string, id: string): Promise<EquipmentAssignment | null> => {


    const { data, error } = await fetchByBusiness("equipment_assignments", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching equipment assignment by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentAssignment;
    }

    return null;
};

export const createEquipmentAssignment = async (businessId: string, assignment: EquipmentAssignmentInsert): Promise<EquipmentAssignment | null> => {
    try {
        assignment = await applyCreated<EquipmentAssignmentInsert>(assignment);

        const { data, error } = await insertWithBusiness("equipment_assignments", assignment, businessId);

        if (error) {
            console.error("Error creating equipment assignment:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who created the assignment
            const { userId } = await auth();

            // Get equipment, project, and crew names for notification
            const [equipmentData, projectData, crewData] = await Promise.all([
                fetchByBusiness("equipment", businessId, ["name"], {
                    filter: { id: data.equipment_id },
                }),
                fetchByBusiness("projects", businessId, ["name"], {
                    filter: { id: data.project_id },
                }),
                fetchByBusiness("crews", businessId, ["name"], {
                    filter: { id: data.crew_id },
                })
            ]);

            const equipmentName = equipmentData.data?.[0]?.name || "Unknown Equipment";
            const projectName = projectData.data?.[0]?.name || "Unknown Project";
            const crewName = crewData.data?.[0]?.name || "Unknown Crew";            // Trigger notification
            await triggerAssignmentNotification(
                businessId,
                data.id,
                equipmentName,
                projectName,
                crewName,
                "assigned",
                data.start_date || undefined,
                undefined,
                userId || undefined
            );
        }

        return data as unknown as EquipmentAssignment;
    } catch (err) {
        console.error("Error in createEquipmentAssignment:", err);
        return null;
    }
}

export const updateEquipmentAssignment = async (businessId: string, id: string, assignment: EquipmentAssignmentUpdate): Promise<EquipmentAssignment | null> => {
    try {
        assignment = await applyUpdated<EquipmentAssignmentUpdate>(assignment);

        const { data, error } = await updateWithBusinessCheck("equipment_assignments", id, assignment, businessId);

        if (error) {
            console.error("Error updating equipment assignment:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who updated the assignment
            const { userId } = await auth();

            // Get equipment, project, and crew names for notification
            const [equipmentData, projectData, crewData] = await Promise.all([
                fetchByBusiness("equipment", businessId, ["name"], {
                    filter: { id: data.equipment_id },
                }),
                fetchByBusiness("projects", businessId, ["name"], {
                    filter: { id: data.project_id },
                }),
                fetchByBusiness("crews", businessId, ["name"], {
                    filter: { id: data.crew_id },
                })
            ]);

            const equipmentName = equipmentData.data?.[0]?.name || "Unknown Equipment";
            const projectName = projectData.data?.[0]?.name || "Unknown Project";
            const crewName = crewData.data?.[0]?.name || "Unknown Crew";            // Determine event type based on return date
            const eventType = data.end_date ? "returned" : "updated";

            // Trigger notification
            await triggerAssignmentNotification(
                businessId,
                data.id,
                equipmentName,
                projectName,
                crewName,
                eventType,
                data.start_date || undefined,
                data.end_date || undefined,
                userId || undefined
            );
        }

        return data as unknown as EquipmentAssignment;
    } catch (err) {
        console.error("Error in updateEquipmentAssignment:", err);
        return null;
    }
}

export const deleteEquipmentAssignment = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the assignment data before deletion for notification
        const { data: assignmentData } = await fetchByBusiness("equipment_assignments", businessId, "*", {
            filter: { id },
        });
        const assignment = assignmentData?.[0] as EquipmentAssignment | undefined;

        const { error } = await deleteWithBusinessCheck("equipment_assignments", id, businessId);

        if (error) {
            console.error("Error deleting equipment assignment:", error);
            return false;
        }

        if (assignment) {
            // Get the current user session to identify who deleted the assignment
            const { userId } = await auth();

            // Get equipment, project, and crew names for notification
            const [equipmentData, projectData, crewData] = await Promise.all([
                fetchByBusiness("equipment", businessId, ["name"], {
                    filter: { id: assignment.equipment_id },
                }),
                fetchByBusiness("projects", businessId, ["name"], {
                    filter: { id: assignment.project_id },
                }),
                fetchByBusiness("crews", businessId, ["name"], {
                    filter: { id: assignment.crew_id },
                })
            ]);

            const equipmentName = equipmentData.data?.[0]?.name || "Unknown Equipment";
            const projectName = projectData.data?.[0]?.name || "Unknown Project";
            const crewName = crewData.data?.[0]?.name || "Unknown Crew";            // Trigger notification
            await triggerAssignmentNotification(
                businessId,
                assignment.id,
                equipmentName,
                projectName,
                crewName,
                "deleted",
                assignment.start_date || undefined,
                assignment.end_date || undefined,
                userId || undefined
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteEquipmentAssignment:", err);
        return false;
    }
}

export const searchEquipmentAssignments = async (businessId: string, query: string): Promise<EquipmentAssignment[]> => {


    const { data, error } = await fetchByBusiness("equipment_assignments", businessId, "*", {
        filter: {
            or: [
                { equipment_id: { ilike: `%${query}%` } },
                { assigned_to: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching equipment assignments:", error);
        return [];
    }

    return data as unknown as EquipmentAssignment[];
};

export const getEquipmentAssignmentsByEquipmentId = async (businessId: string, id: string): Promise<EquipmentAssignment[] | []> => {


    const { data: assignData, error: assignError } = await fetchByBusiness("equipment_assignments", businessId, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "start_date", ascending: true },
    });

    if (assignError) {
        console.error("Error fetching equipment assignment by ID:", assignError);
        return [];
    }

    if (!assignData || assignData.length === 0) {
        return [];
    }

    const crewIds = assignData?.map((assignment) => assignment.crew_id).filter(Boolean) || [];

    let crewData: any[] = [];
    if (crewIds.length > 0) {
        const { data: crews } = await fetchByBusiness("crews", businessId, "*", {
            filter: { id: { in: crewIds } },
            orderBy: { column: "name", ascending: true },
        });
        crewData = crews || [];
    }

    let projectData: any[] = [];
    if (crewIds.length > 0) {
        const { data: projects } = await fetchByBusiness("project_crews", businessId, "*", {
            filter: { crew_id: { in: crewIds } },
            orderBy: { column: "start_date", ascending: true },
        });
        projectData = projects || [];
    }

    const projectIds = (projectData as unknown as ProjectCrew[])?.map((project) => project.project_id).filter(Boolean) || [];

    let projectDetails: any[] = [];
    if (projectIds.length > 0) {
        const { data: projects } = await fetchByBusiness("projects", businessId, "*", {
            filter: { id: { in: projectIds } },
            orderBy: { column: "start_date", ascending: true },
        });
        projectDetails = projects || [];
    } const data = assignData.map((assignment) => {
        const crew = crewData?.find((crew) => crew.id === assignment.crew_id);
        const projectCrew = projectData?.find((pc) => pc.crew_id === assignment.crew_id);
        const project = projectDetails?.find((proj) => proj.id === assignment.project_id);

        return {
            ...assignment,
            crew_name: crew ? crew.name : "Unknown Crew",
            project_name: project ? project.name : "Unknown Project",
        };
    });

    return data as unknown as EquipmentAssignment[];
};