import { createServerClient } from '@/lib/supabase';
import { serverFetchByBusiness, serverDeleteWithBusinessCheck, serverUpdateWithBusinessCheck, serverInsertWithBusiness } from '@/lib/db';
import { ProjectIssue, ProjectIssueInsert, ProjectIssueUpdate, ProjectIssueWithDetails } from '@/types/projects-issues';

/**
 * Server-side utility to get all project issues for a business
 * Replaces server action for API route usage
 */
export async function getProjectIssuesServer(businessId: string): Promise<ProjectIssue[]> {
    try {
        const result = await serverFetchByBusiness('project_issues', businessId);
        if (result.error || !result.data) {
            console.error('Error fetching project issues:', result.error);
            return [];
        }
        return Array.isArray(result.data) ? (result.data as unknown as ProjectIssue[]) : [result.data as unknown as ProjectIssue];
    } catch (error) {
        console.error('Error in getProjectIssuesServer:', error);
        return [];
    }
}

/**
 * Server-side utility to get a project issue by ID
 * Replaces server action for API route usage
 */
export async function getProjectIssueByIdServer(businessId: string, id: string): Promise<ProjectIssue | null> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return null;
        }

        const { data, error } = await supabase
            .from('project_issues')
            .select('*')
            .eq('business_id', businessId)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching project issue by ID:', error);
            if (error.code === 'PGRST116') {
                throw new Error('Issue not found');
            }
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getProjectIssueByIdServer:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            throw error;
        }
        return null;
    }
}

/**
 * Server-side utility to create a project issue
 * Replaces server action for API route usage
 */
export async function createProjectIssueServer(businessId: string, userId: string, issue: ProjectIssueInsert): Promise<ProjectIssue | null> {
    try {
        const issueData = {
            ...issue,
            business_id: businessId,
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await serverInsertWithBusiness(
            'project_issues',
            issueData,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error creating project issue:', result.error);
            return null;
        }

        const insertedIssue = Array.isArray(result.data) ? result.data[0] : result.data;
        return insertedIssue;
    } catch (error) {
        console.error('Error in createProjectIssueServer:', error);
        return null;
    }
}

/**
 * Server-side utility to update a project issue
 * Replaces server action for API route usage
 */
export async function updateProjectIssueServer(businessId: string, userId: string, id: string, issue: ProjectIssueUpdate): Promise<ProjectIssue | null> {
    try {
        const updateData = {
            ...issue,
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const result = await serverUpdateWithBusinessCheck(
            'project_issues',
            id,
            updateData,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error updating project issue:', result.error);
            if (result.error.message && result.error.message.includes('not found')) {
                throw new Error('Issue not found');
            }
            return null;
        }

        const updatedIssue = Array.isArray(result.data) ? result.data[0] : result.data;
        return updatedIssue;
    } catch (error) {
        console.error('Error in updateProjectIssueServer:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            throw error;
        }
        return null;
    }
}

/**
 * Server-side utility to delete a project issue
 * Replaces server action for API route usage
 */
export async function deleteProjectIssueServer(businessId: string, userId: string, id: string): Promise<boolean> {
    try {
        const result = await serverDeleteWithBusinessCheck('project_issues', id, businessId);
        return !result.error;
    } catch (error) {
        console.error('Error in deleteProjectIssueServer:', error);
        return false;
    }
}

/**
 * Server-side utility to search project issues
 * Replaces server action for API route usage
 */
export async function searchProjectIssuesServer(businessId: string, query: string): Promise<ProjectIssue[]> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return [];
        }

        const { data, error } = await supabase
            .from('project_issues')
            .select('*')
            .eq('business_id', businessId)
            .or(`title.ilike.%${query}%,description.ilike.%${query}%,status.ilike.%${query}%,priority.ilike.%${query}%`);

        if (error) {
            console.error('Error searching project issues:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in searchProjectIssuesServer:', error);
        return [];
    }
}

/**
 * Server-side utility to get project issues with details by project ID
 * Replaces server action for API route usage
 */
export async function getProjectIssuesWithDetailsByProjectIdServer(businessId: string, projectId: string): Promise<ProjectIssueWithDetails[]> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return [];
        }

        const { data, error } = await supabase
            .from('project_issues')
            .select(`
                *,
                assigned_to_profile:profiles!project_issues_assigned_to_fkey(full_name),
                project:projects(name)
            `)
            .eq('business_id', businessId)
            .eq('project_id', projectId);

        if (error) {
            console.error('Error fetching project issues with details:', error);
            return [];
        }

        // Transform the data to match ProjectIssueWithDetails type
        const transformedData = data?.map(issue => ({
            ...issue,
            assigned_to_name: issue.assigned_to_profile?.full_name || 'Unassigned',
            project_name: issue.project?.name || 'Unknown Project'
        })) || [];

        return transformedData;
    } catch (error) {
        console.error('Error in getProjectIssuesWithDetailsByProjectIdServer:', error);
        return [];
    }
}
