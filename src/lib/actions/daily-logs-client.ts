/**
 * Client-Side Daily Logs Actions
 * 
 * Replaces src/app/actions/daily-logs.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { DailyLog, DailyLogInsert, DailyLogUpdate, DailyLogWithDetails } from "@/types/daily-logs";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Create client-side daily log actions
const insertDailyLog = createInsertAction('daily_logs', 'high');
const updateDailyLogAction = createUpdateAction('daily_logs', 'high');
const deleteDailyLogAction = createDeleteAction('daily_logs', 'high');
const selectDailyLogs = createSelectAction('daily_logs');

/**
 * Get all daily logs for a business - works offline with server fallback
 */
export const getDailyLogs = async (businessId: string): Promise<DailyLog[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectDailyLogs({}, businessId);

        if (result.error) {
            console.error("Error fetching daily logs from IndexedDB:", result.error);
        }

        const clientData = (result.data || []) as DailyLog[];

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Daily logs loaded from IndexedDB: ${clientData.length} logs`);
            return clientData;
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for daily logs...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getDailyLogs: getDailyLogsServer } = await import('@/app/actions/daily-logs');
            const serverData = await getDailyLogsServer(businessId);

            if (serverData.length > 0) {
                console.log(`✅ Daily logs loaded from server: ${serverData.length} logs`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('daily_logs', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} daily logs to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache daily logs data:', cacheError);
                }

                return serverData;
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for daily logs:', serverError);
        }

        console.log('📭 No daily logs found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getDailyLogs:", err);
        return [];
    }
};

/**
 * Get daily log by ID - works offline
 */
export const getDailyLogById = async (businessId: string, id: string): Promise<DailyLog | null> => {
    try {
        const dailyLogs = await getDailyLogs(businessId);
        const dailyLog = dailyLogs.find(log => log.id === id);

        if (!dailyLog) {
            console.warn(`Daily log with ID ${id} not found`);
            return null;
        }

        return dailyLog;
    } catch (err) {
        console.error("Error in getDailyLogById:", err);
        return null;
    }
};

/**
 * Create new daily log - works offline with optimistic updates
 */
export const createDailyLog = async (
    businessId: string,
    log: DailyLogInsert
): Promise<DailyLog | null> => {
    try {
        // Ensure required fields
        const dailyLogData = {
            ...log,
            id: log.id || uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertDailyLog(dailyLogData, businessId);

        if (result.error) {
            console.error("Error creating daily log:", result.error);
            return null;
        }

        return result.data as DailyLog;
    } catch (err) {
        console.error("Error in createDailyLog:", err);
        return null;
    }
};

/**
 * Update daily log - works offline with optimistic updates
 */
export const updateDailyLog = async (
    businessId: string,
    id: string,
    log: DailyLogUpdate
): Promise<DailyLog | null> => {
    try {
        const updateData = {
            ...log,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateDailyLogAction(updateData, businessId);

        if (result.error) {
            console.error("Error updating daily log:", result.error);
            return null;
        }

        return result.data as DailyLog;
    } catch (err) {
        console.error("Error in updateDailyLog:", err);
        return null;
    }
};

/**
 * Delete daily log - works offline with optimistic updates
 */
export const deleteDailyLog = async (
    businessId: string,
    id: string
): Promise<boolean> => {
    try {
        const result = await deleteDailyLogAction({ id }, businessId);

        if (result.error) {
            console.error("Error deleting daily log:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteDailyLog:", err);
        return false;
    }
};

/**
 * Search daily logs - works offline
 */
export const searchDailyLogs = async (businessId: string, query: string): Promise<DailyLog[]> => {
    try {
        const allLogs = await getDailyLogs(businessId);

        if (!query.trim()) {
            return allLogs;
        }

        // Simple client-side search - could be enhanced
        const searchLower = query.toLowerCase();
        return allLogs.filter(log =>
            log.notes?.toLowerCase().includes(searchLower) ||
            log.weather?.toLowerCase().includes(searchLower) ||
            log.project_id?.toLowerCase().includes(searchLower) ||
            log.work_completed?.toLowerCase().includes(searchLower) ||
            log.work_planned?.toLowerCase().includes(searchLower)
        );
    } catch (err) {
        console.error("Error in searchDailyLogs:", err);
        return [];
    }
};

/**
 * Get daily logs with details - works offline
 */
export const getDailyLogsWithDetails = async (businessId: string): Promise<DailyLogWithDetails[]> => {
    try {
        // Fetch all related data concurrently
        const [dailyLogs, projects, crews, clients] = await Promise.all([
            getDailyLogs(businessId),
            import('./projects-client').then(m => m.getProjects(businessId)),
            import('./crews-client').then(m => m.getCrews(businessId)),
            import('./clients-client').then(m => m.getClients(businessId))
        ]);

        // Create lookup maps for efficient joining
        const projectsMap = new Map(projects.map(p => [p.id, p]));
        const crewsMap = new Map(crews.map(c => [c.id, c]));
        const clientsMap = new Map(clients.map(c => [c.id, c]));

        // Join the data
        return dailyLogs.map(log => {
            const project = projectsMap.get(log.project_id);
            const crew = crewsMap.get(log.crew_id);
            
            // Find client through project
            const client = project ? clientsMap.get(project.client_id) : null;

            return {
                ...log,
                client: client ? {
                    id: client.id,
                    name: client.name,
                    contact_name: client.contact_name,
                    contact_email: client.contact_email,
                    contact_phone: client.contact_phone
                } : {
                    id: "unknown",
                    name: "Unknown Client",
                    contact_name: null,
                    contact_email: null,
                    contact_phone: null
                },
                project: project ? {
                    id: project.id,
                    name: project.name,
                    description: project.description
                } : {
                    id: log.project_id,
                    name: "Unknown Project",
                    description: null
                },
                crew: crew ? {
                    id: crew.id,
                    name: crew.name
                } : {
                    id: log.crew_id,
                    name: "Unknown Crew"
                },
                equipment: [], // TODO: Implement equipment lookup if needed
                materials: [] // TODO: Implement materials lookup if needed
            };
        }) as DailyLogWithDetails[];

    } catch (err) {
        console.error("Error in getDailyLogsWithDetails:", err);
        return [];
    }
};

/**
 * Get daily log with details by ID - works offline
 */
export const getDailyLogWithDetailsById = async (businessId: string, id: string): Promise<DailyLogWithDetails | null> => {
    try {
        const logsWithDetails = await getDailyLogsWithDetails(businessId);
        const logWithDetails = logsWithDetails.find(log => log.id === id);

        if (!logWithDetails) {
            console.warn(`Daily log with details for ID ${id} not found`);
            return null;
        }

        return logWithDetails;
    } catch (err) {
        console.error("Error in getDailyLogWithDetailsById:", err);
        return null;
    }
};

/**
 * Get daily log details by ID - works offline (legacy compatibility)
 */
export const getDailyLogDetailsByID = async (businessId: string, id: string) => {
    try {
        const dailyLog = await getDailyLogById(businessId, id);

        if (!dailyLog) {
            throw new Error(`Daily log with ID ${id} not found`);
        }

        // Return structure similar to server version but with offline placeholders
        return {
            dailyLog,
            project: { name: "Loading..." }, // Placeholder
            user: { name: "Loading..." }, // Placeholder
            materials: [], // TODO: Implement materials lookup
            equipment: [], // TODO: Implement equipment lookup
            crews: [], // TODO: Implement crews lookup
            images: [], // TODO: Implement images lookup
            weather: dailyLog.weather ? { condition: dailyLog.weather } : null
        };
    } catch (err) {
        console.error("Error in getDailyLogDetailsByID:", err);
        throw err;
    }
};

/**
 * Get daily logs with stats - works offline
 */
export const getDailyLogsWithStats = async (
    businessId: string,
    filters?: {
        projectId?: string;
        startDate?: string;
        endDate?: string;
        userId?: string;
    }
): Promise<{
    logs: DailyLog[];
    stats: {
        totalLogs: number;
        totalProjects: number;
        totalHours: number;
        avgDailyProgress: number;
    };
}> => {
    try {
        let logs = await getDailyLogs(businessId);

        // Apply filters
        if (filters?.projectId) {
            logs = logs.filter(log => log.project_id === filters.projectId);
        }
        if (filters?.startDate) {
            logs = logs.filter(log => log.date >= filters.startDate!);
        }
        if (filters?.endDate) {
            logs = logs.filter(log => log.date <= filters.endDate!);
        }
        if (filters?.userId) {
            logs = logs.filter(log => log.author_id === filters.userId);
        }

        // Calculate stats
        const uniqueProjects = new Set(logs.map(log => log.project_id)).size;
        const totalHours = logs.reduce((sum, log) => sum + (log.hours_worked || 0), 0);
        const avgProgress = logs.length > 0
            ? logs.reduce((sum, log) => sum + (log.hours_worked || 0), 0) / logs.length
            : 0;

        return {
            logs,
            stats: {
                totalLogs: logs.length,
                totalProjects: uniqueProjects,
                totalHours,
                avgDailyProgress: avgProgress
            }
        };
    } catch (err) {
        console.error("Error in getDailyLogsWithStats:", err);
        return {
            logs: [],
            stats: { totalLogs: 0, totalProjects: 0, totalHours: 0, avgDailyProgress: 0 }
        };
    }
};

/**
 * Get daily log analytics - works offline
 */
export const getDailyLogAnalytics = async (businessId: string, projectId?: string) => {
    try {
        const { logs, stats } = await getDailyLogsWithStats(businessId, { projectId });

        // Simple analytics calculations - could be enhanced
        const dailyStats = logs.reduce((acc, log) => {
            const date = log.date;
            if (!acc[date]) {
                acc[date] = { hours: 0, progress: 0, count: 0 };
            }
            acc[date].hours += log.hours_worked || 0;
            acc[date].progress += log.hours_worked || 0; // Using hours as progress proxy
            acc[date].count += 1;
            return acc;
        }, {} as Record<string, { hours: number; progress: number; count: number }>);

        return {
            summary: stats,
            dailyBreakdown: Object.entries(dailyStats).map(([date, data]) => ({
                date,
                hours: data.hours,
                avgProgress: data.progress / data.count,
                logCount: data.count
            }))
        };
    } catch (err) {
        console.error("Error in getDailyLogAnalytics:", err);
        return {
            summary: { totalLogs: 0, totalProjects: 0, totalHours: 0, avgDailyProgress: 0 },
            dailyBreakdown: []
        };
    }
};

// Export compatibility functions for existing code
export {
    getDailyLogs as default,
    createDailyLog as insertDailyLog
};
