"use client";

import { useUserRole } from '@/hooks/use-user-role';
import { getDashboardConfig, getWidgetsByPriority, priorityZoneStyles } from '@/lib/dashboard-config';
import type { UserRole, PriorityZone } from '@/lib/dashboard-config';
import Loading from '@/app/loading';
import { SubscriptionStatusBanner } from './subscription';

interface RoleBasedDashboardProps {
    children: React.ReactNode;
    fallbackRole?: UserRole;
    onQuickAction?: (action: string) => void;
}

interface DashboardSectionProps {
    priority: PriorityZone;
    role: UserRole;
    children: React.ReactNode;
}

/**
 * Dashboard section wrapper that applies priority-based styling
 */
function DashboardSection({ priority, role, children }: DashboardSectionProps) {
    const widgets = getWidgetsByPriority(role, priority);
    const styles = priorityZoneStyles[priority];

    if (widgets.length === 0) return null;

    const sectionTitles = {
        critical: '🔴 Critical - Immediate Attention',
        important: '🟡 Important - Today\'s Focus',
        informational: '🟢 Overview - Information & Insights'
    };

    return (
        <div className={`rounded-lg p-4 mb-6 ${styles.containerClass}`}>
            <div className="flex items-center gap-2 mb-4">
                <h2 className={`text-lg font-semibold ${styles.titleClass}`}>
                    {sectionTitles[priority]}
                </h2>
                <span className={`badge ${styles.badge} badge-sm`}>
                    {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {children}
            </div>
        </div>
    );
}

/**
 * Role-based dashboard wrapper that provides user role context
 * and renders dashboard sections based on user permissions
 */
export function RoleBasedDashboard({ children, fallbackRole = 'member', onQuickAction }: RoleBasedDashboardProps) {
    const { userRole, loading, error } = useUserRole();

    // Show loading state while determining user role
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Loading />
                    <p className="mt-2 text-sm text-base-content/70">
                        Personalizing your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // Use fallback role if there's an error or no role found
    const effectiveRole = userRole || fallbackRole;
    const config = getDashboardConfig(effectiveRole);

    // Show error notification but continue with fallback
    if (error) {
        console.warn('Dashboard role detection error:', error);
    }

    return (
        <div className="role-based-dashboard">
            <SubscriptionStatusBanner className="mb-6" />
            {/* Dashboard Header with Role Info */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        {effectiveRole === 'admin' ? 'Business Command Center' :
                            effectiveRole === 'manager' ? 'Project Management Hub' :
                                'My Workspace'}
                    </h1>
                    <p className="text-lg opacity-90">
                        {effectiveRole === 'admin' ? 'Strategic oversight and business management' :
                            effectiveRole === 'manager' ? 'Project coordination and team leadership' :
                                'Daily tasks and project updates'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="badge badge-outline">
                        {effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)} View
                    </span>
                    {error && (
                        <div className="tooltip tooltip-left" data-tip="Using default permissions">
                            <span className="badge badge-warning badge-sm">⚠️</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Role-specific footer insights */}
            <div className="mt-8 p-4 bg-base-200 rounded-lg">
                <div className="text-sm text-base-content/70">
                    💡 <strong>Tip for {effectiveRole}s:</strong> {getRoleTip(effectiveRole)}
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-bolt text-primary"></i>
                    <h3 className="font-semibold">Quick Actions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {config.quickActions.map((action, index) => (
                        <button
                            key={action}
                            className={`btn btn-sm ${index === 0 ? 'btn-primary' :
                                index === 1 ? 'btn-secondary' :
                                    'btn-outline'
                                }`}
                            onClick={() => onQuickAction?.(action)}
                        >
                            <i className={`fas fa-${getActionIcon(action)} mr-1`}></i>
                            {formatActionLabel(action)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Role-specific dashboard content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}

/**
 * Render dashboard sections with priority-based organization
 */
export function DashboardWithSections({ role, children }: { role: UserRole; children: React.ReactNode }) {
    return (
        <>
            <DashboardSection priority="critical" role={role}>
                {children}
            </DashboardSection>

            <DashboardSection priority="important" role={role}>
                {children}
            </DashboardSection>

            <DashboardSection priority="informational" role={role}>
                {children}
            </DashboardSection>
        </>
    );
}

// Helper functions
function getActionIcon(action: string): string {
    const iconMap: Record<string, string> = {
        addDailyLog: 'calendar-plus',
        uploadPhoto: 'camera',
        startTimeTracking: 'clock',
        viewMyTasks: 'list-ul',
        reportSafety: 'shield-alt',
        createProject: 'project-diagram',
        assignTask: 'user-plus',
        reviewProgress: 'chart-line',
        approveTimesheet: 'check-circle',
        viewReports: 'file-chart',
        createBusiness: 'building',
        manageUsers: 'users',
        viewFinancials: 'dollar-sign',
        systemSettings: 'cog',
        generateReports: 'file-export'
    };
    return iconMap[action] || 'plus';
}

function formatActionLabel(action: string): string {
    const labelMap: Record<string, string> = {
        addDailyLog: 'Add Daily Log',
        uploadPhoto: 'Take Photo',
        startTimeTracking: 'Start Timer',
        viewMyTasks: 'My Tasks',
        reportSafety: 'Report Safety',
        createProject: 'New Project',
        assignTask: 'Create Task',
        reviewProgress: 'Review Progress',
        approveTimesheet: 'Approve Time',
        viewReports: 'View Reports',
        createBusiness: 'New Business',
        manageUsers: 'Manage Users',
        viewFinancials: 'Financials',
        systemSettings: 'Settings',
        generateReports: 'Generate Reports'
    };

    return labelMap[action] || action
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function getRoleTip(role: UserRole): string {
    const tips: Record<UserRole, string> = {
        admin: 'Use the financial metrics and strategic insights to make data-driven business decisions.',
        manager: 'Focus on critical tasks and team performance to keep projects on track.',
        member: 'Stay on top of your daily tasks and use quick actions for efficient reporting.'
    };
    return tips[role];
}
