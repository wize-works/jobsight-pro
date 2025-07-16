'use client';

import { useState, useEffect } from 'react';
import {
    TasksAPI,
    TaskResponse,
    TasksResponse,
    TaskWithDetailsResponse,
    TasksWithDetailsResponse,
    SubtaskResponse,
    SubtasksResponse,
    TaskDependencyResponse,
    TaskDependenciesResponse,
    TaskNoteResponse,
    TaskNotesResponse,
    CreateTaskRequest,
    UpdateTaskRequest,
    QuickUpdateTaskRequest,
    CreateSubtaskRequest,
    UpdateSubtaskRequest,
    CreateTaskDependencyRequest,
    UpdateTaskDependencyRequest,
    CreateTaskNoteRequest,
    UpdateTaskNoteRequest,
    tasksAPI,
    taskUtils
} from '@/lib/api/tasks';
import { Task, TaskInsert, TaskUpdate, TaskWithDetails } from "@/types/tasks";
import { Subtask, SubtaskInsert, SubtaskUpdate } from "@/types/subtasks";
import { TaskDependency, TaskDependencyInsert, TaskDependencyUpdate } from "@/types/task_dependencies";
import { TaskNote, TaskNoteInsert, TaskNoteUpdate } from "@/types/task-notes";

/**
 * Hook for managing tasks
 */
export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTasks();
            if (result.success) {
                setTasks(result.tasks || []);
            } else {
                setError(result.error || 'Failed to fetch tasks');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return { tasks, loading, error, refetch: fetchTasks };
}

/**
 * Hook for managing tasks with details
 */
