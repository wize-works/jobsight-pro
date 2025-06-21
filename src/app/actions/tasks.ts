"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";
import { Task, TaskInsert, TaskUpdate, TaskWithDetails } from "@/types/tasks";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { NotificationInsert } from "@/types/notifications";

// Create notifications for task events
async function triggerTaskNotification(
    businessId: string,
    taskId: string,
    taskName: string,
    projectName: string,
    eventType: string,
    assigneeId?: string,
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
                title = "New Task Created";
                message = assigneeId
                    ? `A new task "${taskName}" has been created and assigned in project ${projectName}.`
                    : `A new task "${taskName}" has been created in project ${projectName}.`;
                break;
            case "updated":
                title = "Task Updated";
                message = `Task "${taskName}" in project ${projectName} has been updated.`;
                break;
            case "assigned":
                title = "Task Assigned";
                message = `Task "${taskName}" in project ${projectName} has been assigned.`;
                break;
            case "completed":
                title = "Task Completed";
                message = `Task "${taskName}" in project ${projectName} has been completed.`;
                break;
            case "deleted":
                title = "Task Deleted";
                message = `Task "${taskName}" in project ${projectName} has been deleted.`;
                break;
            default:
                title = "Task Updated";
                message = `Task "${taskName}" in project ${projectName} has been modified.`;
        }

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            } const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "taskAssignments",
                title,
                message,
                link: `/dashboard/tasks/${taskId}`,
                read: false,
                read_at: null,
                metadata: {
                    taskId,
                    taskName,
                    projectName,
                    eventType,
                    assigneeId,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

        console.log(`Notifications created for task ${taskName} (${taskId}) - ${eventType} for ${users.length} users`);
    } catch (error) {
        console.error("Error creating task notification:", error);
    }
}


export const getTasks = async (businessId: string): Promise<Task[]> => {
    try {
        const { data, error } = await fetchByBusiness("tasks", businessId);

        if (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Task[];
        }

        return data as unknown as Task[];
    } catch (err) {
        console.error("Error in getTasks:", err);
        return [];
    }
};

export const getTaskById = async (businessId: string, id: string): Promise<Task | null> => {
    try {
        const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
            filter: { id },
        });

        if (error) {
            console.error("Error fetching task by ID:", error);
            return null;
        }

        if (data && data[0]) {
            return data[0] as unknown as Task;
        }

        return null;
    } catch (err) {
        console.error("Error in getTaskById:", err);
        return null;
    }
};

export const createTask = async (businessId: string, task: TaskInsert): Promise<Task | null> => {
    try {
        task = await applyCreated<TaskInsert>(task);

        const { data, error } = await insertWithBusiness("tasks", task, businessId);

        if (error) {
            console.error("Error creating task:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who created the task
            const { getUser } = getKindeServerSession();
            const user = await getUser();            // Get project name for notification
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: data.project_id },
            });
            const projectName = projectData?.[0]?.name || "Unknown Project";

            // Determine event type based on whether task is assigned
            const eventType = data.assigned_to ? "assigned" : "created";

            // Trigger notification
            await triggerTaskNotification(
                businessId,
                data.id,
                data.name || "Unnamed Task",
                projectName,
                eventType,
                data.assigned_to || undefined,
                user?.id
            );
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in createTask:", err);
        return null;
    }
}

export const updateTask = async (businessId: string, id: string, task: TaskUpdate): Promise<Task> => {
    try {
        // Get the existing task to compare changes
        const { data: existingTaskData } = await fetchByBusiness("tasks", businessId, "*", {
            filter: { id },
        });
        const existingTask = existingTaskData?.[0] as Task | undefined;

        task = await applyUpdated<TaskUpdate>(task);

        const { data, error } = await updateWithBusinessCheck("tasks", id, task, businessId);

        if (error) {
            console.error("Error updating task:", error);
            throw error;
        }

        if (data && existingTask) {
            // Get the current user session to identify who updated the task
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Get project name for notification
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: data.project_id },
            });
            const projectName = projectData?.[0]?.name || "Unknown Project";

            // Determine event type based on changes
            let eventType = "updated";

            // Check if task was completed
            if (existingTask.status !== "completed" && data.status === "completed") {
                eventType = "completed";
            }
            // Check if task was assigned to someone new
            else if (existingTask.assigned_to !== data.assigned_to && data.assigned_to) {
                eventType = "assigned";
            }

            // Trigger notification
            await triggerTaskNotification(
                businessId,
                data.id,
                data.name || "Unnamed Task",
                projectName,
                eventType,
                data.assigned_to || undefined,
                user?.id
            );
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in updateTask:", err);
        throw err;
    }
}

