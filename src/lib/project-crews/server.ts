import { createServerClient } from '@/lib/supabase';
import { serverFetchByBusiness, serverDeleteWithBusinessCheck, serverUpdateWithBusinessCheck, serverInsertWithBusiness } from '@/lib/db';
import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate } from '@/types/project-crews';

/**
 * Server-side utility to get all project crews for a business
 * Replaces server action for API route usage
 */
export async function getProjectCrewsServer(businessId: string): Promise<ProjectCrew[]> {
    try {
        const result = await serverFetchByBusiness('project_crews', businessId);
        if (result.error || !result.data) {
            console.error('Error fetching project crews:', result.error);
            return [];
        }
        // Type assertion since we know this is the correct data when no error
        return Array.isArray(result.data) ? (result.data as unknown as ProjectCrew[]) : [result.data as unknown as ProjectCrew];
    } catch (error) {
        console.error('Error in getProjectCrewsServer:', error);
        return [];
    }
}

/**
 * Server-side utility to get a project crew by ID
 * Replaces server action for API route usage
 */
export async function getProjectCrewByIdServer(businessId: string, id: string): Promise<ProjectCrew | null> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return null;
        }

        const { data, error } = await supabase
            .from('project_crews')
            .select(`
                *,
                crew:crews(id, name, description),
                project:projects(id, name, description)
            `)
            .eq('business_id', businessId)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching project crew by ID:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getProjectCrewByIdServer:', error);
        return null;
    }
}

/**
 * Server-side utility to create a project crew
 * Replaces server action for API route usage
 */
export async function createProjectCrewServer(businessId: string, userId: string, crew: ProjectCrewInsert): Promise<ProjectCrew | null> {
    try {
        const crewData = {
            ...crew,
            business_id: businessId,
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await serverInsertWithBusiness(
            'project_crews',
            crewData,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error creating project crew:', result.error);
            return null;
        }

        const insertedCrew = Array.isArray(result.data) ? result.data[0] : result.data;
        return insertedCrew;
    } catch (error) {
        console.error('Error in createProjectCrewServer:', error);
        return null;
    }
}

/**
 * Server-side utility to update a project crew
 * Replaces server action for API route usage
 */
export async function updateProjectCrewServer(businessId: string, userId: string, id: string, crew: ProjectCrewUpdate): Promise<ProjectCrew | null> {
    try {
        const updateData = {
            ...crew,
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const result = await serverUpdateWithBusinessCheck(
            'project_crews',
            id,
            updateData,
            businessId,
            userId
        );

        if (result.error) {
            console.error('Error updating project crew:', result.error);
            return null;
        }

        const updatedCrew = Array.isArray(result.data) ? result.data[0] : result.data;
        return updatedCrew;
    } catch (error) {
        console.error('Error in updateProjectCrewServer:', error);
        return null;
    }
}

/**
 * Server-side utility to delete a project crew
 * Replaces server action for API route usage
 */
export async function deleteProjectCrewServer(businessId: string, userId: string, id: string): Promise<boolean> {
    try {
        const result = await serverDeleteWithBusinessCheck('project_crews', id, businessId);
        return !result.error;
    } catch (error) {
        console.error('Error in deleteProjectCrewServer:', error);
        return false;
    }
}

/**
 * Server-side utility to search project crews
 * Replaces server action for API route usage
 */
export async function searchProjectCrewsServer(businessId: string, query: string): Promise<ProjectCrew[]> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return [];
        }

        const { data, error } = await supabase
            .from('project_crews')
            .select(`
                *,
                crew:crews(id, name, description),
                project:projects(id, name, description)
            `)
            .eq('business_id', businessId)
            .or(`crew.name.ilike.%${query}%,project.name.ilike.%${query}%,role.ilike.%${query}%`);

        if (error) {
            console.error('Error searching project crews:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in searchProjectCrewsServer:', error);
        return [];
    }
}

/**
 * Server-side utility to add a crew to a project (simple assignment)
 * Replaces server action for API route usage
 */
export async function addCrewToProjectServer(businessId: string, userId: string, projectId: string, crewId: string): Promise<ProjectCrew | null> {
    try {
        const crewData: Partial<ProjectCrewInsert> = {
            business_id: businessId,
            project_id: projectId,
            crew_id: crewId,
            start_date: new Date().toISOString().split('T')[0], // Default to today
            created_by: userId,
            updated_by: userId
        };

        return await createProjectCrewServer(businessId, userId, crewData as ProjectCrewInsert);
    } catch (error) {
        console.error('Error in addCrewToProjectServer:', error);
        return null;
    }
}

/**
 * Server-side utility to remove a crew from a project
 * Replaces server action for API route usage
 */
export async function removeCrewFromProjectServer(businessId: string, userId: string, projectId: string, crewId: string): Promise<boolean> {
    try {
        const supabase = await createServerClient();
        if (!supabase) {
            console.error('Failed to create Supabase client');
            return false;
        }

        const { error } = await supabase
            .from('project_crews')
            .delete()
            .eq('business_id', businessId)
            .eq('project_id', projectId)
            .eq('crew_id', crewId);

        if (error) {
            console.error('Error removing crew from project:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in removeCrewFromProjectServer:', error);
        return false;
    }
}
