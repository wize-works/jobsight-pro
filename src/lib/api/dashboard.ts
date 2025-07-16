// Dashboard API types
export interface DashboardStats {
    activeProjects: number;
    totalProjects: number;
    pendingTasks: number;
    totalTasks: number;
    equipmentUtilization: number;
    totalEquipment: number;
    totalRevenue: number;
    pendingRevenue: number;
}

export interface ProjectStatusData {
    active: number;
    completed: number;
    onHold: number;
    planning: number;
}

export interface TaskStatusData {
    pending: number;
    inProgress: number;
    completed: number;
}

export interface ProjectWithProgress {
    id: string;
    name: string;
    description?: string;
    status: string;
    client_id?: string;
    progress: number;
    taskCount: number;
    completedTasks: number;
    clientName: string;
    crewNames: string;
    created_at: string;
    updated_at: string;
    business_id: string;
}

export interface RecentActivity {
    id: string;
    type: 'daily_log';
    message: string;
    projectName: string;
    clientName: string;
    weather: string;
    timestamp: string;
    projectId: string;
}

export interface CriticalTask {
    id: string;
    name: string;
    projectName: string;
    clientName: string;
    crewName: string;
    dueDate: string;
    status: string;
    priority: string;
    isOverdue: boolean;
}

export interface TeamMetric {
    id: string;
    name: string;
    activeTasks: number;
    completedTasks: number;
    productivity: number;
}

export interface FinancialOverview {
    totalRevenue: number;
    pendingRevenue: number;
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
}

export interface EquipmentStatus {
    available: number;
    inUse: number;
    maintenance: number;
}

export interface DashboardData {
    stats: DashboardStats;
    projectStatusData: ProjectStatusData;
    taskStatusData: TaskStatusData;
    projectsWithProgress: ProjectWithProgress[];
    recentActivity: RecentActivity[];
    criticalTasks: CriticalTask[];
    teamMetrics: TeamMetric[];
    financialOverview: FinancialOverview;
    equipmentStatus: EquipmentStatus;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
}

export interface ApiError {
    error: string;
    details?: any;
}

// Base API URL
const API_BASE = "/api/dashboard";

// Dashboard API Client
export class DashboardAPI {

    static async getDashboardData(params?: {
        include?: string;
        date_from?: string;
        date_to?: string;
        project_limit?: number;
        activity_limit?: number;
        task_limit?: number;
        team_limit?: number;
    }): Promise<ApiResponse<DashboardData>> {
        const url = new URL(API_BASE, window.location.origin);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        return response.json();
    }

    // Convenience methods for specific data sections
    static async getStats(params?: {
        date_from?: string;
        date_to?: string;
    }): Promise<ApiResponse<DashboardData>> {
        return this.getDashboardData(params);
    }

    static async getProjectsWithProgress(limit?: number): Promise<ApiResponse<DashboardData>> {
        return this.getDashboardData({
            project_limit: limit,
        });
    }

    static async getRecentActivity(limit?: number): Promise<ApiResponse<DashboardData>> {
        return this.getDashboardData({
            activity_limit: limit,
        });
    }

    static async getCriticalTasks(limit?: number): Promise<ApiResponse<DashboardData>> {
        return this.getDashboardData({
            task_limit: limit,
        });
    }

    static async getTeamMetrics(limit?: number): Promise<ApiResponse<DashboardData>> {
        return this.getDashboardData({
            team_limit: limit,
        });
    }

    static async getFinancialOverview(params?: {
        date_from?: string;
        date_to?: string;
    }): Promise<ApiResponse<DashboardData>> {
        return this.getDashboardData(params);
    }

    static async getEquipmentStatus(): Promise<ApiResponse<DashboardData>> {
        return this.getDashboardData();
    }
}

// Helper function for error handling
export function handleApiError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "An unknown error occurred";
}
