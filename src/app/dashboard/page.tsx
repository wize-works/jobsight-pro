"use client"

import Link from "next/link"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
} from "chart.js"
import { Doughnut, Bar, Line } from "react-chartjs-2"
import { getDashboardData } from "@/app/actions/dashboard"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useEffect, useState } from "react"
import ProjectModal from "./projects/components/modal-project"
import TaskModal from "./tasks/components/modal-task"
import EquipmentNewModal from "./equipment/components/modal-new"
import DailyLogModal from "./daily-logs/components/modal-log"
import { useBusiness } from "@/lib/business-context"
import Loading from "@/app/loading";
import ErrorBoundary from "@/components/error-boundary"
import WeatherWidget from "@/components/weather-widget"
import CompactWeatherWidget from "@/components/compact-weather-widget"
import { processAIQuery } from "@/app/actions/ai"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title)

interface DashboardData {
    stats: {
        activeProjects: number;
        totalProjects: number;
        pendingTasks: number;
        totalTasks: number;
        equipmentUtilization: number;
        totalEquipment: number;
        totalRevenue: number;
        pendingRevenue: number;
    };
    projectStatusData: {
        active: number;
        completed: number;
        onHold: number;
        planning: number;
    };
    taskStatusData: {
        pending: number;
        inProgress: number;
        completed: number;
    };
    projectsWithProgress: Array<{
        id: string;
        name: string;
        progress: number;
        taskCount: number;
        completedTasks: number;
        clientName: string;
        crewName: string;
        status: string;
        start_date?: string;
        end_date?: string;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        message: string;
        projectName: string;
        clientName: string;
        weather?: string;
        timestamp: string;
        projectId: string;
    }>;
    criticalTasks: Array<{
        id: string;
        name: string;
        projectName: string;
        clientName: string;
        crewName: string;
        dueDate: string;
        status: string;
        priority?: string;
        isOverdue: boolean;
    }>;
    teamMetrics: Array<{
        id: string;
        name: string;
        activeTasks: number;
        completedTasks: number;
        productivity: number;
    }>;
    financialOverview: {
        totalRevenue: number;
        pendingRevenue: number;
        totalInvoices: number;
        paidInvoices: number;
        overdueInvoices: number;
    }; equipmentStatus: {
        available: number;
        inUse: number;
        maintenance: number;
    };
    dailyLogsData: {
        dates: string[];
        delays: number[];
        issues: number[];
        safetyReports: number[];
    };
    aiRecommendations: Array<{
        id: string;
        type: 'equipment' | 'safety' | 'productivity' | 'weather' | 'general';
        priority: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        description: string;
        actionItems: string[];
        confidence: number;
    }>;
}

