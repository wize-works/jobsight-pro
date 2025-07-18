import type { Project, ProjectInsert, ProjectUpdate, ProjectWithDetails } from '@/types/projects';

// Project API client utilities
export interface ProjectsResponse {
    success: boolean;
    data: Project[];
    pagination: {
        count: number;
        total: number | null;
        limit: number | null;
        offset: number;
        hasMore: boolean;
    };
}

export interface ProjectDetailsResponse {
    project: Project;
    milestones: any[];
    tasks: any[];
    crews: any[];
    projectCrews: any[];
    issues: any[];
    client: any | null;
    contacts: any[];
    manager: any | null;
    stats: {
        totalTasks: number;
        completedTasks: number;
        totalMilestones: number;
        completedMilestones: number;
        totalIssues: number;
        openIssues: number;
        totalCrews: number;
    };
}

export interface ProjectProfitabilityResponse {
    projects: any[];
    summary: {
        totalProjects: number;
        totalBudget: number;
        totalSpend: number;
        totalProfit: number;
        averageMargin: number;
        profitableProjects: number;
        unprofitableProjects: number;
        atRiskProjects: number;
    };
}

/**
 * Get all projects
 */
export async function getProjects(options?: {
    includeDetails?: boolean;
    search?: string;
}): Promise<Project[] | ProjectWithDetails[]> {
    const params = new URLSearchParams();

    if (options?.includeDetails) {
        params.append('include', 'details');
    }

    if (options?.search) {
        params.append('search', options.search);
    }

    const response = await fetch(`/api/projects?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
    }

    return result.data || [];
}

/**
 * Get project by ID
 */
export async function getProjectById(
    projectId: string,
    options?: {
        includeDetails?: boolean;
    }
): Promise<Project | ProjectDetailsResponse> {
    const params = new URLSearchParams();

    if (options?.includeDetails) {
        params.append('includeDetails', 'true');
    }

    const response = await fetch(`/api/projects/${projectId}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Create a new project
 */
export async function createProject(projectData: ProjectInsert): Promise<Project> {
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
    });

    if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
    }

    return result.data;
}

/**
 * Update a project
 */
export async function updateProject(
    projectId: string,
    projectData: ProjectUpdate,
    options?: {
        progressOnly?: boolean;
    }
): Promise<Project> {
    const params = new URLSearchParams();

    if (options?.progressOnly) {
        params.append('progressOnly', 'true');
    }

    const response = await fetch(`/api/projects/${projectId}?${params.toString()}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
    });

    if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Failed to update project');
    }

    return result.data;
}

/**
 * Update project progress
 */
export async function updateProjectProgress(
    projectId: string,
    progress: number
): Promise<Project> {
    return updateProject(projectId, { progress } as ProjectUpdate, { progressOnly: true });
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get projects by client ID
 */
export async function getProjectsByClientId(clientId: string): Promise<Project[]> {
    const response = await fetch(`/api/projects/client/${clientId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch projects for client: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Search projects
 */
export async function searchProjects(query: string): Promise<Project[]> {
    return getProjects({ search: query }) as Promise<Project[]>;
}

/**
 * Get project profitability data
 */
export async function getProjectProfitability(filters?: {
    status?: string;
    clientId?: string;
    riskLevel?: string;
    startDate?: string;
    endDate?: string;
}): Promise<ProjectProfitabilityResponse> {
    const params = new URLSearchParams();

    if (filters?.status) {
        params.append('status', filters.status);
    }

    if (filters?.clientId) {
        params.append('clientId', filters.clientId);
    }

    if (filters?.riskLevel) {
        params.append('riskLevel', filters.riskLevel);
    }

    if (filters?.startDate) {
        params.append('startDate', filters.startDate);
    }

    if (filters?.endDate) {
        params.append('endDate', filters.endDate);
    }

    const response = await fetch(`/api/projects/profitability?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch project profitability: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get projects with details (combines project data with related information)
 */
export async function getProjectsWithDetails(): Promise<ProjectWithDetails[]> {
    return getProjects({ includeDetails: true }) as Promise<ProjectWithDetails[]>;
}

/**
 * Get project details by ID (includes all related data)
 */
export async function getProjectDetailsByID(projectId: string): Promise<ProjectDetailsResponse> {
    return getProjectById(projectId, { includeDetails: true }) as Promise<ProjectDetailsResponse>;
}

// Utility functions for file operations
export async function downloadProjectFile(url: string, filename: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
}

export function generateProjectFilename(project: Project, extension: string = 'pdf'): string {
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `project_${sanitizedName}_${timestamp}.${extension}`;
}