export const deleteTask = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the task data before deletion for notification
        const { data: taskData } = await fetchByBusiness("tasks", businessId, "*", {
            filter: { id },
        });
        const task = taskData?.[0] as Task | undefined;

        const { error } = await deleteWithBusinessCheck("tasks", id, businessId);

        if (error) {
            console.error("Error deleting task:", error);
            return false;
        }

        if (task) {
            // Get the current user session to identify who deleted the task
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Get project name for notification
            const { data: projectData } = await fetchByBusiness("projects", businessId, ["name"], {
                filter: { id: task.project_id },
            });
            const projectName = projectData?.[0]?.name || "Unknown Project";

            // Trigger notification
            await triggerTaskNotification(
                businessId,
                task.id,
                task.name || "Unnamed Task",
                projectName,
                "deleted",
                task.assigned_to || undefined,
                user?.id
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteTask:", err);
        return false;
    }
}

export const searchTasks = async (businessId: string, query: string): Promise<Task[]> => {
    try {
        const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
            filter: {
                or: [
                    { name: { ilike: `%${query}%` } },
                    { description: { ilike: `%${query}%` } },
                ],
            },
            orderBy: { column: "name", ascending: true },
        });

        if (error) {
            console.error("Error searching tasks:", error);
            return [];
        }

        return data as unknown as Task[];
    } catch (err) {
        console.error("Error in searchTasks:", err);
        return [];
    }
};

export const getTasksByProjectId = async (businessId: string, id: string): Promise<TaskWithDetails[]> => {
    try {


        const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
            filter: { project_id: id },
            orderBy: { column: "status", ascending: false },
        });

        const projectIds = data?.map((task: Task) => task.project_id).filter(Boolean) || [];
        const { data: projects, error: projectsError } = await fetchByBusiness("projects", businessId, "*", {
            filter: { id: { in: projectIds } },
        });

        const crewIds = projects?.map((project: any) => project.crew_id).filter(Boolean) || [];
        const taskCrewIds = data?.map((task: Task) => task.assigned_to).filter(Boolean) || [];
        const crewIdsSet = new Set([...crewIds, ...taskCrewIds]);
        const { data: crews, error: crewsError } = await fetchByBusiness("crews", businessId, "*", {
            filter: { id: { in: crewIdsSet } },
        });

        const clientIds = projects?.map((project: any) => project.client_id).filter(Boolean) || [];
        const { data: clients, error: clientsError } = await fetchByBusiness("clients", businessId, "*", {
            filter: { id: { in: clientIds } },
        });

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            return [];
        }
        if (crewsError) {
            console.error("Error fetching crews:", crewsError);
            return [];
        }
        if (clientsError) {
            console.error("Error fetching clients:", clientsError);
            return [];
        }

        if (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }
        const tasksWithDetails = data.map<TaskWithDetails>((task: TaskWithDetails) => {
            const project = projects?.find((p: any) => p.id === task.project_id);
            const crew = crews?.find((c: any) => c.id === task?.assigned_to);
            const client = clients?.find((c: any) => c.id === project?.client_id);
            return {
                ...task,
                project_name: project?.name || "",
                crew_name: crew?.name || "",
                client_name: client?.name || "",
            };
        });

        return tasksWithDetails;
    } catch (err) {
        console.error("Error in getTasks:", err);
        return [];
    }
}



