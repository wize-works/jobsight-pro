"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"

// Mock data for reports
const projectStatusData = [
  { name: "Planning", value: 4 },
  { name: "In Progress", value: 7 },
  { name: "On Hold", value: 2 },
  { name: "Completed", value: 12 },
]

const monthlyRevenueData = [
  { name: "Jan", revenue: 45000 },
  { name: "Feb", revenue: 52000 },
  { name: "Mar", revenue: 48000 },
  { name: "Apr", revenue: 61000 },
  { name: "May", revenue: 55000 },
  { name: "Jun", revenue: 67000 },
  { name: "Jul", revenue: 72000 },
  { name: "Aug", revenue: 78000 },
  { name: "Sep", revenue: 69000 },
  { name: "Oct", revenue: 74000 },
  { name: "Nov", revenue: 79000 },
  { name: "Dec", revenue: 85000 },
]

const equipmentUtilizationData = [
  { name: "Excavator", utilized: 85, idle: 15 },
  { name: "Bulldozer", utilized: 72, idle: 28 },
  { name: "Crane", utilized: 65, idle: 35 },
  { name: "Forklift", utilized: 90, idle: 10 },
  { name: "Backhoe", utilized: 78, idle: 22 },
]

const crewPerformanceData = [
  { name: "Team A", efficiency: 92, target: 85 },
  { name: "Team B", efficiency: 87, target: 85 },
  { name: "Team C", efficiency: 79, target: 85 },
  { name: "Team D", efficiency: 95, target: 85 },
  { name: "Team E", efficiency: 82, target: 85 },
]

