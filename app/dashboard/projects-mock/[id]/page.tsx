"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// Mock data for projects
const projectsData = {
    proj1: {
        id: "proj1",
        name: "Main Street Development",
        client: "Oakridge Development",
        clientId: "client1",
        type: "Commercial",
        status: "In Progress",
        startDate: "2025-03-15",
        endDate: "2025-09-30",
        budget: 1250000,
        location: "123 Main St, Anytown, USA",
        progress: 35,
        description:
            "A mixed-use commercial development featuring retail spaces on the ground floor and office spaces on upper floors. The project includes parking facilities and landscaped outdoor areas.",
        assignedCrews: ["crew1", "crew3"],
        manager: "Robert Johnson",
        contacts: [
            {
                name: "Michael Thompson",
                role: "Project Manager",
                email: "michael.t@oakridge.com",
                phone: "(555) 123-4567",
            },
            {
                name: "Sarah Williams",
                role: "Financial Officer",
                email: "sarah.w@oakridge.com",
                phone: "(555) 234-5678",
            },
        ],
        milestones: [
            {
                id: "ms1",
                name: "Site Preparation",
                dueDate: "2025-04-15",
                status: "Completed",
                description: "Clear the site and prepare for foundation work",
            },
            {
                id: "ms2",
                name: "Foundation Work",
                dueDate: "2025-05-30",
                status: "In Progress",
                description: "Complete all foundation and underground utility work",
            },
            {
                id: "ms3",
                name: "Structural Framing",
                dueDate: "2025-07-15",
                status: "Not Started",
                description: "Complete structural framing for all floors",
            },
            {
                id: "ms4",
                name: "Exterior Completion",
                dueDate: "2025-08-30",
                status: "Not Started",
                description: "Complete exterior walls, windows, and roofing",
            },
            {
                id: "ms5",
                name: "Interior Finishing",
                dueDate: "2025-09-15",
                status: "Not Started",
                description: "Complete all interior finishing work",
            },
        ],
        tasks: [
            {
                id: "task1",
                name: "Excavation",
                assignedTo: "crew1",
                startDate: "2025-03-20",
                endDate: "2025-04-05",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task2",
                name: "Foundation Pouring",
                assignedTo: "crew1",
                startDate: "2025-04-10",
                endDate: "2025-05-10",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task3",
                name: "Underground Electrical",
                assignedTo: "crew3",
                startDate: "2025-05-15",
                endDate: "2025-06-15",
                status: "In Progress",
                progress: 60,
            },
            {
                id: "task4",
                name: "First Floor Framing",
                assignedTo: "crew1",
                startDate: "2025-06-20",
                endDate: "2025-07-20",
                status: "Not Started",
                progress: 0,
            },
        ],
        budget: {
            total: 1250000,
            spent: 437500,
            remaining: 812500,
            categories: [
                { name: "Materials", allocated: 625000, spent: 218750 },
                { name: "Labor", allocated: 437500, spent: 153125 },
                { name: "Equipment", allocated: 125000, spent: 43750 },
                { name: "Permits & Fees", allocated: 62500, spent: 21875 },
            ],
        },
        documents: [
            {
                id: "doc1",
                name: "Project Contract",
                type: "PDF",
                uploadedBy: "Robert Johnson",
                uploadDate: "2025-03-10",
            },
            {
                id: "doc2",
                name: "Architectural Plans",
                type: "PDF",
                uploadedBy: "Robert Johnson",
                uploadDate: "2025-03-12",
            },
            {
                id: "doc3",
                name: "Engineering Specifications",
                type: "PDF",
                uploadedBy: "Michael Thompson",
                uploadDate: "2025-03-14",
            },
            {
                id: "doc4",
                name: "Permit Applications",
                type: "PDF",
                uploadedBy: "Robert Johnson",
                uploadDate: "2025-03-18",
            },
        ],
        issues: [
            {
                id: "issue1",
                title: "Soil Composition Issue",
                description: "Unexpected soil composition requiring additional foundation work",
                status: "Resolved",
                priority: "High",
                reportedDate: "2025-04-05",
                reportedBy: "Mike Wilson",
                assignedTo: "Robert Johnson",
                resolution: "Added reinforcement to foundation design",
            },
            {
                id: "issue2",
                title: "Electrical Permit Delay",
                description: "City permit office delayed approval of electrical plans",
                status: "Resolved",
                priority: "Medium",
                reportedDate: "2025-05-10",
                reportedBy: "David Martinez",
                assignedTo: "Robert Johnson",
                resolution: "Submitted revised plans and received approval",
            },
            {
                id: "issue3",
                title: "Material Delivery Delay",
                description: "Structural steel delivery delayed by 2 weeks",
                status: "Open",
                priority: "High",
                reportedDate: "2025-05-25",
                reportedBy: "Robert Johnson",
                assignedTo: "Sarah Williams",
                resolution: "",
            },
        ],
    },
    proj2: {
        id: "proj2",
        name: "Riverside Apartments",
        client: "Riverside Properties",
        clientId: "client2",
        type: "Residential",
        status: "In Progress",
        startDate: "2025-02-01",
        endDate: "2025-08-15",
        budget: 3500000,
        location: "456 River Rd, Anytown, USA",
        progress: 45,
        description:
            "A luxury apartment complex with 48 units across 4 buildings. The project includes a clubhouse, swimming pool, and landscaped grounds with walking paths along the river.",
        assignedCrews: ["crew2", "crew4"],
        manager: "Sarah Johnson",
        contacts: [
            {
                name: "James Wilson",
                role: "Development Director",
                email: "james.w@riverside.com",
                phone: "(555) 345-6789",
            },
            {
                name: "Emily Davis",
                role: "Project Coordinator",
                email: "emily.d@riverside.com",
                phone: "(555) 456-7890",
            },
        ],
        milestones: [
            {
                id: "ms1",
                name: "Site Preparation",
                dueDate: "2025-02-28",
                status: "Completed",
                description: "Clear the site and prepare for foundation work",
            },
            {
                id: "ms2",
                name: "Foundation Work",
                dueDate: "2025-03-30",
                status: "Completed",
                description: "Complete all foundation work for all buildings",
            },
            {
                id: "ms3",
                name: "Framing",
                dueDate: "2025-05-15",
                status: "In Progress",
                description: "Complete framing for all buildings",
            },
            {
                id: "ms4",
                name: "Roofing and Exterior",
                dueDate: "2025-06-30",
                status: "Not Started",
                description: "Complete roofing and exterior finishes",
            },
            {
                id: "ms5",
                name: "Interior Finishing",
                dueDate: "2025-07-30",
                status: "Not Started",
                description: "Complete all interior finishing work",
            },
        ],
        tasks: [
            {
                id: "task1",
                name: "Site Clearing",
                assignedTo: "crew2",
                startDate: "2025-02-05",
                endDate: "2025-02-15",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task2",
                name: "Foundation Work - Building A",
                assignedTo: "crew2",
                startDate: "2025-02-20",
                endDate: "2025-03-10",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task3",
                name: "Foundation Work - Building B",
                assignedTo: "crew2",
                startDate: "2025-03-15",
                endDate: "2025-03-30",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task4",
                name: "Framing - Building A",
                assignedTo: "crew2",
                startDate: "2025-04-05",
                endDate: "2025-04-25",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task5",
                name: "Framing - Building B",
                assignedTo: "crew2",
                startDate: "2025-04-30",
                endDate: "2025-05-20",
                status: "In Progress",
                progress: 75,
            },
            {
                id: "task6",
                name: "Rough Plumbing - Building A",
                assignedTo: "crew4",
                startDate: "2025-05-01",
                endDate: "2025-05-15",
                status: "In Progress",
                progress: 50,
            },
        ],
        budget: {
            total: 3500000,
            spent: 1575000,
            remaining: 1925000,
            categories: [
                { name: "Materials", allocated: 1750000, spent: 787500 },
                { name: "Labor", allocated: 1225000, spent: 551250 },
                { name: "Equipment", allocated: 350000, spent: 157500 },
                { name: "Permits & Fees", allocated: 175000, spent: 78750 },
            ],
        },
        documents: [
            {
                id: "doc1",
                name: "Project Contract",
                type: "PDF",
                uploadedBy: "Sarah Johnson",
                uploadDate: "2025-01-25",
            },
            {
                id: "doc2",
                name: "Architectural Plans",
                type: "PDF",
                uploadedBy: "Sarah Johnson",
                uploadDate: "2025-01-27",
            },
            {
                id: "doc3",
                name: "Engineering Specifications",
                type: "PDF",
                uploadedBy: "James Wilson",
                uploadDate: "2025-01-30",
            },
        ],
        issues: [
            {
                id: "issue1",
                title: "Drainage Issue",
                description: "Poor drainage near Building B foundation requiring additional work",
                status: "Resolved",
                priority: "High",
                reportedDate: "2025-03-20",
                reportedBy: "Sarah Johnson",
                assignedTo: "James Wilson",
                resolution: "Installed additional drainage system",
            },
            {
                id: "issue2",
                title: "Material Price Increase",
                description: "Lumber prices increased by 15% affecting budget",
                status: "Open",
                priority: "Medium",
                reportedDate: "2025-04-10",
                reportedBy: "Emily Davis",
                assignedTo: "James Wilson",
                resolution: "",
            },
        ],
    },
    proj3: {
        id: "proj3",
        name: "Downtown Project",
        client: "Metro City Government",
        clientId: "client3",
        type: "Government",
        status: "In Progress",
        startDate: "2025-01-10",
        endDate: "2025-12-20",
        budget: 5750000,
        location: "789 Center Ave, Metro City, USA",
        progress: 20,
        description:
            "A comprehensive downtown revitalization project including street improvements, public plaza construction, and utility upgrades. The project aims to enhance the downtown area's accessibility and appeal.",
        assignedCrews: ["crew3"],
        manager: "David Martinez",
        contacts: [
            {
                name: "Mayor Thomas Wilson",
                role: "Project Sponsor",
                email: "mayor@metrocity.gov",
                phone: "(555) 567-8901",
            },
            {
                name: "Jennifer Adams",
                role: "City Engineer",
                email: "jennifer.a@metrocity.gov",
                phone: "(555) 678-9012",
            },
        ],
        milestones: [
            {
                id: "ms1",
                name: "Planning and Approvals",
                dueDate: "2025-02-28",
                status: "Completed",
                description: "Complete all planning and obtain necessary approvals",
            },
            {
                id: "ms2",
                name: "Utility Upgrades",
                dueDate: "2025-05-30",
                status: "In Progress",
                description: "Complete all underground utility upgrades",
            },
            {
                id: "ms3",
                name: "Street Improvements",
                dueDate: "2025-08-30",
                status: "Not Started",
                description: "Complete street improvements including paving and sidewalks",
            },
            {
                id: "ms4",
                name: "Plaza Construction",
                dueDate: "2025-10-30",
                status: "Not Started",
                description: "Complete construction of the public plaza",
            },
            {
                id: "ms5",
                name: "Finishing and Landscaping",
                dueDate: "2025-11-30",
                status: "Not Started",
                description: "Complete all finishing work and landscaping",
            },
        ],
        tasks: [
            {
                id: "task1",
                name: "Public Hearings",
                assignedTo: "David Martinez",
                startDate: "2025-01-15",
                endDate: "2025-02-15",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task2",
                name: "Electrical Infrastructure Upgrade",
                assignedTo: "crew3",
                startDate: "2025-03-01",
                endDate: "2025-04-30",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task3",
                name: "Water and Sewer Upgrades",
                assignedTo: "crew3",
                startDate: "2025-05-01",
                endDate: "2025-06-30",
                status: "In Progress",
                progress: 40,
            },
        ],
        budget: {
            total: 5750000,
            spent: 1150000,
            remaining: 4600000,
            categories: [
                { name: "Materials", allocated: 2300000, spent: 460000 },
                { name: "Labor", allocated: 2012500, spent: 402500 },
                { name: "Equipment", allocated: 1150000, spent: 230000 },
                { name: "Permits & Fees", allocated: 287500, spent: 57500 },
            ],
        },
        documents: [
            {
                id: "doc1",
                name: "Project Contract",
                type: "PDF",
                uploadedBy: "David Martinez",
                uploadDate: "2025-01-05",
            },
            {
                id: "doc2",
                name: "City Council Approval",
                type: "PDF",
                uploadedBy: "Mayor Thomas Wilson",
                uploadDate: "2025-01-08",
            },
            {
                id: "doc3",
                name: "Engineering Plans",
                type: "PDF",
                uploadedBy: "Jennifer Adams",
                uploadDate: "2025-01-12",
            },
            {
                id: "doc4",
                name: "Environmental Impact Study",
                type: "PDF",
                uploadedBy: "Jennifer Adams",
                uploadDate: "2025-01-15",
            },
        ],
        issues: [
            {
                id: "issue1",
                title: "Unexpected Underground Utilities",
                description: "Discovered unmapped utility lines during excavation",
                status: "Resolved",
                priority: "High",
                reportedDate: "2025-03-15",
                reportedBy: "David Martinez",
                assignedTo: "Jennifer Adams",
                resolution: "Mapped utilities and adjusted plans",
            },
            {
                id: "issue2",
                title: "Public Concern About Traffic",
                description: "Local businesses concerned about traffic disruption",
                status: "Open",
                priority: "Medium",
                reportedDate: "2025-04-20",
                reportedBy: "Mayor Thomas Wilson",
                assignedTo: "David Martinez",
                resolution: "",
            },
            {
                id: "issue3",
                title: "Material Delivery Delays",
                description: "Electrical components delayed by supplier",
                status: "Open",
                priority: "Medium",
                reportedDate: "2025-05-10",
                reportedBy: "David Martinez",
                assignedTo: "Jennifer Adams",
                resolution: "",
            },
        ],
    },
    proj4: {
        id: "proj4",
        name: "Johnson Residence",
        client: "Johnson Family",
        clientId: "client7",
        type: "Residential",
        status: "In Progress",
        startDate: "2025-04-01",
        endDate: "2025-07-15",
        budget: 450000,
        location: "321 Oak St, Anytown, USA",
        progress: 65,
        description:
            "A custom single-family home with 4 bedrooms, 3 bathrooms, and a 2-car garage. The design features an open floor plan, energy-efficient systems, and high-end finishes throughout.",
        assignedCrews: ["crew5"],
        manager: "James Taylor",
        contacts: [
            {
                name: "Richard Johnson",
                role: "Homeowner",
                email: "richard.j@example.com",
                phone: "(555) 789-0123",
            },
            {
                name: "Karen Johnson",
                role: "Homeowner",
                email: "karen.j@example.com",
                phone: "(555) 890-1234",
            },
        ],
        milestones: [
            {
                id: "ms1",
                name: "Foundation",
                dueDate: "2025-04-15",
                status: "Completed",
                description: "Complete foundation work",
            },
            {
                id: "ms2",
                name: "Framing",
                dueDate: "2025-05-15",
                status: "Completed",
                description: "Complete structural framing",
            },
            {
                id: "ms3",
                name: "Rough-ins",
                dueDate: "2025-06-01",
                status: "Completed",
                description: "Complete electrical, plumbing, and HVAC rough-ins",
            },
            {
                id: "ms4",
                name: "Drywall and Painting",
                dueDate: "2025-06-15",
                status: "In Progress",
                description: "Complete drywall installation and painting",
            },
            {
                id: "ms5",
                name: "Finishing",
                dueDate: "2025-07-10",
                status: "Not Started",
                description: "Complete all interior and exterior finishing",
            },
        ],
        tasks: [
            {
                id: "task1",
                name: "Foundation Work",
                assignedTo: "crew5",
                startDate: "2025-04-05",
                endDate: "2025-04-15",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task2",
                name: "Framing",
                assignedTo: "crew5",
                startDate: "2025-04-20",
                endDate: "2025-05-15",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task3",
                name: "Electrical Rough-in",
                assignedTo: "crew5",
                startDate: "2025-05-20",
                endDate: "2025-05-27",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task4",
                name: "Plumbing Rough-in",
                assignedTo: "crew5",
                startDate: "2025-05-20",
                endDate: "2025-05-27",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task5",
                name: "HVAC Installation",
                assignedTo: "crew5",
                startDate: "2025-05-28",
                endDate: "2025-06-01",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task6",
                name: "Drywall Installation",
                assignedTo: "crew5",
                startDate: "2025-06-05",
                endDate: "2025-06-12",
                status: "Completed",
                progress: 100,
            },
            {
                id: "task7",
                name: "Painting",
                assignedTo: "crew5",
                startDate: "2025-06-15",
                endDate: "2025-06-22",
                status: "In Progress",
                progress: 50,
            },
        ],
        budget: {
            total: 450000,
            spent: 292500,
            remaining: 157500,
            categories: [
                { name: "Materials", allocated: 225000, spent: 146250 },
                { name: "Labor", allocated: 157500, spent: 102375 },
                { name: "Equipment", allocated: 45000, spent: 29250 },
                { name: "Permits & Fees", allocated: 22500, spent: 14625 },
            ],
        },
        documents: [
            {
                id: "doc1",
                name: "Building Contract",
                type: "PDF",
                uploadedBy: "James Taylor",
                uploadDate: "2025-03-25",
            },
            {
                id: "doc2",
                name: "Architectural Plans",
                type: "PDF",
                uploadedBy: "James Taylor",
                uploadDate: "2025-03-27",
            },
            {
                id: "doc3",
                name: "Building Permit",
                type: "PDF",
                uploadedBy: "James Taylor",
                uploadDate: "2025-03-30",
            },
        ],
        issues: [
            {
                id: "issue1",
                title: "Window Size Discrepancy",
                description: "Windows delivered do not match specifications",
                status: "Resolved",
                priority: "Medium",
                reportedDate: "2025-05-10",
                reportedBy: "James Taylor",
                assignedTo: "James Taylor",
                resolution: "Returned windows and received correct sizes",
            },
            {
                id: "issue2",
                title: "Client Requested Layout Change",
                description: "Clients want to modify kitchen layout",
                status: "Resolved",
                priority: "Medium",
                reportedDate: "2025-05-25",
                reportedBy: "Richard Johnson",
                assignedTo: "James Taylor",
                resolution: "Approved change order and updated plans",
            },
        ],
    },
}

