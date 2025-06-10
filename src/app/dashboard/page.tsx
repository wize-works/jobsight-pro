"use client"

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

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title)

export default function Dashboard() {
    const [timeRange, setTimeRange] = useState("week")

    // Project Status Chart Data
    const projectStatusData = {
        labels: ["In Progress", "Completed", "On Hold", "Planning"],
        datasets: [
            {
                data: [12, 8, 3, 5],
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

    // Task Completion Chart Data
    const taskCompletionData = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
            {
                label: "Completed Tasks",
                data: [5, 8, 12, 7, 10, 4, 6],
                backgroundColor: "#02ACA3", // secondary
                borderColor: "#02ACA3", // secondary
                borderWidth: 2,
            },
            {
                label: "Created Tasks",
                data: [7, 11, 15, 9, 12, 8, 10],
                backgroundColor: "#F87431", // primary
                borderColor: "#F87431", // primary
                borderWidth: 2,
            },
        ],
    }

    // Revenue Chart Data
    const revenueData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
            {
                label: "Revenue",
                data: [12500, 19200, 15700, 18300, 24100, 27800],
                borderColor: "#02ACA3", // secondary
                backgroundColor: "rgba(2, 172, 163, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <div className="flex gap-2">
                    <button
                        className={`btn btn-sm ${timeRange === "week" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setTimeRange("week")}
                    >
                        Week
                    </button>
                    <button
                        className={`btn btn-sm ${timeRange === "month" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setTimeRange("month")}
                    >
                        Month
                    </button>
                    <button
                        className={`btn btn-sm ${timeRange === "year" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setTimeRange("year")}
                    >
                        Year
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Active Projects</p>
                                <h3 className="text-2xl font-bold">12</h3>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3">
                                <i className="fas fa-project-diagram text-primary"></i>
                            </div>
                        </div>
                        <div className="text-xs text-success flex items-center mt-2">
                            <i className="fas fa-arrow-up mr-1"></i> 8% from last month
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Pending Tasks</p>
                                <h3 className="text-2xl font-bold">43</h3>
                            </div>
                            <div className="rounded-full bg-secondary/10 p-3">
                                <i className="fas fa-tasks text-secondary"></i>
                            </div>
                        </div>
                        <div className="text-xs text-error flex items-center mt-2">
                            <i className="fas fa-arrow-up mr-1"></i> 12% from last month
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Equipment Usage</p>
                                <h3 className="text-2xl font-bold">78%</h3>
                            </div>
                            <div className="rounded-full bg-accent/10 p-3">
                                <i className="fas fa-truck text-accent"></i>
                            </div>
                        </div>
                        <div className="text-xs text-success flex items-center mt-2">
                            <i className="fas fa-arrow-up mr-1"></i> 5% from last month
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-base-content/70">Unpaid Invoices</p>
                                <h3 className="text-2xl font-bold">$24,500</h3>
                            </div>
                            <div className="rounded-full bg-warning/10 p-3">
                                <i className="fas fa-file-invoice-dollar text-warning"></i>
                            </div>
                        </div>
                        <div className="text-xs text-error flex items-center mt-2">
                            <i className="fas fa-arrow-up mr-1"></i> 15% from last month
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

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-lg mb-4">Task Completion</h3>
                        <div className="h-64">
                            <Bar data={taskCompletionData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-lg mb-4">Revenue</h3>
                        <div className="h-64">
                            <Line data={revenueData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
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
                            <div className="flex gap-3">
                                <div className="avatar">
                                    <div className="w-10 rounded-full">
                                        <img src="/placeholder.svg?height=40&width=40&query=avatar1" alt="User avatar" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">
                                        John Doe completed task{" "}
                                        <Link href="#" className="link link-primary">
                                            Foundation inspection
                                        </Link>
                                    </p>
                                    <p className="text-xs text-base-content/70">2 hours ago</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="avatar">
                                    <div className="w-10 rounded-full">
                                        <img src="/placeholder.svg?height=40&width=40&query=avatar2" alt="User avatar" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Sarah Johnson added a new daily log to{" "}
                                        <Link href="#" className="link link-primary">
                                            Main Street Project
                                        </Link>
                                    </p>
                                    <p className="text-xs text-base-content/70">4 hours ago</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="avatar">
                                    <div className="w-10 rounded-full">
                                        <img src="/placeholder.svg?height=40&width=40&query=avatar3" alt="User avatar" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Mike Wilson created a new project{" "}
                                        <Link href="#" className="link link-primary">
                                            Riverside Apartments
                                        </Link>
                                    </p>
                                    <p className="text-xs text-base-content/70">Yesterday at 3:45 PM</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="avatar">
                                    <div className="w-10 rounded-full">
                                        <img src="/placeholder.svg?height=40&width=40&query=avatar4" alt="User avatar" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Emily Clark assigned equipment{" "}
                                        <Link href="#" className="link link-primary">
                                            Excavator #103
                                        </Link>{" "}
                                        to{" "}
                                        <Link href="#" className="link link-primary">
                                            Downtown Project
                                        </Link>
                                    </p>
                                    <p className="text-xs text-base-content/70">Yesterday at 1:30 PM</p>
                                </div>
                            </div>
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
                                    <tr>
                                        <td>Concrete pouring</td>
                                        <td>Main Street</td>
                                        <td>Today</td>
                                        <td>
                                            <span className="badge badge-warning">Pending</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Electrical inspection</td>
                                        <td>Riverside Apts</td>
                                        <td>Tomorrow</td>
                                        <td>
                                            <span className="badge badge-info">Scheduled</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Framing</td>
                                        <td>Downtown Project</td>
                                        <td>May 22</td>
                                        <td>
                                            <span className="badge badge-primary">In Progress</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Final walkthrough</td>
                                        <td>Johnson Residence</td>
                                        <td>May 25</td>
                                        <td>
                                            <span className="badge badge-secondary">Upcoming</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
