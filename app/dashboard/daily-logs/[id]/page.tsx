"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { WeatherDisplay } from "@/components/weather-display"

// Mock data for a specific daily log
const mockDailyLog = {
  id: "dl-001",
  date: "2023-05-15",
  project: "Riverside Apartments",
  author: "John Doe",
  weather: {
    condition: "Sunny",
    temperature: 75,
    humidity: 45,
    windSpeed: 8,
    location: "New York, NY",
  },
  status: "Completed",
  summary:
    "Completed foundation work on the east wing. Materials delivered on time. Two minor safety issues reported and addressed.",
  tasks: [
    { id: 1, description: "Pour concrete for east wing foundation", status: "Completed" },
    { id: 2, description: "Install rebar for west wing", status: "Completed" },
    { id: 3, description: "Prepare site for electrical conduit installation", status: "Completed" },
    { id: 4, description: "Clean up construction debris", status: "Completed" },
  ],
  materials: [
    { id: 1, name: "Concrete", quantity: "12 yards", status: "Delivered" },
    { id: 2, name: "Rebar", quantity: "500 units", status: "Delivered" },
    { id: 3, name: "Electrical conduit", quantity: "200 ft", status: "Delivered" },
  ],
  equipment: [
    { id: 1, name: "Excavator", hours: 6, operator: "Mike Johnson", status: "Operational" },
    { id: 2, name: "Concrete mixer", hours: 8, operator: "Dave Wilson", status: "Operational" },
    { id: 3, name: "Crane", hours: 4, operator: "Sarah Lee", status: "Operational" },
  ],
  safety: {
    incidents: [
      {
        id: 1,
        description: "Worker slipped on wet surface",
        severity: "Minor",
        action: "Area cleaned and marked with caution signs",
      },
      {
        id: 2,
        description: "Near miss with falling material",
        severity: "Minor",
        action: "Reminded crew about proper securing of materials at height",
      },
    ],
    inspections: [
      {
        id: 1,
        type: "Daily safety briefing",
        inspector: "John Doe",
        findings: "All workers wearing proper PPE",
      },
    ],
  },
  visitors: [
    { id: 1, name: "Sarah Johnson", company: "City Inspector", purpose: "Routine inspection" },
    { id: 2, name: "Robert Chen", company: "Electrical Contractor", purpose: "Planning meeting" },
  ],
  photos: [
    {
      id: 1,
      url: "/construction-foundation.png",
      caption: "East wing foundation work",
      timestamp: "2023-05-15T09:30:00",
    },
    {
      id: 2,
      url: "/rebar-installation.png",
      caption: "Rebar installation for west wing",
      timestamp: "2023-05-15T11:45:00",
    },
    {
      id: 3,
      url: "/construction-concrete-pouring.png",
      caption: "Concrete pouring in progress",
      timestamp: "2023-05-15T14:20:00",
    },
    {
      id: 4,
      url: "/construction-delivery.png",
      caption: "Material delivery",
      timestamp: "2023-05-15T16:10:00",
    },
  ],
  notes:
    "Team morale is high. Project is on schedule. Need to follow up with electrical contractor about conduit installation schedule for tomorrow.",
}

