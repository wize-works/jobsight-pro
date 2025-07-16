import { Task, TaskInsert, TaskUpdate, TaskWithDetails } from "@/types/tasks";
import { Subtask, SubtaskInsert, SubtaskUpdate } from "@/types/subtasks";
import { TaskDependency, TaskDependencyInsert, TaskDependencyUpdate } from "@/types/task_dependencies";
import { TaskNote, TaskNoteInsert, TaskNoteUpdate } from "@/types/task-notes";

// TypeScript interfaces for task operations
export interface TaskResponse {
    success: boolean;
    task?: Task;
    error?: string;
}

export interface TasksResponse {
    success: boolean;
    tasks?: Task[];
    error?: string;
}

export interface TaskWithDetailsResponse {
    success: boolean;
    task?: TaskWithDetails & {
        subtasks: Subtask[];
        dependencies: TaskDependency[];
        notes: TaskNote[];
    };
    error?: string;
}

export interface TasksWithDetailsResponse {
    success: boolean;
    tasks?: TaskWithDetails[];
    error?: string;
}

export interface SubtaskResponse {
    success: boolean;
    subtask?: Subtask;
    error?: string;
}

export interface SubtasksResponse {
    success: boolean;
    subtasks?: Subtask[];
    error?: string;
}

export interface TaskDependencyResponse {
    success: boolean;
    dependency?: TaskDependency;
    error?: string;
}

export interface TaskDependenciesResponse {
    success: boolean;
    dependencies?: TaskDependency[];
    error?: string;
}

export interface TaskNoteResponse {
    success: boolean;
    note?: TaskNote;
    error?: string;
}

export interface TaskNotesResponse {
    success: boolean;
    notes?: TaskNote[];
    error?: string;
}

export interface CreateTaskRequest {
    task: TaskInsert;
}

export interface UpdateTaskRequest {
    task: TaskUpdate;
}

export interface QuickUpdateTaskRequest {
    updates: Partial<TaskUpdate>;
}

export interface CreateSubtaskRequest {
    subtask: SubtaskInsert;
}

export interface UpdateSubtaskRequest {
    subtask: SubtaskUpdate;
}

export interface CreateTaskDependencyRequest {
    dependency: TaskDependencyInsert;
}

export interface UpdateTaskDependencyRequest {
    dependency: TaskDependencyUpdate;
}

export interface CreateTaskNoteRequest {
    note: TaskNoteInsert;
}

export interface UpdateTaskNoteRequest {
    note: TaskNoteUpdate;
}

/**
 * API client for task operations
 */
export class TasksAPI {
    private readonly baseUrl = '/api/tasks';