export function useTasksWithDetails() {
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTasksWithDetails();
            if (result.success) {
                setTasks(result.tasks || []);
            } else {
                setError(result.error || 'Failed to fetch tasks');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return { tasks, loading, error, refetch: fetchTasks };
}

/**
 * Hook for managing a single task
 */
export function useTask(id: string | null) {
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTask = async () => {
        if (!id) {
            setTask(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTaskById(id);
            if (result.success) {
                setTask(result.task || null);
            } else {
                setError(result.error || 'Failed to fetch task');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch task');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTask();
    }, [id]);

    return { task, loading, error, refetch: fetchTask };
}

/**
 * Hook for managing task details with subtasks, dependencies, and notes
 */
export function useTaskDetails(id: string | null) {
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTaskDetails = async () => {
        if (!id) {
            setTask(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTaskDetailsById(id);
            if (result.success) {
                setTask(result.task || null);
            } else {
                setError(result.error || 'Failed to fetch task details');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch task details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskDetails();
    }, [id]);

    return { task, loading, error, refetch: fetchTaskDetails };
}

/**
 * Hook for managing tasks by project
 */
export function useTasksByProject(projectId: string | null) {
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = async () => {
        if (!projectId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTasksByProject(projectId);
            if (result.success) {
                setTasks(result.tasks || []);
            } else {
                setError(result.error || 'Failed to fetch tasks');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    return { tasks, loading, error, refetch: fetchTasks };
}

/**
 * Hook for task search
 */
export function useTaskSearch() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchTasks = async (query: string) => {
        if (!query.trim()) {
            setTasks([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.searchTasks(query);
            if (result.success) {
                setTasks(result.tasks || []);
            } else {
                setError(result.error || 'Failed to search tasks');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search tasks');
        } finally {
            setLoading(false);
        }
    };

    return { tasks, loading, error, searchTasks };
}

/**
 * Hook for task CRUD operations
 */
export function useTaskMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createTask = async (data: CreateTaskRequest): Promise<TaskResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.createTask(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateTask = async (id: string, data: UpdateTaskRequest): Promise<TaskResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.updateTask(id, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const quickUpdateTask = async (id: string, data: QuickUpdateTaskRequest): Promise<TaskResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.quickUpdateTask(id, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const deleteTask = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.deleteTask(id);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createTask, updateTask, quickUpdateTask, deleteTask, loading, error };
}

/**
 * Hook for managing subtasks
 */
export function useSubtasks(taskId: string | null) {
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubtasks = async () => {
        if (!taskId) {
            setSubtasks([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTaskSubtasks(taskId);
            if (result.success) {
                setSubtasks(result.subtasks || []);
            } else {
                setError(result.error || 'Failed to fetch subtasks');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch subtasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubtasks();
    }, [taskId]);

    return { subtasks, loading, error, refetch: fetchSubtasks };
}

/**
 * Hook for subtask CRUD operations
 */
export function useSubtaskMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSubtask = async (data: CreateSubtaskRequest): Promise<SubtaskResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.createSubtask(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create subtask';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateSubtask = async (id: string, data: UpdateSubtaskRequest): Promise<SubtaskResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.updateSubtask(id, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update subtask';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const deleteSubtask = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.deleteSubtask(id);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete subtask';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createSubtask, updateSubtask, deleteSubtask, loading, error };
}

/**
 * Hook for managing task dependencies
 */
export function useTaskDependencies(taskId: string | null) {
    const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDependencies = async () => {
        if (!taskId) {
            setDependencies([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTaskDependencies(taskId);
            if (result.success) {
                setDependencies(result.dependencies || []);
            } else {
                setError(result.error || 'Failed to fetch dependencies');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dependencies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDependencies();
    }, [taskId]);

    return { dependencies, loading, error, refetch: fetchDependencies };
}

/**
 * Hook for task dependency CRUD operations
 */
export function useTaskDependencyMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createDependency = async (data: CreateTaskDependencyRequest): Promise<TaskDependencyResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.createTaskDependency(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create dependency';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateDependency = async (id: string, data: UpdateTaskDependencyRequest): Promise<TaskDependencyResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.updateTaskDependency(id, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update dependency';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const deleteDependency = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.deleteTaskDependency(id);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete dependency';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createDependency, updateDependency, deleteDependency, loading, error };
}

/**
 * Hook for managing task notes
 */
export function useTaskNotes(taskId: string | null) {
    const [notes, setNotes] = useState<TaskNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = async () => {
        if (!taskId) {
            setNotes([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.getTaskNotes(taskId);
            if (result.success) {
                setNotes(result.notes || []);
            } else {
                setError(result.error || 'Failed to fetch notes');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [taskId]);

    return { notes, loading, error, refetch: fetchNotes };
}

/**
 * Hook for task note CRUD operations
 */
export function useTaskNoteMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createNote = async (data: CreateTaskNoteRequest): Promise<TaskNoteResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.createTaskNote(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateNote = async (id: string, data: UpdateTaskNoteRequest): Promise<TaskNoteResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.updateTaskNote(id, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const deleteNote = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);
            setError(null);
            const result = await tasksAPI.deleteTaskNote(id);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createNote, updateNote, deleteNote, loading, error };
}

/**
 * Combined hook for complete task management
 */
export function useTaskManager(taskId: string | null) {
    const { task, loading: taskLoading, error: taskError, refetch: refetchTask } = useTaskDetails(taskId);
    const { subtasks, loading: subtasksLoading, error: subtasksError, refetch: refetchSubtasks } = useSubtasks(taskId);
    const { dependencies, loading: dependenciesLoading, error: dependenciesError, refetch: refetchDependencies } = useTaskDependencies(taskId);
    const { notes, loading: notesLoading, error: notesError, refetch: refetchNotes } = useTaskNotes(taskId);

    const { createTask, updateTask, quickUpdateTask, deleteTask, loading: taskMutationLoading, error: taskMutationError } = useTaskMutations();
    const { createSubtask, updateSubtask, deleteSubtask, loading: subtaskMutationLoading, error: subtaskMutationError } = useSubtaskMutations();
    const { createDependency, updateDependency, deleteDependency, loading: dependencyMutationLoading, error: dependencyMutationError } = useTaskDependencyMutations();
    const { createNote, updateNote, deleteNote, loading: noteMutationLoading, error: noteMutationError } = useTaskNoteMutations();

    // Combined loading state
    const loading = taskLoading || subtasksLoading || dependenciesLoading || notesLoading ||
        taskMutationLoading || subtaskMutationLoading || dependencyMutationLoading || noteMutationLoading;

    // Combined error state
    const error = taskError || subtasksError || dependenciesError || notesError ||
        taskMutationError || subtaskMutationError || dependencyMutationError || noteMutationError;

    const refreshData = async () => {
        if (taskId) {
            await Promise.all([
                refetchTask(),
                refetchSubtasks(),
                refetchDependencies(),
                refetchNotes()
            ]);
        }
    };

    const createTaskWithSubtasks = async (taskData: TaskInsert, subtaskData: SubtaskInsert[] = []) => {
        const taskResult = await createTask({ task: taskData });
        if (taskResult.success && taskResult.task && subtaskData.length > 0) {
            const subtaskPromises = subtaskData.map(subtask =>
                createSubtask({ subtask: { ...subtask, task_id: taskResult.task!.id } })
            );
            await Promise.all(subtaskPromises);
        }
        return taskResult;
    };

    return {
        // Data
        task,
        subtasks,
        dependencies,
        notes,

        // Loading and error states
        loading,
        error,

        // Task operations
        createTask,
        updateTask,
        quickUpdateTask,
        deleteTask,
        createTaskWithSubtasks,

        // Subtask operations
        createSubtask,
        updateSubtask,
        deleteSubtask,

        // Dependency operations
        createDependency,
        updateDependency,
        deleteDependency,

        // Note operations
        createNote,
        updateNote,
        deleteNote,

        // Refresh
        refreshData,
        refetchTask,
        refetchSubtasks,
        refetchDependencies,
        refetchNotes
    };
}

/**
 * Hook for task analytics
 */
export function useTaskAnalytics(tasks: Task[]) {
    const analytics = {
        ...taskUtils.getTaskStats(tasks),

        // Additional analytics
        overdueCount: taskUtils.filterOverdue(tasks).length,
        dueSoonCount: taskUtils.filterDueSoon(tasks).length,

        // Priority breakdown
        priorityBreakdown: {
            urgent: taskUtils.filterByPriority(tasks, 'urgent').length,
            high: taskUtils.filterByPriority(tasks, 'high').length,
            medium: taskUtils.filterByPriority(tasks, 'medium').length,
            low: taskUtils.filterByPriority(tasks, 'low').length,
        },

        // Status breakdown
        statusBreakdown: {
            todo: taskUtils.filterByStatus(tasks, 'todo').length,
            inProgress: taskUtils.filterByStatus(tasks, 'in_progress').length,
            completed: taskUtils.filterByStatus(tasks, 'completed').length,
            onHold: taskUtils.filterByStatus(tasks, 'on_hold').length,
            cancelled: taskUtils.filterByStatus(tasks, 'cancelled').length,
        },

        // Sorting utilities
        sortByPriority: () => taskUtils.sortByPriority(tasks),
        sortByDueDate: () => taskUtils.sortByDueDate(tasks),

        // Filtering utilities
        filterOverdue: () => taskUtils.filterOverdue(tasks),
        filterDueSoon: () => taskUtils.filterDueSoon(tasks),
    };

    return analytics;
}
