"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";
import { Task, TaskInsert, TaskUpdate, TaskWithDetails } from "@/types/tasks";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";


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

        // Trigger push notification for task assignment
        if (data && data.assigned_to) {
            // Assuming getProjectById and triggerTaskNotification are defined elsewhere
            // and are accessible in this scope.  Need to create dummy functions
            async function getProjectById(project_id: string) {
                return { name: "test" };
            }

            async function triggerTaskNotification(
                taskId: any,
                title: any,
                projectName: any,
                assigned: any,
                assigned_to: any
            ) {
                console.log("triggerTaskNotification called");
            }
            const project = await getProjectById(data.project_id);
            await triggerTaskNotification(
                data.id,
                task.name,
                project?.name || 'Unknown Project',
                'assigned',
                data.assigned_to
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
        console.log("updateTask called with id:", id, "and task:", task);
        task = await applyUpdated<TaskUpdate>(task);

        const { data, error } = await updateWithBusinessCheck("tasks", id, task, businessId);

        if (error) {
            console.error("Error updating task:", error);
            throw error;
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in updateTask:", err);
        throw err;
    }
}

export const deleteTask = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const { error } = await deleteWithBusinessCheck("tasks", id, businessId);

        if (error) {
            console.error("Error deleting task:", error);
            return false;
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