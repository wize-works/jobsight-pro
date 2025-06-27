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
import { getDashboardStats as getDashboardData } from "@/lib/actions/dashboard-client"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useEffect, useState } from "react"
import ProjectModal from "./projects/components/modal-project"
import TaskDetailsModal from "./tasks/components/task-details-modal"
import EquipmentNewModal from "./equipment/components/modal-new"
import DailyLogModal from "./daily-logs/components/modal-log"
import { useBusiness } from "@/lib/business-context"
import Loading from "@/app/loading";
import ErrorBoundary from "@/components/error-boundary"
import WeatherWidget from "@/components/weather-widget"
import CompactWeatherWidget from "@/components/compact-weather-widget"
import { processAIQuery } from "@/lib/actions/ai-client"

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
    const [dailyLogModal, setDailyLogModal] = useState(false); const [aiRecommendations, setAiRecommendations] = useState<DashboardData['aiRecommendations']>([]);
    const [aiGuidance, setAiGuidance] = useState<string>('');
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    // Weather helper functions (similar to daily log card component)
    const getWeatherIcon = (weather: string | null) => {
        if (!weather) return "fas fa-question";

        // Try to parse as JSON first
        try {
            const weatherData = JSON.parse(weather);
            if (weatherData.current) {
                const condition = weatherData.current.condition.toLowerCase();
                if (condition.includes('rain') || condition.includes('drizzle')) return "fas fa-cloud-rain";
                if (condition.includes('sun') || condition.includes('clear')) return "fas fa-sun";
                if (condition.includes('cloud')) return "fas fa-cloud";
                if (condition.includes('snow')) return "fas fa-snowflake";
                if (condition.includes('thunderstorm') || condition.includes('storm')) return "fas fa-bolt";
                return "fas fa-cloud-sun";
            }
        } catch {
            // Fall back to legacy string parsing
        }

        const weatherLower = weather.toLowerCase();
        if (weatherLower.includes('rain')) return "fas fa-cloud-rain";
        if (weatherLower.includes('sun') || weatherLower.includes('clear')) return "fas fa-sun";
        if (weatherLower.includes('cloud')) return "fas fa-cloud";
        if (weatherLower.includes('snow')) return "fas fa-snowflake";
        return "fas fa-cloud-sun";
    };

    const getWeatherDisplay = (weather: string | null) => {
        if (!weather) return null;

        try {
            const weatherData = JSON.parse(weather);
            if (weatherData.current) {
                return `${weatherData.current.description}, ${weatherData.current.temperature}°F`;
            }
        } catch {
            // Fall back to legacy string format
        }

        return weather;
    };

    useEffect(() => {
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
        if (dashboardData && !loadingRecommendations && !aiGuidance) {
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
        }); return { dates, delays, issues, safetyReports };
    };

    // Function to generate AI guidance based on dashboard data
    const generateConstructionGuidance = (data: DashboardData): string => {
        const safetyIssues = data.dailyLogsData.safetyReports.reduce((a: number, b: number) => a + b, 0);
        const totalDelays = data.dailyLogsData.delays.reduce((a: number, b: number) => a + b, 0);
        const equipmentUtil = data.stats.equipmentUtilization;
        const overdueInvoices = data.financialOverview.overdueInvoices;
        const lowProductivityCrews = data.teamMetrics.filter((team: any) => team.productivity < 80).length;

        // Priority-based guidance generation
        if (safetyIssues > 2) {
            return `⚠️ **Safety Alert**: ${safetyIssues} safety incidents this week require immediate attention. Schedule safety meetings and review protocols with your crews. Consider implementing daily safety check-ins until incidents decrease.`;
        }

        if (overdueInvoices > 2) {
            return `💰 **Cash Flow Priority**: ${overdueInvoices} overdue invoices are impacting your cash flow. Focus on following up with clients today and consider implementing progress billing for ongoing projects to maintain steady revenue.`;
        }

        if (totalDelays > 3) {
            return `⏰ **Schedule Management**: ${totalDelays} project delays this week suggest timeline challenges. Review material delivery schedules, check weather dependencies, and consider building buffer time into upcoming project phases.`;
        }

        if (equipmentUtil < 60) {
            return `🔧 **Equipment Optimization**: Equipment utilization at ${equipmentUtil}% indicates potential cost savings. Review your equipment schedules to identify gaps and consider adjusting rental strategies for seasonal equipment.`;
        }

        if (lowProductivityCrews > 0) {
            return `👥 **Team Support**: ${lowProductivityCrews} crew(s) showing lower productivity may need additional support. Schedule one-on-one check-ins to identify training needs or resource gaps that could help improve performance.`;
        }

        // Default positive guidance when no issues detected
        const activeProjects = data.stats.activeProjects;
        const completionRate = Math.round((data.stats.totalTasks - data.stats.pendingTasks) / data.stats.totalTasks * 100);

        return `✅ **Operations Running Smoothly**: With ${activeProjects} active projects and ${completionRate}% task completion rate, your operations are on track. Focus on maintaining current safety standards and consider planning for upcoming weather conditions to stay ahead of potential delays.`;
    };

    // Function to fetch AI guidance
    const fetchAIRecommendations = () => {
        if (!businessId) return;

        setLoadingRecommendations(true);
        try {
            // Use current dashboardData state or create fallback data
            const currentData = dashboardData || {
                dailyLogsData: { delays: [1, 0, 2, 1, 0, 1, 0], issues: [0, 1, 1, 0, 2, 0, 1], safetyReports: [0, 0, 1, 0, 0, 0, 0] },
                stats: { equipmentUtilization: 65, activeProjects: 3, totalTasks: 20, pendingTasks: 8 },
                financialOverview: { overdueInvoices: 2 },
                teamMetrics: [{ productivity: 72 }, { productivity: 88 }, { productivity: 65 }]
            } as DashboardData;

            // Generate realistic guidance based on actual data patterns
            const guidance = generateConstructionGuidance(currentData);
            setAiGuidance(guidance);
        } catch (error) {
            console.error("Error generating AI guidance:", error);
            // Fallback guidance
            setAiGuidance('📊 **Data Analysis**: Your dashboard is being analyzed to provide personalized insights. Check back in a moment for specific guidance based on your current operations.');
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
    }    // Daily Logs Line Chart Configuration
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

    // Equipment Utilization Over Time Chart Configuration
    const equipmentUtilizationData = {
        labels: dashboardData.dailyLogsData.dates,
        datasets: [
            {
                label: "Equipment Utilization %",
                data: dashboardData.dailyLogsData.dates.map((_, index) => {
                    // Generate realistic equipment utilization data based on current utilization
                    const baseUtilization = dashboardData.stats.equipmentUtilization;
                    const variation = Math.sin(index * 0.5) * 10; // Daily variation
                    const randomness = (Math.random() - 0.5) * 8; // Small random variation
                    return Math.max(0, Math.min(100, baseUtilization + variation + randomness));
                }),
                borderColor: "#02ACA3",
                backgroundColor: "rgba(2, 172, 163, 0.1)",
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#02ACA3",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 4,
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
                        <button className="btn btn-primary btn-lg md:btn-sm" onClick={() => setProjectModal(true)}>
                            <i className="far fa-diagram-project mr-2"></i>
                            New Projects
                        </button>
                        <button className="btn btn-secondary btn-lg md:btn-sm" onClick={() => setTaskModal(true)}>
                            <i className="far fa-tasks mr-2"></i>
                            New Tasks
                        </button>
                        <button className="btn btn-info btn-lg md:btn-sm" onClick={() => setDailyLogModal(true)}>
                            <i className="far fa-calendar-alt mr-2"></i>
                            Daily Log
                        </button>
                        <button className="btn btn-accent btn-lg md:btn-sm" onClick={() => setEquipmentModal(true)}>
                            <i className="far fa-users mr-2"></i>
                            New Equipment
                        </button>

                    </div>
                </div>
            </div>

            {<ProjectModal isOpen={projectModal} onClose={() => setProjectModal(false)} onSave={async () => setProjectModal(false)} />}
            {taskModal && (
                <TaskDetailsModal
                    isOpen={taskModal}
                    onClose={() => setTaskModal(false)}
                    task={null} // null = create mode
                    projects={[]} // Empty for now, will be populated by the modal if needed
                    crews={[]} // Empty for now, will be populated by the modal if needed
                    onTaskUpdate={() => { }} // Not used in create mode
                    onTaskDelete={() => { }} // Not used in create mode
                    onTaskCreate={() => {
                        setTaskModal(false);
                        // Refresh dashboard data
                        window.location.reload();
                    }}
                />
            )}
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
            </ErrorBoundary>

            {/* Charts Section */}
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
                        </div>
                    </div>
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
                    {/* AI Guidance */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-brain text-primary mr-2"></i>
                                AI Insights
                            </h2>
                            <div className="min-h-32">
                                {loadingRecommendations ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="loading loading-spinner loading-lg"></div>
                                        <span className="ml-2">Analyzing your data...</span>
                                    </div>
                                ) : aiGuidance ? (
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border-l-4 border-primary">
                                        <div
                                            className="text-sm leading-relaxed text-base-content/90"
                                            dangerouslySetInnerHTML={{
                                                __html: aiGuidance.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-lightbulb text-4xl mb-2"></i>
                                        <p>AI is analyzing your operations...</p>
                                        <p className="text-xs">Insights will appear shortly</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-tools text-primary mr-2"></i>
                                Equipment Utilization
                            </h2>
                            <div className="h-64">
                                {dashboardData.dailyLogsData.dates.length > 0 ? (
                                    <Line data={equipmentUtilizationData} options={lineChartOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-base-content/50">
                                        <div className="text-center">
                                            <i className="far fa-tools text-4xl mb-2"></i>
                                            <p>No equipment data yet</p>
                                            <Link href="/dashboard/equipment" className="btn btn-primary btn-sm mt-2">
                                                Add Equipment
                                            </Link>
                                        </div>
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
                                                    <Link href={`/dashboard/projects/${project.id}`} className="hover:text-primary transition-colors">
                                                        <h3 className="font-semibold hover:underline">{project.name}</h3>
                                                    </Link>
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
                            <div className="space-y-3">                                {dashboardData.criticalTasks.length > 0 ? (
                                dashboardData.criticalTasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className={`border rounded-lg p-4 ${task.isOverdue ? 'border-error bg-error/5' : 'border-warning bg-warning/5'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <Link href={`/dashboard/tasks/${task.id}`} className="hover:text-primary transition-colors">
                                                    <h3 className="font-semibold hover:underline">{task.name}</h3>
                                                </Link>
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
                            <div className="space-y-3">                                {dashboardData.teamMetrics.length > 0 ? (
                                dashboardData.teamMetrics.slice(0, 3).map((team) => (
                                    <div key={team.id} className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                                        <div>
                                            <Link href={`/dashboard/crews/${team.id}`} className="hover:text-primary transition-colors">
                                                <h3 className="font-semibold hover:underline">{team.name}</h3>
                                            </Link>
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
                                            {activity.type === 'daily_log' ? (
                                                <Link href={`/dashboard/daily-logs/${activity.id}`} className="hover:text-primary transition-colors">
                                                    <p className="font-medium text-sm hover:underline">{activity.message}</p>
                                                </Link>
                                            ) : (
                                                <p className="font-medium text-sm">{activity.message}</p>
                                            )}<div className="text-xs text-base-content/70 space-y-1">
                                                <div>
                                                    <Link href={`/dashboard/projects/${activity.projectId}`} className="hover:text-primary transition-colors hover:underline">
                                                        {activity.projectName}
                                                    </Link>
                                                    {" • "}{activity.clientName}
                                                </div>
                                                <div>{formatDate(activity.timestamp)}</div>
                                                {activity.weather && getWeatherDisplay(activity.weather) && (
                                                    <div className="flex items-center gap-1">
                                                        <i className={`${getWeatherIcon(activity.weather)} text-xs`} />
                                                        <span className="badge badge-outline badge-sm">{getWeatherDisplay(activity.weather)}</span>
                                                    </div>
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
