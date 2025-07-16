import { NextRequest, NextResponse } from "next/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Task, TaskInsert, TaskUpdate, TaskWithDetails } from "@/types/tasks";
import { Subtask, SubtaskInsert, SubtaskUpdate } from "@/types/subtasks";
import { TaskDependency, TaskDependencyInsert, TaskDependencyUpdate } from "@/types/task_dependencies";
import { TaskNote, TaskNoteInsert, TaskNoteUpdate } from "@/types/task-notes";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export async function GET(req: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const id = searchParams.get('id');
        const projectId = searchParams.get('projectId');
        const query = searchParams.get('query');

        switch (action) {
            case 'list':
                return await getTasks(business.id);
            case 'get-by-id':
                if (!id) return NextResponse.json({ success: false, error: "Task ID required" }, { status: 400 });
                return await getTaskById(business.id, id);
            case 'get-by-project':
                if (!projectId) return NextResponse.json({ success: false, error: "Project ID required" }, { status: 400 });
                return await getTasksByProject(business.id, projectId);
            case 'get-with-details':
                return await getTasksWithDetails(business.id);
            case 'get-details-by-id':
                if (!id) return NextResponse.json({ success: false, error: "Task ID required" }, { status: 400 });
                return await getTaskDetailsById(business.id, id);
            case 'search':
                if (!query) return NextResponse.json({ success: false, error: "Search query required" }, { status: 400 });
                return await searchTasks(business.id, query);
            case 'get-subtasks':
                if (!id) return NextResponse.json({ success: false, error: "Task ID required" }, { status: 400 });
                return await getTaskSubtasks(business.id, id);
            case 'get-dependencies':
                if (!id) return NextResponse.json({ success: false, error: "Task ID required" }, { status: 400 });
                return await getTaskDependencies(business.id, id);
            case 'get-notes':
                if (!id) return NextResponse.json({ success: false, error: "Task ID required" }, { status: 400 });
                return await getTaskNotes(business.id, id);
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Tasks API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { action, ...data } = await req.json();

        switch (action) {
            case 'create':
                return await createTask(business.id, data.task);
            case 'create-subtask':
                return await createSubtask(business.id, data.subtask);
            case 'create-dependency':
                return await createTaskDependency(business.id, data.dependency);
            case 'create-note':
                return await createTaskNote(business.id, data.note);
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Tasks API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { action, id, ...data } = await req.json();

        if (!id) {
            return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
        }

        switch (action) {
            case 'update':
                return await updateTask(business.id, id, data.task);
            case 'quick-update':
                return await quickUpdateTask(business.id, id, data.updates);
            case 'update-subtask':
                return await updateSubtask(business.id, id, data.subtask);
            case 'update-dependency':
                return await updateTaskDependency(business.id, id, data.dependency);
            case 'update-note':
                return await updateTaskNote(business.id, id, data.note);
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Tasks API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
        }

        switch (action) {
            case 'delete':
                return await deleteTask(business.id, id);
            case 'delete-subtask':
                return await deleteSubtask(business.id, id);
            case 'delete-dependency':
                return await deleteTaskDependency(business.id, id);
            case 'delete-note':
                return await deleteTaskNote(business.id, id);
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Tasks API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Task operations
async function getTasks(businessId: string) {
    try {
        const { data, error } = await fetchByBusiness("tasks", businessId);

        if (error) {
            console.error("Error fetching tasks:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, tasks: data || [] });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
    }
}

async function getTaskById(businessId: string, id: string) {
    try {
        const { data, error } = await fetchByBusiness("tasks", businessId, "*", { filter: { id } });

        if (error) {
            console.error("Error fetching task by ID:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const task = data?.[0] || null;
        return NextResponse.json({ success: true, task });
    } catch (error) {
        console.error("Error fetching task by ID:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 });
    }
}

async function getTasksByProject(businessId: string, projectId: string) {
    try {
        const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
            filter: { project_id: projectId },
            orderBy: { column: "status", ascending: false },
        });

        if (error) {
            console.error("Error fetching tasks by project:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Get related data for enhanced task details
        const tasks = data || [];
        const enhancedTasks = await enhanceTasksWithDetails(businessId, tasks);

        return NextResponse.json({ success: true, tasks: enhancedTasks });
    } catch (error) {
        console.error("Error fetching tasks by project:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
    }
}

async function getTasksWithDetails(businessId: string) {
    try {
        const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
            orderBy: { column: "status", ascending: false },
        });

        if (error) {
            console.error("Error fetching tasks with details:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const tasks = data || [];
        const enhancedTasks = await enhanceTasksWithDetails(businessId, tasks);

        return NextResponse.json({ success: true, tasks: enhancedTasks });
    } catch (error) {
        console.error("Error fetching tasks with details:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
    }
}

async function getTaskDetailsById(businessId: string, id: string) {
    try {
        // Get the main task
        const { data: taskData, error: taskError } = await fetchByBusiness("tasks", businessId, "*", {
            filter: { id },
        });

        if (taskError) {
            console.error("Error fetching task details:", taskError);
            return NextResponse.json({ success: false, error: taskError.message }, { status: 500 });
        }

        const task = taskData?.[0];
        if (!task) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        // Get subtasks
        const { data: subtasksData } = await fetchByBusiness("subtasks", businessId, "*", {
            filter: { task_id: id },
            orderBy: { column: "created_at", ascending: true },
        });

        // Get dependencies
        const { data: dependenciesData } = await fetchByBusiness("task_dependencies", businessId, "*", {
            filter: { task_id: id },
        });

        // Get notes
        const { data: notesData } = await fetchByBusiness("task_notes", businessId, "*", {
            filter: { task_id: id },
            orderBy: { column: "created_at", ascending: false },
        });

        const taskDetails = {
            ...task,
            subtasks: subtasksData || [],
            dependencies: dependenciesData || [],
            notes: notesData || [],
        };

        return NextResponse.json({ success: true, task: taskDetails });
    } catch (error) {
        console.error("Error fetching task details:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch task details" }, { status: 500 });
    }
}

async function searchTasks(businessId: string, query: string) {
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
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, tasks: data || [] });
    } catch (error) {
        console.error("Error searching tasks:", error);
        return NextResponse.json({ success: false, error: "Failed to search tasks" }, { status: 500 });
    }
}

async function createTask(businessId: string, task: TaskInsert) {
    try {
        const taskData = await applyCreated<TaskInsert>(task);
        const { data, error } = await insertWithBusiness("tasks", taskData, businessId);

        if (error) {
            console.error("Error creating task:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, task: data });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
    }
}

async function updateTask(businessId: string, id: string, task: TaskUpdate) {
    try {
        const taskData = await applyUpdated<TaskUpdate>(task);
        const { data, error } = await updateWithBusinessCheck("tasks", id, taskData, businessId);

        if (error) {
            console.error("Error updating task:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, task: data });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
    }
}

async function quickUpdateTask(businessId: string, id: string, updates: Partial<TaskUpdate>) {
    try {
        const updateData = await applyUpdated<TaskUpdate>(updates);
        const { data, error } = await updateWithBusinessCheck("tasks", id, updateData, businessId);

        if (error) {
            console.error("Error quick updating task:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, task: data });
    } catch (error) {
        console.error("Error quick updating task:", error);
        return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
    }
}

async function deleteTask(businessId: string, id: string) {
    try {
        const { error } = await deleteWithBusinessCheck("tasks", id, businessId);

        if (error) {
            console.error("Error deleting task:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 });
    }
}

// Subtask operations
async function getTaskSubtasks(businessId: string, taskId: string) {
    try {
        const { data, error } = await fetchByBusiness("subtasks", businessId, "*", {
            filter: { task_id: taskId },
            orderBy: { column: "created_at", ascending: true },
        });

        if (error) {
            console.error("Error fetching subtasks:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, subtasks: data || [] });
    } catch (error) {
        console.error("Error fetching subtasks:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch subtasks" }, { status: 500 });
    }
}

async function createSubtask(businessId: string, subtask: SubtaskInsert) {
    try {
        const subtaskData = await applyCreated<SubtaskInsert>(subtask);
        const { data, error } = await insertWithBusiness("subtasks", subtaskData, businessId);

        if (error) {
            console.error("Error creating subtask:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, subtask: data });
    } catch (error) {
        console.error("Error creating subtask:", error);
        return NextResponse.json({ success: false, error: "Failed to create subtask" }, { status: 500 });
    }
}

async function updateSubtask(businessId: string, id: string, subtask: SubtaskUpdate) {
    try {
        const subtaskData = await applyUpdated<SubtaskUpdate>(subtask);
        const { data, error } = await updateWithBusinessCheck("subtasks", id, subtaskData, businessId);

        if (error) {
            console.error("Error updating subtask:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, subtask: data });
    } catch (error) {
        console.error("Error updating subtask:", error);
        return NextResponse.json({ success: false, error: "Failed to update subtask" }, { status: 500 });
    }
}

async function deleteSubtask(businessId: string, id: string) {
    try {
        const { error } = await deleteWithBusinessCheck("subtasks", id, businessId);

        if (error) {
            console.error("Error deleting subtask:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting subtask:", error);
        return NextResponse.json({ success: false, error: "Failed to delete subtask" }, { status: 500 });
    }
}

// Task dependency operations
async function getTaskDependencies(businessId: string, taskId: string) {
    try {
        const { data, error } = await fetchByBusiness("task_dependencies", businessId, "*", {
            filter: { task_id: taskId },
        });

        if (error) {
            console.error("Error fetching task dependencies:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, dependencies: data || [] });
    } catch (error) {
        console.error("Error fetching task dependencies:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch dependencies" }, { status: 500 });
    }
}

async function createTaskDependency(businessId: string, dependency: TaskDependencyInsert) {
    try {
        const dependencyData = await applyCreated<TaskDependencyInsert>(dependency);
        const { data, error } = await insertWithBusiness("task_dependencies", dependencyData, businessId);

        if (error) {
            console.error("Error creating task dependency:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, dependency: data });
    } catch (error) {
        console.error("Error creating task dependency:", error);
        return NextResponse.json({ success: false, error: "Failed to create dependency" }, { status: 500 });
    }
}

async function updateTaskDependency(businessId: string, id: string, dependency: TaskDependencyUpdate) {
    try {
        const dependencyData = await applyUpdated<TaskDependencyUpdate>(dependency);
        const { data, error } = await updateWithBusinessCheck("task_dependencies", id, dependencyData, businessId);

        if (error) {
            console.error("Error updating task dependency:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, dependency: data });
    } catch (error) {
        console.error("Error updating task dependency:", error);
        return NextResponse.json({ success: false, error: "Failed to update dependency" }, { status: 500 });
    }
}

async function deleteTaskDependency(businessId: string, id: string) {
    try {
        const { error } = await deleteWithBusinessCheck("task_dependencies", id, businessId);

        if (error) {
            console.error("Error deleting task dependency:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task dependency:", error);
        return NextResponse.json({ success: false, error: "Failed to delete dependency" }, { status: 500 });
    }
}

// Task note operations
async function getTaskNotes(businessId: string, taskId: string) {
    try {
        const { data, error } = await fetchByBusiness("task_notes", businessId, "*", {
            filter: { task_id: taskId },
            orderBy: { column: "created_at", ascending: false },
        });

        if (error) {
            console.error("Error fetching task notes:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, notes: data || [] });
    } catch (error) {
        console.error("Error fetching task notes:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch notes" }, { status: 500 });
    }
}

async function createTaskNote(businessId: string, note: TaskNoteInsert) {
    try {
        const noteData = await applyCreated<TaskNoteInsert>(note);
        const { data, error } = await insertWithBusiness("task_notes", noteData, businessId);

        if (error) {
            console.error("Error creating task note:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, note: data });
    } catch (error) {
        console.error("Error creating task note:", error);
        return NextResponse.json({ success: false, error: "Failed to create note" }, { status: 500 });
    }
}

async function updateTaskNote(businessId: string, id: string, note: TaskNoteUpdate) {
    try {
        const noteData = await applyUpdated<TaskNoteUpdate>(note);
        const { data, error } = await updateWithBusinessCheck("task_notes", id, noteData, businessId);

        if (error) {
            console.error("Error updating task note:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, note: data });
    } catch (error) {
        console.error("Error updating task note:", error);
        return NextResponse.json({ success: false, error: "Failed to update note" }, { status: 500 });
    }
}

async function deleteTaskNote(businessId: string, id: string) {
    try {
        const { error } = await deleteWithBusinessCheck("task_notes", id, businessId);

        if (error) {
            console.error("Error deleting task note:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task note:", error);
        return NextResponse.json({ success: false, error: "Failed to delete note" }, { status: 500 });
    }
}

// Helper function to enhance tasks with related details
async function enhanceTasksWithDetails(businessId: string, tasks: any[]) {
    if (!tasks || tasks.length === 0) return [];

    try {
        // Get project details
        const projectIds = tasks.map(task => task.project_id).filter(Boolean);
        const { data: projects } = await fetchByBusiness("projects", businessId, "*", {
            filter: { id: { in: projectIds } },
        });

        // Get crew details
        const crewIds = [
            ...tasks.map(task => task.assigned_to).filter(Boolean),
        ];
        const uniqueCrewIds = Array.from(new Set(crewIds));
        const { data: crews } = await fetchByBusiness("crews", businessId, "*", {
            filter: { id: { in: uniqueCrewIds } },
        });

        // Get client details
        const clientIds = projects?.map((project: any) => project.client_id).filter(Boolean) || [];
        const { data: clients } = await fetchByBusiness("clients", businessId, "*", {
            filter: { id: { in: clientIds } },
        });

        // Enhance tasks with details
        return tasks.map(task => {
            const project = projects?.find((p: any) => p.id === task.project_id);
            const assignedCrew = crews?.find((c: any) => c.id === task.assigned_to);
            const client = clients?.find((c: any) => c.id === project?.client_id);

            return {
                ...task,
                project: project || null,
                assigned_crew: assignedCrew || null,
                client: client || null,
            };
        });
    } catch (error) {
        console.error("Error enhancing tasks with details:", error);
        return tasks;
    }
}
