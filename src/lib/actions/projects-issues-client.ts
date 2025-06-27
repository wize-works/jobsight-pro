/**
 * Client-Side Project Issues Actions
 * 
 * Replaces src/app/actions/projects-issues.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for project issues
type ProjectIssue = Database['public']['Tables']['project_issues']['Row'];
type ProjectIssueInsert = Database['public']['Tables']['project_issues']['Insert'];
type ProjectIssueUpdate = Partial<Database['public']['Tables']['project_issues']['Update']> & { id: string };

// Create client-side project issue actions
const insertProjectIssue = createInsertAction('project_issues', 'high');
const updateProjectIssue = createUpdateAction('project_issues', 'high');
const deleteProjectIssue = createDeleteAction('project_issues', 'high');
const selectProjectIssues = createSelectAction('project_issues');

/**
 * Get all project issues for a business - works offline
 */
export const getProjectIssues = async (businessId: string): Promise<ProjectIssue[]> => {
    try {
        const result = await selectProjectIssues({}, businessId);

        if (result.error) {
            console.error("Error fetching project issues:", result.error);
            return [];
        }

        return (result.data || []) as ProjectIssue[];
    } catch (err) {
        console.error("Error in getProjectIssues:", err);
        return [];
    }
};

/**
 * Get project issue by ID - works offline
 */
export const getProjectIssueById = async (businessId: string, id: string): Promise<ProjectIssue | null> => {
    try {
        const result = await selectProjectIssues({ id }, businessId);

        if (result.error) {
            console.error("Error fetching project issue:", result.error);
            return null;
        }

        const issues = (result.data || []) as ProjectIssue[];
        return issues.length > 0 ? issues[0] : null;
    } catch (err) {
        console.error("Error in getProjectIssueById:", err);
        return null;
    }
};

/**
 * Create new project issue - works offline
 */
export const createProjectIssue = async (
    businessId: string,
    issue: Omit<ProjectIssueInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<ProjectIssue | null> => {
    try {
        const newIssue: ProjectIssueInsert = {
            ...issue,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertProjectIssue(newIssue, businessId);

        if (result.error) {
            console.error("Error creating project issue:", result.error);
            return null;
        }

        return result.data as ProjectIssue;
    } catch (err) {
        console.error("Error in createProjectIssue:", err);
        return null;
    }
};

/**
 * Update project issue - works offline
 */
export const updateProjectIssueById = async (
    businessId: string,
    id: string,
    updates: Partial<ProjectIssueUpdate>
): Promise<ProjectIssue | null> => {
    try {
        const updateData: ProjectIssueUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateProjectIssue(updateData, businessId);

        if (result.error) {
            console.error("Error updating project issue:", result.error);
            return null;
        }

        return result.data as ProjectIssue;
    } catch (err) {
        console.error("Error in updateProjectIssueById:", err);
        return null;
    }
};

/**
 * Delete project issue - works offline
 */
export const deleteProjectIssueById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteProjectIssue({ id }, businessId);

        if (result.error) {
            console.error("Error deleting project issue:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteProjectIssueById:", err);
        return false;
    }
};

/**
 * Get project issues by project ID - works offline
 */
export const getProjectIssuesByProjectId = async (businessId: string, projectId: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        return allIssues.filter(issue => issue.project_id === projectId);
    } catch (err) {
        console.error("Error in getProjectIssuesByProjectId:", err);
        return [];
    }
};

/**
 * Get project issues by status - works offline
 */
export const getProjectIssuesByStatus = async (businessId: string, status: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        return allIssues.filter(issue => issue.status === status);
    } catch (err) {
        console.error("Error in getProjectIssuesByStatus:", err);
        return [];
    }
};

/**
 * Get project issues by priority - works offline
 */
export const getProjectIssuesByPriority = async (businessId: string, priority: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        return allIssues.filter(issue => issue.priority === priority);
    } catch (err) {
        console.error("Error in getProjectIssuesByPriority:", err);
        return [];
    }
};

/**
 * Get project issues assigned to user - works offline
 */
export const getProjectIssuesAssignedTo = async (businessId: string, userId: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        return allIssues.filter(issue => issue.assigned_to === userId);
    } catch (err) {
        console.error("Error in getProjectIssuesAssignedTo:", err);
        return [];
    }
};

/**
 * Get project issues reported by user - works offline
 */
export const getProjectIssuesReportedBy = async (businessId: string, userId: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        return allIssues.filter(issue => issue.reported_by === userId);
    } catch (err) {
        console.error("Error in getProjectIssuesReportedBy:", err);
        return [];
    }
};

/**
 * Search project issues by title or description - works offline
 */
export const searchProjectIssues = async (businessId: string, query: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        const searchTerm = query.toLowerCase();

        return allIssues.filter((issue: ProjectIssue) =>
            issue.title?.toLowerCase().includes(searchTerm) ||
            issue.description?.toLowerCase().includes(searchTerm)
        );
    } catch (err) {
        console.error("Error in searchProjectIssues:", err);
        return [];
    }
};

/**
 * Get open project issues - works offline
 */
