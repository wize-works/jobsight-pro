import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneUpdate } from '@/types/project_milestones';

/**
 * Client-side utility to create a project milestone
 * Replaces direct server action calls
 */
export async function createProjectMilestoneClient(milestone: ProjectMilestoneInsert): Promise<ProjectMilestone | null> {
    try {
        const response = await fetch('/api/project-milestones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(milestone),
        });

        if (!response.ok) {
            throw new Error('Failed to create milestone');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating milestone:', error);
        return null;
    }
}

/**
 * Client-side utility to update a project milestone
 * Replaces direct server action calls
 */
export async function updateProjectMilestoneClient(id: string, milestone: ProjectMilestoneUpdate): Promise<ProjectMilestone | null> {
    try {
        const response = await fetch(`/api/project-milestones/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(milestone),
        });

        if (!response.ok) {
            throw new Error('Failed to update milestone');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating milestone:', error);
        return null;
    }
}
