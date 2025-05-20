"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"

// Mock project data
const projectData = {
  id: 1,
  name: "Downtown Highrise",
  client: "Metropolis Development Corp",
  location: "123 Main St, Downtown",
  startDate: "2025-01-15",
  endDate: "2026-06-30",
  budget: 12500000,
  status: "In Progress",
  progress: 35,
  description:
    "A 25-story commercial building with retail space on the ground floor and office space above. The project includes underground parking, green roof technology, and state-of-the-art energy management systems. The building is designed to achieve LEED Platinum certification.",
  manager: "John Smith",
  thumbnail: "/construction-site-dashboard.png",
  tasks: {
    total: 145,
    completed: 52,
  },
  team: [
    { id: 1, name: "John Smith", role: "Project Manager", avatar: null },
    { id: 2, name: "Sarah Johnson", role: "Site Supervisor", avatar: null },
    { id: 3, name: "Michael Brown", role: "Lead Engineer", avatar: null },
    { id: 4, name: "Emily Davis", role: "Architect", avatar: null },
    { id: 5, name: "David Wilson", role: "Safety Officer", avatar: null },
  ],
  milestones: [
    { id: 1, name: "Project Kickoff", date: "2025-01-15", completed: true },
    { id: 2, name: "Foundation Complete", date: "2025-04-30", completed: true },
    { id: 3, name: "Structure to 10th Floor", date: "2025-08-15", completed: false },
    { id: 4, name: "Structure Complete", date: "2025-12-01", completed: false },
    { id: 5, name: "Exterior Complete", date: "2026-03-15", completed: false },
    { id: 6, name: "Interior Finishes", date: "2026-05-30", completed: false },
    { id: 7, name: "Project Handover", date: "2026-06-30", completed: false },
  ],
  tasks: [
    {
      id: 1,
      name: "Site Preparation",
      status: "Completed",
      assignee: "Team Alpha",
      dueDate: "2025-02-15",
      priority: "High",
      progress: 100,
    },
    {
      id: 2,
      name: "Foundation Work",
      status: "Completed",
      assignee: "Team Bravo",
      dueDate: "2025-04-30",
      priority: "High",
      progress: 100,
    },
    {
      id: 3,
      name: "Structural Steel Installation",
      status: "In Progress",
      assignee: "Team Charlie",
      dueDate: "2025-07-15",
      priority: "High",
      progress: 45,
    },
    {
      id: 4,
      name: "Concrete Pouring - Floors 1-10",
      status: "In Progress",
      assignee: "Team Delta",
      dueDate: "2025-08-01",
      priority: "Medium",
      progress: 30,
    },
    {
      id: 5,
      name: "Electrical Rough-In - Lower Floors",
      status: "In Progress",
      assignee: "Team Echo",
      dueDate: "2025-08-15",
      priority: "Medium",
      progress: 20,
    },
    {
      id: 6,
      name: "Plumbing Installation - Lower Floors",
      status: "Not Started",
      assignee: "Unassigned",
      dueDate: "2025-09-01",
      priority: "Medium",
      progress: 0,
    },
    {
      id: 7,
      name: "HVAC Installation - Lower Floors",
      status: "Not Started",
      assignee: "Unassigned",
      dueDate: "2025-09-15",
      priority: "Medium",
      progress: 0,
    },
  ],
  budget: {
    total: 12500000,
    spent: 4375000,
    remaining: 8125000,
    categories: [
      { name: "Materials", allocated: 6250000, spent: 2500000 },
      { name: "Labor", allocated: 4375000, spent: 1312500 },
      { name: "Equipment", allocated: 1250000, spent: 437500 },
      { name: "Permits & Fees", allocated: 625000, spent: 125000 },
    ],
  },
  risks: [
    {
      id: 1,
      name: "Weather Delays",
      impact: "High",
      probability: "Medium",
      status: "Monitoring",
      mitigation: "Schedule buffer added, indoor work planned for rainy season",
    },
    {
      id: 2,
      name: "Material Price Increases",
      impact: "High",
      probability: "High",
      status: "Active",
      mitigation: "Pre-purchasing critical materials, exploring alternative suppliers",
    },
    {
      id: 3,
      name: "Labor Shortage",
      impact: "Medium",
      probability: "Medium",
      status: "Monitoring",
      mitigation: "Early recruitment, competitive wages, subcontractor agreements",
    },
    {
      id: 4,
      name: "Permit Delays",
      impact: "High",
      probability: "Low",
      status: "Resolved",
      mitigation: "Early application, regular follow-up with authorities",
    },
  ],
  documents: [
    { id: 1, name: "Project Contract", type: "PDF", size: "2.4 MB", uploadedAt: "2025-01-10" },
    { id: 2, name: "Architectural Plans", type: "PDF", size: "15.7 MB", uploadedAt: "2025-01-12" },
    { id: 3, name: "Structural Drawings", type: "PDF", size: "8.3 MB", uploadedAt: "2025-01-12" },
    { id: 4, name: "Electrical Plans", type: "PDF", size: "5.2 MB", uploadedAt: "2025-01-14" },
    { id: 5, name: "Plumbing Plans", type: "PDF", size: "4.8 MB", uploadedAt: "2025-01-14" },
    { id: 6, name: "Site Survey", type: "PDF", size: "3.1 MB", uploadedAt: "2025-01-05" },
  ],
  updates: [
    {
      id: 1,
      date: "2025-04-30",
      author: "John Smith",
      content: "Foundation work completed on schedule. Moving to structural steel installation next week.",
      attachments: 2,
    },
    {
      id: 2,
      date: "2025-04-15",
      author: "Sarah Johnson",
      content: "Safety inspection passed with no issues. Team commended for excellent safety practices.",
      attachments: 0,
    },
    {
      id: 3,
      date: "2025-03-28",
      author: "Michael Brown",
      content:
        "Encountered unexpected soil conditions during excavation. Engineering team reviewing options. May impact foundation timeline by 3-5 days.",
      attachments: 4,
    },
    {
      id: 4,
      date: "2025-03-10",
      author: "Emily Davis",
      content: "Client approved revised lobby design. Updated drawings uploaded to document repository.",
      attachments: 1,
    },
  ],
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id
  const project = projectData // In a real app, you would fetch the project data based on the ID

  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div
              className={`badge ${
                project.status === "In Progress"
                  ? "badge-primary"
                  : project.status === "Planning"
                    ? "badge-secondary"
                    : project.status === "On Hold"
                      ? "badge-warning"
                      : "badge-success"
              }`}
            >
              {project.status}
            </div>
          </div>
          <p className="text-base-content/70">
            {project.client} • {project.location}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/projects/${projectId}/edit`} className="btn btn-outline">
            <i className="fas fa-edit mr-2"></i>
            Edit Project
          </Link>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn">
              <i className="fas fa-ellipsis-v mr-2"></i>
              Actions
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a>
                  <i className="fas fa-file-export"></i> Export Data
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-print"></i> Print Report
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-share-alt"></i> Share Project
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-archive"></i> Archive Project
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Project Progress */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{project.progress}%</span>
              </div>
              <progress
                className={`progress w-full ${
                  project.progress < 30
                    ? "progress-primary"
                    : project.progress < 70
                      ? "progress-warning"
                      : "progress-success"
                }`}
                value={project.progress}
                max="100"
              ></progress>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-base-content/70">Start Date:</span>
                <span className="font-medium ml-1">{new Date(project.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-base-content/70">End Date:</span>
                <span className="font-medium ml-1">{new Date(project.endDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-base-content/70">Budget:</span>
                <span className="font-medium ml-1">${(project.budget / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>
          Tasks
        </button>
        <button
          className={`tab ${activeTab === "timeline" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          Timeline
        </button>
        <button className={`tab ${activeTab === "budget" ? "tab-active" : ""}`} onClick={() => setActiveTab("budget")}>
          Budget
        </button>
        <button className={`tab ${activeTab === "team" ? "tab-active" : ""}`} onClick={() => setActiveTab("team")}>
          Team
        </button>
        <button className={`tab ${activeTab === "risks" ? "tab-active" : ""}`} onClick={() => setActiveTab("risks")}>
          Risks
        </button>
        <button className={`tab ${activeTab === "files" ? "tab-active" : ""}`} onClick={() => setActiveTab("files")}>
          Files
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab project={project} />}
      {activeTab === "tasks" && <TasksTab project={project} />}
      {activeTab === "timeline" && <TimelineTab project={project} />}
      {activeTab === "budget" && <BudgetTab project={project} />}
      {activeTab === "team" && <TeamTab project={project} />}
      {activeTab === "risks" && <RisksTab project={project} />}
      {activeTab === "files" && <FilesTab project={project} />}
    </div>
  )
}

