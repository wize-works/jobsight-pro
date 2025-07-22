"use server";
import type { Project, ProjectInsert, ProjectUpdate, ProjectWithDetails } from "@/types/projects";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { Client } from "@/types/clients";
import { createNotificationWithEmail } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import type { NotificationInsert } from "@/types/notifications";
import { CrewWithMemberInfo } from "@/types/crews";
import { AIContextCache } from "@/lib/ai/cache";


export const getProjects = async (businessId: string): Promise<Project[]> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Project[];
        }

        return data as unknown as Project[];
    } catch (err) {
        console.error("Error in getProjects:", err);
        return [];
    }
};

export const getProjectById = async (businessId: string, id: string): Promise<Project> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            filter: { id },
        });

        if (error) {
            console.error("Error fetching project by ID:", error);
            throw error;
        }

        if (data && data[0]) {
            return data[0];
        }

        throw new Error(`Project with ID ${id} not found`);
    } catch (err) {
        console.error("Error in getProjectById:", err);
        throw err;
    }
};

export const createProject = async (businessId: string, project: ProjectInsert): Promise<Project | null> => {
    try {
        project = await applyCreated<ProjectInsert>(project);

        const { data, error } = await insertWithBusiness("projects", project, businessId);

        if (error) {
            console.error("Error creating project:", error);
            return null;
        } const createdProject = data as Project;

        // Invalidate AI context cache after project creation
        AIContextCache.invalidateByEntity(businessId, 'projects', 'create');

        // Create notification for project creation
        await triggerProjectNotification(businessId, createdProject.id, createdProject.name, "created", createdProject.created_by || undefined);

        return createdProject;
    } catch (err) {
        console.error("Error in createProject:", err);
        return null;
    }
};

export const updateProject = async (businessId: string, id: string, project: ProjectUpdate): Promise<Project | null> => {
    try {
        project = await applyUpdated<ProjectUpdate>(project);

        const { data, error } = await updateWithBusinessCheck("projects", id, project, businessId);

        if (error) {
            console.error("Error updating project:", error);
            return null;
        } const updatedProject = data as Project;

        // Invalidate AI context cache after project update
        AIContextCache.invalidateByEntity(businessId, 'projects', 'update');

        // Create notification for project update
        await triggerProjectNotification(businessId, updatedProject.id, updatedProject.name, "updated", updatedProject.updated_by || undefined);

        return updatedProject;
    } catch (err) {
        console.error("Error in updateProject:", err);
        return null;
    }
};

export const updateProjectProgress = async (businessId: string, id: string, progress: number): Promise<Project | null> => {
    try {
        const updateData = await applyUpdated<ProjectUpdate>({ progress });

        const { data, error } = await updateWithBusinessCheck("projects", id, updateData, businessId);

        if (error) {
            console.error("Error updating project progress:", error);
            return null;
        }

        const updatedProject = data as Project;

        // Invalidate AI context cache after project update
        AIContextCache.invalidateByEntity(businessId, 'projects', 'update');

        // No notification for progress-only updates
        console.log(`Project progress updated silently for project ${updatedProject.name} (${updatedProject.id}) - ${progress}%`);

        return updatedProject;
    } catch (err) {
        console.error("Error in updateProjectProgress:", err);
        return null;
    }
};

export const deleteProject = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get project details before deletion for notification
        let projectName = "Unknown Project";
        try {
            const project = await getProjectById(businessId, id);
            projectName = project.name;
        } catch (error) {
            console.warn("Could not fetch project name for notification:", error);
        } const { error } = await deleteWithBusinessCheck("projects", id, businessId);

        if (error) {
            console.error("Error deleting project:", error);
            return false;
        }

        // Invalidate AI context cache after project deletion
        AIContextCache.invalidateByEntity(businessId, 'projects', 'delete');

        // Create notification for project deletion
        await triggerProjectNotification(businessId, id, projectName, "deleted");

        return true;
    } catch (err) {
        console.error("Error in deleteProject:", err);
        return false;
    }
};

export const searchProjects = async (businessId: string, query: string): Promise<Project[]> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            filter: {
                or: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                ]
            },
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error searching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Project[];
        }

        return data as unknown as Project[];
    } catch (err) {
        console.error("Error in searchProjects:", err);
        return [];
    }
}

export const getProjectsByClientId = async (businessId: string, clientId: string): Promise<Project[]> => {
    try {
        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            filter: { client_id: clientId },
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Project[];
        }

        return data as unknown as Project[];
    } catch (err) {
        console.error("Error in getProjectsByClientId:", err);
        return [];
    }
};

