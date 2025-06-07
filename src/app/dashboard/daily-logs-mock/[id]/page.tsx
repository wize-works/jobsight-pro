"use client";
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function DailyLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const id = params;
    const log = {
        id: id,
        date: "2023-05-20",
        project: {
            id: "proj-001",
            name: "Oakridge Commercial Center",
            client: {
                id: "client-001",
                name: "Oakridge Development",
            },
        },
        crew: {
            id: "crew-001",
            name: "Foundation Team Alpha",
            members: [
                { id: "mem-001", name: "John Smith", role: "Foreman" },
                { id: "mem-002", name: "Maria Garcia", role: "Operator" },
                { id: "mem-003", name: "David Johnson", role: "Laborer" },
                { id: "mem-004", name: "Sarah Williams", role: "Laborer" },
                { id: "mem-005", name: "Michael Brown", role: "Laborer" },
            ],
        },
        weather: {
            condition: "Sunny",
            temperature: "75°F",
            windSpeed: "5 mph",
            precipitation: "0 in",
            notes: "Perfect working conditions",
        },
        workCompleted:
            "Completed foundation pouring for east wing. Prepared formwork for west wing foundation. Installed drainage system around perimeter.",
        workPlanned: "Complete west wing foundation pouring. Begin backfilling operations on east wing.",
        hoursWorked: 45,
        startTime: "07:00",
        endTime: "16:30",
        overtime: 5,
        materials: [
            { name: "Concrete", quantity: "12 yards", cost: 1440, supplier: "Metro Concrete" },
            { name: "Rebar", quantity: "500 ft", cost: 750, supplier: "Steel Supply Co." },
            { name: "Drainage Pipe", quantity: "200 ft", cost: 600, supplier: "Construction Depot" },
            { name: "Gravel", quantity: "3 tons", cost: 210, supplier: "Quarry Materials" },
        ],
        equipment: [
            { name: "Concrete Mixer", hours: 6, operator: "Maria Garcia", condition: "Good" },
            { name: "Excavator", hours: 4, operator: "John Smith", condition: "Good" },
            { name: "Compactor", hours: 3, operator: "David Johnson", condition: "Good" },
            { name: "Pump", hours: 5, operator: "Michael Brown", condition: "Fair" },
        ],
        safety: {
            incidents: "No incidents",
            inspections: "Daily toolbox talk completed. All PPE verified.",
            hazards: "Deep excavation areas marked and barricaded.",
            corrective: "None required",
        },
        quality: {
            inspections: "Concrete mix verified to meet specifications. Slump test performed.",
            issues: "None",
            corrective: "None required",
        },
        delays: {
            description: "Material delivery delayed by 30 minutes in the morning",
            impact: "Minimal - team adjusted work sequence",
            resolution: "Coordinated with supplier for earlier delivery tomorrow",
        },
        visitors: [
            { name: "Robert Chen", company: "Oakridge Development", purpose: "Client inspection" },
            { name: "Lisa Wong", company: "City Building Department", purpose: "Foundation inspection" },
        ],
        notes:
            "Work progressing ahead of schedule. Additional crew may be needed for tomorrow to complete west wing. Concrete curing process began for east wing, will need to monitor overnight temperatures.",
        images: [
            { url: "/construction-daily-logs.png", caption: "East wing foundation pour" },
            { url: "/construction-daily-logs.png", caption: "Drainage installation" },
            { url: "/construction-daily-logs.png", caption: "Formwork for west wing" },
        ],
        documents: [
            { name: "Concrete Delivery Receipt", url: "#" },
            { name: "Foundation Inspection Report", url: "#" },
        ],
        author: {
            id: "user-001",
            name: "Michael Rodriguez",
            role: "Project Manager",
        },
        createdAt: "2023-05-20T17:30:00Z",
        updatedAt: "2023-05-20T18:15:00Z",
    }

    // State for active tab
    const [activeTab, setActiveTab] = useState("overview")

    // Calculate total material cost
    const totalMaterialCost = log.materials.reduce((total, material) => total + material.cost, 0)

    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <a href="/dashboard/daily-logs" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </a>
                        <h1 className="text-2xl font-bold">Daily Log</h1>
                        <span className="badge badge-primary">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-500">
                        <a href={`/dashboard/projects/${log.project.id}`} className="hover:text-primary">
                            {log.project.name}
                        </a>{" "}
                        | Logged by {log.author.name}
                    </p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    <a href={`/dashboard/daily-logs/${log.id}`} className="btn btn-outline btn-sm">
                        <i className="fas fa-edit mr-2"></i> Edit
                    </a>
                    <a href={`/dashboard/daily-logs/${log.id}`} className="btn btn-outline btn-sm">
                        <i className="fas fa-print mr-2"></i> Print
                    </a>
                    <button className="btn btn-outline btn-sm">
                        <i className="fas fa-share-alt mr-2"></i> Share
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-box mb-6">
                <button
                    className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </button>
                <button className={`tab ${activeTab === "labor" ? "tab-active" : ""}`} onClick={() => setActiveTab("labor")}>
                    Labor & Hours
                </button>
                <button
                    className={`tab ${activeTab === "materials" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("materials")}
                >
                    Materials & Equipment
                </button>
                <button className={`tab ${activeTab === "safety" ? "tab-active" : ""}`} onClick={() => setActiveTab("safety")}>
                    Safety & Quality
                </button>
                <button className={`tab ${activeTab === "photos" ? "tab-active" : ""}`} onClick={() => setActiveTab("photos")}>
                    Photos & Documents
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Work Summary</h2>
                                <div className="divider my-2"></div>

                                <h3 className="font-semibold mt-2">Work Completed</h3>
                                <p className="mb-4">{log.workCompleted}</p>

                                <h3 className="font-semibold">Work Planned for Next Day</h3>
                                <p className="mb-4">{log.workPlanned}</p>

                                {log.delays.description && (
                                    <>
                                        <h3 className="font-semibold">Delays & Issues</h3>
                                        <p className="mb-1">
                                            <span className="font-medium">Description:</span> {log.delays.description}
                                        </p>
                                        <p className="mb-1">
                                            <span className="font-medium">Impact:</span> {log.delays.impact}
                                        </p>
                                        <p className="mb-4">
                                            <span className="font-medium">Resolution:</span> {log.delays.resolution}
                                        </p>
                                    </>
                                )}

                                <h3 className="font-semibold">Notes</h3>
                                <p>{log.notes}</p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg mt-6">
                            <div className="card-body">
                                <h2 className="card-title">Weather Conditions</h2>
                                <div className="divider my-2"></div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <i className="fas fa-sun text-3xl text-warning mb-2"></i>
                                        <p className="font-semibold">{log.weather.condition}</p>
                                    </div>
                                    <div className="text-center">
                                        <i className="fas fa-temperature-high text-3xl text-error mb-2"></i>
                                        <p className="font-semibold">{log.weather.temperature}</p>
                                    </div>
                                    <div className="text-center">
                                        <i className="fas fa-wind text-3xl text-info mb-2"></i>
                                        <p className="font-semibold">{log.weather.windSpeed}</p>
                                    </div>
                                    <div className="text-center">
                                        <i className="fas fa-cloud-rain text-3xl text-primary mb-2"></i>
                                        <p className="font-semibold">{log.weather.precipitation}</p>
                                    </div>
                                </div>

                                {log.weather.notes && <p className="mt-4 text-center">{log.weather.notes}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Project Information</h2>
                                <div className="divider my-2"></div>

                                <div className="flex flex-col gap-2">
                                    <div>
                                        <span className="font-semibold">Project:</span>{" "}
                                        <Link href={`/dashboard/projects/${log.project.id}`} className="hover:text-primary">
                                            {log.project.name}
                                        </Link>
                                    </div>
                                    <div>
                                        <span className="font-semibold">Client:</span>{" "}
                                        <Link href={`/dashboard/clients/${log.project.client.id}`} className="hover:text-primary">
                                            {log.project.client.name}
                                        </Link>
                                    </div>
                                    <div>
                                        <span className="font-semibold">Date:</span> {new Date(log.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Crew Information</h2>
                                <div className="divider my-2"></div>

                                <div className="mb-2">
                                    <span className="font-semibold">Crew:</span>{" "}
                                    <Link href={`/dashboard/crews/${log.crew.id}`} className="hover:text-primary">
                                        {log.crew.name}
                                    </Link>
                                </div>

                                <h3 className="font-semibold text-sm mt-4 mb-2">Crew Members Present:</h3>
                                <ul className="space-y-1">
                                    {log.crew.members.map((member) => (
                                        <li key={member.id} className="flex justify-between">
                                            <span>{member.name}</span>
                                            <span className="text-gray-500">{member.role}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Site Visitors</h2>
                                <div className="divider my-2"></div>

                                {log.visitors.length > 0 ? (
                                    <ul className="space-y-2">
                                        {log.visitors.map((visitor, index) => (
                                            <li key={index} className="flex justify-between">
                                                <div>
                                                    <p className="font-semibold">{visitor.name}</p>
                                                    <p className="text-sm text-gray-500">{visitor.company}</p>
                                                </div>
                                                <span className="badge">{visitor.purpose}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-500">No visitors recorded</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Labor & Hours Tab */}
            {activeTab === "labor" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Labor Hours</h2>
                                <div className="divider my-2"></div>

                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Role</th>
                                                <th>Regular Hours</th>
                                                <th>Overtime</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {log.crew.members.map((member) => (
                                                <tr key={member.id}>
                                                    <td>{member.name}</td>
                                                    <td>{member.role}</td>
                                                    <td>8</td>
                                                    <td>{member.role === "Foreman" ? "1" : "0"}</td>
                                                    <td>{member.role === "Foreman" ? "9" : "8"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan={2}>Total</th>
                                                <th>40</th>
                                                <th>5</th>
                                                <th>45</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg mt-6">
                            <div className="card-body">
                                <h2 className="card-title">Work Activities</h2>
                                <div className="divider my-2"></div>

                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Activity</th>
                                                <th>Hours</th>
                                                <th>Crew Members</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Foundation pouring - East wing</td>
                                                <td>18</td>
                                                <td>All members</td>
                                                <td>
                                                    <span className="badge badge-success">Completed</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Drainage system installation</td>
                                                <td>12</td>
                                                <td>David, Sarah, Michael</td>
                                                <td>
                                                    <span className="badge badge-success">Completed</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Formwork - West wing</td>
                                                <td>15</td>
                                                <td>John, Maria</td>
                                                <td>
                                                    <span className="badge badge-success">Completed</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Hours Summary</h2>
                                <div className="divider my-2"></div>

                                <div className="stats stats-vertical shadow">
                                    <div className="stat">
                                        <div className="stat-title">Start Time</div>
                                        <div className="stat-value text-lg">{log.startTime}</div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">End Time</div>
                                        <div className="stat-value text-lg">{log.endTime}</div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">Regular Hours</div>
                                        <div className="stat-value text-lg">{log.hoursWorked - log.overtime}</div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">Overtime Hours</div>
                                        <div className="stat-value text-lg">{log.overtime}</div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">Total Hours</div>
                                        <div className="stat-value text-primary">{log.hoursWorked}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Productivity</h2>
                                <div className="divider my-2"></div>

                                <div className="flex flex-col gap-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span>Foundation Work</span>
                                            <span>100%</span>
                                        </div>
                                        <progress className="progress progress-success" value="100" max="100"></progress>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span>Drainage Installation</span>
                                            <span>100%</span>
                                        </div>
                                        <progress className="progress progress-success" value="100" max="100"></progress>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span>Formwork Preparation</span>
                                            <span>100%</span>
                                        </div>
                                        <progress className="progress progress-success" value="100" max="100"></progress>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span>Overall Daily Progress</span>
                                            <span>100%</span>
                                        </div>
                                        <progress className="progress progress-success" value="100" max="100"></progress>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Materials & Equipment Tab */}
            {activeTab === "materials" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Materials Used</h2>
                                <div className="divider my-2"></div>

                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Material</th>
                                                <th>Quantity</th>
                                                <th>Supplier</th>
                                                <th>Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {log.materials.map((material, index) => (
                                                <tr key={index}>
                                                    <td>{material.name}</td>
                                                    <td>{material.quantity}</td>
                                                    <td>{material.supplier}</td>
                                                    <td>${material.cost.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan={3}>Total</th>
                                                <th>${totalMaterialCost.toLocaleString()}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg mt-6">
                            <div className="card-body">
                                <h2 className="card-title">Equipment Used</h2>
                                <div className="divider my-2"></div>

                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Equipment</th>
                                                <th>Hours</th>
                                                <th>Operator</th>
                                                <th>Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {log.equipment.map((equipment, index) => (
                                                <tr key={index}>
                                                    <td>{equipment.name}</td>
                                                    <td>{equipment.hours}</td>
                                                    <td>{equipment.operator}</td>
                                                    <td>
                                                        <span
                                                            className={`badge ${equipment.condition === "Good" ? "badge-success" : "badge-warning"}`}
                                                        >
                                                            {equipment.condition}
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

                    <div className="flex flex-col gap-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Material Cost Breakdown</h2>
                                <div className="divider my-2"></div>

                                <div className="flex flex-col gap-4">
                                    {log.materials.map((material, index) => (
                                        <div key={index}>
                                            <div className="flex justify-between mb-1">
                                                <span>{material.name}</span>
                                                <span>${material.cost.toLocaleString()}</span>
                                            </div>
                                            <progress
                                                className="progress progress-primary"
                                                value={material.cost}
                                                max={totalMaterialCost}
                                            ></progress>
                                        </div>
                                    ))}
                                </div>

                                <div className="stat bg-base-200 mt-4">
                                    <div className="stat-title">Total Material Cost</div>
                                    <div className="stat-value text-primary">${totalMaterialCost.toLocaleString()}</div>
                                    <div className="stat-desc">For {log.date}</div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Equipment Hours</h2>
                                <div className="divider my-2"></div>

                                <div className="flex flex-col gap-4">
                                    {log.equipment.map((equipment, index) => (
                                        <div key={index}>
                                            <div className="flex justify-between mb-1">
                                                <span>{equipment.name}</span>
                                                <span>{equipment.hours} hrs</span>
                                            </div>
                                            <progress
                                                className="progress progress-accent"
                                                value={equipment.hours}
                                                max={Math.max(...log.equipment.map((e) => e.hours))}
                                            ></progress>
                                        </div>
                                    ))}
                                </div>

                                <div className="stat bg-base-200 mt-4">
                                    <div className="stat-title">Total Equipment Hours</div>
                                    <div className="stat-value text-accent">
                                        {log.equipment.reduce((total, equip) => total + equip.hours, 0)}
                                    </div>
                                    <div className="stat-desc">For {log.date}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Safety & Quality Tab */}
            {activeTab === "safety" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fas fa-shield-alt text-success mr-2"></i>
                                Safety Information
                            </h2>
                            <div className="divider my-2"></div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">Incidents</h3>
                                    <p>{log.safety.incidents}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold">Safety Inspections</h3>
                                    <p>{log.safety.inspections}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold">Hazards Identified</h3>
                                    <p>{log.safety.hazards}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold">Corrective Actions</h3>
                                    <p>{log.safety.corrective}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fas fa-check-circle text-info mr-2"></i>
                                Quality Control
                            </h2>
                            <div className="divider my-2"></div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">Quality Inspections</h3>
                                    <p>{log.quality.inspections}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold">Quality Issues</h3>
                                    <p>{log.quality.issues}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold">Corrective Actions</h3>
                                    <p>{log.quality.corrective}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg md:col-span-2">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fas fa-exclamation-triangle text-warning mr-2"></i>
                                Delays & Issues
                            </h2>
                            <div className="divider my-2"></div>

                            {log.delays.description ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <h3 className="font-semibold">Description</h3>
                                        <p>{log.delays.description}</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold">Impact</h3>
                                        <p>{log.delays.impact}</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold">Resolution</h3>
                                        <p>{log.delays.resolution}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center">No delays or issues reported for this day.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Photos & Documents Tab */}
            {activeTab === "photos" && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title">Photos</h2>
                            <div className="divider my-2"></div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {log.images.map((image, index) => (
                                    <div key={index} className="card bg-base-200">
                                        <figure className="relative h-48">
                                            <Image src={image.url || "/placeholder.svg"} alt={image.caption} fill className="object-cover" />
                                        </figure>
                                        <div className="card-body p-4">
                                            <p>{image.caption}</p>
                                            <div className="card-actions justify-end mt-2">
                                                <button className="btn btn-sm btn-outline">
                                                    <i className="fas fa-download mr-1"></i> Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title">Documents</h2>
                            <div className="divider my-2"></div>

                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Document Name</th>
                                            <th>Type</th>
                                            <th>Size</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {log.documents.map((doc, index) => (
                                            <tr key={index}>
                                                <td>{doc.name}</td>
                                                <td>PDF</td>
                                                <td>1.2 MB</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-xs btn-outline">
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button className="btn btn-xs btn-outline">
                                                            <i className="fas fa-download"></i>
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
            )}
        </div>
    )
}