export default function DailyLogDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/daily-logs" className="btn btn-ghost btn-sm">
              <i className="fas fa-arrow-left"></i>
            </Link>
            <h1 className="text-2xl font-bold">Daily Log Details</h1>
          </div>
          <p className="text-base-content/70">
            {new Date(mockDailyLog.date).toLocaleDateString()} - {mockDailyLog.project}
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link href={`/dashboard/daily-logs/${params.id}/edit`} className="btn btn-outline">
            <i className="fas fa-edit mr-2"></i>
            Edit Log
          </Link>
          <button className="btn btn-primary">
            <i className="fas fa-file-pdf mr-2"></i>
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>
          Tasks & Materials
        </button>
        <button
          className={`tab ${activeTab === "equipment" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("equipment")}
        >
          Equipment
        </button>
        <button className={`tab ${activeTab === "safety" ? "tab-active" : ""}`} onClick={() => setActiveTab("safety")}>
          Safety
        </button>
        <button className={`tab ${activeTab === "photos" ? "tab-active" : ""}`} onClick={() => setActiveTab("photos")}>
          Photos
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="card bg-base-100 shadow-md mb-6">
              <div className="card-body">
                <h2 className="card-title">Summary</h2>
                <p>{mockDailyLog.summary}</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md mb-6">
              <div className="card-body">
                <h2 className="card-title">Notes</h2>
                <p>{mockDailyLog.notes}</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Visitors</h2>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockDailyLog.visitors.map((visitor) => (
                        <tr key={visitor.id}>
                          <td>{visitor.name}</td>
                          <td>{visitor.company}</td>
                          <td>{visitor.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Weather Conditions</h2>
                <WeatherDisplay
                  location={mockDailyLog.weather.location}
                  date={mockDailyLog.date}
                  fallbackData={mockDailyLog.weather}
                />
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Log Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Project:</span>
                    <span className="font-medium">{mockDailyLog.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Date:</span>
                    <span className="font-medium">{new Date(mockDailyLog.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Author:</span>
                    <span className="font-medium">{mockDailyLog.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Status:</span>
                    <span className="badge badge-success">{mockDailyLog.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Quick Stats</h2>
                <div className="stats stats-vertical shadow">
                  <div className="stat">
                    <div className="stat-title">Tasks</div>
                    <div className="stat-value">{mockDailyLog.tasks.length}</div>
                    <div className="stat-desc">All tasks completed</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Materials</div>
                    <div className="stat-value">{mockDailyLog.materials.length}</div>
                    <div className="stat-desc">All materials delivered</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Safety Incidents</div>
                    <div className="stat-value">{mockDailyLog.safety.incidents.length}</div>
                    <div className="stat-desc">All minor and addressed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks & Materials Tab */}
      {activeTab === "tasks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Tasks</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDailyLog.tasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.description}</td>
                        <td>
                          <span className={`badge ${task.status === "Completed" ? "badge-success" : "badge-warning"}`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Materials</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDailyLog.materials.map((material) => (
                      <tr key={material.id}>
                        <td>{material.name}</td>
                        <td>{material.quantity}</td>
                        <td>
                          <span
                            className={`badge ${material.status === "Delivered" ? "badge-success" : "badge-warning"}`}
                          >
                            {material.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === "equipment" && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Equipment Used</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Hours</th>
                    <th>Operator</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockDailyLog.equipment.map((equipment) => (
                    <tr key={equipment.id}>
                      <td>{equipment.name}</td>
                      <td>{equipment.hours}</td>
                      <td>{equipment.operator}</td>
                      <td>
                        <span
                          className={`badge ${equipment.status === "Operational" ? "badge-success" : "badge-error"}`}
                        >
                          {equipment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === "safety" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Safety Incidents</h2>
              <div className="space-y-4">
                {mockDailyLog.safety.incidents.map((incident) => (
                  <div key={incident.id} className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{incident.description}</h3>
                        <span className={`badge ${incident.severity === "Minor" ? "badge-warning" : "badge-error"}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Action taken:</span> {incident.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Safety Inspections</h2>
              <div className="space-y-4">
                {mockDailyLog.safety.inspections.map((inspection) => (
                  <div key={inspection.id} className="card bg-base-200">
                    <div className="card-body p-4">
                      <h3 className="font-medium">{inspection.type}</h3>
                      <p className="text-sm">
                        <span className="font-medium">Inspector:</span> {inspection.inspector}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Findings:</span> {inspection.findings}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === "photos" && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Site Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockDailyLog.photos.map((photo) => (
                <div key={photo.id} className="card bg-base-200">
                  <figure className="relative h-48">
                    <Image
                      src={photo.url || "/placeholder.svg"}
                      alt={photo.caption}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </figure>
                  <div className="card-body p-4">
                    <h3 className="card-title text-base">{photo.caption}</h3>
                    <p className="text-xs text-base-content/70">{new Date(photo.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