export const getTasksWithDetails = async (businessId: string): Promise<TaskWithDetails[]> => {
    try {


        const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
            orderBy: { column: "status", ascending: false },
        });

        const projectIds = data?.map((task: Task) => task.project_id).filter(Boolean) || [];
        const { data: projects, error: projectsError } = await fetchByBusiness("projects", businessId, "*", {
            filter: { id: { in: projectIds } },
        });

        const crewIds = projects?.map((project: any) => project.crew_id).filter(Boolean) || [];
        const taskCrewIds = data?.map((task: Task) => task.assigned_to).filter(Boolean) || [];
        const crewIdsSet = new Set([...crewIds, ...taskCrewIds]);
        const { data: crews, error: crewsError } = await fetchByBusiness("crews", businessId, "*", {
            filter: { id: { in: crewIdsSet } },
        });

        const clientIds = projects?.map((project: any) => project.client_id).filter(Boolean) || [];
        const { data: clients, error: clientsError } = await fetchByBusiness("clients", businessId, "*", {
            filter: { id: { in: clientIds } },
        });

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            return [];
        }
        if (crewsError) {
            console.error("Error fetching crews:", crewsError);
            return [];
        }
        if (clientsError) {
            console.error("Error fetching clients:", clientsError);
            return [];
        }

        if (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }
        const tasksWithDetails = data.map<TaskWithDetails>((task: TaskWithDetails) => {
            const project = projects?.find((p: any) => p.id === task.project_id);
            const crew = crews?.find((c: any) => c.id === task?.assigned_to);
            const client = clients?.find((c: any) => c.id === project?.client_id);
            return {
                ...task,
                project_name: project?.name || "",
                crew_name: crew?.name || "",
                client_name: client?.name || "",
            };
        });

        return tasksWithDetails;
    } catch (err) {
        console.error("Error in getTasks:", err);
        return [];
    }
}

export const getTaskDetailsByID = async (businessId: string, id: string) => {
    try {
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "tasks",
            select: ["id", "title", "description", "status", "priority", "project_id", "assigned_to",
                "due_date", "start_date", "completed_date", "estimated_hours", "actual_hours",
                "created_at", "updated_at"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status", "client_id"],
                    alias: "project"
                },
                {
                    table: "crew_members",
                    select: ["id", "name", "role", "crew_id"],
                    alias: "assignee"
                },
                {
                    table: "task_comments",
                    select: ["id", "comment", "author_id", "created_at"],
                    alias: "comments"
                },
                {
                    table: "task_dependencies",
                    select: ["id", "dependent_task_id", "dependency_type"],
                    alias: "dependencies"
                }
            ],
            aggregates: [
                { function: "count", table: "task_comments", alias: "comment_count" },
                { function: "count", table: "task_dependencies", alias: "dependency_count" },
                { function: "sum", table: "task_time_logs", alias: "logged_hours", column: "hours" }
            ],
            where: { id },
            orderBy: { column: "updated_at", ascending: false }
        });

        if (error) {
            console.error("Error fetching task details:", error);
            return null;
        }

        return data?.[0] || null;
    } catch (error) {
        console.error("Error in getTaskDetailsByID:", error);
        return null;
    }
};

export const getTasksWithStats = async (businessId: string) => {
    try {
        const { data, error } = await fetchByBusinessWithQuery(businessId, {
            from: "tasks",
            select: ["id", "title", "status", "priority", "project_id", "assigned_to", "due_date",
                "estimated_hours", "actual_hours"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status"],
                    alias: "project"
                },
                {
                    table: "crew_members",
                    select: ["id", "name", "role"],
                    alias: "assignee"
                }
            ],
            aggregates: [
                { function: "count", table: "task_comments", alias: "comment_count" },
                { function: "sum", table: "task_time_logs", alias: "logged_hours", column: "hours" }
            ],
            orderBy: { column: "due_date", ascending: true }
        });

        if (error) {
            console.error("Error fetching tasks with stats:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Error in getTasksWithStats:", error);
        return [];
    }
};