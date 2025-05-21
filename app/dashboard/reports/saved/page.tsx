"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for saved reports
const savedReports = [
  {
    id: "report1",
    name: "Q2 Financial Summary",
    description: "Financial performance for Q2 including revenue, expenses, and profit margins.",
    category: "financial",
    createdAt: "2025-04-15",
    lastRun: "2025-05-10",
    favorite: true,
    scheduled: true,
    scheduleFrequency: "Monthly",
  },
  {
    id: "report2",
    name: "Annual Equipment Review",
    description: "Annual review of equipment utilization, maintenance costs, and performance.",
    category: "equipment",
    createdAt: "2025-01-10",
    lastRun: "2025-05-05",
    favorite: true,
    scheduled: false,
    scheduleFrequency: null,
  },
  {
    id: "report3",
    name: "Project Profitability",
    description: "Analysis of project profitability across all active and completed projects.",
    category: "project",
    createdAt: "2025-03-22",
    lastRun: "2025-05-01",
    favorite: true,
    scheduled: true,
    scheduleFrequency: "Weekly",
  },
  {
    id: "report4",
    name: "Crew Performance Metrics",
    description: "Performance metrics for all crews including efficiency and utilization.",
    category: "crew",
    createdAt: "2025-02-18",
    lastRun: "2025-04-28",
    favorite: false,
    scheduled: false,
    scheduleFrequency: null,
  },
  {
    id: "report5",
    name: "Client Revenue Analysis",
    description: "Analysis of revenue by client, including trends and projections.",
    category: "client",
    createdAt: "2025-03-05",
    lastRun: "2025-05-02",
    favorite: false,
    scheduled: true,
    scheduleFrequency: "Monthly",
  },
  {
    id: "report6",
    name: "Equipment Maintenance Costs",
    description: "Detailed breakdown of maintenance costs by equipment type.",
    category: "equipment",
    createdAt: "2025-04-10",
    lastRun: "2025-05-08",
    favorite: false,
    scheduled: false,
    scheduleFrequency: null,
  },
  {
    id: "report7",
    name: "Project Timeline Analysis",
    description: "Analysis of project timelines vs. estimates for all projects.",
    category: "project",
    createdAt: "2025-02-28",
    lastRun: "2025-04-15",
    favorite: false,
    scheduled: true,
    scheduleFrequency: "Bi-weekly",
  },
]

export default function SavedReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [showScheduledOnly, setShowScheduledOnly] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Filter reports based on search query and filters
  const filteredReports = savedReports.filter((report) => {
    const matchesSearch =
      searchQuery === "" ||
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === null || report.category === categoryFilter
    const matchesScheduled = !showScheduledOnly || report.scheduled
    const matchesFavorites = !showFavoritesOnly || report.favorite

    return matchesSearch && matchesCategory && matchesScheduled && matchesFavorites
  })

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "financial":
        return "chart-line"
      case "project":
        return "project-diagram"
      case "equipment":
        return "truck"
      case "crew":
        return "users"
      case "client":
        return "user-tie"
      default:
        return "file-alt"
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports" className="btn btn-ghost btn-sm">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="text-2xl font-bold">Saved Reports</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/reports/custom" className="btn btn-primary">
            <i className="fas fa-plus mr-2"></i> New Report
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="form-control flex-1">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search reports..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-square">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              className="select select-bordered"
              value={categoryFilter || ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
            >
              <option value="">All Categories</option>
              <option value="financial">Financial</option>
              <option value="project">Project</option>
              <option value="equipment">Equipment</option>
              <option value="crew">Crew</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={showScheduledOnly}
              onChange={() => setShowScheduledOnly(!showScheduledOnly)}
            />
            <span className="label-text">Scheduled Reports Only</span>
          </label>
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={showFavoritesOnly}
              onChange={() => setShowFavoritesOnly(!showFavoritesOnly)}
            />
            <span className="label-text">Favorites Only</span>
          </label>
        </div>
      </div>

      {/* Reports grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={`bg-${report.category === "financial" ? "blue" : report.category === "project" ? "green" : report.category === "equipment" ? "yellow" : report.category === "crew" ? "purple" : "red"}-500 bg-opacity-20 p-3 rounded-full`}
                  >
                    <i
                      className={`fas fa-${getCategoryIcon(report.category)} text-${report.category === "financial" ? "blue" : report.category === "project" ? "green" : report.category === "equipment" ? "yellow" : report.category === "crew" ? "purple" : "red"}-500`}
                    ></i>
                  </div>
                  <h2 className="card-title">{report.name}</h2>
                </div>
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
                    <i className="fas fa-ellipsis-v"></i>
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                      <a>
                        <i className="fas fa-edit mr-2"></i> Edit Report
                      </a>
                    </li>
                    <li>
                      <a>
                        <i className="fas fa-copy mr-2"></i> Duplicate
                      </a>
                    </li>
                    <li>
                      <a>
                        <i className={`fas fa-${report.scheduled ? "calendar-times" : "calendar-plus"} mr-2`}></i>
                        {report.scheduled ? "Remove Schedule" : "Schedule Report"}
                      </a>
                    </li>
                    <li>
                      <a>
                        <i className={`fas fa-${report.favorite ? "star text-warning" : "star"} mr-2`}></i>
                        {report.favorite ? "Remove from Favorites" : "Add to Favorites"}
                      </a>
                    </li>
                    <li>
                      <a className="text-error">
                        <i className="fas fa-trash mr-2"></i> Delete
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-base-content/70 mt-2">{report.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="badge badge-outline">
                  {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                </div>
                {report.scheduled && (
                  <div className="badge badge-outline badge-primary">
                    <i className="fas fa-calendar-alt mr-1"></i> {report.scheduleFrequency}
                  </div>
                )}
                {report.favorite && (
                  <div className="badge badge-outline badge-warning">
                    <i className="fas fa-star mr-1"></i> Favorite
                  </div>
                )}
              </div>
              <div className="text-xs text-base-content/60 mt-4">
                <div className="flex justify-between">
                  <span>Created: {formatDate(report.createdAt)}</span>
                  <span>Last Run: {formatDate(report.lastRun)}</span>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <Link href={`/dashboard/reports/${report.id}`} className="btn btn-sm btn-outline">
                  <i className="fas fa-eye mr-2"></i> View
                </Link>
                <button className="btn btn-sm btn-primary">
                  <i className="fas fa-play mr-2"></i> Run
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="bg-base-100 p-8 rounded-lg shadow-sm text-center">
          <i className="fas fa-search text-5xl text-base-content/30 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
          <p className="text-base-content/70 mb-6">
            No reports match your current search criteria. Try adjusting your filters or create a new report.
          </p>
          <Link href="/dashboard/reports/custom" className="btn btn-primary">
            <i className="fas fa-plus mr-2"></i> Create New Report
          </Link>
        </div>
      )}
    </div>
  )
}