export const setProjectLocation = async (project: ProjectUpdate): Promise<Project | null> => {
    try {
        project = await applyUpdated<ProjectUpdate>(project);

        const { data, error } = await updateWithBusinessCheck("projects", project.id, project, project.business_id);

        if (error) {
            console.error("Error creating project:", error);
            return null;
        }

        return data as Project;
    } catch (err) {
        console.error("Error in createProject:", err);
        return null;
    }
};

export const getProjectsWithDetails = async (businessId: string): Promise<ProjectWithDetails[]> => {
    try {


        const { data, error } = await fetchByBusiness("projects", businessId, "*", {
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as ProjectWithDetails[];
        }

        // Ensure data is an array of ProjectWithDetails before accessing client_id
        const projectsWithDetails = data as unknown as ProjectWithDetails[];
        const clientIds = projectsWithDetails.map((project) => project.client_id).filter(Boolean);

        const { data: clients, error: clientError } = await fetchByBusiness("clients", businessId, ["id", "name"], {
            filter: { id: { in: clientIds } },
        });

        return projectsWithDetails.map((project) => {
            const client = (clients as unknown as Client[])?.find((c) => c.id === project.client_id);
            return {
                ...project,
                client_name: client ? client.name : "Unknown Client",
            };
        });

    } catch (err) {
        console.error("Error in getProjects:", err);
        return [];
    }
};

export const getProjectDetailsByID = async (businessId: string, projectId: string): Promise<{
    project: Project;
    milestones: any[];
    tasks: any[];
    crews: CrewWithMemberInfo[];
    issues: any[];
    client: any | null;
    contacts: any[];
    manager: any | null;
    stats: {
        totalTasks: number;
        completedTasks: number;
        totalMilestones: number;
        completedMilestones: number;
        totalIssues: number;
        openIssues: number;
        totalCrews: number;
    };
} | null> => {
    try {
        // First, get the project with related data using joins
        const { data: projectWithRelations, error: projectError } = await fetchByBusinessWithQuery(businessId, {
            from: "projects",
            select: ["*"], joins: [
                {
                    table: "project_milestones",
                    select: ["id", "name", "description", "due_date", "status", "created_at", "updated_at"],
                    alias: "project_milestones"
                },
                {
                    table: "tasks",
                    select: ["id", "name", "description", "status", "priority", "end_date", "created_at", "updated_at"],
                    alias: "tasks"
                },
                {
                    table: "project_crews",
                    select: ["id", "crew_id", "created_at"],
                    alias: "project_crews"
                },
                {
                    table: "project_issues",
                    select: ["id", "title", "description", "priority", "status", "created_at", "updated_at"],
                    alias: "project_issues"
                }
            ],
            where: { id: projectId }
        });

        if (projectError) {
            console.error("Error fetching project details:", projectError);
            throw new Error("Failed to fetch project details");
        }

        if (!projectWithRelations || projectWithRelations.length === 0) {
            throw new Error("Project not found");
        }

        const projectData = projectWithRelations[0];

        // Get aggregated stats
        const { data: statsData, error: statsError } = await fetchByBusinessWithQuery(businessId, {
            from: "projects",
            select: ["id"],
            aggregates: [
                { function: "count", table: "tasks", alias: "total_tasks", where: { project_id: projectId } },
                { function: "count", table: "tasks", alias: "completed_tasks", where: { project_id: projectId, status: "completed" } },
                { function: "count", table: "project_milestones", alias: "total_milestones", where: { project_id: projectId } },
                { function: "count", table: "project_milestones", alias: "completed_milestones", where: { project_id: projectId, status: "completed" } },
                { function: "count", table: "project_issues", alias: "total_issues", where: { project_id: projectId } },
                { function: "count", table: "project_issues", alias: "open_issues", where: { project_id: projectId, status: { neq: "closed" } } },
                { function: "count", table: "project_crews", alias: "total_crews", where: { project_id: projectId } }
            ],
            where: { id: projectId }
        });

        const statsResult = statsData?.[0] || {};

        // Extract the main project data
        const project: Project = {
            id: projectData.id,
            business_id: projectData.business_id,
            name: projectData.name,
            type: projectData.type,
            status: projectData.status,
            start_date: projectData.start_date,
            end_date: projectData.end_date,
            budget: projectData.budget,
            location: projectData.location,
            description: projectData.description,
            client_id: projectData.client_id,
            manager_id: projectData.manager_id,
            progress: projectData.progress,
            created_by: projectData.created_by,
            created_at: projectData.created_at,
            updated_by: projectData.updated_by,
            updated_at: projectData.updated_at
        };

        // Extract related data
        const milestones = projectData.project_milestones || [];
        const tasks = projectData.tasks || [];
        const projectCrews = projectData.project_crews || [];
        const issues = projectData.project_issues || [];

        // Get full crew data for assigned crews
        let crews: CrewWithMemberInfo[] = [];
        if (projectCrews.length > 0) {
            const crewIds = projectCrews.map((pc: any) => pc.crew_id).filter(Boolean);
            if (crewIds.length > 0) {
                try {
                    const { data: crewData } = await fetchByBusiness("crews", businessId, "*", {
                        filter: { id: { in: crewIds } }
                    });

                    if (crewData && crewData.length > 0) {
                        // Get leader information for each crew
                        const leaderIds = crewData.map((crew: any) => crew.leader_id).filter(Boolean);
                        let leaders: any[] = [];
                        if (leaderIds.length > 0) {
                            const { data: leaderData } = await fetchByBusiness("crew_members", businessId, "*", {
                                filter: { id: { in: leaderIds } }
                            });
                            leaders = leaderData || [];
                        }

                        // Get member counts for each crew
                        const { data: crewMembersData } = await fetchByBusiness("crew_member_assignments", businessId, ["id", "crew_id", "crew_member_id"], {
                            filter: { crew_id: { in: crewIds } }
                        });

                        // Transform crew data to match CrewWithMemberInfo structure
                        crews = crewData.map((crew: any) => {
                            const memberCount = crewMembersData?.filter((member: any) => member.crew_id === crew.id).length || 0;
                            const leader = leaders.find((leader: any) => leader.id === crew.leader_id);

                            return {
                                ...crew,
                                member_count: memberCount,
                                leader_name: leader?.name || "No Assigned Leader"
                            };
                        });
                    }
                } catch (error) {
                    console.error("Error fetching crew data:", error);
                }
            }
        }

        // Get client data if client_id exists
        let client = null;
        let contacts: any[] = [];
        if (project.client_id) {
            try {
                const { data: clientData } = await fetchByBusinessWithQuery(businessId, {
                    from: "clients",
                    select: ["*"],
                    joins: [
                        {
                            table: "client_contacts",
                            select: ["id", "name", "title", "email", "phone", "is_primary"],
                            alias: "client_contacts"
                        }
                    ],
                    where: { id: project.client_id }
                });

                if (clientData && clientData.length > 0) {
                    client = clientData[0];
                    contacts = client.client_contacts || [];
                }
            } catch (error) {
                console.error("Error fetching client data:", error);
            }
        }

        // Get manager data if manager_id exists
        let manager = null;
        if (project.manager_id) {
            try {
                const { data: managerData } = await fetchByBusiness("crew_members", businessId, "*", {
                    filter: { id: project.manager_id }
                });
                if (managerData && managerData.length > 0) {
                    manager = managerData[0];
                }
            } catch (error) {
                console.error("Error fetching manager data:", error);
            }
        }

        const stats = {
            totalTasks: statsResult.total_tasks || 0,
            completedTasks: statsResult.completed_tasks || 0,
            totalMilestones: statsResult.total_milestones || 0,
            completedMilestones: statsResult.completed_milestones || 0,
            totalIssues: statsResult.total_issues || 0,
            openIssues: statsResult.open_issues || 0,
            totalCrews: statsResult.total_crews || 0
        };

        return {
            project,
            milestones,
            tasks,
            crews,
            issues,
            client,
            contacts,
            manager,
            stats
        };
    } catch (err) {
        console.error("Error in getProjectDetailsByID:", err);
        throw new Error("Failed to fetch project details");
    }
};

// Create notifications for project events
async function triggerProjectNotification(
    businessId: string,
    projectId: string,
    projectName: string,
    eventType: string,
    triggeredBy?: string
) {
    try {
        const title = eventType === "created" ? "New Project Created"
            : eventType === "updated" ? "Project Updated"
                : "Project Deleted";
        const message = eventType === "created"
            ? `A new project "${projectName}" has been created.`
            : eventType === "updated"
                ? `Project "${projectName}" has been updated.`
                : `Project "${projectName}" has been deleted.`;

        const notificationData: NotificationInsert = {
            user_id: triggeredBy || "system", // Will be ignored for bulk notifications
            type: "projectUpdates",
            title,
            message,
            link: eventType !== "deleted" ? `/dashboard/projects/${projectId}` : `/dashboard/projects`,
            read: false,
            read_at: null,
            metadata: {
                projectId,
                projectName,
                eventType,
                triggeredBy
            }
        };

        // Send notification with email to all users in the business (excluding triggering user)
        await createNotificationWithEmail(
            businessId,
            notificationData,
            true, // Send email
            triggeredBy, // Exclude triggering user
            "JobSight Pro" // Business name for email
        );

        console.log(`Notifications (with email) created for project ${projectName} (${projectId}) - ${eventType}`);
    } catch (error) {
        console.error("Error creating project notification:", error);
    }
}