import { useState, useEffect } from "react";
import { DashboardAPI, DashboardData, handleApiError } from "@/lib/api/dashboard";

// Dashboard Hook
export function useDashboard(params?: {
    include?: string;
    date_from?: string;
    date_to?: string;
    project_limit?: number;
    activity_limit?: number;
    task_limit?: number;
    team_limit?: number;
    refreshInterval?: number; // in milliseconds
}) {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await DashboardAPI.getDashboardData(params);
            setDashboardData(response.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => {
        fetchDashboardData();
    };

    useEffect(() => {
        fetchDashboardData();
    }, [params?.date_from, params?.date_to, params?.project_limit, params?.activity_limit, params?.task_limit, params?.team_limit]);

    // Auto-refresh functionality
    useEffect(() => {
        if (params?.refreshInterval) {
            const interval = setInterval(fetchDashboardData, params.refreshInterval);
            return () => clearInterval(interval);
        }
    }, [params?.refreshInterval]);

    return {
        dashboardData,
        loading,
        error,
        refresh,
        // Convenience getters for individual sections
        stats: dashboardData?.stats || null,
        projectStatusData: dashboardData?.projectStatusData || null,
        taskStatusData: dashboardData?.taskStatusData || null,
        projectsWithProgress: dashboardData?.projectsWithProgress || [],
        recentActivity: dashboardData?.recentActivity || [],
        criticalTasks: dashboardData?.criticalTasks || [],
        teamMetrics: dashboardData?.teamMetrics || [],
        financialOverview: dashboardData?.financialOverview || null,
        equipmentStatus: dashboardData?.equipmentStatus || null,
    };
}

// Specialized hooks for specific dashboard sections
export function useDashboardStats(params?: {
    date_from?: string;
    date_to?: string;
    refreshInterval?: number;
}) {
    const { stats, loading, error, refresh } = useDashboard(params);

    return {
        stats,
        loading,
        error,
        refresh,
    };
}

export function useDashboardProjects(limit?: number) {
    const { projectsWithProgress, loading, error, refresh } = useDashboard({
        project_limit: limit,
    });

    return {
        projects: projectsWithProgress,
        loading,
        error,
        refresh,
    };
}

export function useDashboardActivity(limit?: number) {
    const { recentActivity, loading, error, refresh } = useDashboard({
        activity_limit: limit,
    });

    return {
        activity: recentActivity,
        loading,
        error,
        refresh,
    };
}

export function useDashboardTasks(limit?: number) {
    const { criticalTasks, loading, error, refresh } = useDashboard({
        task_limit: limit,
    });

    return {
        tasks: criticalTasks,
        loading,
        error,
        refresh,
    };
}

export function useDashboardTeam(limit?: number) {
    const { teamMetrics, loading, error, refresh } = useDashboard({
        team_limit: limit,
    });

    return {
        team: teamMetrics,
        loading,
        error,
        refresh,
    };
}

export function useDashboardFinancials(params?: {
    date_from?: string;
    date_to?: string;
    refreshInterval?: number;
}) {
    const { financialOverview, loading, error, refresh } = useDashboard(params);

    return {
        financials: financialOverview,
        loading,
        error,
        refresh,
    };
}

export function useDashboardEquipment() {
    const { equipmentStatus, loading, error, refresh } = useDashboard();

    return {
        equipment: equipmentStatus,
        loading,
        error,
        refresh,
    };
}

// Real-time dashboard hook with auto-refresh
export function useRealTimeDashboard(refreshInterval = 30000) { // 30 seconds default
    return useDashboard({
        refreshInterval,
    });
}
