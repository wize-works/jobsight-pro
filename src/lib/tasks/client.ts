import { Task, TaskWithDetails } from '@/types/tasks';

/**
 * Client-side utility to fetch tasks from API
 * Replaces direct server action calls
 */
export async function getTasksClient(): Promise<Task[]> {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

/**
 * Client-side utility to fetch tasks with details from API
 * Replaces direct server action calls
 */
export async function getTasksWithDetailsClient(): Promise<TaskWithDetails[]> {
    try {
        const response = await fetch('/api/tasks?withDetails=true');
        if (!response.ok) {
            throw new Error('Failed to fetch tasks with details');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching tasks with details:', error);
        return [];
    }
}

/**
 * Client-side utility to quick update a task
 * Replaces direct server action calls
 */
export async function quickUpdateTaskClient(id: string, updates: any): Promise<Task | null> {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating task:', error);
        return null;
    }
}

/**
 * Client-side utility to delete a task
 * Replaces direct server action calls
 */
export async function deleteTaskClient(id: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
        });

        return response.ok;
    } catch (error) {
        console.error('Error deleting task:', error);
        return false;
    }
}
