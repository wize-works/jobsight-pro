"use client"

import type React from "react"

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
} from "recharts"

// Mock data for date ranges
const dateRanges = [
  { id: "last7days", name: "Last 7 Days" },
  { id: "last30days", name: "Last 30 Days" },
  { id: "last90days", name: "Last 90 Days" },
  { id: "lastYear", name: "Last Year" },
  { id: "ytd", name: "Year to Date" },
  { id: "custom", name: "Custom Range" },
]

// Mock data for data sources
const dataSources = [
  { id: "projects", name: "Projects", icon: "project-diagram" },
  { id: "tasks", name: "Tasks", icon: "tasks" },
  { id: "crews", name: "Crews", icon: "users" },
  { id: "equipment", name: "Equipment", icon: "truck" },
  { id: "clients", name: "Clients", icon: "user-tie" },
  { id: "invoices", name: "Invoices", icon: "file-invoice-dollar" },
  { id: "expenses", name: "Expenses", icon: "money-bill-wave" },
]

// Mock data for metrics
const metrics = [
  {
    id: "count",
    name: "Count",
    dataTypes: ["projects", "tasks", "crews", "equipment", "clients", "invoices", "expenses"],
  },
  { id: "status", name: "Status Distribution", dataTypes: ["projects", "tasks"] },
  { id: "revenue", name: "Revenue", dataTypes: ["projects", "clients", "invoices"] },
  { id: "cost", name: "Cost", dataTypes: ["projects", "equipment", "expenses"] },
  { id: "profit", name: "Profit", dataTypes: ["projects", "clients"] },
  { id: "utilization", name: "Utilization", dataTypes: ["crews", "equipment"] },
  { id: "performance", name: "Performance", dataTypes: ["crews"] },
  { id: "timeline", name: "Timeline", dataTypes: ["projects", "tasks"] },
]

// Mock data for visualization types
const visualizationTypes = [
  { id: "bar", name: "Bar Chart", icon: "chart-bar" },
  { id: "line", name: "Line Chart", icon: "chart-line" },
  { id: "pie", name: "Pie Chart", icon: "chart-pie" },
  { id: "table", name: "Table", icon: "table" },
]

// Mock data for sample report
const sampleProjectData = [
  { name: "Project A", revenue: 125000, cost: 95000, profit: 30000 },
  { name: "Project B", revenue: 85000, cost: 72000, profit: 13000 },
  { name: "Project C", revenue: 210000, cost: 175000, profit: 35000 },
  { name: "Project D", revenue: 65000, cost: 58000, profit: 7000 },
  { name: "Project E", revenue: 145000, cost: 110000, profit: 35000 },
]

