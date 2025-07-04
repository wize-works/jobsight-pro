import type { UserRole } from '@/types/users';

// Export the UserRole type for convenience
export type { UserRole } from '@/types/users';

// Priority zones for visual hierarchy
export type PriorityZone = 'critical' | 'important' | 'informational';

// Widget types for the dashboard
export type DashboardWidget =
    // Common widgets
    | 'kpiCards'
    | 'recentActivity'
    | 'weather'
    | 'notifications'

    // Member-focused widgets
    | 'myTasks'
    | 'todaySchedule'
    | 'safetyAlerts'
    | 'photoUpload'
    | 'timeTracker'
    | 'quickActions'

    // Manager-focused widgets
    | 'projectTimelines'
    | 'teamPerformance'
    | 'resourceAllocation'
    | 'criticalTasks'
    | 'budgetTracking'
    | 'projectProgress'
    | 'equipmentStatus'

    // Admin-focused widgets
    | 'financialMetrics'
    | 'businessKPIs'
    | 'userManagement'
    | 'systemSettings'
    | 'profitability'
    | 'strategicInsights'
    | 'invoiceManagement';

export interface WidgetConfig {
    widget: DashboardWidget;
    priority: PriorityZone;
    size: 'sm' | 'md' | 'lg' | 'xl';
    order: number;
    visible: boolean;
}

export interface DashboardLayout {
    role: UserRole;
    widgets: WidgetConfig[];
    quickActions: string[];
    defaultView: 'grid' | 'list' | 'cards';
}

// Role-based dashboard configurations
export const dashboardConfigs: Record<UserRole, DashboardLayout> = {
    member: {
        role: 'member',
        defaultView: 'cards',
        quickActions: [
            'addDailyLog',
            'uploadPhoto',
            'startTimeTracking',
            'viewMyTasks',
            'reportSafety'
        ],
        widgets: [
            // Critical zone - immediate attention needed
            { widget: 'safetyAlerts', priority: 'critical', size: 'lg', order: 1, visible: true },
            { widget: 'myTasks', priority: 'critical', size: 'lg', order: 2, visible: true },

            // Important zone - today's work
            { widget: 'todaySchedule', priority: 'important', size: 'md', order: 3, visible: true },
            { widget: 'weather', priority: 'important', size: 'sm', order: 4, visible: true },
            { widget: 'quickActions', priority: 'important', size: 'md', order: 5, visible: true },

            // Informational zone - helpful context
            { widget: 'timeTracker', priority: 'informational', size: 'sm', order: 6, visible: true },
            { widget: 'recentActivity', priority: 'informational', size: 'md', order: 7, visible: true },
            { widget: 'notifications', priority: 'informational', size: 'sm', order: 8, visible: true }
        ]
    },

    manager: {
        role: 'manager',
        defaultView: 'grid',
        quickActions: [
            'createProject',
            'assignTask',
            'reviewProgress',
            'approveTimesheet',
            'viewReports'
        ],
        widgets: [
            // Critical zone - issues requiring immediate action
            { widget: 'criticalTasks', priority: 'critical', size: 'lg', order: 1, visible: true },
            { widget: 'safetyAlerts', priority: 'critical', size: 'md', order: 2, visible: true },

            // Important zone - project management focus
            { widget: 'projectProgress', priority: 'important', size: 'lg', order: 3, visible: true },
            { widget: 'teamPerformance', priority: 'important', size: 'md', order: 4, visible: true },
            { widget: 'budgetTracking', priority: 'important', size: 'md', order: 5, visible: true },
            { widget: 'resourceAllocation', priority: 'important', size: 'md', order: 6, visible: true },

            // Informational zone - overview and context
            { widget: 'kpiCards', priority: 'informational', size: 'xl', order: 7, visible: true },
            { widget: 'equipmentStatus', priority: 'informational', size: 'sm', order: 8, visible: true },
            { widget: 'weather', priority: 'informational', size: 'sm', order: 9, visible: true },
            { widget: 'recentActivity', priority: 'informational', size: 'md', order: 10, visible: true }
        ]
    },

    admin: {
        role: 'admin',
        defaultView: 'grid',
        quickActions: [
            'createBusiness',
            'manageUsers',
            'viewFinancials',
            'systemSettings',
            'generateReports'
        ],
        widgets: [
            // Critical zone - business-critical issues
            { widget: 'financialMetrics', priority: 'critical', size: 'xl', order: 1, visible: true },
            { widget: 'safetyAlerts', priority: 'critical', size: 'md', order: 2, visible: true },

            // Important zone - business operations
            { widget: 'businessKPIs', priority: 'important', size: 'lg', order: 3, visible: true },
            { widget: 'profitability', priority: 'important', size: 'md', order: 4, visible: true },
            { widget: 'invoiceManagement', priority: 'important', size: 'md', order: 5, visible: true },
            { widget: 'projectProgress', priority: 'important', size: 'md', order: 6, visible: true },

            // Informational zone - strategic insights
            { widget: 'strategicInsights', priority: 'informational', size: 'lg', order: 7, visible: true },
            { widget: 'teamPerformance', priority: 'informational', size: 'md', order: 8, visible: true },
            { widget: 'userManagement', priority: 'informational', size: 'sm', order: 9, visible: true },
            { widget: 'systemSettings', priority: 'informational', size: 'sm', order: 10, visible: true },
            { widget: 'recentActivity', priority: 'informational', size: 'md', order: 11, visible: true }
        ]
    }
};

/**
 * Get dashboard configuration for a specific user role
 */
export function getDashboardConfig(role: UserRole): DashboardLayout {
    return dashboardConfigs[role];
}

/**
 * Get widgets filtered by priority zone
 */
export function getWidgetsByPriority(role: UserRole, priority: PriorityZone): WidgetConfig[] {
    const config = getDashboardConfig(role);
    return config.widgets
        .filter(w => w.priority === priority && w.visible)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get all visible widgets for a role, sorted by order
 */
export function getVisibleWidgets(role: UserRole): WidgetConfig[] {
    const config = getDashboardConfig(role);
    return config.widgets
        .filter(w => w.visible)
        .sort((a, b) => a.order - b.order);
}

/**
 * Priority zone styling configurations
 */
export const priorityZoneStyles = {
    critical: {
        containerClass: 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 dark:from-red-900/20 dark:to-red-800/20',
        titleClass: 'text-red-700 dark:text-red-300',
        iconClass: 'text-red-600',
        badge: 'badge-error'
    },
    important: {
        containerClass: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 dark:from-yellow-900/20 dark:to-yellow-800/20',
        titleClass: 'text-yellow-700 dark:text-yellow-300',
        iconClass: 'text-yellow-600',
        badge: 'badge-warning'
    },
    informational: {
        containerClass: 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 dark:from-blue-900/20 dark:to-blue-800/20',
        titleClass: 'text-blue-700 dark:text-blue-300',
        iconClass: 'text-blue-600',
        badge: 'badge-info'
    }
};

/**
 * Widget size configurations for responsive design
 */
export const widgetSizes = {
    sm: 'col-span-1 lg:col-span-1',
    md: 'col-span-1 lg:col-span-2',
    lg: 'col-span-2 lg:col-span-3',
    xl: 'col-span-full lg:col-span-4'
};
