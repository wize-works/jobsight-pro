import Link from "next/link"
import { useState } from "react"
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
import { Doughnut, Line, Bar } from "react-chartjs-2"
import { getDashboardData } from "@/app/actions/dashboard"
import { formatCurrency, formatDate } from "@/utils/formatters"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title)

interface DashboardData {
    stats: {
        activeProjects: number
        pendingTasks: number
        equipmentUtilization: number
        unpaidInvoices: number
        unpaidAmount: number
    }
    projectStatusData: {
        inProgress: number
        completed: number
        onHold: number
        planning: number
    }
    recentActivity: Array<{
        id: string
        type: 'task_completed' | 'log_created' | 'project_created' | 'equipment_assigned'
        message: string
        user: string
        timestamp: string
        projectId?: string
        taskId?: string
    }>
    upcomingTasks: Array<{
        id: string
        name: string
        projectName: string
        dueDate: string
        status: 'pending' | 'scheduled' | 'in_progress' | 'upcoming'
    }>
}

export default async function Dashboard() {
    const dashboardData = await getDashboardData()

    // Project Status Chart Data
    const projectStatusData = {
        labels: ["In Progress", "Completed", "On Hold", "Planning"],
        datasets: [
            {
                data: [
                    dashboardData.projectStatusData.inProgress,
                    dashboardData.projectStatusData.completed,
                    dashboardData.projectStatusData.onHold,
                    dashboardData.projectStatusData.planning
                ],
                backgroundColor: [
                    "#5C95FF", // accent
                    "#34A432", // success
                    "#F5B400", // warning
                    "#CCC9C0", // base-300
                ],
                borderWidth: 0,
            },
        ],
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending': return 'badge-warning'
            case 'scheduled': return 'badge-info'
            case 'in_progress': return 'badge-primary'
            case 'upcoming': return 'badge-secondary'
            default: return 'badge-ghost'
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Active Projects</p>
                                <h3 className="text-2xl font-bold">{dashboardData.stats.activeProjects}</h3>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3">
                                <i className="fas fa-project-diagram text-primary"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Pending Tasks</p>
                                <h3 className="text-2xl font-bold">{dashboardData.stats.pendingTasks}</h3>
                            </div>
                            <div className="rounded-full bg-secondary/10 p-3">
                                <i className="fas fa-tasks text-secondary"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Equipment Usage</p>
                                <h3 className="text-2xl font-bold">{dashboardData.stats.equipmentUtilization}%</h3>
                            </div>
                            <div className="rounded-full bg-accent/10 p-3">
                                <i className="fas fa-truck text-accent"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Unpaid Invoices</p>
                                <h3 className="text-2xl font-bold">{formatCurrency(dashboardData.stats.unpaidAmount)}</h3>
                            </div>
                            <div className="rounded-full bg-warning/10 p-3">
                                <i className="fas fa-file-invoice-dollar text-warning"></i>
                            </div>
                        </div>
                        <div className="text-xs text-base-content/70 mt-2">
                            {dashboardData.stats.unpaidInvoices} invoice{dashboardData.stats.unpaidInvoices !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-lg mb-4">Project Status</h3>
                        <div className="h-64">
                            <Doughnut data={projectStatusData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm lg:col-span-2">
                    <div className="card-body">
                        <h3 className="card-title text-lg mb-4">Project Overview</h3>
                        <div className="text-center text-base-content/70 py-12">
                            <i className="fas fa-chart-bar text-4xl mb-4"></i>
                            <p>Task completion and revenue charts coming soon</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Upcoming Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="card-title text-lg">Recent Activity</h3>
                            <Link href="/dashboard/activity" className="text-sm text-primary">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {dashboardData.recentActivity.length > 0 ? (
                                dashboardData.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex gap-3">
                                        <div className="avatar">
                                            <div className="w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <i className="fas fa-user text-primary text-sm"></i>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-medium">{activity.message}</p>
                                            <p className="text-xs text-base-content/70">
                                                {activity.user} • {formatDate(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-base-content/70 py-8">
                                    <i className="fas fa-clock text-2xl mb-2"></i>
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Tasks */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="card-title text-lg">Upcoming Tasks</h3>
                            <Link href="/dashboard/tasks" className="text-sm text-primary">
                                View All
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            {dashboardData.upcomingTasks.length > 0 ? (
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Task</th>
                                            <th>Project</th>
                                            <th>Due Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.upcomingTasks.map((task) => (
                                            <tr key={task.id}>
                                                <td>
                                                    <Link 
                                                        href={`/dashboard/tasks/${task.id}`}
                                                        className="link link-primary"
                                                    >
                                                        {task.name}
                                                    </Link>
                                                </td>
                                                <td>{task.projectName}</td>
                                                <td>{formatDate(task.dueDate)}</td>
                                                <td>
                                                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center text-base-content/70 py-8">
                                    <i className="fas fa-tasks text-2xl mb-2"></i>
                                    <p>No upcoming tasks</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}