import { createServerClient } from '@/lib/supabase';
import { serverFetchByBusiness, serverDeleteWithBusinessCheck, serverUpdateWithBusinessCheck, serverInsertWithBusiness } from '@/lib/db';
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneUpdate } from '@/types/project_milestones';

/**
 * Server-side utility to get all project milestones for a business
 * Replaces server action for API route usage
 */
export async function getProjectMilestonesServer(businessId: string): Promise<ProjectMilestone[]> {
    try {
        const result = await serverFetchByBusiness('project_milestones', businessId);
        if (result.error || !result.data) {
            console.error('Error fetching project milestones:', result.error);
            return [];
        }
        return Array.isArray(result.data) ? (result.data as unknown as ProjectMilestone[]) : [result.data as unknown as ProjectMilestone];
    } catch (error) {
        console.error('Error in getProjectMilestonesServer:', error);
        return [];
    }
}

/**
 * Server-side utility to get a project milestone by ID
 * Replaces server action for API route usage
 */
export async function getProjectMilestoneByIdServer(businessId: string, id: string): Promise<ProjectMilestone | null> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return null;
        }

        const { data, error } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('business_id', businessId)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching project milestone by ID:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getProjectMilestoneByIdServer:', error);
        return null;
    }
}

/**
 * Server-side utility to create a project milestone
 * Replaces server action for API route usage
 */
export async function createProjectMilestoneServer(businessId: string, userId: string, milestone: ProjectMilestoneInsert): Promise<ProjectMilestone | null> {
    try {
        const milestoneData = {
            ...milestone,
            business_id: businessId,
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await serverInsertWithBusiness(
            'project_milestones',
            milestoneData,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error creating project milestone:', result.error);
            return null;
        }

        const insertedMilestone = Array.isArray(result.data) ? result.data[0] : result.data;
        return insertedMilestone;
    } catch (error) {
        console.error('Error in createProjectMilestoneServer:', error);
        return null;
    }
}

/**
 * Server-side utility to update a project milestone
 * Replaces server action for API route usage
 */
export async function updateProjectMilestoneServer(businessId: string, userId: string, id: string, milestone: ProjectMilestoneUpdate): Promise<ProjectMilestone | null> {
    try {
        const updateData = {
            ...milestone,
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const result = await serverUpdateWithBusinessCheck(
            'project_milestones',
            id,
            updateData,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error updating project milestone:', result.error);
            return null;
        }

        const updatedMilestone = Array.isArray(result.data) ? result.data[0] : result.data;
        return updatedMilestone;
    } catch (error) {
        console.error('Error in updateProjectMilestoneServer:', error);
        return null;
    }
}

/**
 * Server-side utility to delete a project milestone
 * Replaces server action for API route usage
 */
export async function deleteProjectMilestoneServer(businessId: string, userId: string, id: string): Promise<boolean> {
    try {
        const result = await serverDeleteWithBusinessCheck('project_milestones', id, businessId);
        return !result.error;
    } catch (error) {
        console.error('Error in deleteProjectMilestoneServer:', error);
        return false;
    }
}

/**
 * Server-side utility to search project milestones
 * Replaces server action for API route usage
 */
export async function searchProjectMilestonesServer(businessId: string, query: string): Promise<ProjectMilestone[]> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return [];
        }

        const { data, error } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('business_id', businessId)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%,status.ilike.%${query}%`);

        if (error) {
            console.error('Error searching project milestones:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in searchProjectMilestonesServer:', error);
        return [];
    }
}

/**
 * Server-side utility to get project milestones by project ID
 * Replaces server action for API route usage
 */
export async function getProjectMilestonesByProjectIdServer(businessId: string, projectId: string): Promise<ProjectMilestone[]> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return [];
        }

        const { data, error } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('business_id', businessId)
            .eq('project_id', projectId)
            .order('due_date', { ascending: true });

        if (error) {
            console.error('Error fetching project milestones by project ID:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getProjectMilestonesByProjectIdServer:', error);
        return [];
    }
}
