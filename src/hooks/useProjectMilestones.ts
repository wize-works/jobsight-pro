import { useState, useCallback } from 'react';
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneUpdate } from '@/types/project_milestones';
import { db } from '@/lib/offline/dexie-db';
import { useBusiness } from '@/lib/business-context';

interface UseProjectMilestonesResult {
    milestones: ProjectMilestone[];
    loading: boolean;
    error: string | null;
    getMilestonesByProject: (projectId: string) => Promise<{ success: boolean; milestones?: ProjectMilestone[]; error?: string; }>;
    createMilestone: (milestone: ProjectMilestoneInsert) => Promise<{ success: boolean; milestone?: ProjectMilestone; error?: string; }>;
    updateMilestone: (id: string, updates: ProjectMilestoneUpdate) => Promise<{ success: boolean; milestone?: ProjectMilestone; error?: string; }>;
    deleteMilestone: (id: string) => Promise<{ success: boolean; error?: string; }>;
    refreshMilestones: (projectId?: string) => Promise<void>;
}

export function useProjectMilestones(): UseProjectMilestonesResult {
    const { businessId } = useBusiness();
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshMilestones = useCallback(async (projectId?: string) => {
        if (!businessId) return;

        try {
            let query = db.projectMilestones.where('business_id').equals(businessId);

            if (projectId) {
                query = query.and(milestone => milestone.project_id === projectId);
            }

            const fetchedMilestones = await query.toArray();
            setMilestones(fetchedMilestones);
        } catch (err) {
            console.error('Error refreshing milestones:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh milestones');
        }
    }, [businessId]);

    const getMilestonesByProject = useCallback(async (projectId: string) => {
        if (!businessId || !projectId) {
            return { success: false, error: 'Business ID and Project ID are required' };
        }

        try {
            setLoading(true);
            setError(null);

            const projectMilestones = await db.projectMilestones
                .where('business_id')
                .equals(businessId)
                .and(milestone => milestone.project_id === projectId)
                .toArray();

            setMilestones(projectMilestones);
            return { success: true, milestones: projectMilestones };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch milestones';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    const createMilestone = useCallback(async (milestoneData: ProjectMilestoneInsert) => {
        if (!businessId) {
            return { success: false, error: 'Business ID is required' };
        }

        try {
            setLoading(true);
            setError(null);

            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            const newMilestone: ProjectMilestone = {
                ...milestoneData,
                id,
                business_id: businessId,
                description: milestoneData.description || null,
                due_date: milestoneData.due_date || null,
                status: milestoneData.status || 'planned',
                created_at: now,
                updated_at: now,
                created_by: null, // Will be set by server sync
                updated_by: null // Will be set by server sync
            };

            await db.projectMilestones.add(newMilestone);

            // Refresh milestones for the project
            await refreshMilestones(newMilestone.project_id);

            return { success: true, milestone: newMilestone };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create milestone';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [businessId, refreshMilestones]);

    const updateMilestone = useCallback(async (id: string, updates: ProjectMilestoneUpdate) => {
        if (!businessId) {
            return { success: false, error: 'Business ID is required' };
        }

        try {
            setLoading(true);
            setError(null);

            const existingMilestone = await db.projectMilestones.get(id);
            if (!existingMilestone) {
                return { success: false, error: 'Milestone not found' };
            }

            const updatedMilestone = {
                ...existingMilestone,
                ...updates,
                updated_at: new Date().toISOString()
            };

            await db.projectMilestones.update(id, updatedMilestone);

            // Refresh milestones for the project
            await refreshMilestones(existingMilestone.project_id);

            return { success: true, milestone: updatedMilestone };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update milestone';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [businessId, refreshMilestones]);

    const deleteMilestone = useCallback(async (id: string) => {
        if (!businessId) {
            return { success: false, error: 'Business ID is required' };
        }

        try {
            setLoading(true);
            setError(null);

            const existingMilestone = await db.projectMilestones.get(id);
            if (!existingMilestone) {
                return { success: false, error: 'Milestone not found' };
            }

            await db.projectMilestones.delete(id);

            // Refresh milestones for the project
            await refreshMilestones(existingMilestone.project_id);

            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete milestone';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [businessId, refreshMilestones]);

    return {
        milestones,
        loading,
        error,
        getMilestonesByProject,
        createMilestone,
        updateMilestone,
        deleteMilestone,
        refreshMilestones
    };
}
