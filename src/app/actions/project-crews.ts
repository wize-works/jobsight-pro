"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate } from "@/types/project-crews";
import { getUserBusiness } from "@/app/actions/business";
import { auth } from "@clerk/nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for project crew events
async function triggerProjectCrewNotification(
    businessId: string,
    assignmentId: string,
    crewName: string,
    projectName: string,
    eventType: string,
    role?: string,
    startDate?: string,
    endDate?: string,
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
                title = "Crew Assigned to Project";
                message = `Crew "${crewName}" has been assigned to project "${projectName}"${role ? ` as ${role}` : ''}${startDate ? ` starting ${startDate}` : ''}.`;
                break;
            case "updated":
                title = "Project Crew Assignment Updated";
                message = `Assignment of crew "${crewName}" to project "${projectName}" has been updated.`;
                break;
            case "removed":
                title = "Crew Removed from Project";
                message = `Crew "${crewName}" has been removed from project "${projectName}"${endDate ? ` as of ${endDate}` : ''}.`;
                break;
            case "completed":
                title = "Project Crew Assignment Completed";
                message = `Crew "${crewName}" has completed their assignment on project "${projectName}".`;
                break;
            default:
                title = "Project Crew Assignment Modified";
                message = `Assignment of crew "${crewName}" to project "${projectName}" has been modified.`;
        }

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates",
                title,
                message,
                link: `/dashboard/projects/${assignmentId}?tab=crews`,
                read: false,
                read_at: null,
                metadata: {
                    assignmentId,
                    crewName,
                    projectName,
                    eventType,
                    role,
                    startDate,
                    endDate,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating project crew notification:", error);
    }
}

