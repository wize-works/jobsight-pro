import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate } from '@/types/project-crews';

/**
 * Client-side utility to add a crew to a project
 * Replaces direct server action calls
 */
export async function addCrewToProjectClient(projectId: string, crewId: string): Promise<ProjectCrew | null> {
    try {
        const response = await fetch('/api/project-crews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_id: projectId,
                crew_id: crewId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to add crew to project');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding crew to project:', error);
        return null;
    }
}

/**
 * Client-side utility to remove a crew from a project
 * Replaces direct server action calls
 */
export async function removeCrewFromProjectClient(projectCrewId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/project-crews/${projectCrewId}`, {
            method: 'DELETE',
        });

        return response.ok;
    } catch (error) {
        console.error('Error removing crew from project:', error);
        return false;
    }
}

/**
 * Client-side utility to get crews for a specific project
 * Replaces direct server action calls
 */
export async function getCrewsByProjectIdClient(projectId: string): Promise<ProjectCrew[]> {
    try {
        const response = await fetch(`/api/project-crews?project_id=${projectId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch project crews');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching project crews:', error);
        return [];
    }
}