    // Task operations
    async getTasks(): Promise<TasksResponse> {
        const response = await fetch(`${this.baseUrl}?action=list`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getTaskById(id: string): Promise<TaskResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-by-id&id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getTasksByProject(projectId: string): Promise<TasksWithDetailsResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-by-project&projectId=${projectId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getTasksWithDetails(): Promise<TasksWithDetailsResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-with-details`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getTaskDetailsById(id: string): Promise<TaskWithDetailsResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-details-by-id&id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async searchTasks(query: string): Promise<TasksResponse> {
        const response = await fetch(`${this.baseUrl}?action=search&query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async createTask(data: CreateTaskRequest): Promise<TaskResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async updateTask(id: string, data: UpdateTaskRequest): Promise<TaskResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update',
                id,
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async quickUpdateTask(id: string, data: QuickUpdateTaskRequest): Promise<TaskResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'quick-update',
                id,
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
        const response = await fetch(`${this.baseUrl}?action=delete&id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Subtask operations
    async getTaskSubtasks(taskId: string): Promise<SubtasksResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-subtasks&id=${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async createSubtask(data: CreateSubtaskRequest): Promise<SubtaskResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-subtask',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async updateSubtask(id: string, data: UpdateSubtaskRequest): Promise<SubtaskResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update-subtask',
                id,
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async deleteSubtask(id: string): Promise<{ success: boolean; error?: string }> {
        const response = await fetch(`${this.baseUrl}?action=delete-subtask&id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Task dependency operations
    async getTaskDependencies(taskId: string): Promise<TaskDependenciesResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-dependencies&id=${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async createTaskDependency(data: CreateTaskDependencyRequest): Promise<TaskDependencyResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-dependency',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async updateTaskDependency(id: string, data: UpdateTaskDependencyRequest): Promise<TaskDependencyResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update-dependency',
                id,
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async deleteTaskDependency(id: string): Promise<{ success: boolean; error?: string }> {
        const response = await fetch(`${this.baseUrl}?action=delete-dependency&id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Task note operations
    async getTaskNotes(taskId: string): Promise<TaskNotesResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-notes&id=${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async createTaskNote(data: CreateTaskNoteRequest): Promise<TaskNoteResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-note',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async updateTaskNote(id: string, data: UpdateTaskNoteRequest): Promise<TaskNoteResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update-note',
                id,
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async deleteTaskNote(id: string): Promise<{ success: boolean; error?: string }> {
        const response = await fetch(`${this.baseUrl}?action=delete-note&id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

// Create singleton instance
export const tasksAPI = new TasksAPI();

/**
 * Utility functions for task operations
 */
export const taskUtils = {
    /**
     * Get task status color
     */
    getStatusColor: (status: string): string => {
        switch (status?.toLowerCase()) {
            case 'todo':
            case 'pending':
                return 'gray';
            case 'in_progress':
            case 'in-progress':
                return 'blue';
            case 'completed':
            case 'done':
                return 'green';
            case 'cancelled':
            case 'canceled':
                return 'red';
            case 'on_hold':
            case 'on-hold':
                return 'yellow';
            default:
                return 'gray';
        }
    },

    /**
     * Get task priority color
     */
    getPriorityColor: (priority: string): string => {
        switch (priority?.toLowerCase()) {
            case 'low':
                return 'green';
            case 'medium':
                return 'yellow';
            case 'high':
                return 'orange';
            case 'urgent':
                return 'red';
            default:
                return 'gray';
        }
    },

    /**
     * Format task status for display
     */
    formatStatus: (status: string): string => {
        switch (status?.toLowerCase()) {
            case 'todo':
                return 'To Do';
            case 'in_progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            case 'on_hold':
                return 'On Hold';
            default:
                return status || 'Unknown';
        }
    },

    /**
     * Format task priority for display
     */
    formatPriority: (priority: string): string => {
        switch (priority?.toLowerCase()) {
            case 'low':
                return 'Low';
            case 'medium':
                return 'Medium';
            case 'high':
                return 'High';
            case 'urgent':
                return 'Urgent';
            default:
                return priority || 'Medium';
        }
    },

    /**
     * Check if task is overdue
     */
    isOverdue: (task: Task): boolean => {
        if (!task.end_date) return false;
        const dueDate = new Date(task.end_date);
        const now = new Date();
        return dueDate < now && task.status !== 'completed';
    },

    /**
     * Check if task is due soon (within 24 hours)
     */
    isDueSoon: (task: Task): boolean => {
        if (!task.end_date) return false;
        const dueDate = new Date(task.end_date);
        const now = new Date();
        const timeDiff = dueDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff <= 24 && hoursDiff > 0 && task.status !== 'completed';
    },

    /**
     * Calculate task completion percentage
     */
    getCompletionPercentage: (task: Task, subtasks?: Subtask[]): number => {
        if (task.status === 'completed') return 100;
        if (task.status === 'todo' || task.status === 'pending') return 0;

        // If subtasks exist, calculate based on completed subtasks
        if (subtasks && subtasks.length > 0) {
            const completedSubtasks = subtasks.filter(st => st.status === 'completed');
            return Math.round((completedSubtasks.length / subtasks.length) * 100);
        }

        // Otherwise estimate based on status
        switch (task.status?.toLowerCase()) {
            case 'in_progress':
                return 50;
            case 'on_hold':
                return 25;
            default:
                return 0;
        }
    },

    /**
     * Get task progress color
     */
    getProgressColor: (percentage: number): string => {
        if (percentage >= 100) return 'green';
        if (percentage >= 75) return 'blue';
        if (percentage >= 50) return 'yellow';
        if (percentage >= 25) return 'orange';
        return 'red';
    },

    /**
     * Sort tasks by priority
     */
    sortByPriority: (tasks: Task[]): Task[] => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return [...tasks].sort((a, b) => {
            const priorityA = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] || 2;
            const priorityB = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] || 2;
            return priorityB - priorityA;
        });
    },

    /**
     * Sort tasks by due date
     */
    sortByDueDate: (tasks: Task[]): Task[] => {
        return [...tasks].sort((a, b) => {
            if (!a.end_date && !b.end_date) return 0;
            if (!a.end_date) return 1;
            if (!b.end_date) return -1;
            return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        });
    },

    /**
     * Filter tasks by status
     */
    filterByStatus: (tasks: Task[], status: string): Task[] => {
        return tasks.filter(task => task.status?.toLowerCase() === status.toLowerCase());
    },

    /**
     * Filter tasks by priority
     */
    filterByPriority: (tasks: Task[], priority: string): Task[] => {
        return tasks.filter(task => task.priority?.toLowerCase() === priority.toLowerCase());
    },

    /**
     * Filter overdue tasks
     */
    filterOverdue: (tasks: Task[]): Task[] => {
        return tasks.filter(task => taskUtils.isOverdue(task));
    },

    /**
     * Filter tasks due soon
     */
    filterDueSoon: (tasks: Task[]): Task[] => {
        return tasks.filter(task => taskUtils.isDueSoon(task));
    },

    /**
     * Get task statistics
     */
    getTaskStats: (tasks: Task[]) => {
        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            todo: tasks.filter(t => t.status === 'todo' || t.status === 'pending').length,
            overdue: tasks.filter(t => taskUtils.isOverdue(t)).length,
            dueSoon: tasks.filter(t => taskUtils.isDueSoon(t)).length,
            onHold: tasks.filter(t => t.status === 'on_hold').length,
            cancelled: tasks.filter(t => t.status === 'cancelled').length,
        };

        return {
            ...stats,
            completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
            activeRate: stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0,
        };
    },

    /**
     * Calculate estimated hours remaining
     */
    getEstimatedHoursRemaining: (task: Task): number => {
        // Task type doesn't have estimated_hours, returning 0 for now
        // This would need to be implemented based on actual schema
        return 0;
    },

    /**
     * Check if task is on track (actual vs estimated hours)
     */
    isOnTrack: (task: Task): boolean => {
        // Task type doesn't have these fields, returning true for now
        // This would need to be implemented based on actual schema
        return true;
    },

    /**
     * Format date for display
     */
    formatDate: (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    },

    /**
     * Format time for display
     */
    formatTime: (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    },

    /**
     * Format duration in hours
     */
    formatDuration: (hours: number): string => {
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    },

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    getRelativeTime: (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

        return taskUtils.formatDate(dateString);
    },

    /**
     * Validate task data
     */
    validateTask: (task: TaskInsert | TaskUpdate): string[] => {
        const errors: string[] = [];

        if ('name' in task && (!task.name || task.name.trim().length === 0)) {
            errors.push('Task name is required');
        }

        if ('name' in task && task.name && task.name.length > 255) {
            errors.push('Task name must be less than 255 characters');
        }

        if ('end_date' in task && task.end_date) {
            const dueDate = new Date(task.end_date);
            if (isNaN(dueDate.getTime())) {
                errors.push('Invalid due date format');
            }
        }

        return errors;
    }
};