export const getOpenProjectIssues = async (businessId: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        const openStatuses = ['open', 'in_progress', 'pending'];
        return allIssues.filter(issue => openStatuses.includes(issue.status || ''));
    } catch (err) {
        console.error("Error in getOpenProjectIssues:", err);
        return [];
    }
};

/**
 * Get high priority project issues - works offline
 */
export const getHighPriorityProjectIssues = async (businessId: string): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        const highPriorities = ['high', 'critical', 'urgent'];
        return allIssues.filter(issue => highPriorities.includes(issue.priority || ''));
    } catch (err) {
        console.error("Error in getHighPriorityProjectIssues:", err);
        return [];
    }
};

/**
 * Get project issues for date range - works offline
 */
export const getProjectIssuesForDateRange = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<ProjectIssue[]> => {
    try {
        const allIssues = await getProjectIssues(businessId);
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allIssues.filter(issue => {
            if (!issue.reported_date) return false;
            const reportedDate = new Date(issue.reported_date).getTime();
            return reportedDate >= start && reportedDate <= end;
        });
    } catch (err) {
        console.error("Error in getProjectIssuesForDateRange:", err);
        return [];
    }
};

/**
 * Assign project issue to user - works offline
 */
export const assignProjectIssue = async (businessId: string, issueId: string, userId: string): Promise<boolean> => {
    try {
        const updated = await updateProjectIssueById(businessId, issueId, {
            assigned_to: userId,
            status: 'assigned'
        });

        return updated !== null;
    } catch (err) {
        console.error("Error in assignProjectIssue:", err);
        return false;
    }
};

/**
 * Resolve project issue - works offline
 */
export const resolveProjectIssue = async (businessId: string, issueId: string, resolution: string): Promise<boolean> => {
    try {
        const updated = await updateProjectIssueById(businessId, issueId, {
            status: 'resolved',
            resolution: resolution
        });

        return updated !== null;
    } catch (err) {
        console.error("Error in resolveProjectIssue:", err);
        return false;
    }
};

/**
 * Close project issue - works offline
 */
export const closeProjectIssue = async (businessId: string, issueId: string): Promise<boolean> => {
    try {
        const updated = await updateProjectIssueById(businessId, issueId, {
            status: 'closed'
        });

        return updated !== null;
    } catch (err) {
        console.error("Error in closeProjectIssue:", err);
        return false;
    }
};

/**
 * Get project issue statistics - works offline
 */
export const getProjectIssueStats = async (businessId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    byProject: Record<string, number>;
    averageResolutionTime: number;
    unassigned: number;
}> => {
    try {
        const issues = await getProjectIssues(businessId);

        const byPriority: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        const byProject: Record<string, number> = {};

        let open = 0;
        let inProgress = 0;
        let resolved = 0;
        let closed = 0;
        let unassigned = 0;
        let totalResolutionTime = 0;
        let resolvedCount = 0;

        issues.forEach(issue => {
            // Track by priority
            const priority = issue.priority || 'none';
            byPriority[priority] = (byPriority[priority] || 0) + 1;

            // Track by status
            const status = issue.status || 'unknown';
            byStatus[status] = (byStatus[status] || 0) + 1;

            // Track by project
            byProject[issue.project_id] = (byProject[issue.project_id] || 0) + 1;

            // Count by status categories
            switch (status) {
                case 'open':
                    open++;
                    break;
                case 'in_progress':
                    inProgress++;
                    break;
                case 'resolved':
                    resolved++;
                    break;
                case 'closed':
                    closed++;
                    break;
            }

            // Count unassigned
            if (!issue.assigned_to) {
                unassigned++;
            }

            // Calculate resolution time
            if (status === 'resolved' && issue.reported_date && issue.updated_at) {
                const reportedTime = new Date(issue.reported_date).getTime();
                const resolvedTime = new Date(issue.updated_at).getTime();
                totalResolutionTime += resolvedTime - reportedTime;
                resolvedCount++;
            }
        });

        return {
            total: issues.length,
            open,
            inProgress,
            resolved,
            closed,
            byPriority,
            byStatus,
            byProject,
            averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
            unassigned
        };
    } catch (err) {
        console.error("Error in getProjectIssueStats:", err);
        return {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0,
            byPriority: {},
            byStatus: {},
            byProject: {},
            averageResolutionTime: 0,
            unassigned: 0
        };
    }
};

/**
 * Validate project issue data
 */
export const validateProjectIssue = (issue: Partial<ProjectIssueInsert>): string[] => {
    const errors: string[] = [];

    if (!issue.project_id || issue.project_id.trim().length === 0) {
        errors.push('Project ID is required');
    }

    if (!issue.title || issue.title.trim().length === 0) {
        errors.push('Issue title is required');
    }

    if (issue.title && issue.title.length > 200) {
        errors.push('Issue title is too long (maximum 200 characters)');
    }

    const validStatuses = ['open', 'in_progress', 'assigned', 'resolved', 'closed', 'cancelled'];
    if (issue.status && !validStatuses.includes(issue.status)) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const validPriorities = ['low', 'medium', 'high', 'critical', 'urgent'];
    if (issue.priority && !validPriorities.includes(issue.priority)) {
        errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    return errors;
};
