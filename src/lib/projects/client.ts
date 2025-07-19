import { Project } from '@/types/projects';

/**
 * Client-side utility to fetch projects from API
 * Replaces direct server action calls
 */
export async function getProjectsClient(): Promise<Project[]> {
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

/**
 * Client-side utility to get a project by ID
 * Replaces direct server action calls
 */
export async function getProjectByIdClient(id: string): Promise<Project | null> {
    try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching project by ID:', error);
        return null;
    }
}
