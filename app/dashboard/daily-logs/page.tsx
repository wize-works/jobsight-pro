"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for daily logs
const mockDailyLogs = [
  {
    id: "dl-001",
    date: "2023-05-15",
    project: "Riverside Apartments",
    author: "John Doe",
    weather: "Sunny, 75°F",
    status: "Completed",
    tasks: 12,
    issues: 2,
    photos: 8,
  },
  {
    id: "dl-002",
    date: "2023-05-14",
    project: "Downtown Office Complex",
    author: "Jane Smith",
    weather: "Cloudy, 68°F",
    status: "Completed",
    tasks: 8,
    issues: 1,
    photos: 5,
  },
  {
    id: "dl-003",
    date: "2023-05-13",
    project: "Riverside Apartments",
    author: "John Doe",
    weather: "Rainy, 62°F",
    status: "Completed",
    tasks: 6,
    issues: 3,
    photos: 4,
  },
  {
    id: "dl-004",
    date: "2023-05-12",
    project: "Community Center",
    author: "Mike Johnson",
    weather: "Partly Cloudy, 70°F",
    status: "Completed",
    tasks: 10,
    issues: 0,
    photos: 12,
  },
  {
    id: "dl-005",
    date: "2023-05-11",
    project: "Downtown Office Complex",
    author: "Jane Smith",
    weather: "Sunny, 72°F",
    status: "Completed",
    tasks: 9,
    issues: 1,
    photos: 7,
  },
]

export default function DailyLogsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProject, setFilterProject] = useState("")

  // Filter logs based on search term and project filter
  const filteredLogs = mockDailyLogs.filter((log) => {
    const matchesSearch =
      log.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.date.includes(searchTerm)

    const matchesProject = filterProject === "" || log.project === filterProject

    return matchesSearch && matchesProject
  })

  // Get unique projects for filter dropdown
  const uniqueProjects = Array.from(new Set(mockDailyLogs.map((log) => log.project)))

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Daily Logs</h1>
          <p className="text-base-content/70">Track and manage your project daily logs</p>
        </div>
        <Link href="/dashboard/daily-logs/create" className="btn btn-primary mt-4 md:mt-0">
          <i className="fas fa-plus mr-2"></i>
          Create New Log
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-primary/20 p-3 mr-4">
                <i className="fas fa-clipboard-list text-primary text-xl"></i>
              </div>
              <div>
                <h3 className="card-title text-lg">Total Logs</h3>
                <p className="text-3xl font-bold">{mockDailyLogs.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-accent/20 p-3 mr-4">
                <i className="fas fa-camera text-accent text-xl"></i>
              </div>
              <div>
                <h3 className="card-title text-lg">Total Photos</h3>
                <p className="text-3xl font-bold">{mockDailyLogs.reduce((sum, log) => sum + log.photos, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-secondary/20 p-3 mr-4">
                <i className="fas fa-exclamation-triangle text-secondary text-xl"></i>
              </div>
              <div>
                <h3 className="card-title text-lg">Issues Reported</h3>
                <p className="text-3xl font-bold">{mockDailyLogs.reduce((sum, log) => sum + log.issues, 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control flex-1">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-square">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>

            <div className="form-control w-full md:w-64">
              <select
                className="select select-bordered w-full"
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
              >
                <option value="">All Projects</option>
                {uniqueProjects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control w-full md:w-64">
              <select className="select select-bordered w-full">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom range</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="card bg-base-100 shadow-md overflow-x-auto">
        <div className="card-body p-0">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th className="hidden md:table-cell">Author</th>
                <th className="hidden md:table-cell">Weather</th>
                <th className="hidden md:table-cell">Tasks</th>
                <th className="hidden md:table-cell">Issues</th>
                <th className="hidden md:table-cell">Photos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="font-medium">{new Date(log.date).toLocaleDateString()}</div>
                  </td>
                  <td>{log.project}</td>
                  <td className="hidden md:table-cell">{log.author}</td>
                  <td className="hidden md:table-cell">{log.weather}</td>
                  <td className="hidden md:table-cell">{log.tasks}</td>
                  <td className="hidden md:table-cell">
                    {log.issues > 0 ? (
                      <span className="badge badge-error">{log.issues}</span>
                    ) : (
                      <span className="badge badge-success">0</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell">{log.photos}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/daily-logs/${log.id}`} className="btn btn-sm btn-ghost">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <Link href={`/dashboard/daily-logs/${log.id}/edit`} className="btn btn-sm btn-ghost">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button className="btn btn-sm btn-ghost text-error">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <div className="join">
          <button className="join-item btn">«</button>
          <button className="join-item btn btn-active">1</button>
          <button className="join-item btn">2</button>
          <button className="join-item btn">3</button>
          <button className="join-item btn">»</button>
        </div>
      </div>
    </div>
  )
}