export default function CustomReportPage() {
  const [dateRange, setDateRange] = useState("last30days")
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" })
  const [dataSource, setDataSource] = useState("projects")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["revenue", "cost", "profit"])
  const [visualization, setVisualization] = useState("bar")
  const [showPreview, setShowPreview] = useState(false)
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")

  // Filter metrics based on selected data source
  const filteredMetrics = metrics.filter((metric) => metric.dataTypes.includes(dataSource))

  // Toggle metric selection
  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter((id) => id !== metricId))
    } else {
      setSelectedMetrics([...selectedMetrics, metricId])
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Generate report preview
  const renderReportPreview = () => {
    switch (visualization) {
      case "bar":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleProjectData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                {selectedMetrics.includes("revenue") && <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />}
                {selectedMetrics.includes("cost") && <Bar dataKey="cost" fill="#82ca9d" name="Cost" />}
                {selectedMetrics.includes("profit") && <Bar dataKey="profit" fill="#ffc658" name="Profit" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "line":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleProjectData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                {selectedMetrics.includes("revenue") && (
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                )}
                {selectedMetrics.includes("cost") && (
                  <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost" />
                )}
                {selectedMetrics.includes("profit") && (
                  <Line type="monotone" dataKey="profit" stroke="#ffc658" name="Profit" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )

      case "pie":
        // For pie chart, we'll just use the profit data as an example
        const pieData = sampleProjectData.map((project) => ({
          name: project.name,
          value: project.profit,
        }))

        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c"][index % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Project</th>
                  {selectedMetrics.includes("revenue") && <th className="text-right">Revenue</th>}
                  {selectedMetrics.includes("cost") && <th className="text-right">Cost</th>}
                  {selectedMetrics.includes("profit") && <th className="text-right">Profit</th>}
                </tr>
              </thead>
              <tbody>
                {sampleProjectData.map((project, index) => (
                  <tr key={index}>
                    <td>{project.name}</td>
                    {selectedMetrics.includes("revenue") && (
                      <td className="text-right">{formatCurrency(project.revenue)}</td>
                    )}
                    {selectedMetrics.includes("cost") && <td className="text-right">{formatCurrency(project.cost)}</td>}
                    {selectedMetrics.includes("profit") && (
                      <td className="text-right">{formatCurrency(project.profit)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">Total</td>
                  {selectedMetrics.includes("revenue") && (
                    <td className="text-right font-bold">
                      {formatCurrency(sampleProjectData.reduce((sum, project) => sum + project.revenue, 0))}
                    </td>
                  )}
                  {selectedMetrics.includes("cost") && (
                    <td className="text-right font-bold">
                      {formatCurrency(sampleProjectData.reduce((sum, project) => sum + project.cost, 0))}
                    </td>
                  )}
                  {selectedMetrics.includes("profit") && (
                    <td className="text-right font-bold">
                      {formatCurrency(sampleProjectData.reduce((sum, project) => sum + project.profit, 0))}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        )

      default:
        return (
          <div className="alert alert-info">
            <i className="fas fa-info-circle"></i>
            <span>Please select visualization type and metrics to preview the report.</span>
          </div>
        )
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save the report configuration
    setShowPreview(true)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports" className="btn btn-ghost btn-sm">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="text-2xl font-bold">Create Custom Report</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Report configuration */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit}>
            <div className="card bg-base-100 shadow-sm mb-6">
              <div className="card-body">
                <h2 className="card-title">Report Details</h2>
                <div className="divider mt-0"></div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Report Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Enter report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    placeholder="Enter report description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6">
              <div className="card-body">
                <h2 className="card-title">Data Source</h2>
                <div className="divider mt-0"></div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Select Data Source</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={dataSource}
                    onChange={(e) => {
                      setDataSource(e.target.value)
                      setSelectedMetrics([])
                    }}
                  >
                    {dataSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Date Range</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    {dateRanges.map((range) => (
                      <option key={range.id} value={range.id}>
                        {range.name}
                      </option>
                    ))}
                  </select>
                </div>

                {dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Start Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">End Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6">
              <div className="card-body">
                <h2 className="card-title">Metrics</h2>
                <div className="divider mt-0"></div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Select Metrics</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredMetrics.map((metric) => (
                      <label key={metric.id} className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedMetrics.includes(metric.id)}
                          onChange={() => toggleMetric(metric.id)}
                        />
                        <span className="label-text">{metric.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6">
              <div className="card-body">
                <h2 className="card-title">Visualization</h2>
                <div className="divider mt-0"></div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Select Visualization Type</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {visualizationTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer ${visualization === type.id ? "border-primary bg-primary bg-opacity-10" : "border-base-300"}`}
                      >
                        <input
                          type="radio"
                          name="visualization"
                          className="hidden"
                          value={type.id}
                          checked={visualization === type.id}
                          onChange={() => setVisualization(type.id)}
                        />
                        <i
                          className={`fas fa-${type.icon} text-3xl mb-2 ${visualization === type.id ? "text-primary" : ""}`}
                        ></i>
                        <span>{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 mb-6">
              <Link href="/dashboard/reports" className="btn btn-outline flex-1">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary flex-1">
                Generate Report
              </button>
            </div>
          </form>
        </div>

        {/* Right column - Report preview */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-sm sticky top-4">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Report Preview</h2>
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-outline">
                    <i className="fas fa-sync-alt mr-2"></i> Refresh
                  </button>
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-sm btn-outline">
                      <i className="fas fa-file-export mr-2"></i> Export
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
                </div>
              </div>
              <div className="divider mt-0"></div>

              {showPreview ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">{reportName || "Project Financial Performance"}</h3>
                  <div className="text-sm text-base-content/70 mb-6">
                    <p>
                      {reportDescription ||
                        "Financial performance metrics for projects including revenue, cost, and profit."}
                    </p>
                    <p className="mt-2">
                      <span className="font-medium">Date Range:</span>{" "}
                      {dateRanges.find((r) => r.id === dateRange)?.name}
                      {dateRange === "custom" &&
                        customDateRange.start &&
                        customDateRange.end &&
                        ` (${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()})`}
                    </p>
                  </div>

                  {renderReportPreview()}

                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <div className="stats shadow w-full">
                      {selectedMetrics.includes("revenue") && (
                        <div className="stat">
                          <div className="stat-title">Total Revenue</div>
                          <div className="stat-value text-lg">
                            {formatCurrency(sampleProjectData.reduce((sum, project) => sum + project.revenue, 0))}
                          </div>
                        </div>
                      )}

                      {selectedMetrics.includes("cost") && (
                        <div className="stat">
                          <div className="stat-title">Total Cost</div>
                          <div className="stat-value text-lg">
                            {formatCurrency(sampleProjectData.reduce((sum, project) => sum + project.cost, 0))}
                          </div>
                        </div>
                      )}

                      {selectedMetrics.includes("profit") && (
                        <div className="stat">
                          <div className="stat-title">Total Profit</div>
                          <div className="stat-value text-lg">
                            {formatCurrency(sampleProjectData.reduce((sum, project) => sum + project.profit, 0))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button className="btn btn-primary btn-block">
                      <i className="fas fa-save mr-2"></i> Save Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <i className="fas fa-chart-bar text-6xl text-base-content/30 mb-4"></i>
                  <p className="text-base-content/70">
                    Configure your report and click "Generate Report" to see a preview.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
