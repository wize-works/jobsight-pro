"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// Mock data for tasks
const tasksData = {
    task1: {
        id: "task1",
        name: "Excavation",
        projectId: "proj1",
        projectName: "Main Street Development",
        assignedTo: "crew1",
        assignedToName: "Foundation Team",
        startDate: "2025-03-20",
        endDate: "2025-04-05",
        status: "Completed",
        priority: "High",
        progress: 100,
        description:
            "Complete excavation of the site according to architectural plans. This includes removing topsoil, grading the site, and preparing for foundation work. All excavated material should be properly disposed of or stored for later use in landscaping.",
        notes: [
            {
                id: "note1",
                date: "2025-03-20",
                author: "Mike Wilson",
                content: "Started excavation today. Site conditions are good, no unexpected issues.",
            },
            {
                id: "note2",
                date: "2025-03-25",
                author: "Mike Wilson",
                content:
                    "Excavation is 50% complete. Found some rocky areas on the north side that may require additional equipment.",
            },
            {
                id: "note3",
                date: "2025-04-02",
                author: "Mike Wilson",
                content: "Excavation completed. Site is ready for foundation work.",
            },
        ],
        attachments: [
            {
                id: "att1",
                name: "Excavation Plan.pdf",
                type: "PDF",
                uploadedBy: "Robert Johnson",
                uploadDate: "2025-03-18",
            },
            {
                id: "att2",
                name: "Site Photos - Before.jpg",
                type: "Image",
                uploadedBy: "Mike Wilson",
                uploadDate: "2025-03-20",
            },
            {
                id: "att3",
                name: "Site Photos - After.jpg",
                type: "Image",
                uploadedBy: "Mike Wilson",
                uploadDate: "2025-04-02",
            },
        ],
        subtasks: [
            {
                id: "sub1",
                name: "Remove topsoil",
                status: "Completed",
                assignedTo: "John Smith",
            },
            {
                id: "sub2",
                name: "Grade site according to plans",
                status: "Completed",
                assignedTo: "Mark Davis",
            },
            {
                id: "sub3",
                name: "Prepare for foundation work",
                status: "Completed",
                assignedTo: "John Smith",
            },
        ],
        dependencies: [
            {
                id: "dep1",
                taskId: "task0",
                taskName: "Site Survey",
                type: "Finish-to-Start",
                status: "Completed",
            },
        ],
        dependents: [
            {
                id: "dep2",
                taskId: "task2",
                taskName: "Foundation Pouring",
                type: "Finish-to-Start",
                status: "Completed",
            },
        ],
        history: [
            {
                id: "hist1",
                date: "2025-03-15",
                user: "Robert Johnson",
                action: "Created task",
            },
            {
                id: "hist2",
                date: "2025-03-20",
                user: "Mike Wilson",
                action: "Changed status to In Progress",
            },
            {
                id: "hist3",
                date: "2025-04-02",
                user: "Mike Wilson",
                action: "Changed status to Completed",
            },
            {
                id: "hist4",
                date: "2025-04-03",
                user: "Robert Johnson",
                action: "Updated progress to 100%",
            },
        ],
    },
    task3: {
        id: "task3",
        name: "Underground Electrical",
        projectId: "proj1",
        projectName: "Main Street Development",
        assignedTo: "crew3",
        assignedToName: "Electrical Team",
        startDate: "2025-05-15",
        endDate: "2025-06-15",
        status: "In Progress",
        priority: "Medium",
        progress: 60,
        description:
            "Install underground electrical conduits and wiring according to the electrical plans. This includes trenching, laying conduit, pulling wire, and connecting to the main electrical service. All work must comply with local electrical codes and be inspected before backfilling.",
        notes: [
            {
                id: "note1",
                date: "2025-05-15",
                author: "David Martinez",
                content: "Started trenching for electrical conduits. Ground conditions are good.",
            },
            {
                id: "note2",
                date: "2025-05-25",
                author: "David Martinez",
                content: "Conduit installation is 75% complete. Waiting for inspection before pulling wire.",
            },
            {
                id: "note3",
                date: "2025-06-02",
                author: "David Martinez",
                content: "Inspection passed. Starting wire pull tomorrow.",
            },
        ],
        attachments: [
            {
                id: "att1",
                name: "Electrical Plans.pdf",
                type: "PDF",
                uploadedBy: "Robert Johnson",
                uploadDate: "2025-05-10",
            },
            {
                id: "att2",
                name: "Conduit Layout Photos.jpg",
                type: "Image",
                uploadedBy: "David Martinez",
                uploadDate: "2025-05-20",
            },
        ],
        subtasks: [
            {
                id: "sub1",
                name: "Trench for conduits",
                status: "Completed",
                assignedTo: "Alex Rodriguez",
            },
            {
                id: "sub2",
                name: "Install conduits",
                status: "Completed",
                assignedTo: "Brian Johnson",
            },
            {
                id: "sub3",
                name: "Pull wire",
                status: "In Progress",
                assignedTo: "Carlos Mendez",
            },
            {
                id: "sub4",
                name: "Connect to main service",
                status: "Not Started",
                assignedTo: "David Martinez",
            },
        ],
        dependencies: [
            {
                id: "dep1",
                taskId: "task2",
                taskName: "Foundation Pouring",
                type: "Finish-to-Start",
                status: "Completed",
            },
        ],
        dependents: [
            {
                id: "dep2",
                taskId: "task4",
                taskName: "First Floor Framing",
                type: "Finish-to-Start",
                status: "Not Started",
            },
        ],
        history: [
            {
                id: "hist1",
                date: "2025-05-10",
                user: "Robert Johnson",
                action: "Created task",
            },
            {
                id: "hist2",
                date: "2025-05-15",
                user: "David Martinez",
                action: "Changed status to In Progress",
            },
            {
                id: "hist3",
                date: "2025-06-01",
                user: "David Martinez",
                action: "Updated progress to 60%",
            },
        ],
    },
    task9: {
        id: "task9",
        name: "Framing - Building B",
        projectId: "proj2",
        projectName: "Riverside Apartments",
        assignedTo: "crew2",
        assignedToName: "Framing Crew",
        startDate: "2025-04-30",
        endDate: "2025-05-20",
        status: "In Progress",
        priority: "Medium",
        progress: 75,
        description:
            "Complete structural framing for Building B of the Riverside Apartments project. This includes wall framing, floor joists, roof trusses, and sheathing. All work must comply with the architectural plans and structural engineering specifications.",
        notes: [
            {
                id: "note1",
                date: "2025-04-30",
                author: "Sarah Johnson",
                content: "Started framing first floor walls. Materials delivered on time.",
            },
            {
                id: "note2",
                date: "2025-05-07",
                author: "Sarah Johnson",
                content: "First floor complete, starting second floor framing.",
            },
            {
                id: "note3",
                date: "2025-05-15",
                author: "Sarah Johnson",
                content: "Second floor and roof trusses installed. Starting sheathing tomorrow.",
            },
        ],
        attachments: [
            {
                id: "att1",
                name: "Building B Framing Plans.pdf",
                type: "PDF",
                uploadedBy: "James Wilson",
                uploadDate: "2025-04-25",
            },
            {
                id: "att2",
                name: "Structural Details.pdf",
                type: "PDF",
                uploadedBy: "James Wilson",
                uploadDate: "2025-04-25",
            },
            {
                id: "att3",
                name: "First Floor Progress Photos.jpg",
                type: "Image",
                uploadedBy: "Sarah Johnson",
                uploadDate: "2025-05-07",
            },
        ],
        subtasks: [
            {
                id: "sub1",
                name: "First floor wall framing",
                status: "Completed",
                assignedTo: "Tom Anderson",
            },
            {
                id: "sub2",
                name: "Second floor joists and subfloor",
                status: "Completed",
                assignedTo: "Eric Williams",
            },
            {
                id: "sub3",
                name: "Second floor wall framing",
                status: "Completed",
                assignedTo: "Tom Anderson",
            },
            {
                id: "sub4",
                name: "Roof trusses",
                status: "Completed",
                assignedTo: "Eric Williams",
            },
            {
                id: "sub5",
                name: "Sheathing",
                status: "In Progress",
                assignedTo: "Tom Anderson",
            },
        ],
        dependencies: [
            {
                id: "dep1",
                taskId: "task7",
                taskName: "Foundation Work - Building B",
                type: "Finish-to-Start",
                status: "Completed",
            },
        ],
        dependents: [
            {
                id: "dep2",
                taskId: "task10",
                taskName: "Rough Plumbing - Building B",
                type: "Finish-to-Start",
                status: "Not Started",
            },
            {
                id: "dep3",
                taskId: "task11",
                taskName: "Rough Electrical - Building B",
                type: "Finish-to-Start",
                status: "Not Started",
            },
        ],
        history: [
            {
                id: "hist1",
                date: "2025-04-20",
                user: "James Wilson",
                action: "Created task",
            },
            {
                id: "hist2",
                date: "2025-04-30",
                user: "Sarah Johnson",
                action: "Changed status to In Progress",
            },
            {
                id: "hist3",
                date: "2025-05-07",
                user: "Sarah Johnson",
                action: "Updated progress to 40%",
            },
            {
                id: "hist4",
                date: "2025-05-15",
                user: "Sarah Johnson",
                action: "Updated progress to 75%",
            },
        ],
    },
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id: taskId } = await params;
    const [activeTab, setActiveTab] = useState("overview")
    const [showEditTaskModal, setShowEditTaskModal] = useState(false)
    const [showAddNoteModal, setShowAddNoteModal] = useState(false)
    const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false)
    const [showUploadAttachmentModal, setShowUploadAttachmentModal] = useState(false)

    const task = tasksData[taskId as keyof typeof tasksData]

    // If task doesn't exist, redirect to tasks page
    useEffect(() => {
        if (!task) {
            router.push("/dashboard/tasks")
        }
    }, [task, router])

    if (!task) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    // Get status badge color
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case "Completed":
                return "badge-success"
            case "In Progress":
                return "badge-primary"
            case "Not Started":
                return "badge-ghost"
            default:
                return "badge-ghost"
        }
    }

    // Get priority badge color
    const getPriorityBadgeColor = (priority) => {
        switch (priority) {
            case "High":
                return "badge-error"
            case "Medium":
                return "badge-warning"
            case "Low":
                return "badge-info"
            default:
                return "badge-ghost"
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/tasks" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{task.name}</h1>
                        <div className={`badge ${getStatusBadgeColor(task.status)}`}>{task.status}</div>
                        <div className={`badge ${getPriorityBadgeColor(task.priority)}`}>{task.priority}</div>
                    </div>
                    <p className="text-base-content/70 mt-1">
                        Project:{" "}
                        <Link href={`/dashboard/projects/${task.projectId}`} className="hover:underline">
                            {task.projectName}
                        </Link>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => setShowEditTaskModal(true)}>
                        <i className="fas fa-edit mr-2"></i> Edit Task
                    </button>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-primary btn-sm">
                            <i className="fas fa-plus mr-2"></i> Add
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <button onClick={() => setShowAddNoteModal(true)}>
                                    <i className="fas fa-sticky-note mr-2"></i> Add Note
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setShowAddSubtaskModal(true)}>
                                    <i className="fas fa-tasks mr-2"></i> Add Subtask
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setShowUploadAttachmentModal(true)}>
                                    <i className="fas fa-paperclip mr-2"></i> Upload Attachment
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="tabs tabs-boxed mb-6">
                <a className={`tab ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")}>
                    Overview
                </a>
                <a className={`tab ${activeTab === "subtasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("subtasks")}>
                    Subtasks
                </a>
                <a className={`tab ${activeTab === "notes" ? "tab-active" : ""}`} onClick={() => setActiveTab("notes")}>
                    Notes
                </a>
                <a
                    className={`tab ${activeTab === "attachments" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("attachments")}
                >
                    Attachments
                </a>
                <a
                    className={`tab ${activeTab === "dependencies" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("dependencies")}
                >
                    Dependencies
                </a>
                <a className={`tab ${activeTab === "history" ? "tab-active" : ""}`} onClick={() => setActiveTab("history")}>
                    History
                </a>
            </div>

            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-2">Task Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Assigned To</h4>
                                            <p>{task.assignedToName}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Start Date</h4>
                                            <p>{formatDate(task.startDate)}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Status</h4>
                                            <div className={`badge ${getStatusBadgeColor(task.status)}`}>{task.status}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Project</h4>
                                            <p>{task.projectName}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Due Date</h4>
                                            <p>{formatDate(task.endDate)}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Priority</h4>
                                            <div className={`badge ${getPriorityBadgeColor(task.priority)}`}>{task.priority}</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-base-content/70 mb-2">Description</h4>
                                    <p>{task.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Recent Notes</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setActiveTab("notes")}>
                                        View All
                                    </button>
                                </div>
                                {task.notes.length > 0 ? (
                                    <div className="space-y-4">
                                        {task.notes.slice(0, 3).map((note) => (
                                            <div key={note.id} className="bg-base-200 p-4 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-medium">{note.author}</div>
                                                    <div className="text-sm text-base-content/70">{formatDate(note.date)}</div>
                                                </div>
                                                <p>{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle"></i>
                                        <span>No notes have been added to this task yet.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Recent Subtasks</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setActiveTab("subtasks")}>
                                        View All
                                    </button>
                                </div>
                                {task.subtasks.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Subtask</th>
                                                    <th>Assigned To</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {task.subtasks.slice(0, 3).map((subtask) => (
                                                    <tr key={subtask.id}>
                                                        <td>{subtask.name}</td>
                                                        <td>{subtask.assignedTo}</td>
                                                        <td>
                                                            <div className={`badge ${getStatusBadgeColor(subtask.status)}`}>{subtask.status}</div>
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button className="btn btn-ghost btn-xs">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button className="btn btn-ghost btn-xs text-error">
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle"></i>
                                        <span>No subtasks have been added to this task yet.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-4">Task Progress</h3>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Progress</span>
                                    <span className="text-sm font-medium">{task.progress}%</span>
                                </div>
                                <progress className="progress progress-primary w-full mb-4" value={task.progress} max="100"></progress>

                                <div className="stats stats-vertical shadow w-full">
                                    <div className="stat">
                                        <div className="stat-title">Days Elapsed</div>
                                        <div className="stat-value text-lg">
                                            {getDaysElapsed(task.startDate, new Date().toISOString().split("T")[0])}
                                        </div>
                                        <div className="stat-desc">of {getDaysElapsed(task.startDate, task.endDate)} total days</div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">Subtasks Completed</div>
                                        <div className="stat-value text-lg">
                                            {task.subtasks.filter((subtask) => subtask.status === "Completed").length}
                                        </div>
                                        <div className="stat-desc">of {task.subtasks.length} total subtasks</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Dependencies</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setActiveTab("dependencies")}>
                                        View All
                                    </button>
                                </div>
                                {task.dependencies.length > 0 || task.dependents.length > 0 ? (
                                    <div className="space-y-4">
                                        {task.dependencies.length > 0 && (
                                            <div>
                                                <h4 className="font-medium mb-2">This task depends on:</h4>
                                                <ul className="space-y-2">
                                                    {task.dependencies.map((dep) => (
                                                        <li key={dep.id} className="flex items-center justify-between">
                                                            <div>
                                                                <Link href={`/dashboard/tasks/${dep.taskId}`} className="hover:underline">
                                                                    {dep.taskName}
                                                                </Link>
                                                                <div className="text-xs text-base-content/70">{dep.type}</div>
                                                            </div>
                                                            <div className={`badge ${getStatusBadgeColor(dep.status)}`}>{dep.status}</div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {task.dependents.length > 0 && (
                                            <div>
                                                <h4 className="font-medium mb-2">Tasks that depend on this:</h4>
                                                <ul className="space-y-2">
                                                    {task.dependents.map((dep) => (
                                                        <li key={dep.id} className="flex items-center justify-between">
                                                            <div>
                                                                <Link href={`/dashboard/tasks/${dep.taskId}`} className="hover:underline">
                                                                    {dep.taskName}
                                                                </Link>
                                                                <div className="text-xs text-base-content/70">{dep.type}</div>
                                                            </div>
                                                            <div className={`badge ${getStatusBadgeColor(dep.status)}`}>{dep.status}</div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle"></i>
                                        <span>No dependencies have been defined for this task.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Recent Attachments</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setActiveTab("attachments")}>
                                        View All
                                    </button>
                                </div>
                                {task.attachments.length > 0 ? (
                                    <div className="space-y-3">
                                        {task.attachments.slice(0, 3).map((attachment) => (
                                            <div key={attachment.id} className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <i
                                                        className={`fas ${attachment.type === "PDF"
                                                                ? "fa-file-pdf text-error"
                                                                : attachment.type === "Image"
                                                                    ? "fa-file-image text-primary"
                                                                    : "fa-file text-base-content/70"
                                                            }`}
                                                    ></i>
                                                    <div>
                                                        <div className="font-medium">{attachment.name}</div>
                                                        <div className="text-xs text-base-content/70">
                                                            Uploaded by {attachment.uploadedBy} on {formatDate(attachment.uploadDate)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="btn btn-ghost btn-xs">
                                                    <i className="fas fa-download"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle"></i>
                                        <span>No attachments have been added to this task yet.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "subtasks" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Subtasks</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAddSubtaskModal(true)}>
                                <i className="fas fa-plus mr-2"></i> Add Subtask
                            </button>
                        </div>
                        {task.subtasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Subtask</th>
                                            <th>Assigned To</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {task.subtasks.map((subtask) => (
                                            <tr key={subtask.id}>
                                                <td>{subtask.name}</td>
                                                <td>{subtask.assignedTo}</td>
                                                <td>
                                                    <div className={`badge ${getStatusBadgeColor(subtask.status)}`}>{subtask.status}</div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-ghost btn-xs">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs text-error">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                <span>No subtasks have been added to this task yet.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "notes" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Notes</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAddNoteModal(true)}>
                                <i className="fas fa-plus mr-2"></i> Add Note
                            </button>
                        </div>
                        {task.notes.length > 0 ? (
                            <div className="space-y-4">
                                {task.notes.map((note) => (
                                    <div key={note.id} className="bg-base-200 p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium">{note.author}</div>
                                            <div className="text-sm text-base-content/70">{formatDate(note.date)}</div>
                                        </div>
                                        <p>{note.content}</p>
                                        <div className="flex justify-end mt-2">
                                            <button className="btn btn-ghost btn-xs">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button className="btn btn-ghost btn-xs text-error">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                <span>No notes have been added to this task yet.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "attachments" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Attachments</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowUploadAttachmentModal(true)}>
                                <i className="fas fa-plus mr-2"></i> Upload Attachment
                            </button>
                        </div>
                        {task.attachments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>File</th>
                                            <th>Type</th>
                                            <th>Uploaded By</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {task.attachments.map((attachment) => (
                                            <tr key={attachment.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <i
                                                            className={`fas ${attachment.type === "PDF"
                                                                    ? "fa-file-pdf text-error"
                                                                    : attachment.type === "Image"
                                                                        ? "fa-file-image text-primary"
                                                                        : "fa-file text-base-content/70"
                                                                }`}
                                                        ></i>
                                                        <span className="font-medium">{attachment.name}</span>
                                                    </div>
                                                </td>
                                                <td>{attachment.type}</td>
                                                <td>{attachment.uploadedBy}</td>
                                                <td>{formatDate(attachment.uploadDate)}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-ghost btn-xs">
                                                            <i className="fas fa-download"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs">
                                                            <i className="fas fa-share-alt"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs text-error">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                <span>No attachments have been added to this task yet.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "dependencies" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="text-lg font-semibold mb-4">Dependencies</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-3">This task depends on:</h4>
                                {task.dependencies.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Task</th>
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {task.dependencies.map((dep) => (
                                                    <tr key={dep.id}>
                                                        <td>
                                                            <Link href={`/dashboard/tasks/${dep.taskId}`} className="hover:underline">
                                                                {dep.taskName}
                                                            </Link>
                                                        </td>
                                                        <td>{dep.type}</td>
                                                        <td>
                                                            <div className={`badge ${getStatusBadgeColor(dep.status)}`}>{dep.status}</div>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-ghost btn-xs text-error">
                                                                <i className="fas fa-unlink"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle"></i>
                                        <span>This task doesn't depend on any other tasks.</span>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <button className="btn btn-sm btn-outline">
                                        <i className="fas fa-plus mr-2"></i> Add Dependency
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-3">Tasks that depend on this:</h4>
                                {task.dependents.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Task</th>
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {task.dependents.map((dep) => (
                                                    <tr key={dep.id}>
                                                        <td>
                                                            <Link href={`/dashboard/tasks/${dep.taskId}`} className="hover:underline">
                                                                {dep.taskName}
                                                            </Link>
                                                        </td>
                                                        <td>{dep.type}</td>
                                                        <td>
                                                            <div className={`badge ${getStatusBadgeColor(dep.status)}`}>{dep.status}</div>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-ghost btn-xs text-error">
                                                                <i className="fas fa-unlink"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle"></i>
                                        <span>No tasks depend on this task.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "history" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="text-lg font-semibold mb-4">Task History</h3>
                        {task.history.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>User</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {task.history.map((item) => (
                                            <tr key={item.id}>
                                                <td>{formatDate(item.date)}</td>
                                                <td>{item.user}</td>
                                                <td>{item.action}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                <span>No history available for this task.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {showEditTaskModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-3xl">
                        <h3 className="font-bold text-lg mb-4">Edit Task</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Task Name</span>
                                </label>
                                <input type="text" defaultValue={task.name} className="input input-bordered" />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project</span>
                                </label>
                                <select className="select select-bordered" defaultValue={task.projectId}>
                                    <option value="proj1">Main Street Development</option>
                                    <option value="proj2">Riverside Apartments</option>
                                    <option value="proj3">Downtown Project</option>
                                    <option value="proj4">Johnson Residence</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Assign To</span>
                                </label>
                                <select className="select select-bordered" defaultValue={task.assignedTo}>
                                    <option value="crew1">Foundation Team</option>
                                    <option value="crew2">Framing Crew</option>
                                    <option value="crew3">Electrical Team</option>
                                    <option value="crew4">Plumbing Specialists</option>
                                    <option value="crew5">Finishing Crew</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Priority</span>
                                </label>
                                <select className="select select-bordered" defaultValue={task.priority}>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Start Date</span>
                                </label>
                                <input type="date" defaultValue={task.startDate} className="input input-bordered" />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Due Date</span>
                                </label>
                                <input type="date" defaultValue={task.endDate} className="input input-bordered" />
                            </div>
                            <div className="form-control md:col-span-2">
                                <label className="label">
                                    <span className="label-text">Description</span>
                                </label>
                                <textarea className="textarea textarea-bordered h-24" defaultValue={task.description}></textarea>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Status</span>
                                </label>
                                <select className="select select-bordered" defaultValue={task.status}>
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Progress (%)</span>
                                </label>
                                <input type="number" min="0" max="100" defaultValue={task.progress} className="input input-bordered" />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowEditTaskModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowEditTaskModal(false)}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowEditTaskModal(false)}></div>
                </div>
            )}

            {/* Add Note Modal */}
            {showAddNoteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add Note</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Note</span>
                            </label>
                            <textarea className="textarea textarea-bordered h-32" placeholder="Enter your note here"></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddNoteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowAddNoteModal(false)}>
                                Add Note
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddNoteModal(false)}></div>
                </div>
            )}

            {/* Add Subtask Modal */}
            {showAddSubtaskModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add Subtask</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Subtask Name</span>
                            </label>
                            <input type="text" placeholder="Enter subtask name" className="input input-bordered" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Assign To</span>
                            </label>
                            <input type="text" placeholder="Enter assignee name" className="input input-bordered" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            <select className="select select-bordered">
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddSubtaskModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowAddSubtaskModal(false)}>
                                Add Subtask
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddSubtaskModal(false)}></div>
                </div>
            )}

            {/* Upload Attachment Modal */}
            {showUploadAttachmentModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Upload Attachment</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">File</span>
                            </label>
                            <input type="file" className="file-input file-input-bordered w-full" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                placeholder="Enter a description for this file"
                            ></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowUploadAttachmentModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowUploadAttachmentModal(false)}>
                                Upload
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowUploadAttachmentModal(false)}></div>
                </div>
            )}
        </div>
    )
}

// Helper functions
function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
}

function getDaysElapsed(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}
