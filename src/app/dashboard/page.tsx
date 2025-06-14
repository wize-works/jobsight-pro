
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
import { Doughnut, Bar } from "react-chartjs-2"
import { getDashboardData } from "@/app/actions/dashboard"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useEffect, useState } from "react"

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
    };
    equipmentStatus: {
        available: number;
        inUse: number;
        maintenance: number;
    };
}

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

    useEffect(() => {
        async function fetchData() {
            const rawData = await getDashboardData()
            // Fix: Ensure status is always a string for each project
            const fixedProjectsWithProgress = rawData.projectsWithProgress.map((project) => ({
                ...project,
                status: project.status ?? "", // fallback to empty string if null
                start_date: project.start_date ?? undefined,
                end_date: project.end_date ?? undefined,
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

            const data: DashboardData = {
                ...rawData,
                projectsWithProgress: fixedProjectsWithProgress,
                recentActivity: fixedRecentActivity,
                criticalTasks: fixedCriticalTasks,
            };
            setDashboardData(data)
        }
        fetchData()
    }, [])

    if (!dashboardData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg mb-4"></div>
                    <p className="text-lg">Loading your construction dashboard...</p>
                </div>
            </div>
        )
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
                    "#10B981", // Emerald
                    "#3B82F6", // Blue
                    "#F59E0B", // Amber
                    "#8B5CF6", // Violet
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
                    "#F59E0B", // Amber
                    "#3B82F6", // Blue
                    "#10B981", // Emerald
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
                    "#10B981", // Available - Green
                    "#3B82F6", // In Use - Blue  
                    "#EF4444", // Maintenance - Red
                ],
                borderWidth: 0,
            },
        ],
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-base-100 p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Construction Command Center</h1>
                <p className="text-lg opacity-90">Real-time insights into your projects, teams, and operations</p>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg">
                    <div className="stat-figure">
                        <i className="fas fa-project-diagram text-3xl opacity-80"></i>
                    </div>
                    <div className="stat-title text-blue-100">Active Projects</div>
                    <div className="stat-value">{dashboardData.stats.activeProjects}</div>
                    <div className="stat-desc text-blue-200">of {dashboardData.stats.totalProjects} total</div>
                </div>

                <div className="stat bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg shadow-lg">
                    <div className="stat-figure">
                        <i className="fas fa-tasks text-3xl opacity-80"></i>
                    </div>
                    <div className="stat-title text-emerald-100">Pending Tasks</div>
                    <div className="stat-value">{dashboardData.stats.pendingTasks}</div>
                    <div className="stat-desc text-emerald-200">of {dashboardData.stats.totalTasks} total</div>
                </div>

                <div className="stat bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg shadow-lg">
                    <div className="stat-figure">
                        <i className="fas fa-tools text-3xl opacity-80"></i>
                    </div>
                    <div className="stat-title text-amber-100">Equipment Active</div>
                    <div className="stat-value">{dashboardData.stats.equipmentUtilization}%</div>
                    <div className="stat-desc text-amber-200">{dashboardData.stats.totalEquipment} total units</div>
                </div>

                <div className="stat bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg">
                    <div className="stat-figure">
                        <i className="fas fa-dollar-sign text-3xl opacity-80"></i>
                    </div>
                    <div className="stat-title text-green-100">Revenue</div>
                    <div className="stat-value text-2xl">{formatCurrency(dashboardData.stats.totalRevenue)}</div>
                    <div className="stat-desc text-green-200">{formatCurrency(dashboardData.stats.pendingRevenue)} pending</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-lg mb-4">
                            <i className="fas fa-chart-pie text-primary mr-2"></i>
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
                            <i className="fas fa-chart-bar text-primary mr-2"></i>
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
                            <i className="fas fa-cogs text-primary mr-2"></i>
                            Equipment Status
                        </h2>
                        <div className="h-64">
                            <Doughnut data={equipmentData} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Progress & Critical Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-lg mb-4">
                            <i className="fas fa-building text-primary mr-2"></i>
                            Active Projects
                        </h2>
                        <div className="space-y-3">
                            {dashboardData.projectsWithProgress.length > 0 ? (
                                dashboardData.projectsWithProgress.map((project) => (
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
                                    <i className="fas fa-plus-circle text-4xl mb-2"></i>
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
                            <i className="fas fa-exclamation-triangle text-warning mr-2"></i>
                            Critical Tasks
                        </h2>
                        <div className="space-y-3">
                            {dashboardData.criticalTasks.length > 0 ? (
                                dashboardData.criticalTasks.map((task) => (
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
                                    <i className="fas fa-check-circle text-4xl mb-2 text-success"></i>
                                    <p>All tasks are on track!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Performance & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-lg mb-4">
                            <i className="fas fa-users text-primary mr-2"></i>
                            Team Performance
                        </h2>
                        <div className="space-y-3">
                            {dashboardData.teamMetrics.length > 0 ? (
                                dashboardData.teamMetrics.map((team) => (
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
                                    <i className="fas fa-user-plus text-4xl mb-2"></i>
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
                            <i className="fas fa-clock text-primary mr-2"></i>
                            Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {dashboardData.recentActivity.length > 0 ? (
                                dashboardData.recentActivity.map((activity) => (
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
                                    <i className="fas fa-clipboard-list text-4xl mb-2"></i>
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

            {/* Financial Overview */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title text-lg mb-4">
                        <i className="fas fa-chart-line text-primary mr-2"></i>
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

            {/* Quick Actions */}
            <div className="card bg-gradient-to-r from-base-200 to-base-300 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title text-lg mb-4">
                        <i className="fas fa-bolt text-primary mr-2"></i>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/dashboard/projects" className="btn btn-primary btn-lg">
                            <i className="fas fa-plus mr-2"></i>
                            New Project
                        </Link>
                        <Link href="/dashboard/daily-logs" className="btn btn-secondary btn-lg">
                            <i className="fas fa-clipboard-list mr-2"></i>
                            Daily Log
                        </Link>
                        <Link href="/dashboard/invoices/new" className="btn btn-accent btn-lg">
                            <i className="fas fa-file-invoice mr-2"></i>
                            Create Invoice
                        </Link>
                        <Link href="/dashboard/equipment" className="btn btn-neutral btn-lg">
                            <i className="fas fa-tools mr-2"></i>
                            Equipment
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