const clientDistributionData = [
  { name: "Residential", value: 35 },
  { name: "Commercial", value: 45 },
  { name: "Government", value: 15 },
  { name: "Industrial", value: 5 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

// Report types
const reportTypes = [
  { id: "financial", name: "Financial Reports" },
  { id: "project", name: "Project Reports" },
  { id: "equipment", name: "Equipment Reports" },
  { id: "crew", name: "Crew Reports" },
  { id: "client", name: "Client Reports" },
]

// Report templates
const reportTemplates = [
  {
    id: "monthly-revenue",
    name: "Monthly Revenue",
    category: "financial",
    description: "Track monthly revenue trends over the past year",
    icon: "chart-line",
  },
  {
    id: "project-status",
    name: "Project Status Overview",
    category: "project",
    description: "Overview of all projects by current status",
    icon: "project-diagram",
  },
  {
    id: "equipment-utilization",
    name: "Equipment Utilization",
    category: "equipment",
    description: "Utilization rates for major equipment",
    icon: "truck",
  },
  {
    id: "crew-performance",
    name: "Crew Performance",
    category: "crew",
    description: "Efficiency metrics for each crew compared to targets",
    icon: "users",
  },
  {
    id: "client-distribution",
    name: "Client Distribution",
    category: "client",
    description: "Breakdown of clients by industry sector",
    icon: "user-tie",
  },
  {
    id: "project-timeline",
    name: "Project Timeline Analysis",
    category: "project",
    description: "Analysis of project timelines vs. estimates",
    icon: "calendar-alt",
  },
  {
    id: "expense-breakdown",
    name: "Expense Breakdown",
    category: "financial",
    description: "Detailed breakdown of expenses by category",
    icon: "money-bill-wave",
  },
  {
    id: "maintenance-costs",
    name: "Equipment Maintenance Costs",
    category: "equipment",
    description: "Tracking maintenance costs for equipment",
    icon: "tools",
  },
  {
    id: "crew-utilization",
    name: "Crew Utilization",
    category: "crew",
    description: "Utilization rates for each crew",
    icon: "user-clock",
  },
  {
    id: "client-revenue",
    name: "Client Revenue Contribution",
    category: "client",
    description: "Revenue contribution by top clients",
    icon: "hand-holding-usd",
  },
]

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<string | null>("monthly-revenue")

  // Filter templates by category
  const filteredTemplates = selectedCategory
    ? reportTemplates.filter((template) => template.category === selectedCategory)
    : reportTemplates

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Render the selected report
  const renderReport = () => {
    switch (activeReport) {
      case "monthly-revenue":
        return (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Monthly Revenue (Past Year)</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>
                  Total Annual Revenue:{" "}
                  {formatCurrency(monthlyRevenueData.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
                <p>
                  Average Monthly Revenue:{" "}
                  {formatCurrency(monthlyRevenueData.reduce((sum, item) => sum + item.revenue, 0) / 12)}
                </p>
                <p>
                  Highest Month:{" "}
                  {
                    monthlyRevenueData.reduce(
                      (max, item) => (item.revenue > max.revenue ? item : max),
                      monthlyRevenueData[0],
                    ).name
                  }{" "}
                  (
                  {formatCurrency(
                    monthlyRevenueData.reduce(
                      (max, item) => (item.revenue > max.revenue ? item : max),
                      monthlyRevenueData[0],
                    ).revenue,
                  )}
                  )
                </p>
              </div>
            </div>
          </div>
        )

      case "project-status":
        return (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Project Status Overview</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Projects"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>Total Projects: {projectStatusData.reduce((sum, item) => sum + item.value, 0)}</p>
                <p>
                  Completion Rate:{" "}
                  {(
                    ((projectStatusData.find((item) => item.name === "Completed")?.value || 0) /
                      projectStatusData.reduce((sum, item) => sum + item.value, 0)) *
                    100
                  ).toFixed(0)}
                  %
                </p>
                <p>
                  Active Projects:{" "}
                  {(projectStatusData.find((item) => item.name === "In Progress")?.value || 0) +
                    (projectStatusData.find((item) => item.name === "Planning")?.value || 0)}
                </p>
              </div>
            </div>
          </div>
        )

      case "equipment-utilization":
        return (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Equipment Utilization</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equipmentUtilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="utilized" stackId="a" fill="#8884d8" name="Utilized (%)" />
                    <Bar dataKey="idle" stackId="a" fill="#82ca9d" name="Idle (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>
                  Average Utilization:{" "}
                  {(
                    equipmentUtilizationData.reduce((sum, item) => sum + item.utilized, 0) /
                    equipmentUtilizationData.length
                  ).toFixed(1)}
                  %
                </p>
                <p>
                  Most Utilized:{" "}
                  {
                    equipmentUtilizationData.reduce(
                      (max, item) => (item.utilized > max.utilized ? item : max),
                      equipmentUtilizationData[0],
                    ).name
                  }{" "}
                  (
                  {
                    equipmentUtilizationData.reduce(
                      (max, item) => (item.utilized > max.utilized ? item : max),
                      equipmentUtilizationData[0],
                    ).utilized
                  }
                  %)
                </p>
                <p>
                  Least Utilized:{" "}
                  {
                    equipmentUtilizationData.reduce(
                      (min, item) => (item.utilized < min.utilized ? item : min),
                      equipmentUtilizationData[0],
                    ).name
                  }{" "}
                  (
                  {
                    equipmentUtilizationData.reduce(
                      (min, item) => (item.utilized < min.utilized ? item : min),
                      equipmentUtilizationData[0],
                    ).utilized
                  }
                  %)
                </p>
              </div>
            </div>
          </div>
        )

      case "crew-performance":
        return (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Crew Performance</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={crewPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="efficiency" stroke="#8884d8" name="Efficiency (%)" />
                    <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeDasharray="5 5" name="Target (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>
                  Average Efficiency:{" "}
                  {(
                    crewPerformanceData.reduce((sum, item) => sum + item.efficiency, 0) / crewPerformanceData.length
                  ).toFixed(1)}
                  %
                </p>
                <p>
                  Top Performer:{" "}
                  {
                    crewPerformanceData.reduce(
                      (max, item) => (item.efficiency > max.efficiency ? item : max),
                      crewPerformanceData[0],
                    ).name
                  }{" "}
                  (
                  {
                    crewPerformanceData.reduce(
                      (max, item) => (item.efficiency > max.efficiency ? item : max),
                      crewPerformanceData[0],
                    ).efficiency
                  }
                  %)
                </p>
                <p>
                  Teams Above Target: {crewPerformanceData.filter((item) => item.efficiency > item.target).length} of{" "}
                  {crewPerformanceData.length}
                </p>
              </div>
            </div>
          </div>
        )

      case "client-distribution":
        return (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Client Distribution by Sector</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {clientDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Clients (%)"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>Total Distribution: 100%</p>
                <p>
                  Largest Sector:{" "}
                  {
                    clientDistributionData.reduce(
                      (max, item) => (item.value > max.value ? item : max),
                      clientDistributionData[0],
                    ).name
                  }{" "}
                  (
                  {
                    clientDistributionData.reduce(
                      (max, item) => (item.value > max.value ? item : max),
                      clientDistributionData[0],
                    ).value
                  }
                  %)
                </p>
                <p>
                  Smallest Sector:{" "}
                  {
                    clientDistributionData.reduce(
                      (min, item) => (item.value < min.value ? item : min),
                      clientDistributionData[0],
                    ).name
                  }{" "}
                  (
                  {
                    clientDistributionData.reduce(
                      (min, item) => (item.value < min.value ? item : min),
                      clientDistributionData[0],
                    ).value
                  }
                  %)
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Select a Report</h2>
              <p>Please select a report from the list to view detailed analytics.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline">
              <i className="fas fa-file-export mr-2"></i> Export <i className="fas fa-chevron-down ml-2"></i>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a>
                  <i className="fas fa-file-pdf mr-2"></i> Export as PDF
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-file-excel mr-2"></i> Export as Excel
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-file-csv mr-2"></i> Export as CSV
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-print mr-2"></i> Print Report
                </a>
              </li>
            </ul>
          </div>
          <Link href="/dashboard/reports/custom" className="btn btn-primary">
            <i className="fas fa-plus mr-2"></i> Custom Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Report categories and templates */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm mb-6">
            <div className="card-body">
              <h2 className="card-title">Report Categories</h2>
              <div className="divider mt-0"></div>
              <ul className="menu bg-base-100 w-full p-0">
                <li>
                  <a className={selectedCategory === null ? "active" : ""} onClick={() => setSelectedCategory(null)}>
                    <i className="fas fa-th-list"></i> All Reports
                  </a>
                </li>
                {reportTypes.map((type) => (
                  <li key={type.id}>
                    <a
                      className={selectedCategory === type.id ? "active" : ""}
                      onClick={() => setSelectedCategory(type.id)}
                    >
                      <i
                        className={`fas fa-${
                          type.id === "financial"
                            ? "chart-line"
                            : type.id === "project"
                              ? "project-diagram"
                              : type.id === "equipment"
                                ? "truck"
                                : type.id === "crew"
                                  ? "users"
                                  : "user-tie"
                        }`}
                      ></i>{" "}
                      {type.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Saved Reports</h2>
              <div className="divider mt-0"></div>
              <ul className="menu bg-base-100 w-full p-0">
                <li>
                  <a>
                    <i className="fas fa-star text-warning"></i> Q2 Financial Summary
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-star text-warning"></i> Annual Equipment Review
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-star text-warning"></i> Project Profitability
                  </a>
                </li>
              </ul>
              <div className="mt-4">
                <Link href="/dashboard/reports/saved" className="btn btn-outline btn-sm btn-block">
                  <i className="fas fa-folder-open mr-2"></i> View All Saved Reports
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right content - Report templates and selected report */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 shadow-sm mb-6">
            <div className="card-body">
              <h2 className="card-title">Report Templates</h2>
              <div className="divider mt-0"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors ${activeReport === template.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setActiveReport(template.id)}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary bg-opacity-20 p-3 rounded-full">
                          <i className={`fas fa-${template.icon} text-primary`}></i>
                        </div>
                        <h3 className="font-medium">{template.name}</h3>
                      </div>
                      <p className="text-sm mt-2">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected report visualization */}
          {renderReport()}
        </div>
      </div>
    </div>
  )
}
