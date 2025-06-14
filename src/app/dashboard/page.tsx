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
import { Doughnut, Line, Bar } from "react-chartjs-2"
import { getDashboardData } from "@/app/actions/dashboard"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { TaskStatus, taskStatusOptions } from "@/types/tasks"
import { useEffect, useState } from "react"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title)

interface DashboardData {
    stats: {
        activeProjects: number;
        pendingTasks: number;
        equipmentUtilization: number;
        unpaidInvoices: number;
        unpaidAmount: number;
    };
    projectStatusData: {
        inProgress: number;
        completed: number;
        onHold: number;
        planning: number;
    };
    recentActivity: Array<{ id: string; message: string; user: string; timestamp: string | null; projectId: string }>;
    upcomingTasks: Array<{ id: string; name: string; dueDate: string | null; status: string | null; projectName: string }>;
}

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

    useEffect(() => {
        async function fetchData() {
            const data: DashboardData = await getDashboardData()
            setDashboardData(data)
        }
        fetchData()
    }, [])

    if (!dashboardData) {
        return <div>Loading...</div>
    }

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

    const getStatusBadgeClass = (status: string | null) => {
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
                <p className="text-gray-500">Welcome back! Here's an overview of your projects and tasks.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="card bg-base-100 shadow-sm p-4">
                    <i className="fas fa-project-diagram text-3xl text-blue-500 mb-2"></i>
                    <h3 className="text-2xl font-bold">{dashboardData.stats.activeProjects}</h3>
                    <p className="text-gray-500">Active Projects</p>
                </div>

                <div className="card bg-base-100 shadow-sm p-4">
                    <i className="fas fa-tasks text-3xl text-yellow-500 mb-2"></i>
                    <h3 className="text-2xl font-bold">{dashboardData.stats.pendingTasks}</h3>
                    <p className="text-gray-500">Pending Tasks</p>
                </div>

                <div className="card bg-base-100 shadow-sm p-4">
                    <i className="fas fa-tools text-3xl text-green-500 mb-2"></i>
                    <h3 className="text-2xl font-bold">{dashboardData.stats.equipmentUtilization}%</h3>
                    <p className="text-gray-500">Equipment Utilization</p>
                </div>

                <div className="card bg-base-100 shadow-sm p-4">
                    <i className="fas fa-file-invoice-dollar text-3xl text-red-500 mb-2"></i>
                    <h3 className="text-2xl font-bold">{formatCurrency(dashboardData.stats.unpaidAmount)}</h3>
                    <p className="text-gray-500">Unpaid Invoices</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="card bg-base-100 shadow-sm p-4">
                    <h2 className="text-lg font-bold mb-4">Project Status</h2>
                    <Doughnut data={projectStatusData} />
                </div>

                <div className="card bg-base-100 shadow-sm p-4">
                    <h2 className="text-lg font-bold mb-4">Equipment Utilization</h2>
                    {/* Placeholder for another chart */}
                </div>
            </div>

            {/* Recent Activity & Upcoming Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm p-4">
                    <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
                    {dashboardData.recentActivity.length > 0 ? (
                        dashboardData.recentActivity.map((activity) => (
                            <div key={activity.id} className="mb-4">
                                <p className="font-medium">{activity.message}</p>
                                <p className="text-gray-500 text-sm">{activity.user} • {formatDate(activity.timestamp || "")}</p>
                            </div>
                        ))
                    ) : (
                        <div>No recent activity</div>
                    )}
                </div>

                <div className="card bg-base-100 shadow-sm p-4">
                    <h2 className="text-lg font-bold mb-4">Upcoming Tasks</h2>
                    {dashboardData.upcomingTasks.length > 0 ? (
                        dashboardData.upcomingTasks.map((task) => (
                            <div key={task.id} className="mb-4">
                                <p className="font-medium">{task.name}</p>
                                <p className="text-gray-500 text-sm">{task.projectName} • Due: {formatDate(task.dueDate || "")}</p>
                                <span className={`badge ${getStatusBadgeClass(task.status)}`}>{task.status || "Unknown"}</span>
                            </div>
                        ))
                    ) : (
                        <div>No upcoming tasks</div>
                    )}
                </div>
            </div>
        </div>
    )
}