export const getProjectCrews = async (businessId: string): Promise<ProjectCrew[]> => {


    const { data, error } = await fetchByBusiness("project_crews", businessId);

    if (error) {
        console.error("Error fetching project crews:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as ProjectCrew[];
    }

    return data as unknown as ProjectCrew[];
}

export const getProjectCrewById = async (businessId: string, id: string): Promise<ProjectCrew | null> => {


    const { data, error } = await fetchByBusiness("project_crews", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching project crew by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as ProjectCrew;
    }

    return null;
};

export const createProjectCrew = async (businessId: string, crew: ProjectCrewInsert): Promise<ProjectCrew | null> => {
    try {
        crew = await applyCreated<ProjectCrewInsert>(crew);

        const { data, error } = await insertWithBusiness("project_crews", crew, businessId);

        if (error) {
            console.error("Error creating project crew:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who created the assignment
            const { userId } = await auth();

            // Get project and crew names for notification
            const [projectData, crewData] = await Promise.all([
                fetchByBusiness("projects", businessId, ["name"], {
                    filter: { id: data.project_id },
                }),
                fetchByBusiness("crews", businessId, ["name"], {
                    filter: { id: data.crew_id },
                })
            ]);

            const projectName = projectData.data?.[0]?.name || "Unknown Project";
            const crewName = crewData.data?.[0]?.name || "Unknown Crew";            // Trigger notification
            await triggerProjectCrewNotification(
                businessId,
                data.id,
                crewName,
                projectName,
                "assigned",
                undefined,
                data.start_date || undefined,
                data.end_date || undefined,
                userId || undefined
            );
        }

        return data as unknown as ProjectCrew;
    } catch (err) {
        console.error("Error in createProjectCrew:", err);
        return null;
    }
}

export const updateProjectCrew = async (businessId: string, id: string, crew: ProjectCrewUpdate): Promise<ProjectCrew | null> => {
    try {
        crew = await applyUpdated<ProjectCrewUpdate>(crew);

        const { data, error } = await updateWithBusinessCheck("project_crews", id, crew, businessId);

        if (error) {
            console.error("Error updating project crew:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who updated the assignment
            const { userId } = await auth();

            // Get project and crew names for notification
            const [projectData, crewData] = await Promise.all([
                fetchByBusiness("projects", businessId, ["name"], {
                    filter: { id: data.project_id },
                }),
                fetchByBusiness("crews", businessId, ["name"], {
                    filter: { id: data.crew_id },
                })
            ]);

            const projectName = projectData.data?.[0]?.name || "Unknown Project";
            const crewName = crewData.data?.[0]?.name || "Unknown Crew";

            // Determine event type based on end date
            const eventType = data.end_date ? "completed" : "updated";            // Trigger notification
            await triggerProjectCrewNotification(
                businessId,
                data.id,
                crewName,
                projectName,
                eventType,
                undefined,
                data.start_date || undefined,
                data.end_date || undefined,
                userId || undefined
            );
        }

        return data as unknown as ProjectCrew;
    } catch (err) {
        console.error("Error in updateProjectCrew:", err);
        return null;
    }
}

export const deleteProjectCrew = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the assignment data before deletion for notification
        const { data: assignmentData } = await fetchByBusiness("project_crews", businessId, "*", {
            filter: { id },
        });
        const assignment = assignmentData?.[0] as ProjectCrew | undefined;

        const { error } = await deleteWithBusinessCheck("project_crews", id, businessId);

        if (error) {
            console.error("Error deleting project crew:", error);
            return false;
        }

        if (assignment) {
            // Get the current user session to identify who deleted the assignment
            const { userId } = await auth();

            // Get project and crew names for notification
            const [projectData, crewData] = await Promise.all([
                fetchByBusiness("projects", businessId, ["name"], {
                    filter: { id: assignment.project_id },
                }),
                fetchByBusiness("crews", businessId, ["name"], {
                    filter: { id: assignment.crew_id },
                })
            ]);

            const projectName = projectData.data?.[0]?.name || "Unknown Project";
            const crewName = crewData.data?.[0]?.name || "Unknown Crew";            // Trigger notification
            await triggerProjectCrewNotification(
                businessId,
                assignment.id,
                crewName,
                projectName,
                "removed",
                undefined,
                assignment.start_date || undefined,
                assignment.end_date || undefined,
                userId || undefined
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteProjectCrew:", err);
        return false;
    }
}

export const searchProjectCrews = async (businessId: string, query: string): Promise<ProjectCrew[]> => {


    const { data, error } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: {
            or: [
                { project_id: { ilike: `%${query}%` } },
                { crew_id: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching project crews:", error);
        return [];
    }

    return data as unknown as ProjectCrew[];
};

export const addCrewToProject = async (businessId: string, projectId: string, crewId: string): Promise<ProjectCrew | null> => {


    let newCrew = {
        project_id: projectId,
        crew_id: crewId,
        business_id: businessId,
    } as ProjectCrewInsert;

    newCrew = await applyCreated<ProjectCrewInsert>(newCrew);

    const createdCrew = await createProjectCrew(businessId, newCrew);

    if (!createdCrew) {
        console.error("Failed to add crew to project");
        return null;
    }

    // Notify about the new crew assignment
    await triggerProjectCrewNotification(businessId, createdCrew.id, crewId, projectId, "assigned", undefined, undefined, undefined, undefined);

    return createdCrew;
};

export const removeCrewFromProject = async (businessId: string, projectId: string, crewId: string): Promise<boolean> => {


    const { data, error } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { project_id: projectId, crew_id: crewId },
    }) as { data: ProjectCrew[], error: any };

    if (error) {
        console.error("Error fetching project crew for removal:", error);
        return false;
    }
    if (!data || data.length === 0) {
        console.warn("No crew found for the specified project and crew ID");
        return false;
    }
    if (data.length > 1) {
        console.warn("Multiple crews found for the specified project and crew ID, removing the first one");
    }

    const success = await deleteProjectCrew(businessId, data[0].id);

    if (!success) {
        console.error("Failed to remove crew from project");
        return false;
    }

    // Notify about the crew removal
    await triggerProjectCrewNotification(businessId, data[0].id, crewId, projectId, "removed", undefined, undefined, undefined, undefined);

    return true;
};