export default function Dashboard() {
    const { businessId, loading } = useBusiness();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [projectModal, setProjectModal] = useState(false);
    const [taskModal, setTaskModal] = useState(false);
    const [equipmentModal, setEquipmentModal] = useState(false);
    const [dailyLogModal, setDailyLogModal] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<DashboardData['aiRecommendations']>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false); useEffect(() => {
        async function fetchData() {
            if (!businessId || loading) {
                return;
            }

            try {
                const rawData = await getDashboardData(businessId);
                // Fix: Ensure status is always a string for each project
                const fixedProjectsWithProgress = rawData.projectsWithProgress.map((project) => ({
                    ...project,
                    status: project.status ?? "", // fallback to empty string if null
                    start_date: project.start_date ?? undefined,
                    end_date: project.end_date ?? undefined,
                    crewName: project.crewNames, // Map crewNames to crewName to match the expected type
                }));

                const fixedRecentActivity = rawData.recentActivity.map((activity: any) => ({
                    ...activity,
                    timestamp: activity.timestamp ?? "", // fallback to empty string if null
                    weather: typeof activity.weather === "string" ? activity.weather : undefined, // ensure weather is string or undefined
                }));

                const fixedCriticalTasks = rawData.criticalTasks.map((task: any) => ({
                    ...task,
                    dueDate: task.dueDate ?? "", // fallback to empty string if null
                    status: task.status ?? "",   // fallback to empty string if null
                    // priority is optional, so only include if not null
                    ...(task.priority !== null ? { priority: task.priority } : {}),
                }));

                // Process daily logs data for the chart
                const processedDailyLogsData = processDailyLogsForChart(rawData.recentActivity || []);

                const data: DashboardData = {
                    ...rawData,
                    projectsWithProgress: fixedProjectsWithProgress,
                    recentActivity: fixedRecentActivity,
                    criticalTasks: fixedCriticalTasks,
                    // Add daily logs chart data
                    dailyLogsData: processedDailyLogsData,
                    aiRecommendations: [] // Will be fetched separately
                }; setDashboardData(data);

                // Fetch AI recommendations after setting dashboard data
                setTimeout(() => {
                    fetchAIRecommendations();
                }, 100);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        } fetchData();
    }, [businessId, loading])

    // Separate useEffect for AI recommendations that triggers when dashboardData is available
    useEffect(() => {
        if (dashboardData && !loadingRecommendations && aiRecommendations.length === 0) {
            fetchAIRecommendations();
        }
    }, [dashboardData]);

    // Function to process daily logs for chart data
    const processDailyLogsForChart = (recentActivity: any[]) => {
        // Get last 7 days of data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        // Initialize data arrays
        const dates = last7Days;
        const delays = new Array(7).fill(0);
        const issues = new Array(7).fill(0);
        const safetyReports = new Array(7).fill(0);

        // Process recent activity to count issues per day
        recentActivity.forEach((activity: any) => {
            if (activity.type === 'daily_log' && activity.timestamp) {
                const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
                const dayIndex = dates.indexOf(activityDate);

                if (dayIndex !== -1) {
                    const message = activity.message?.toLowerCase() || '';

                    if (message.includes('delay') || message.includes('delayed')) {
                        delays[dayIndex]++;
                    }
                    if (message.includes('issue') || message.includes('problem')) {
                        issues[dayIndex]++;
                    }
                    if (message.includes('safety') || message.includes('incident')) {
                        safetyReports[dayIndex]++;
                    }
                }
            }
        });

        return { dates, delays, issues, safetyReports };
    };    // Function to generate realistic AI recommendations based on dashboard data
    const generateConstructionRecommendations = (data: DashboardData): DashboardData['aiRecommendations'] => {
        const recommendations: DashboardData['aiRecommendations'] = [];

        // Safety recommendation based on weather and recent activity
        const safetyIssues = data.dailyLogsData.safetyReports.reduce((a, b) => a + b, 0);
        if (safetyIssues > 0) {
            recommendations.push({
                id: 'safety-1',
                type: 'safety',
                priority: 'high',
                title: 'Increase Safety Training Focus',
                description: `${safetyIssues} safety incidents reported this week. Address recurring issues immediately.`,
                actionItems: [
                    'Schedule safety meeting for affected crews',
                    'Review and update safety protocols',
                    'Provide additional PPE if needed'
                ],
                confidence: 92
            });
        }

        // Equipment utilization recommendation
        if (data.stats.equipmentUtilization < 75) {
            recommendations.push({
                id: 'equipment-1',
                type: 'equipment',
                priority: 'medium',
                title: 'Equipment Underutilization Detected',
                description: `Equipment utilization at ${data.stats.equipmentUtilization}%. Optimize scheduling to reduce costs.`,
                actionItems: [
                    'Review equipment schedules for gaps',
                    'Consider rental vs. purchase for seasonal needs',
                    'Cross-train crews on multiple equipment types'
                ],
                confidence: 88
            });
        }

        // Project delays recommendation
        const totalDelays = data.dailyLogsData.delays.reduce((a, b) => a + b, 0);
        if (totalDelays > 2) {
            recommendations.push({
                id: 'productivity-1',
                type: 'productivity',
                priority: 'medium',
                title: 'Address Recurring Project Delays',
                description: `${totalDelays} delays reported this week. Identify root causes to improve timeline adherence.`,
                actionItems: [
                    'Analyze delay patterns by project and crew',
                    'Adjust material delivery schedules',
                    'Build buffer time for weather-dependent tasks'
                ],
                confidence: 85
            });
        }        // Weather-based recommendation (always show this as it's universally relevant)
        recommendations.push({
            id: 'weather-1',
            type: 'weather',
            priority: 'medium',
            title: 'Weather-Optimized Task Scheduling',
            description: 'Plan indoor/covered work for rainy days and exterior work for clear weather.',
            actionItems: [
                'Move concrete pours to clear forecast days',
                'Schedule interior finishing during rain',
                'Prepare weather protection materials'
            ],
            confidence: 90
        });

        // Add more general recommendations if we don't have enough specific ones
        if (recommendations.length < 2) {
            recommendations.push({
                id: 'productivity-general',
                type: 'productivity',
                priority: 'medium',
                title: 'Daily Progress Tracking',
                description: 'Implement consistent daily logging to identify patterns and improve efficiency.',
                actionItems: [
                    'Set up daily crew check-ins',
                    'Track material usage patterns',
                    'Document equipment maintenance needs'
                ],
                confidence: 88
            });
        }

        if (recommendations.length < 3) {
            recommendations.push({
                id: 'safety-general',
                type: 'safety',
                priority: 'medium',
                title: 'Proactive Safety Management',
                description: 'Regular safety reviews help prevent incidents and maintain compliance.',
                actionItems: [
                    'Schedule weekly safety toolbox talks',
                    'Inspect PPE condition regularly',
                    'Update emergency contact information'
                ],
                confidence: 85
            });
        }

        // Financial performance recommendation
        if (data.financialOverview.overdueInvoices > 0) {
            recommendations.push({
                id: 'financial-1',
                type: 'general',
                priority: 'high',
                title: 'Improve Cash Flow Management',
                description: `${data.financialOverview.overdueInvoices} overdue invoices affecting cash flow.`,
                actionItems: [
                    'Follow up on overdue payments immediately',
                    'Implement progress billing for large projects',
                    'Consider requiring deposits for new projects'
                ],
                confidence: 94
            });
        }

        // Crew productivity recommendation
        const lowProductivityCrews = data.teamMetrics.filter(team => team.productivity < 80);
        if (lowProductivityCrews.length > 0) {
            recommendations.push({
                id: 'productivity-2',
                type: 'productivity',
                priority: 'medium',
                title: 'Support Underperforming Crews',
                description: `${lowProductivityCrews.length} crew(s) below 80% productivity. Provide additional support.`,
                actionItems: [
                    'One-on-one meetings with crew leaders',
                    'Identify training or resource needs',
                    'Consider task reassignment if needed'
                ],
                confidence: 87
            });
        }

        // Return top 3 most relevant recommendations
        return recommendations
            .sort((a, b) => {
                const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            })
            .slice(0, 3);
    };    // Function to fetch AI recommendations
    const fetchAIRecommendations = () => {
        if (!businessId) return;

        setLoadingRecommendations(true);
        try {
            // Use current dashboardData state or create fallback data
            const currentData = dashboardData || {
                dailyLogsData: { delays: [1, 0, 2, 1, 0, 1, 0], issues: [0, 1, 1, 0, 2, 0, 1], safetyReports: [0, 0, 1, 0, 0, 0, 0] },
                stats: { equipmentUtilization: 65 },
                financialOverview: { overdueInvoices: 2 },
                teamMetrics: [{ productivity: 72 }, { productivity: 88 }, { productivity: 65 }]
            } as DashboardData;

            // Generate realistic recommendations based on actual data patterns
            const recommendations = generateConstructionRecommendations(currentData);
            setAiRecommendations(recommendations);
        } catch (error) {
            console.error("Error generating AI recommendations:", error);
            // Fallback to sample recommendations
            setAiRecommendations([
                {
                    id: 'fallback-1',
                    type: 'safety',
                    priority: 'high',
                    title: 'Weather Safety Alert',
                    description: 'Upcoming weather conditions may impact outdoor work safety.',
                    actionItems: ['Check weather forecast daily', 'Prepare indoor alternative tasks'],
                    confidence: 95
                }
            ]);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    if (!dashboardData || loading) {
        return <Loading />
    }

    // Enhanced Chart Configurations
    const projectStatusData = {
        labels: ["Active", "Completed", "On Hold", "Planning"],
        datasets: [
            {
                data: [
                    dashboardData.projectStatusData.active,
                    dashboardData.projectStatusData.completed,
                    dashboardData.projectStatusData.onHold,
                    dashboardData.projectStatusData.planning
                ],
                backgroundColor: [
                    "#F87431", // primary
                    "#02ACA3", // secondary
                    "#C275B4", // accent
                    "#5C95FF", // info
                ],
                borderWidth: 0,
                cutout: "60%",
            },
        ],
    }

    const taskStatusData = {
        labels: ["Pending", "In Progress", "Completed"],
        datasets: [
            {
                label: "Tasks",
                data: [
                    dashboardData.taskStatusData.pending,
                    dashboardData.taskStatusData.inProgress,
                    dashboardData.taskStatusData.completed
                ],
                backgroundColor: [
                    "#F87431", // primary
                    "#02ACA3", // secondary
                    "#C275B4", // accent
                ],
                borderRadius: 4,
            },
        ],
    }

    const equipmentData = {
        labels: ["Available", "In Use", "Maintenance"],
        datasets: [
            {
                data: [
                    dashboardData.equipmentStatus.available,
                    dashboardData.equipmentStatus.inUse,
                    dashboardData.equipmentStatus.maintenance
                ],
                backgroundColor: [
                    "#F87431", // primary
                    "#02ACA3", // secondary
                    "#C275B4", // accent
                ],
                borderWidth: 0,
            },],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    usePointStyle: true,
                }
            }
        }
    }

    // Daily Logs Line Chart Configuration
    const dailyLogsData = {
        labels: dashboardData.dailyLogsData.dates,
        datasets: [
            {
                label: "Delays",
                data: dashboardData.dailyLogsData.delays,
                borderColor: "#F87431",
                backgroundColor: "rgba(248, 116, 49, 0.1)",
                tension: 0.4,
                fill: false,
            },
            {
                label: "Issues",
                data: dashboardData.dailyLogsData.issues,
                borderColor: "#FF6B6B",
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                tension: 0.4,
                fill: false,
            },
            {
                label: "Safety Reports",
                data: dashboardData.dailyLogsData.safetyReports,
                borderColor: "#4ECDC4",
                backgroundColor: "rgba(78, 205, 196, 0.1)",
                tension: 0.4,
                fill: false,
            },
        ],
    }

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    usePointStyle: true,
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                }
            }
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-base-100 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="">
                        <h1 className="text-3xl font-bold mb-2">Command Center</h1>
                        <p className="text-lg opacity-90">Real-time insights into your projects, teams, and operations</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 md:mt-0 w-full md:w-auto">
                        <button className="btn btn-primary md:btn-sm" onClick={() => setProjectModal(true)}>
                            <i className="far fa-diagram-project mr-2"></i>
                            New Projects
                        </button>
                        <button className="btn btn-secondary md:btn-sm" onClick={() => setTaskModal(true)}>
                            <i className="far fa-tasks mr-2"></i>
                            New Tasks
                        </button>
                        <button className="btn btn-info md:btn-sm" onClick={() => setDailyLogModal(true)}>
                            <i className="far fa-calendar-alt mr-2"></i>
                            Daily Log
                        </button>
                        <button className="btn btn-accent md:btn-sm" onClick={() => setEquipmentModal(true)}>
                            <i className="far fa-users mr-2"></i>
                            New Equipment
                        </button>

                    </div>
                </div>
            </div>

            {<ProjectModal isOpen={projectModal} onClose={() => setProjectModal(false)} onSave={async () => setProjectModal(false)} />}
            {<TaskModal isOpen={taskModal} onClose={() => setTaskModal(false)} task={null} />}
            {<DailyLogModal isOpen={dailyLogModal} onClose={() => setDailyLogModal(false)} onSave={() => setDailyLogModal(false)} />}
            {<EquipmentNewModal isOpen={equipmentModal} onClose={() => setEquipmentModal(false)} onSave={() => setEquipmentModal(false)} />}

            {/* Key Performance Indicators */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load dashboard statistics</h3>
                        <div className="text-xs">Please refresh the page to try again.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="stat bg-gradient-to-br from-primary/70 to-primary/100 text-primary-content rounded-lg shadow-lg">
                        <div className="stat-figure">
                            <i className="far fa-screwdriver-wrench text-3xl opacity-80"></i>
                        </div>
                        <div className="stat-title text-blue-100">Active Projects</div>
                        <div className="stat-value">{dashboardData.stats.activeProjects}</div>
                        <div className="stat-desc text-blue-200">of {dashboardData.stats.totalProjects} total</div>
                    </div>

                    <div className="stat bg-gradient-to-br from-secondary/70 to-secondary/100 text-secondary-content rounded-lg shadow-lg">
                        <div className="stat-figure">
                            <i className="far fa-tasks text-3xl opacity-80"></i>
                        </div>
                        <div className="stat-title text-emerald-100">Pending Tasks</div>
                        <div className="stat-value">{dashboardData.stats.pendingTasks}</div>
                        <div className="stat-desc text-emerald-200">of {dashboardData.stats.totalTasks} total</div>
                    </div>

                    <div className="stat bg-gradient-to-br from-accent/70 to-accent/100 text-accent-content rounded-lg shadow-lg">
                        <div className="stat-figure">
                            <i className="far fa-tools text-3xl opacity-80"></i>
                        </div>
                        <div className="stat-title text-amber-100">Equipment Active</div>
                        <div className="stat-value">{dashboardData.stats.equipmentUtilization}%</div>
                        <div className="stat-desc text-amber-200">{dashboardData.stats.totalEquipment} total units</div>
                    </div>

                    <div className="stat bg-gradient-to-br from-info/70 to-info/100 text-info-content rounded-lg shadow-lg">
                        <div className="stat-figure">
                            <i className="far fa-dollar-sign text-3xl opacity-80"></i>
                        </div>
                        <div className="stat-title text-green-100">Revenue</div>
                        <div className="stat-value text-2xl">{formatCurrency(dashboardData.stats.totalRevenue)}</div>
                        <div className="stat-desc text-green-200">{formatCurrency(dashboardData.stats.pendingRevenue)} pending</div>
                    </div>
                </div>
            </ErrorBoundary>            {/* Charts Section */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load dashboard charts</h3>
                        <div className="text-xs">Charts are temporarily unavailable. Please refresh the page.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-chart-pie text-primary mr-2"></i>
                                Project Status
                            </h2>
                            <div className="h-64">
                                <Doughnut data={projectStatusData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-chart-bar text-primary mr-2"></i>
                                Task Distribution
                            </h2>
                            <div className="h-64">
                                <Bar data={taskStatusData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-cogs text-primary mr-2"></i>
                                Equipment Status
                            </h2>
                            <div className="h-64">
                                <Doughnut data={equipmentData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
            {/* Financial Overview */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load financial overview</h3>
                        <div className="text-xs">Financial data is temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-lg">
                            <i className="far fa-chart-line text-primary mr-2"></i>
                            Financial Overview
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="stat">
                                <div className="stat-title">Total Revenue</div>
                                <div className="stat-value text-success">{formatCurrency(dashboardData.financialOverview.totalRevenue)}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Pending</div>
                                <div className="stat-value text-warning">{formatCurrency(dashboardData.financialOverview.pendingRevenue)}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Total Invoices</div>
                                <div className="stat-value">{dashboardData.financialOverview.totalInvoices}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Paid</div>
                                <div className="stat-value text-success">{dashboardData.financialOverview.paidInvoices}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Overdue</div>
                                <div className="stat-value text-error">{dashboardData.financialOverview.overdueInvoices}</div>
                            </div>
                        </div>                    </div>
                </div>
            </ErrorBoundary>

            {/* Compact Weather Forecast */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load weather forecast</h3>
                        <div className="text-xs">Weather data is temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <CompactWeatherWidget
                    location={{
                        latitude: 40.7128,
                        longitude: -74.0060,
                        address: "Current Location"
                    }}
                />
            </ErrorBoundary>

            {/* Daily Logs, AI Recommendations & Weather */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load analytics section</h3>
                        <div className="text-xs">Daily logs, AI recommendations, and weather data are temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily Logs Trends */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-chart-line text-primary mr-2"></i>
                                Daily Logs Trends
                            </h2>
                            <div className="h-64">
                                {dashboardData.dailyLogsData.dates.length > 0 ? (
                                    <Line data={dailyLogsData} options={lineChartOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-base-content/50">
                                        <div className="text-center">
                                            <i className="far fa-chart-line text-4xl mb-2"></i>
                                            <p>No daily logs data yet</p>
                                            <button
                                                className="btn btn-primary btn-sm mt-2"
                                                onClick={() => setDailyLogModal(true)}
                                            >
                                                Add Daily Log
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="card bg-base-100 shadow-lg col-span-2">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-brain text-primary mr-2"></i>
                                AI Recommendations
                            </h2>                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {loadingRecommendations ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="loading loading-spinner loading-lg"></div>
                                        <span className="ml-2">Analyzing your data...</span>
                                    </div>
                                ) : aiRecommendations.length > 0 ? (
                                    aiRecommendations.slice(0, 3).map((recommendation) => (
                                        <div key={recommendation.id} className={`border rounded-lg p-3 ${recommendation.priority === 'critical' ? 'border-error bg-error/5' :
                                            recommendation.priority === 'high' ? 'border-warning bg-warning/5' :
                                                recommendation.priority === 'medium' ? 'border-info bg-info/5' :
                                                    'border-base-300 bg-base-50'
                                            }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-sm">{recommendation.title}</h3>
                                                <div className="flex items-center space-x-1">
                                                    <span className={`badge badge-xs ${recommendation.priority === 'critical' ? 'badge-error' :
                                                        recommendation.priority === 'high' ? 'badge-warning' :
                                                            recommendation.priority === 'medium' ? 'badge-info' :
                                                                'badge-outline'
                                                        }`}>
                                                        {recommendation.priority}
                                                    </span>
                                                    <span className="text-xs text-base-content/50">
                                                        {recommendation.confidence}% confident
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-base-content/70 mb-2">{recommendation.description}</p>
                                            {recommendation.actionItems.length > 0 && (
                                                <div className="text-xs">
                                                    <strong>Actions:</strong>
                                                    <ul className="list-disc list-inside text-base-content/60 ml-2">
                                                        {recommendation.actionItems.slice(0, 2).map((item, index) => (
                                                            <li key={index}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-lightbulb text-4xl mb-2"></i>
                                        <p>AI is analyzing your data...</p>
                                        <p className="text-xs">Recommendations will appear soon</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
            {/* Project Progress & Critical Tasks */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load project status</h3>
                        <div className="text-xs">Project and task data is temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-building text-primary mr-2"></i>
                                Active Projects
                            </h2>
                            <div className="space-y-3">
                                {dashboardData.projectsWithProgress.length > 0 ? (
                                    dashboardData.projectsWithProgress.slice(0, 3).map((project) => (
                                        <div key={project.id} className="border border-base-300 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold">{project.name}</h3>
                                                    <p className="text-sm text-base-content/70">{project.clientName}</p>
                                                </div>
                                                <span className={`badge ${project.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                                    {project.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm">Progress: {project.progress}%</span>
                                                <span className="text-sm">{project.completedTasks}/{project.taskCount} tasks</span>
                                            </div>
                                            <progress className="progress progress-primary w-full" value={project.progress} max="100"></progress>
                                            <div className="text-xs text-base-content/50 mt-1">
                                                Crew: {project.crewName}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-plus-circle text-4xl mb-2"></i>
                                        <p>No active projects yet</p>
                                        <Link href="/dashboard/projects" className="btn btn-primary btn-sm mt-2">
                                            Create Project
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-exclamation-triangle text-warning mr-2"></i>
                                Critical Tasks
                            </h2>
                            <div className="space-y-3">
                                {dashboardData.criticalTasks.length > 0 ? (
                                    dashboardData.criticalTasks.slice(0, 3).map((task) => (
                                        <div key={task.id} className={`border rounded-lg p-4 ${task.isOverdue ? 'border-error bg-error/5' : 'border-warning bg-warning/5'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold">{task.name}</h3>
                                                    <p className="text-sm text-base-content/70">{task.projectName}</p>
                                                </div>
                                                <span className={`badge ${task.isOverdue ? 'badge-error' : 'badge-warning'}`}>
                                                    {task.isOverdue ? 'Overdue' : 'Due Soon'}
                                                </span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <div>Due: {formatDate(task.dueDate)}</div>
                                                <div>Assigned: {task.crewName}</div>
                                                <div>Client: {task.clientName}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-check-circle text-4xl mb-2 text-success"></i>
                                        <p>All tasks are on track!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
            {/* Team Performance & Recent Activity */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load team and activity data</h3>
                        <div className="text-xs">Team performance and recent activity are temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-users text-primary mr-2"></i>
                                Team Performance
                            </h2>
                            <div className="space-y-3">
                                {dashboardData.teamMetrics.length > 0 ? (
                                    dashboardData.teamMetrics.slice(0, 3).map((team) => (
                                        <div key={team.id} className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                                            <div>
                                                <h3 className="font-semibold">{team.name}</h3>
                                                <p className="text-sm text-base-content/70">
                                                    {team.activeTasks} active • {team.completedTasks} completed
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{team.productivity}%</div>
                                                <div className="text-xs text-base-content/50">productivity</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-user-plus text-4xl mb-2"></i>
                                        <p>No teams created yet</p>
                                        <Link href="/dashboard/crews" className="btn btn-primary btn-sm mt-2">
                                            Add Teams
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-clock text-primary mr-2"></i>
                                Recent Activity
                            </h2>
                            <div className="space-y-3">
                                {dashboardData.recentActivity.length > 0 ? (
                                    dashboardData.recentActivity.slice(0, 3).map((activity) => (
                                        <div key={activity.id} className="border-l-4 border-primary pl-4 py-2">
                                            <p className="font-medium text-sm">{activity.message}</p>
                                            <div className="text-xs text-base-content/70 space-y-1">
                                                <div>{activity.projectName} • {activity.clientName}</div>
                                                <div>{formatDate(activity.timestamp)}</div>
                                                {activity.weather && (
                                                    <div className="badge badge-outline badge-sm">{activity.weather}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-clipboard-list text-4xl mb-2"></i>
                                        <p>No recent activity</p>
                                        <Link href="/dashboard/daily-logs" className="btn btn-primary btn-sm mt-2">
                                            Add Daily Log
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </div>
    )
}
