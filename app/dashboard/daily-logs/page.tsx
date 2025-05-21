"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function DailyLogsPage() {
  // Mock data for daily logs
  const mockLogs = [
    {
      id: "log-001",
      date: "2023-05-20",
      project: {
        id: "proj-001",
        name: "Oakridge Commercial Center",
      },
      crew: {
        id: "crew-001",
        name: "Foundation Team Alpha",
      },
      weather: "Sunny, 75°F",
      workCompleted: "Completed foundation pouring for east wing",
      hoursWorked: 45,
      materials: [
        { name: "Concrete", quantity: "12 yards", cost: 1440 },
        { name: "Rebar", quantity: "500 ft", cost: 750 },
      ],
      equipment: [
        { name: "Concrete Mixer", hours: 6 },
        { name: "Excavator", hours: 4 },
      ],
      safety: "No incidents",
      notes: "Work progressing ahead of schedule. Additional crew may be needed for tomorrow to complete west wing.",
      images: ["/construction-daily-logs.png"],
      author: "Michael Rodriguez",
    },
    {
      id: "log-002",
      date: "2023-05-19",
      project: {
        id: "proj-002",
        name: "Riverside Apartments",
      },
      crew: {
        id: "crew-003",
        name: "Electrical Team",
      },
      weather: "Partly Cloudy, 68°F",
      workCompleted: "Installed electrical wiring in units 101-110",
      hoursWorked: 38,
      materials: [
        { name: "Electrical Wire", quantity: "1200 ft", cost: 960 },
        { name: "Junction Boxes", quantity: "24 units", cost: 288 },
      ],
      equipment: [{ name: "Power Tools", hours: 8 }],
      safety: "One minor incident - worker received small cut, first aid administered",
      notes: "Encountered unexpected wall configuration in unit 108, required additional time to reroute wiring.",
      images: ["/construction-daily-logs.png"],
      author: "Sarah Johnson",
    },
    {
      id: "log-003",
      date: "2023-05-19",
      project: {
        id: "proj-001",
        name: "Oakridge Commercial Center",
      },
      crew: {
        id: "crew-002",
        name: "Framing Crew",
      },
      weather: "Sunny, 72°F",
      workCompleted: "Framing completed for second floor offices",
      hoursWorked: 42,
      materials: [
        { name: "Lumber", quantity: "2400 ft", cost: 3600 },
        { name: "Nails", quantity: "50 lbs", cost: 150 },
      ],
      equipment: [
        { name: "Nail Guns", hours: 8 },
        { name: "Circular Saws", hours: 6 },
      ],
      safety: "No incidents",
      notes: "Material delivery delayed by 2 hours in the morning. Team worked efficiently to make up for lost time.",
      images: ["/construction-daily-logs.png"],
      author: "David Chen",
    },
    {
      id: "log-004",
      date: "2023-05-18",
      project: {
        id: "proj-003",
        name: "Metro City Government Building",
      },
      crew: {
        id: "crew-004",
        name: "HVAC Installation Team",
      },
      weather: "Rainy, 62°F",
      workCompleted: "Installed HVAC ductwork on floors 3-4",
      hoursWorked: 36,
      materials: [
        { name: "Ductwork", quantity: "180 ft", cost: 2700 },
        { name: "Insulation", quantity: "200 sq ft", cost: 400 },
      ],
      equipment: [
        { name: "Lifts", hours: 7 },
        { name: "Power Tools", hours: 8 },
      ],
      safety: "Work delayed due to rain leakage in morning. Area secured and work resumed after noon.",
      notes: "Rain caused some delays. May need to adjust schedule if weather continues.",
      images: ["/construction-daily-logs.png"],
      author: "James Wilson",
    },
    {
      id: "log-005",
      date: "2023-05-18",
      project: {
        id: "proj-004",
        name: "Greenfield Homes Development",
      },
      crew: {
        id: "crew-005",
        name: "Roofing Team",
      },
      weather: "Windy, 70°F",
      workCompleted: "Completed roofing on houses 7-9",
      hoursWorked: 40,
      materials: [
        { name: "Shingles", quantity: "75 squares", cost: 9000 },
        { name: "Underlayment", quantity: "3000 sq ft", cost: 1500 },
      ],
      equipment: [
        { name: "Nail Guns", hours: 8 },
        { name: "Lifts", hours: 6 },
      ],
      safety: "Extra precautions taken due to high winds. No incidents reported.",
      notes:
        "Wind conditions slowed work but team maintained safety protocols. May need extra day to complete remaining houses.",
      images: ["/construction-daily-logs.png"],
      author: "Robert Taylor",
    },
  ]

  // State for filters
  const [dateFilter, setDateFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [crewFilter, setCrewFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Get unique projects and crews for filter dropdowns
  const projects = [...new Set(mockLogs.map((log) => log.project.name))]
  const crews = [...new Set(mockLogs.map((log) => log.crew.name))]

  // Filter logs based on selected filters and search query
  const filteredLogs = mockLogs.filter((log) => {
    const matchesDate = dateFilter ? log.date === dateFilter : true
    const matchesProject = projectFilter ? log.project.name === projectFilter : true
    const matchesCrew = crewFilter ? log.crew.name === crewFilter : true
    const matchesSearch = searchQuery
      ? log.workCompleted.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.project.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true

    return matchesDate && matchesProject && matchesCrew && matchesSearch
  })

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Daily Logs</h1>
          <p className="text-gray-500">Track daily activities, progress, and resources</p>
        </div>
        <Link href="/dashboard/daily-logs/new" className="btn btn-primary mt-4 md:mt-0">
          <i className="fas fa-plus mr-2"></i> New Daily Log
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-base-100 shadow">
          <div className="stat-figure text-primary">
            <i className="fas fa-clipboard-list text-3xl"></i>
          </div>
          <div className="stat-title">Total Logs</div>
          <div className="stat-value text-primary">{mockLogs.length}</div>
          <div className="stat-desc">This month</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-figure text-secondary">
            <i className="fas fa-clock text-3xl"></i>
          </div>
          <div className="stat-title">Hours Logged</div>
          <div className="stat-value text-secondary">{mockLogs.reduce((total, log) => total + log.hoursWorked, 0)}</div>
          <div className="stat-desc">Across all crews</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-figure text-accent">
            <i className="fas fa-hard-hat text-3xl"></i>
          </div>
          <div className="stat-title">Active Projects</div>
          <div className="stat-value text-accent">{projects.length}</div>
          <div className="stat-desc">With recent logs</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-figure text-info">
            <i className="fas fa-users text-3xl"></i>
          </div>
          <div className="stat-title">Active Crews</div>
          <div className="stat-value text-info">{crews.length}</div>
          <div className="stat-desc">Currently working</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-base-100 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Project</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project, index) => (
                <option key={index} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Crew</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={crewFilter}
              onChange={(e) => setCrewFilter(e.target.value)}
            >
              <option value="">All Crews</option>
              {crews.map((crew, index) => (
                <option key={index} value={crew}>
                  {crew}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <input
              type="text"
              placeholder="Search logs..."
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h2 className="card-title">
                      <Link href={`/dashboard/projects/${log.project.id}`} className="hover:text-primary">
                        {log.project.name}
                      </Link>
                      <span className="badge badge-primary">{new Date(log.date).toLocaleDateString()}</span>
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                      Crew:{" "}
                      <Link href={`/dashboard/crews/${log.crew.id}`} className="hover:text-primary">
                        {log.crew.name}
                      </Link>{" "}
                      | Weather: {log.weather} | Hours: {log.hoursWorked}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Link href={`/dashboard/daily-logs/${log.id}`} className="btn btn-sm btn-outline">
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Work Completed</h3>
                    <p>{log.workCompleted}</p>

                    <h3 className="font-semibold mt-3 mb-1">Safety</h3>
                    <p>{log.safety}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-1">Materials Used</h3>
                    <ul className="list-disc list-inside">
                      {log.materials.map((material, index) => (
                        <li key={index}>
                          {material.name}: {material.quantity} (${material.cost})
                        </li>
                      ))}
                    </ul>

                    <h3 className="font-semibold mt-3 mb-1">Equipment Used</h3>
                    <ul className="list-disc list-inside">
                      {log.equipment.map((equipment, index) => (
                        <li key={index}>
                          {equipment.name}: {equipment.hours} hours
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {log.notes && (
                  <>
                    <h3 className="font-semibold mt-3 mb-1">Notes</h3>
                    <p>{log.notes}</p>
                  </>
                )}

                {log.images && log.images.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Photos</h3>
                    <div className="flex flex-wrap gap-2">
                      {log.images.map((image, index) => (
                        <div key={index} className="relative h-24 w-32 overflow-hidden rounded-md">
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`Log photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-right text-sm text-gray-500 mt-4">Logged by: {log.author}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-clipboard-list text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold">No logs found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new log</p>
          </div>
        )}
      </div>
    </div>
  )
}