function OverviewTab({ project }: { project: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Project Description */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Project Description</h2>
            <p>{project.description}</p>
          </div>
        </div>

        {/* Project Updates */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title">Recent Updates</h2>
              <button className="btn btn-sm btn-ghost">
                <i className="fas fa-plus"></i> Add Update
              </button>
            </div>
            <div className="space-y-4 mt-4">
              {project.updates.map((update: any) => (
                <div key={update.id} className="border-l-4 border-primary pl-4 py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{update.author}</p>
                      <p className="text-sm text-base-content/70">{update.date}</p>
                    </div>
                    {update.attachments > 0 && (
                      <div className="badge badge-outline">
                        <i className="fas fa-paperclip mr-1"></i> {update.attachments}
                      </div>
                    )}
                  </div>
                  <p className="mt-2">{update.content}</p>
                </div>
              ))}
            </div>
            <div className="card-actions justify-center mt-4">
              <button className="btn btn-ghost btn-sm">View All Updates</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Project Image */}
        <div className="card bg-base-100 shadow-sm">
          <figure className="px-4 pt-4">
            <div className="relative w-full h-48">
              {project.thumbnail ? (
                <Image
                  src={project.thumbnail || "/placeholder.svg"}
                  alt={project.name}
                  fill
                  className="rounded-xl object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-base-200 rounded-xl">
                  <i className="fas fa-building text-6xl text-base-content/20"></i>
                </div>
              )}
            </div>
          </figure>
        </div>

        {/* Key Details */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Key Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-base-content/70">Project Manager:</span>
                <span className="font-medium">{project.manager}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Client:</span>
                <span className="font-medium">{project.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Location:</span>
                <span className="font-medium">{project.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Start Date:</span>
                <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">End Date:</span>
                <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Duration:</span>
                <span className="font-medium">
                  {Math.ceil(
                    (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 30),
                  )}{" "}
                  months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Budget:</span>
                <span className="font-medium">${project.budget.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Upcoming Milestones</h2>
            <div className="space-y-3">
              {project.milestones
                .filter((milestone: any) => !milestone.completed)
                .slice(0, 3)
                .map((milestone: any) => (
                  <div key={milestone.id} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-3"></div>
                    <div className="flex-1">
                      <p className="font-medium">{milestone.name}</p>
                      <p className="text-sm text-base-content/70">{milestone.date}</p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="card-actions justify-center mt-4">
              <button className="btn btn-ghost btn-sm">View All Milestones</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TasksTab({ project }: { project: any }) {
  const [taskFilter, setTaskFilter] = useState("all")

  // Filter tasks based on status
  const filteredTasks = project.tasks.filter((task: any) => {
    if (taskFilter === "all") return true
    return task.status.toLowerCase() === taskFilter.toLowerCase()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${taskFilter === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTaskFilter("all")}
          >
            All
          </button>
          <button
            className={`btn btn-sm ${taskFilter === "in progress" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTaskFilter("in progress")}
          >
            In Progress
          </button>
          <button
            className={`btn btn-sm ${taskFilter === "completed" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTaskFilter("completed")}
          >
            Completed
          </button>
          <button
            className={`btn btn-sm ${taskFilter === "not started" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTaskFilter("not started")}
          >
            Not Started
          </button>
        </div>
        <button className="btn btn-primary btn-sm">
          <i className="fas fa-plus mr-2"></i>
          Add Task
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task: any) => (
                  <tr key={task.id}>
                    <td>{task.name}</td>
                    <td>
                      <div
                        className={`badge ${
                          task.status === "Completed"
                            ? "badge-success"
                            : task.status === "In Progress"
                              ? "badge-primary"
                              : "badge-ghost"
                        }`}
                      >
                        {task.status}
                      </div>
                    </td>
                    <td>{task.assignee}</td>
                    <td>{task.dueDate}</td>
                    <td>
                      <div
                        className={`badge ${
                          task.priority === "High"
                            ? "badge-error"
                            : task.priority === "Medium"
                              ? "badge-warning"
                              : "badge-info"
                        }`}
                      >
                        {task.priority}
                      </div>
                    </td>
                    <td>
                      <progress className="progress progress-primary w-full" value={task.progress} max="100"></progress>
                    </td>
                    <td>
                      <div className="flex space-x-1">
                        <button className="btn btn-xs btn-ghost">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-xs btn-ghost">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-xs btn-ghost text-error">
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
      </div>
    </div>
  )
}

function TimelineTab({ project }: { project: any }) {
  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Project Timeline</h2>
          <p className="text-base-content/70">Key milestones and project phases</p>

          <div className="mt-6">
            <ul className="timeline timeline-vertical">
              {project.milestones.map((milestone: any, index: number) => (
                <li key={milestone.id}>
                  {index % 2 === 0 ? (
                    <>
                      <div className="timeline-start">{milestone.date}</div>
                      <div className={`timeline-middle ${milestone.completed ? "text-success" : ""}`}>
                        <i className={`fas fa-${milestone.completed ? "check-circle" : "circle"}`}></i>
                      </div>
                      <div className="timeline-end timeline-box">
                        <p className="font-medium">{milestone.name}</p>
                        {milestone.completed && <div className="badge badge-success mt-1">Completed</div>}
                      </div>
                      {index !== project.milestones.length - 1 && <hr />}
                    </>
                  ) : (
                    <>
                      <hr />
                      <div className="timeline-start timeline-box">
                        <p className="font-medium">{milestone.name}</p>
                        {milestone.completed && <div className="badge badge-success mt-1">Completed</div>}
                      </div>
                      <div className={`timeline-middle ${milestone.completed ? "text-success" : ""}`}>
                        <i className={`fas fa-${milestone.completed ? "check-circle" : "circle"}`}></i>
                      </div>
                      <div className="timeline-end">{milestone.date}</div>
                      {index !== project.milestones.length - 1 && <hr />}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function BudgetTab({ project }: { project: any }) {
  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Total Budget</h2>
            <p className="text-3xl font-bold">${project.budget.total.toLocaleString()}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Spent</h2>
            <p className="text-3xl font-bold text-error">${project.budget.spent.toLocaleString()}</p>
            <p className="text-sm text-base-content/70">
              {Math.round((project.budget.spent / project.budget.total) * 100)}% of total budget
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Remaining</h2>
            <p className="text-3xl font-bold text-success">${project.budget.remaining.toLocaleString()}</p>
            <p className="text-sm text-base-content/70">
              {Math.round((project.budget.remaining / project.budget.total) * 100)}% of total budget
            </p>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Budget Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Allocated</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {project.budget.categories.map((category: any, index: number) => (
                  <tr key={index}>
                    <td>{category.name}</td>
                    <td>${category.allocated.toLocaleString()}</td>
                    <td>${category.spent.toLocaleString()}</td>
                    <td>${(category.allocated - category.spent).toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <progress
                          className="progress progress-primary w-full"
                          value={category.spent}
                          max={category.allocated}
                        ></progress>
                        <span className="text-sm">{Math.round((category.spent / category.allocated) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Budget Actions */}
      <div className="flex justify-end gap-2">
        <button className="btn btn-outline">
          <i className="fas fa-file-export mr-2"></i>
          Export Budget
        </button>
        <button className="btn btn-primary">
          <i className="fas fa-edit mr-2"></i>
          Update Budget
        </button>
      </div>
    </div>
  )
}

function TeamTab({ project }: { project: any }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Project Team</h2>
        <button className="btn btn-primary btn-sm">
          <i className="fas fa-user-plus mr-2"></i>
          Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.team.map((member: any) => (
          <div key={member.id} className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className="avatar placeholder">
                  <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                    <span className="text-xl">{member.name.charAt(0)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold">{member.name}</h3>
                  <p className="text-sm text-base-content/70">{member.role}</p>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-ghost btn-sm">
                  <i className="fas fa-envelope"></i>
                </button>
                <button className="btn btn-ghost btn-sm">
                  <i className="fas fa-phone"></i>
                </button>
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                    <i className="fas fa-ellipsis-v"></i>
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                      <a>
                        <i className="fas fa-user-edit"></i> Edit Role
                      </a>
                    </li>
                    <li>
                      <a>
                        <i className="fas fa-tasks"></i> View Tasks
                      </a>
                    </li>
                    <li>
                      <a className="text-error">
                        <i className="fas fa-user-minus"></i> Remove from Project
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RisksTab({ project }: { project: any }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Risk Management</h2>
        <button className="btn btn-primary btn-sm">
          <i className="fas fa-plus mr-2"></i>
          Add Risk
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Risk</th>
                  <th>Impact</th>
                  <th>Probability</th>
                  <th>Status</th>
                  <th>Mitigation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.risks.map((risk: any) => (
                  <tr key={risk.id}>
                    <td>{risk.name}</td>
                    <td>
                      <div
                        className={`badge ${
                          risk.impact === "High"
                            ? "badge-error"
                            : risk.impact === "Medium"
                              ? "badge-warning"
                              : "badge-info"
                        }`}
                      >
                        {risk.impact}
                      </div>
                    </td>
                    <td>
                      <div
                        className={`badge ${
                          risk.probability === "High"
                            ? "badge-error"
                            : risk.probability === "Medium"
                              ? "badge-warning"
                              : "badge-info"
                        }`}
                      >
                        {risk.probability}
                      </div>
                    </td>
                    <td>
                      <div
                        className={`badge ${
                          risk.status === "Active"
                            ? "badge-error"
                            : risk.status === "Monitoring"
                              ? "badge-warning"
                              : "badge-success"
                        }`}
                      >
                        {risk.status}
                      </div>
                    </td>
                    <td>{risk.mitigation}</td>
                    <td>
                      <div className="flex space-x-1">
                        <button className="btn btn-xs btn-ghost">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-xs btn-ghost text-error">
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
      </div>
    </div>
  )
}

function FilesTab({ project }: { project: any }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Project Files</h2>
        <button className="btn btn-primary btn-sm">
          <i className="fas fa-upload mr-2"></i>
          Upload Files
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.documents.map((doc: any) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-file-pdf text-error"></i>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td>{doc.type}</td>
                    <td>{doc.size}</td>
                    <td>{doc.uploadedAt}</td>
                    <td>
                      <div className="flex space-x-1">
                        <button className="btn btn-xs btn-ghost">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-xs btn-ghost">
                          <i className="fas fa-download"></i>
                        </button>
                        <button className="btn btn-xs btn-ghost">
                          <i className="fas fa-share"></i>
                        </button>
                        <button className="btn btn-xs btn-ghost text-error">
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
      </div>
    </div>
  )
}
