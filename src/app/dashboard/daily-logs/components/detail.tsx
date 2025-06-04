
"use client";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import EditModal from "./edit-modal";

// Helper function to extract number from a string
const extractNumber = (str: any) => {
    if (str === null || str === undefined) return 0;
    const match = str.toString().match(/^(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
};

type DailyLogDetailProps = {
    log: DailyLogWithDetails;
    crews: Crew[];
    projects: Project[];
};

export default function DailyLogDetail({ log, crews, projects }: DailyLogDetailProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "labor-hours" | "materials-equipment" | "safety-quality" | "photos-documents">("overview");
    const [currentLog, setCurrentLog] = useState<DailyLogWithDetails>(log);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Calculate totals for summary
    const totalMaterialCost = currentLog.materials.reduce((total, material) =>
        total + (extractNumber(material.quantity) * (material.cost_per_unit || 0)), 0);

    const totalEquipmentHours = currentLog.equipment.reduce((total, equip) =>
        total + (equip.hours || 0), 0);

    const handleLogUpdate = (updatedLog: DailyLogWithDetails) => {
        setCurrentLog(updatedLog);
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-base-100 border-b border-base-300 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/daily-logs" className="btn btn-ghost btn-sm">
                            <i className="far fa-arrow-left"></i>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">Daily Log</h1>
                                <span className="badge badge-primary">{format(new Date(currentLog.date), "M/d/yyyy")}</span>
                            </div>
                            <p className="text-base-content/70">
                                {currentLog.project?.name} | Logged by {currentLog.crew?.name || "Unknown"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <i className="far fa-edit mr-2"></i>
                            Edit
                        </button>
                        <button className="btn btn-outline btn-sm">
                            <i className="far fa-print mr-2"></i>
                            Print
                        </button>
                        <button className="btn btn-outline btn-sm">
                            <i className="far fa-share mr-2"></i>
                            Share
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-base-100 border-b border-base-300">
                <div className="container mx-auto px-6">
                    <div className="tabs">
                        <button
                            className={`tab tab-bordered ${activeTab === "overview" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("overview")}
                        >
                            Overview
                        </button>
                        <button
                            className={`tab tab-bordered ${activeTab === "labor-hours" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("labor-hours")}
                        >
                            Labor & Hours
                        </button>
                        <button
                            className={`tab tab-bordered ${activeTab === "materials-equipment" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("materials-equipment")}
                        >
                            Materials & Equipment
                        </button>
                        <button
                            className={`tab tab-bordered ${activeTab === "safety-quality" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("safety-quality")}
                        >
                            Safety & Quality
                        </button>
                        <button
                            className={`tab tab-bordered ${activeTab === "photos-documents" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("photos-documents")}
                        >
                            Photos & Documents
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Work Summary */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Work Summary</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Work Completed</h4>
                                            <p className="text-sm">{currentLog.work_completed || "No work completed information provided."}</p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-semibold mb-2">Work Planned for Next Day</h4>
                                            <p className="text-sm">Continue with foundation work. Begin backfilling operations on east wing.</p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-semibold mb-2">Delays & Issues</h4>
                                            <div className="bg-base-200 p-3 rounded">
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-medium">Description:</span>
                                                        <p>{currentLog.delays || "No delays reported"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Impact:</span>
                                                        <p>Minimal - team adjusted work sequence</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Resolution:</span>
                                                        <p>Coordinated with supplier for earlier delivery tomorrow</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-semibold mb-2">Notes</h4>
                                            <p className="text-sm">{currentLog.notes || "No additional notes provided."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Weather Conditions */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Weather Conditions</h3>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <i className="far fa-sun text-3xl text-yellow-500"></i>
                                                <p className="text-sm font-medium">Sunny</p>
                                            </div>
                                            <div className="text-center">
                                                <i className="far fa-thermometer-half text-2xl text-red-500"></i>
                                                <p className="text-sm font-medium">75°F</p>
                                            </div>
                                            <div className="text-center">
                                                <i className="far fa-wind text-2xl text-blue-500"></i>
                                                <p className="text-sm font-medium">5 mph</p>
                                            </div>
                                            <div className="text-center">
                                                <i className="far fa-cloud-rain text-2xl text-gray-500"></i>
                                                <p className="text-sm font-medium">0 in</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-base-content/70">Perfect working conditions</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Project Information */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Project Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Project:</span> {currentLog.project?.name}</div>
                                        <div><span className="font-medium">Client:</span> Oakridge Development</div>
                                        <div><span className="font-medium">Date:</span> {format(new Date(currentLog.date), "M/d/yyyy")}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Crew Information */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Crew Information</h3>
                                    <div className="space-y-3">
                                        <div><span className="font-medium">Crew:</span> {currentLog.crew?.name || "Unknown"}</div>
                                        <div>
                                            <span className="font-medium">Crew Members Present:</span>
                                            <div className="mt-2 space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>John Smith</span>
                                                    <span className="text-base-content/60">Foreman</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Maria Garcia</span>
                                                    <span className="text-base-content/60">Operator</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>David Johnson</span>
                                                    <span className="text-base-content/60">Laborer</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Sarah Williams</span>
                                                    <span className="text-base-content/60">Laborer</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Michael Brown</span>
                                                    <span className="text-base-content/60">Laborer</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Site Visitors */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Site Visitors</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium">Robert Chen</p>
                                                <p className="text-base-content/60">Oakridge Development</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">Client Inspection</p>
                                                <p className="text-base-content/60">Foundation inspection</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium">Lisa Wong</p>
                                                <p className="text-base-content/60">City Building Department</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">Foundation inspection</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Labor & Hours Tab */}
                {activeTab === "labor-hours" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            {/* Labor Hours Table */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Labor Hours</h3>
                                    <div className="overflow-x-auto">
                                        <table className="table w-full">
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
                                                <tr>
                                                    <td>John Smith</td>
                                                    <td>Foreman</td>
                                                    <td>8</td>
                                                    <td>1</td>
                                                    <td>9</td>
                                                </tr>
                                                <tr>
                                                    <td>Maria Garcia</td>
                                                    <td>Operator</td>
                                                    <td>8</td>
                                                    <td>0</td>
                                                    <td>8</td>
                                                </tr>
                                                <tr>
                                                    <td>David Johnson</td>
                                                    <td>Laborer</td>
                                                    <td>8</td>
                                                    <td>0</td>
                                                    <td>8</td>
                                                </tr>
                                                <tr>
                                                    <td>Sarah Williams</td>
                                                    <td>Laborer</td>
                                                    <td>8</td>
                                                    <td>0</td>
                                                    <td>8</td>
                                                </tr>
                                                <tr>
                                                    <td>Michael Brown</td>
                                                    <td>Laborer</td>
                                                    <td>8</td>
                                                    <td>0</td>
                                                    <td>8</td>
                                                </tr>
                                                <tr className="font-bold">
                                                    <td>Total</td>
                                                    <td></td>
                                                    <td>40</td>
                                                    <td>5</td>
                                                    <td>45</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Work Activities */}
                            <div className="card bg-base-100 shadow mt-6">
                                <div className="card-body">
                                    <h3 className="card-title">Work Activities</h3>
                                    <div className="overflow-x-auto">
                                        <table className="table w-full">
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
                                                    <td><span className="badge badge-success">Completed</span></td>
                                                </tr>
                                                <tr>
                                                    <td>Drainage system installation</td>
                                                    <td>12</td>
                                                    <td>David, Sarah, Michael</td>
                                                    <td><span className="badge badge-success">Completed</span></td>
                                                </tr>
                                                <tr>
                                                    <td>Formwork - West wing</td>
                                                    <td>15</td>
                                                    <td>John, Maria</td>
                                                    <td><span className="badge badge-success">Completed</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Hours Summary */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Hours Summary</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Start Time</span>
                                                <span className="font-bold text-2xl">07:00</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">End Time</span>
                                                <span className="font-bold text-2xl">16:30</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Regular Hours</span>
                                                <span className="font-bold text-2xl">40</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Overtime Hours</span>
                                                <span className="font-bold text-2xl">5</span>
                                            </div>
                                        </div>
                                        <div className="divider"></div>
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Total Hours</span>
                                                <span className="font-bold text-4xl text-primary">45</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Productivity */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Productivity</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Foundation Work</span>
                                                <span className="text-sm">100%</span>
                                            </div>
                                            <progress className="progress progress-success w-full" value="100" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Drainage Installation</span>
                                                <span className="text-sm">100%</span>
                                            </div>
                                            <progress className="progress progress-success w-full" value="100" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Formwork Preparation</span>
                                                <span className="text-sm">100%</span>
                                            </div>
                                            <progress className="progress progress-success w-full" value="100" max="100"></progress>
                                        </div>
                                        <div className="divider"></div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-bold">Overall Daily Progress</span>
                                                <span className="text-sm font-bold">100%</span>
                                            </div>
                                            <progress className="progress progress-success w-full" value="100" max="100"></progress>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Materials & Equipment Tab */}
                {activeTab === "materials-equipment" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Materials Used */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Materials Used</h3>
                                    <div className="overflow-x-auto">
                                        <table className="table w-full">
                                            <thead>
                                                <tr>
                                                    <th>Material</th>
                                                    <th>Quantity</th>
                                                    <th>Supplier</th>
                                                    <th>Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Concrete</td>
                                                    <td>12 yards</td>
                                                    <td>Metro Concrete</td>
                                                    <td>$1,440</td>
                                                </tr>
                                                <tr>
                                                    <td>Rebar</td>
                                                    <td>500 ft</td>
                                                    <td>Steel Supply Co.</td>
                                                    <td>$750</td>
                                                </tr>
                                                <tr>
                                                    <td>Drainage Pipe</td>
                                                    <td>200 ft</td>
                                                    <td>Construction Depot</td>
                                                    <td>$600</td>
                                                </tr>
                                                <tr>
                                                    <td>Gravel</td>
                                                    <td>3 tons</td>
                                                    <td>Quarry Materials</td>
                                                    <td>$210</td>
                                                </tr>
                                                <tr className="font-bold">
                                                    <td>Total</td>
                                                    <td></td>
                                                    <td></td>
                                                    <td>$3,000</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Equipment Used */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Equipment Used</h3>
                                    <div className="overflow-x-auto">
                                        <table className="table w-full">
                                            <thead>
                                                <tr>
                                                    <th>Equipment</th>
                                                    <th>Hours</th>
                                                    <th>Operator</th>
                                                    <th>Condition</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Concrete Mixer</td>
                                                    <td>6</td>
                                                    <td>Maria Garcia</td>
                                                    <td><span className="badge badge-success">Good</span></td>
                                                </tr>
                                                <tr>
                                                    <td>Excavator</td>
                                                    <td>4</td>
                                                    <td>John Smith</td>
                                                    <td><span className="badge badge-success">Good</span></td>
                                                </tr>
                                                <tr>
                                                    <td>Compactor</td>
                                                    <td>3</td>
                                                    <td>David Johnson</td>
                                                    <td><span className="badge badge-success">Good</span></td>
                                                </tr>
                                                <tr>
                                                    <td>Pump</td>
                                                    <td>5</td>
                                                    <td>Michael Brown</td>
                                                    <td><span className="badge badge-warning">Fair</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Material Cost Breakdown */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Material Cost Breakdown</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Concrete</span>
                                                <span className="text-sm">$1,440</span>
                                            </div>
                                            <progress className="progress progress-primary w-full" value="48" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Rebar</span>
                                                <span className="text-sm">$750</span>
                                            </div>
                                            <progress className="progress progress-primary w-full" value="25" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Drainage Pipe</span>
                                                <span className="text-sm">$600</span>
                                            </div>
                                            <progress className="progress progress-primary w-full" value="20" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Gravel</span>
                                                <span className="text-sm">$210</span>
                                            </div>
                                            <progress className="progress progress-primary w-full" value="7" max="100"></progress>
                                        </div>
                                        <div className="divider"></div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-primary">$3,000</div>
                                            <div className="text-sm text-base-content/70">Total Material Cost</div>
                                            <div className="text-xs text-base-content/50">For 2023-05-20</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Equipment Hours */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Equipment Hours</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Concrete Mixer</span>
                                                <span className="text-sm">6 hrs</span>
                                            </div>
                                            <progress className="progress progress-secondary w-full" value="33" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Excavator</span>
                                                <span className="text-sm">4 hrs</span>
                                            </div>
                                            <progress className="progress progress-secondary w-full" value="22" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Compactor</span>
                                                <span className="text-sm">3 hrs</span>
                                            </div>
                                            <progress className="progress progress-secondary w-full" value="17" max="100"></progress>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">Pump</span>
                                                <span className="text-sm">5 hrs</span>
                                            </div>
                                            <progress className="progress progress-secondary w-full" value="28" max="100"></progress>
                                        </div>
                                        <div className="divider"></div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-secondary">18</div>
                                            <div className="text-sm text-base-content/70">Total Equipment Hours</div>
                                            <div className="text-xs text-base-content/50">For 2023-05-20</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Safety & Quality Tab */}
                {activeTab === "safety-quality" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Safety Information */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <h3 className="card-title text-success">
                                    <i className="far fa-shield-check mr-2"></i>
                                    Safety Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Incidents</h4>
                                        <p className="text-sm">No incidents</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Safety Inspections</h4>
                                        <p className="text-sm">Daily toolbox talk completed. All PPE verified.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Hazards Identified</h4>
                                        <p className="text-sm">Deep excavation areas marked and barricaded.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Corrective Actions</h4>
                                        <p className="text-sm">None required</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quality Control */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <h3 className="card-title text-info">
                                    <i className="far fa-clipboard-check mr-2"></i>
                                    Quality Control
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Quality Inspections</h4>
                                        <p className="text-sm">Concrete mix verified to meet specifications. Slump test performed.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Quality Issues</h4>
                                        <p className="text-sm">None</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Corrective Actions</h4>
                                        <p className="text-sm">None required</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delays & Issues */}
                        <div className="lg:col-span-2">
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title text-warning">
                                        <i className="far fa-exclamation-triangle mr-2"></i>
                                        Delays & Issues
                                    </h3>
                                    <div className="bg-base-200 p-4 rounded">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <h4 className="font-semibold mb-2">Description</h4>
                                                <p className="text-sm">Material delivery delayed by 30 minutes in the morning</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-2">Impact</h4>
                                                <p className="text-sm">Minimal - team adjusted work sequence</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-2">Resolution</h4>
                                                <p className="text-sm">Coordinated with supplier for earlier delivery tomorrow</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photos & Documents Tab */}
                {activeTab === "photos-documents" && (
                    <div className="space-y-6">
                        {/* Photos */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <h3 className="card-title">Photos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative group">
                                        <img src="/concrete-pouring.png" alt="East wing foundation pour" className="w-full h-48 object-cover rounded"/>
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-end">
                                            <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <p className="font-medium">East wing foundation pour</p>
                                                <button className="btn btn-sm btn-primary mt-2">
                                                    <i className="far fa-download mr-2"></i>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <img src="/concrete-pouring.png" alt="Drainage installation" className="w-full h-48 object-cover rounded"/>
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-end">
                                            <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <p className="font-medium">Drainage installation</p>
                                                <button className="btn btn-sm btn-primary mt-2">
                                                    <i className="far fa-download mr-2"></i>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <img src="/concrete-pouring.png" alt="Formwork for west wing" className="w-full h-48 object-cover rounded"/>
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-end">
                                            <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <p className="font-medium">Formwork for west wing</p>
                                                <button className="btn btn-sm btn-primary mt-2">
                                                    <i className="far fa-download mr-2"></i>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <h3 className="card-title">Documents</h3>
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
                                            <tr>
                                                <td>Concrete Delivery Receipt</td>
                                                <td>PDF</td>
                                                <td>1.2 MB</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-ghost btn-sm">
                                                            <i className="far fa-eye"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm">
                                                            <i className="far fa-download"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Foundation Inspection Report</td>
                                                <td>PDF</td>
                                                <td>1.2 MB</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-ghost btn-sm">
                                                            <i className="far fa-eye"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm">
                                                            <i className="far fa-download"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <EditModal
                log={currentLog}
                crews={crews}
                projects={projects}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleLogUpdate}
            />
        </div>
    );
}
