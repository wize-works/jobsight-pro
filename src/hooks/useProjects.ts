import { useState, useEffect } from 'react';
import type { Project, ProjectInsert, ProjectUpdate, ProjectWithDetails } from '@/types/projects';
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    updateProjectProgress,
    deleteProject,
    getProjectsByClientId,
    searchProjects,
    getProjectProfitability,
    getProjectsWithDetails,
    getProjectDetailsByID
} from '@/lib/api/projects';
import type { ProjectDetailsResponse, ProjectProfitabilityResponse } from '@/lib/api/projects';

// Hook for managing all projects
export function useProjects(options?: {
    includeDetails?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
}) {
    const [projects, setProjects] = useState<Project[] | ProjectWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await getProjects(options);
            setProjects(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch projects');
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [options?.includeDetails]);

    useEffect(() => {
        if (options?.autoRefresh && options?.refreshInterval) {
            const interval = setInterval(fetchProjects, options.refreshInterval);
            return () => clearInterval(interval);
        }
    }, [options?.autoRefresh, options?.refreshInterval]);

    return {
        projects,
        loading,
        error,
        refetch: fetchProjects,
    };
}

// Hook for managing a single project
export function useProject(projectId: string, options?: {
    includeDetails?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
}) {
    const [project, setProject] = useState<Project | ProjectDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const data = await getProjectById(projectId, options);
            setProject(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch project');
            console.error('Error fetching project:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId, options?.includeDetails]);

    useEffect(() => {
        if (options?.autoRefresh && options?.refreshInterval && projectId) {
            const interval = setInterval(fetchProject, options.refreshInterval);
            return () => clearInterval(interval);
        }
    }, [options?.autoRefresh, options?.refreshInterval, projectId]);

    return {
        project,
        loading,
        error,
        refetch: fetchProject,
    };
}

// Hook for project mutations (create, update, delete)
export function useProjectMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createProjectMutation = async (projectData: ProjectInsert): Promise<Project | null> => {
        try {
            setLoading(true);
            setError(null);
            const project = await createProject(projectData);
            return project;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
            setError(errorMessage);
            console.error('Error creating project:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateProjectMutation = async (
        projectId: string,
        projectData: ProjectUpdate,
        options?: { progressOnly?: boolean }
    ): Promise<Project | null> => {
        try {
            setLoading(true);
            setError(null);
            const project = await updateProject(projectId, projectData, options);
            return project;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
            setError(errorMessage);
            console.error('Error updating project:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateProgressMutation = async (
        projectId: string,
        progress: number
    ): Promise<Project | null> => {
        try {
            setLoading(true);
            setError(null);
            const project = await updateProjectProgress(projectId, progress);
            return project;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update project progress';
            setError(errorMessage);
            console.error('Error updating project progress:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteProjectMutation = async (projectId: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);
            const result = await deleteProject(projectId);
            return result.success;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
            setError(errorMessage);
            console.error('Error deleting project:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        createProject: createProjectMutation,
        updateProject: updateProjectMutation,
        updateProgress: updateProgressMutation,
        deleteProject: deleteProjectMutation,
        loading,
        error,
    };
}

// Hook for projects by client
export function useProjectsByClient(clientId: string) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjectsByClient = async () => {
        try {
            setLoading(true);
            const data = await getProjectsByClientId(clientId);
            setProjects(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch projects for client');
            console.error('Error fetching projects by client:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchProjectsByClient();
        }
    }, [clientId]);

    return {
        projects,
        loading,
        error,
        refetch: fetchProjectsByClient,
    };
}

// Hook for project search
export function useProjectSearch() {
    const [results, setResults] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await searchProjects(query);
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search projects');
            console.error('Error searching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => {
        setResults([]);
        setError(null);
    };

    return {
        results,
        loading,
        error,
        search,
        clearResults,
    };
}

// Hook for project profitability
export function useProjectProfitability(filters?: {
    status?: string;
    clientId?: string;
    riskLevel?: string;
    startDate?: string;
    endDate?: string;
}) {
    const [data, setData] = useState<ProjectProfitabilityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfitability = async () => {
        try {
            setLoading(true);
            const profitabilityData = await getProjectProfitability(filters);
            setData(profitabilityData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch project profitability');
            console.error('Error fetching project profitability:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfitability();
    }, [filters?.status, filters?.clientId, filters?.riskLevel, filters?.startDate, filters?.endDate]);

    return {
        data,
        loading,
        error,
        refetch: fetchProfitability,
    };
}

// Hook for projects with details
export function useProjectsWithDetails() {
    const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjectsWithDetails = async () => {
        try {
            setLoading(true);
            const data = await getProjectsWithDetails();
            setProjects(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch projects with details');
            console.error('Error fetching projects with details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectsWithDetails();
    }, []);

    return {
        projects,
        loading,
        error,
        refetch: fetchProjectsWithDetails,
    };
}

// Hook for project details by ID
export function useProjectDetails(projectId: string) {
    const [projectDetails, setProjectDetails] = useState<ProjectDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            const data = await getProjectDetailsByID(projectId);
            setProjectDetails(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch project details');
            console.error('Error fetching project details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProjectDetails();
        }
    }, [projectId]);

    return {
        projectDetails,
        loading,
        error,
        refetch: fetchProjectDetails,
    };
}

// Combined hook for all project operations
export function useProjectOperations() {
    const mutations = useProjectMutations();
    const search = useProjectSearch();

    return {
        ...mutations,
        ...search,
    };
}
