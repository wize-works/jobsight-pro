import React from 'react';
import { DashboardWidget, WidgetConfig } from '@/lib/dashboard-config';

// Import all widget components
import {
    KPICardsWidget,
    ProjectProgressWidget,
    BudgetTrackingWidget,
    ResourceAllocationWidget,
    TeamPerformanceWidget,
    EquipmentStatusWidget,
    MyTasksWidget,
    TodayScheduleWidget,
    SafetyAlertsWidget,
    TimeTrackerWidget
} from '@/components/dashboard/widgets';

// Widget component map
const WIDGET_COMPONENTS: Record<DashboardWidget, React.ComponentType<any>> = {
    // Common widgets
    kpiCards: KPICardsWidget,
    recentActivity: () => <div className="p-4 text-center text-base-content/60">Recent Activity - Coming Soon</div>,
    weather: () => <div className="p-4 text-center text-base-content/60">Weather Widget - Coming Soon</div>,
    notifications: () => <div className="p-4 text-center text-base-content/60">Notifications - Coming Soon</div>,

    // Member-focused widgets
    myTasks: MyTasksWidget,
    todaySchedule: TodayScheduleWidget,
    safetyAlerts: SafetyAlertsWidget,
    photoUpload: () => <div className="p-4 text-center text-base-content/60">Photo Upload - Use Quick Actions</div>,
    timeTracker: TimeTrackerWidget,
    quickActions: () => <div className="p-4 text-center text-base-content/60">Quick Actions - Available in header</div>,

    // Manager-focused widgets
    projectTimelines: () => <div className="p-4 text-center text-base-content/60">Project Timelines - Coming Soon</div>,
    teamPerformance: TeamPerformanceWidget,
    resourceAllocation: ResourceAllocationWidget,
    criticalTasks: () => <div className="p-4 text-center text-base-content/60">Critical Tasks - Coming Soon</div>,
    budgetTracking: BudgetTrackingWidget,
    projectProgress: ProjectProgressWidget,
    equipmentStatus: EquipmentStatusWidget,

    // Admin-focused widgets
    financialMetrics: () => <div className="p-4 text-center text-base-content/60">Financial Metrics - Coming Soon</div>,
    businessKPIs: () => <div className="p-4 text-center text-base-content/60">Business KPIs - Coming Soon</div>,
    userManagement: () => <div className="p-4 text-center text-base-content/60">User Management - Coming Soon</div>,
    systemSettings: () => <div className="p-4 text-center text-base-content/60">System Settings - Coming Soon</div>,
    profitability: () => <div className="p-4 text-center text-base-content/60">Profitability - Coming Soon</div>,
    strategicInsights: () => <div className="p-4 text-center text-base-content/60">Strategic Insights - Coming Soon</div>,
    invoiceManagement: () => <div className="p-4 text-center text-base-content/60">Invoice Management - Coming Soon</div>,
};

interface WidgetRendererProps {
    config: WidgetConfig;
    className?: string;
}

/**
 * Renders a dashboard widget based on its configuration
 */
export function WidgetRenderer({ config, className = '' }: WidgetRendererProps) {
    const WidgetComponent = WIDGET_COMPONENTS[config.widget];

    if (!WidgetComponent) {
        console.warn(`Widget component not found for: ${config.widget}`);
        return (
            <div className={`card bg-base-100 border border-base-300 shadow-sm ${className}`}>
                <div className="card-body p-4 text-center text-base-content/60">
                    <i className="fas fa-puzzle-piece text-2xl mb-2 opacity-30"></i>
                    <p>Widget not implemented: {config.widget}</p>
                </div>
            </div>
        );
    }

    // Apply size-based styling
    const sizeClasses = {
        sm: 'col-span-1',
        md: 'col-span-1 md:col-span-2',
        lg: 'col-span-1 md:col-span-2 lg:col-span-3',
        xl: 'col-span-1 md:col-span-2 lg:col-span-4'
    };

    const containerClass = `${sizeClasses[config.size]} ${className}`;

    return (
        <div className={containerClass}>
            <WidgetComponent
                widget={config.widget}
                size={config.size}
                priority={config.priority}
                className="h-full"
            />
        </div>
    );
}

interface DashboardWidgetGridProps {
    widgets: WidgetConfig[];
    className?: string;
}

/**
 * Renders a grid of dashboard widgets
 */
export function DashboardWidgetGrid({ widgets, className = '' }: DashboardWidgetGridProps) {
    const visibleWidgets = widgets
        .filter(widget => widget.visible)
        .sort((a, b) => a.order - b.order);

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
            {visibleWidgets.map((widget, index) => (
                <WidgetRenderer
                    key={`${widget.widget}-${index}`}
                    config={widget}
                />
            ))}
        </div>
    );
}
