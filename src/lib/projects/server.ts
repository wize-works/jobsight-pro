import { createServerClient } from '@/lib/supabase';
import { serverFetchByBusiness, serverDeleteWithBusinessCheck, serverUpdateWithBusinessCheck, serverInsertWithBusiness } from '@/lib/db';
import { Project, ProjectInsert, ProjectUpdate } from '@/types/projects';

/**
 * Server-side utility to get all projects for a business
 * Replaces server action for API route usage
 */
export async function getProjectsServer(businessId: string): Promise<Project[]> {
    try {
        const { data, error } = await serverFetchByBusiness("projects", businessId, "*", {
            orderBy: { column: "name", ascending: true },
        });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data as unknown as Project[];
    } catch (err) {
        console.error("Error in getProjectsServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get a project by ID
 * Replaces server action for API route usage
 */
export async function getProjectByIdServer(businessId: string, id: string): Promise<Project | null> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return null;
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('business_id', businessId)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching project by ID:', error);
            if (error.code === 'PGRST116') {
                throw new Error('Project not found');
            }
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getProjectByIdServer:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            throw error;
        }
        return null;
    }
}

/**
 * Server-side utility to update a project
 * Replaces server action for API route usage
 */
export async function updateProjectServer(businessId: string, userId: string, id: string, project: ProjectUpdate): Promise<Project | null> {
    try {
        const updateData = {
            ...project,
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const result = await serverUpdateWithBusinessCheck(
            'projects',
            id,
            updateData,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error updating project:', result.error);
            return null;
        }

        const updatedProject = Array.isArray(result.data) ? result.data[0] : result.data;
        return updatedProject;
    } catch (error) {
        console.error('Error in updateProjectServer:', error);
        return null;
    }
}

/**
 * Server-side utility to delete a project
 * Replaces server action for API route usage
 */
export async function deleteProjectServer(businessId: string, userId: string, id: string): Promise<boolean> {
    try {
        const result = await serverDeleteWithBusinessCheck('projects', id, businessId);
        return !result.error;
    } catch (error) {
        console.error('Error in deleteProjectServer:', error);
        return false;
    }
}

/**
 * Server-side utility to get project details by ID with additional information
 * Replaces server action for API route usage
 */
export async function getProjectDetailsByIDServer(businessId: string, projectId: string): Promise<any> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return null;
        }

        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                client:clients(id, name, email, phone),
                project_crews!inner(
                    id,
                    crew:crews(id, name, description)
                ),
                project_milestones(
                    id, name, description, due_date, status, progress
                ),
                project_issues(
                    id, title, description, status, priority, reported_date
                )
            `)
            .eq('business_id', businessId)
            .eq('id', projectId)
            .single();

        if (error) {
            console.error('Error fetching project details:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getProjectDetailsByIDServer:', error);
        return null;
    }
}

/**
 * Server-side utility to update project progress
 * Replaces server action for API route usage
 */
export async function updateProjectProgressServer(businessId: string, userId: string, id: string, progress: number): Promise<Project | null> {
    try {
        const updateData: Partial<ProjectUpdate> = {
            progress,
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const result = await serverUpdateWithBusinessCheck(
            'projects',
            id,
            updateData as ProjectUpdate,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error updating project progress:', result.error);
            return null;
        }

        const updatedProject = Array.isArray(result.data) ? result.data[0] : result.data;
        return updatedProject;
    } catch (error) {
        console.error('Error in updateProjectProgressServer:', error);
        return null;
    }
}