// Mock data for crews
const crewsData = {
    crew1: {
        id: "crew1",
        name: "Foundation Team",
        leader: "Mike Wilson",
        members: 5,
    },
    crew2: {
        id: "crew2",
        name: "Framing Crew",
        leader: "Sarah Johnson",
        members: 7,
    },
    crew3: {
        id: "crew3",
        name: "Electrical Team",
        leader: "David Martinez",
        members: 4,
    },
    crew4: {
        id: "crew4",
        name: "Plumbing Specialists",
        leader: "Lisa Chen",
        members: 3,
    },
    crew5: {
        id: "crew5",
        name: "Finishing Crew",
        leader: "James Taylor",
        members: 6,
    },
}

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string
    const [activeTab, setActiveTab] = useState("overview")
    const [showAssignCrewModal, setShowAssignCrewModal] = useState(false)
    const [showAddTaskModal, setShowAddTaskModal] = useState(false)
    const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false)
    const [showAddIssueModal, setShowAddIssueModal] = useState(false)
    const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false)

    const project = projectsData[projectId as keyof typeof projectsData]

    // If project doesn't exist, redirect to projects page
    useEffect(() => {
        if (!project) {
            router.push("/dashboard/projects")
        }
    }, [project, router])

    if (!project) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/projects" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <div className={`badge ${getStatusBadgeColor(project.status)}`}>{project.status}</div>
                    </div>
                    <p className="text-base-content/70 mt-1">
                        Client:{" "}
                        <Link href={`/dashboard/clients/${project.clientId}`} className="hover:underline">
                            {project.client}
                        </Link>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm">
                        <i className="fas fa-edit mr-2"></i> Edit Project
                    </button>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-primary btn-sm">
                            <i className="fas fa-plus mr-2"></i> Add
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <button onClick={() => setShowAddTaskModal(true)}>
                                    <i className="fas fa-tasks mr-2"></i> Add Task
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setShowAddMilestoneModal(true)}>
                                    <i className="fas fa-flag mr-2"></i> Add Milestone
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setShowAssignCrewModal(true)}>
                                    <i className="fas fa-users mr-2"></i> Assign Crew
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setShowAddIssueModal(true)}>
                                    <i className="fas fa-exclamation-triangle mr-2"></i> Report Issue
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setShowUploadDocumentModal(true)}>
                                    <i className="fas fa-file-upload mr-2"></i> Upload Document
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
                <a className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>
                    Tasks
                </a>
                <a className={`tab ${activeTab === "crews" ? "tab-active" : ""}`} onClick={() => setActiveTab("crews")}>
                    Crews
                </a>
                <a className={`tab ${activeTab === "budget" ? "tab-active" : ""}`} onClick={() => setActiveTab("budget")}>
                    Budget
                </a>
                <a className={`tab ${activeTab === "documents" ? "tab-active" : ""}`} onClick={() => setActiveTab("documents")}>
                    Documents
                </a>
                <a className={`tab ${activeTab === "issues" ? "tab-active" : ""}`} onClick={() => setActiveTab("issues")}>
                    Issues
                </a>
            </div>

            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-2">Project Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Project Type</h4>
                                            <p>{project.type}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Location</h4>
                                            <p>{project.location}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Project Manager</h4>
                                            <p>{project.manager}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Start Date</h4>
                                            <p>{formatDate(project.startDate)}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">End Date</h4>
                                            <p>{formatDate(project.endDate)}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-base-content/70">Budget</h4>
                                            <p>{formatCurrency(project.budget)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-base-content/70 mb-2">Description</h4>
                                    <p>{project.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Milestones</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setShowAddMilestoneModal(true)}>
                                        <i className="fas fa-plus mr-2"></i> Add Milestone
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Milestone</th>
                                                <th>Due Date</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {project.milestones.map((milestone) => (
                                                <tr key={milestone.id}>
                                                    <td>
                                                        <div className="font-medium">{milestone.name}</div>
                                                        <div className="text-sm text-base-content/70">{milestone.description}</div>
                                                    </td>
                                                    <td>{formatDate(milestone.dueDate)}</td>
                                                    <td>
                                                        <div className={`badge ${getMilestoneBadgeColor(milestone.status)}`}>
                                                            {milestone.status}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button className="btn btn-ghost btn-xs">
                                                                <i className="fas fa-edit"></i>
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

                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Recent Tasks</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setActiveTab("tasks")}>
                                        View All
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Task</th>
                                                <th>Assigned To</th>
                                                <th>Status</th>
                                                <th>Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {project.tasks.slice(0, 3).map((task) => (
                                                <tr key={task.id}>
                                                    <td>
                                                        <div className="font-medium">{task.name}</div>
                                                        <div className="text-xs text-base-content/70">
                                                            {formatDate(task.startDate)} - {formatDate(task.endDate)}
                                                        </div>
                                                    </td>
                                                    <td>{getCrewName(task.assignedTo)}</td>
                                                    <td>
                                                        <div className={`badge ${getTaskStatusBadgeColor(task.status)}`}>{task.status}</div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <progress
                                                                className="progress progress-primary w-20"
                                                                value={task.progress}
                                                                max="100"
                                                            ></progress>
                                                            <span className="text-xs">{task.progress}%</span>
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

                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Overall Progress</span>
                                    <span className="text-sm font-medium">{project.progress}%</span>
                                </div>
                                <progress
                                    className="progress progress-primary w-full mb-4"
                                    value={project.progress}
                                    max="100"
                                ></progress>

                                <div className="stats stats-vertical shadow w-full">
                                    <div className="stat">
                                        <div className="stat-title">Days Elapsed</div>
                                        <div className="stat-value text-lg">
                                            {getDaysElapsed(project.startDate, new Date().toISOString().split("T")[0])}
                                        </div>
                                        <div className="stat-desc">of {getDaysElapsed(project.startDate, project.endDate)} total days</div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">Budget Used</div>
                                        <div className="stat-value text-lg">
                                            {Math.round((project.budget.spent / project.budget.total) * 100)}%
                                        </div>
                                        <div className="stat-desc">
                                            {formatCurrency(project.budget.spent)} of {formatCurrency(project.budget.total)}
                                        </div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">Tasks Completed</div>
                                        <div className="stat-value text-lg">
                                            {project.tasks.filter((task) => task.status === "Completed").length}
                                        </div>
                                        <div className="stat-desc">of {project.tasks.length} total tasks</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-4">Client Contacts</h3>
                                {project.contacts.map((contact, index) => (
                                    <div key={index} className={`${index > 0 ? "border-t pt-3 mt-3" : ""}`}>
                                        <div className="font-medium">{contact.name}</div>
                                        <div className="text-sm text-base-content/70">{contact.role}</div>
                                        <div className="text-sm mt-1">
                                            <div className="flex items-center">
                                                <i className="fas fa-envelope text-base-content/50 w-5"></i>
                                                <span>{contact.email}</span>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <i className="fas fa-phone text-base-content/50 w-5"></i>
                                                <span>{contact.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Assigned Crews</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setShowAssignCrewModal(true)}>
                                        <i className="fas fa-plus mr-2"></i> Assign
                                    </button>
                                </div>
                                {project.assignedCrews.length > 0 ? (
                                    <div className="space-y-3">
                                        {project.assignedCrews.map((crewId) => {
                                            const crew = crewsData[crewId as keyof typeof crewsData]
                                            return (
                                                <div key={crewId} className="flex justify-between items-center">
                                                    <div>
                                                        <Link href={`/dashboard/crews/${crewId}`} className="font-medium hover:underline">
                                                            {crew.name}
                                                        </Link>
                                                        <div className="text-sm text-base-content/70">Led by {crew.leader}</div>
                                                    </div>
                                                    <div className="badge badge-outline">{crew.members} members</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle"></i>
                                        <span>No crews assigned to this project yet.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "tasks" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Project Tasks</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAddTaskModal(true)}>
                                <i className="fas fa-plus mr-2"></i> Add Task
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Task</th>
                                        <th>Assigned To</th>
                                        <th>Timeline</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.tasks.map((task) => (
                                        <tr key={task.id}>
                                            <td>
                                                <div className="font-medium">{task.name}</div>
                                            </td>
                                            <td>{getCrewName(task.assignedTo)}</td>
                                            <td>
                                                <div className="text-xs">
                                                    {formatDate(task.startDate)} - {formatDate(task.endDate)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`badge ${getTaskStatusBadgeColor(task.status)}`}>{task.status}</div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <progress
                                                        className="progress progress-primary w-20"
                                                        value={task.progress}
                                                        max="100"
                                                    ></progress>
                                                    <span className="text-xs">{task.progress}%</span>
                                                </div>
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
                    </div>
                </div>
            )}

            {activeTab === "crews" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Assigned Crews</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAssignCrewModal(true)}>
                                <i className="fas fa-plus mr-2"></i> Assign Crew
                            </button>
                        </div>
                        {project.assignedCrews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {project.assignedCrews.map((crewId) => {
                                    const crew = crewsData[crewId as keyof typeof crewsData]
                                    return (
                                        <div key={crewId} className="card bg-base-200">
                                            <div className="card-body p-4">
                                                <div className="flex justify-between">
                                                    <h4 className="card-title text-base">{crew.name}</h4>
                                                    <div className="badge badge-outline">{crew.members} members</div>
                                                </div>
                                                <p className="text-sm">Led by {crew.leader}</p>
                                                <div className="card-actions justify-end mt-2">
                                                    <Link href={`/dashboard/crews/${crewId}`} className="btn btn-xs btn-ghost">
                                                        <i className="fas fa-eye mr-1"></i> View
                                                    </Link>
                                                    <button className="btn btn-xs btn-ghost text-error">
                                                        <i className="fas fa-user-minus mr-1"></i> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                <span>No crews assigned to this project yet.</span>
                            </div>
                        )}

                        <div className="divider">Available Crews</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.values(crewsData)
                                .filter((crew) => !project.assignedCrews.includes(crew.id))
                                .map((crew) => (
                                    <div key={crew.id} className="card bg-base-200">
                                        <div className="card-body p-4">
                                            <div className="flex justify-between">
                                                <h4 className="card-title text-base">{crew.name}</h4>
                                                <div className="badge badge-outline">{crew.members} members</div>
                                            </div>
                                            <p className="text-sm">Led by {crew.leader}</p>
                                            <div className="card-actions justify-end mt-2">
                                                <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-xs btn-ghost">
                                                    <i className="fas fa-eye mr-1"></i> View
                                                </Link>
                                                <button className="btn btn-xs btn-primary">
                                                    <i className="fas fa-user-plus mr-1"></i> Assign
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "budget" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="text-lg font-semibold mb-4">Project Budget</h3>

                        <div className="stats shadow mb-6 w-full">
                            <div className="stat">
                                <div className="stat-title">Total Budget</div>
                                <div className="stat-value text-lg">{formatCurrency(project.budget.total)}</div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Spent</div>
                                <div className="stat-value text-lg">{formatCurrency(project.budget.spent)}</div>
                                <div className="stat-desc">
                                    {Math.round((project.budget.spent / project.budget.total) * 100)}% of total
                                </div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Remaining</div>
                                <div className="stat-value text-lg">{formatCurrency(project.budget.remaining)}</div>
                            </div>
                        </div>

                        <h4 className="font-semibold mb-3">Budget Breakdown</h4>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Allocated</th>
                                        <th>Spent</th>
                                        <th>Remaining</th>
                                        <th>Usage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.budget.categories.map((category, index) => (
                                        <tr key={index}>
                                            <td>{category.name}</td>
                                            <td>{formatCurrency(category.allocated)}</td>
                                            <td>{formatCurrency(category.spent)}</td>
                                            <td>{formatCurrency(category.allocated - category.spent)}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <progress
                                                        className="progress progress-primary w-20"
                                                        value={category.spent}
                                                        max={category.allocated}
                                                    ></progress>
                                                    <span className="text-xs">{Math.round((category.spent / category.allocated) * 100)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6">
                            <h4 className="font-semibold mb-3">Budget History</h4>
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                <span>Budget history tracking will be available in the next update.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "documents" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Project Documents</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowUploadDocumentModal(true)}>
                                <i className="fas fa-file-upload mr-2"></i> Upload Document
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Document</th>
                                        <th>Type</th>
                                        <th>Uploaded By</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.documents.map((doc) => (
                                        <tr key={doc.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <i className="fas fa-file-pdf text-error"></i>
                                                    <span className="font-medium">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td>{doc.type}</td>
                                            <td>{doc.uploadedBy}</td>
                                            <td>{formatDate(doc.uploadDate)}</td>
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
                    </div>
                </div>
            )}

            {activeTab === "issues" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Project Issues</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAddIssueModal(true)}>
                                <i className="fas fa-exclamation-triangle mr-2"></i> Report Issue
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Issue</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Reported</th>
                                        <th>Assigned To</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.issues.map((issue) => (
                                        <tr key={issue.id}>
                                            <td>
                                                <div className="font-medium">{issue.title}</div>
                                                <div className="text-sm text-base-content/70">{issue.description}</div>
                                            </td>
                                            <td>
                                                <div className={`badge ${getIssueBadgeColor(issue.status)}`}>{issue.status}</div>
                                            </td>
                                            <td>
                                                <div className={`badge ${getIssuePriorityColor(issue.priority)}`}>{issue.priority}</div>
                                            </td>
                                            <td>
                                                <div>{formatDate(issue.reportedDate)}</div>
                                                <div className="text-xs text-base-content/70">by {issue.reportedBy}</div>
                                            </td>
                                            <td>{issue.assignedTo}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-ghost btn-xs">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    {issue.status === "Open" && (
                                                        <button className="btn btn-ghost btn-xs text-success">
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Crew Modal */}
            {showAssignCrewModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Assign Crew to Project</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Select Crew</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Choose a crew
                                </option>
                                {Object.values(crewsData)
                                    .filter((crew) => !project.assignedCrews.includes(crew.id))
                                    .map((crew) => (
                                        <option key={crew.id} value={crew.id}>
                                            {crew.name} (Led by {crew.leader})
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Assignment Period</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text">Start Date</span>
                                    </label>
                                    <input type="date" className="input input-bordered w-full" />
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text">End Date</span>
                                    </label>
                                    <input type="date" className="input input-bordered w-full" />
                                </div>
                            </div>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Notes</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                placeholder="Add any notes about this assignment"
                            ></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAssignCrewModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowAssignCrewModal(false)}>
                                Assign Crew
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAssignCrewModal(false)}></div>
                </div>
            )}

            {/* Add Task Modal */}
            {showAddTaskModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Task</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Task Name</span>
                            </label>
                            <input type="text" placeholder="Enter task name" className="input input-bordered" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Assign To</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Select a crew
                                </option>
                                {project.assignedCrews.map((crewId) => {
                                    const crew = crewsData[crewId as keyof typeof crewsData]
                                    return (
                                        <option key={crewId} value={crewId}>
                                            {crew.name}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Timeline</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text">Start Date</span>
                                    </label>
                                    <input type="date" className="input input-bordered w-full" />
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text">End Date</span>
                                    </label>
                                    <input type="date" className="input input-bordered w-full" />
                                </div>
                            </div>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea className="textarea textarea-bordered" placeholder="Enter task description"></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddTaskModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowAddTaskModal(false)}>
                                Add Task
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddTaskModal(false)}></div>
                </div>
            )}

            {/* Add Milestone Modal */}
            {showAddMilestoneModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Milestone</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Milestone Name</span>
                            </label>
                            <input type="text" placeholder="Enter milestone name" className="input input-bordered" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Due Date</span>
                            </label>
                            <input type="date" className="input input-bordered" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea className="textarea textarea-bordered" placeholder="Enter milestone description"></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddMilestoneModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowAddMilestoneModal(false)}>
                                Add Milestone
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddMilestoneModal(false)}></div>
                </div>
            )}

            {/* Report Issue Modal */}
            {showAddIssueModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Report New Issue</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Issue Title</span>
                            </label>
                            <input type="text" placeholder="Enter issue title" className="input input-bordered" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea className="textarea textarea-bordered" placeholder="Describe the issue"></textarea>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Priority</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Select priority
                                </option>
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Assign To</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Select person
                                </option>
                                <option>{project.manager}</option>
                                {project.contacts.map((contact, index) => (
                                    <option key={index}>{contact.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddIssueModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowAddIssueModal(false)}>
                                Report Issue
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddIssueModal(false)}></div>
                </div>
            )}

            {/* Upload Document Modal */}
            {showUploadDocumentModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Upload Document</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Document Name</span>
                            </label>
                            <input type="text" placeholder="Enter document name" className="input input-bordered" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Document Type</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Select document type
                                </option>
                                <option>Contract</option>
                                <option>Plan</option>
                                <option>Permit</option>
                                <option>Invoice</option>
                                <option>Report</option>
                                <option>Other</option>
                            </select>
                        </div>
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
                            <textarea className="textarea textarea-bordered" placeholder="Enter document description"></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowUploadDocumentModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowUploadDocumentModal(false)}>
                                Upload Document
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowUploadDocumentModal(false)}></div>
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

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount)
}

function getStatusBadgeColor(status) {
    switch (status) {
        case "In Progress":
            return "badge-primary"
        case "Completed":
            return "badge-success"
        case "Planning":
            return "badge-info"
        case "Bidding":
            return "badge-warning"
        case "On Hold":
            return "badge-error"
        default:
            return "badge-ghost"
    }
}

function getMilestoneBadgeColor(status) {
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

function getTaskStatusBadgeColor(status) {
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

function getIssueBadgeColor(status) {
    switch (status) {
        case "Open":
            return "badge-error"
        case "Resolved":
            return "badge-success"
        default:
            return "badge-ghost"
    }
}

function getIssuePriorityColor(priority) {
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

function getCrewName(crewId) {
    const crews = {
        crew1: "Foundation Team",
        crew2: "Framing Crew",
        crew3: "Electrical Team",
        crew4: "Plumbing Specialists",
        crew5: "Finishing Crew",
    }
    return crews[crewId] || crewId
}

function getDaysElapsed(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}
