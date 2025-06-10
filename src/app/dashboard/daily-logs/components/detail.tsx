
"use client";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import EditModal from "./edit-modal";
import { CrewMember } from "@/types/crew-members";
import TabSafety from "./tab-safety";
import TabMaterials from "./tab-materials";
import { DailyLogMaterial } from "@/types/daily-log-materials";
import { DailyLogEquipment } from "@/types/daily-log-equipment";

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
    crewMembers: CrewMember[];
};

export default function DailyLogDetail({ log, crews, projects, crewMembers }: DailyLogDetailProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "labor-hours" | "materials-equipment" | "safety-quality" | "photos-documents">("overview");
    const [currentLog, setCurrentLog] = useState<DailyLogWithDetails>(log);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Calculate totals for summary
    const totalMaterialCost = currentLog.materials.reduce((total, material) =>
        total + (extractNumber(material.quantity) * (material.cost || 0)), 0);

    const totalEquipmentHours = currentLog.equipment.reduce((total, equip) =>
        total + (equip.hours || 0), 0);

    const handleLogUpdate = (updatedLog: DailyLogWithDetails) => {
        setCurrentLog(updatedLog);
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
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

            {/* Tab Navigation */}
            <div className="tabs tabs-box py-6">
                <button
                    className={`tab tab-bordered ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
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

            {/* Content Area */}
            <div className="container mx-auto">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Work Summary */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Work Summary</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
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
                                            <div className="grid grid-cols-3 gap-6">
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
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <i className="far fa-sun text-3xl text-yellow-500"></i>
                                                <p className="font-medium">Sunny</p>
                                            </div>
                                            <div className="text-center">
                                                <i className="far fa-thermometer-half text-2xl text-red-500"></i>
                                                <p className="font-medium">75°F</p>
                                            </div>
                                            <div className="text-center">
                                                <i className="far fa-wind text-2xl text-blue-500"></i>
                                                <p className="font-medium">5 mph</p>
                                            </div>
                                            <div className="text-center">
                                                <i className="far fa-cloud-rain text-2xl text-gray-500"></i>
                                                <p className="font-medium">0 in</p>
                                            </div>
                                        </div>
                                        <p className="text-base-content/70">Perfect working conditions</p>
                                    </div>
                                </div>
                                <div>

                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Project Information */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Project Information</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div><span className="font-medium">Client:</span> <a href={`/dashboard/clients/${log.client.id}`}>{log.client.name}</a></div>
                                        <div><span className="font-medium">Project:</span> <a href={`/dashboard/projects/${log.project.id}`}>{currentLog.project?.name}</a></div>
                                        <div><span className="font-medium">Date:</span> {format(new Date(currentLog.date), "M/d/yyyy")}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Crew Information */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Crew Information</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div className="text-lg font-medium">Crew: {currentLog.crew?.name || "Unknown"}</div>
                                        <div>
                                            <span className="font-medium">Crew Members</span>
                                            <div className="mt-2 space-y-1">
                                                {crewMembers.map((member) => (
                                                    <div key={member.id} className="flex justify-between">
                                                        <span>{member.name}</span>
                                                        <span className="text-base-content/60">{member.role}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hours Summary */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Hours Summary</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
                                        <div className="flex justify-between align-top">
                                            <span>Start Time</span>
                                            <span className="text-2xl">{currentLog.start_time}</span>
                                        </div>
                                        <div className="flex justify-between align-center">
                                            <span>End Time</span>
                                            <span className="text-2xl">{currentLog.end_time}</span>
                                        </div>
                                        <div className="flex justify-between align-center">
                                            <span>Overtime Hours</span>
                                            <span className="text-2xl">{currentLog.overtime || "0"} hrs</span>
                                        </div>
                                        <div className="flex justify-between align-center">
                                            <span>Regular Hours</span>
                                            <span className="text-2xl">{currentLog.hours_worked || "0"} hrs</span>
                                        </div>
                                        <div className="divider my-1" />
                                        <div className="flex justify-between align-center">
                                            <span>Total Hours Worked</span>
                                            <span className="text-2xl text-secondary font-bold">{currentLog.hours_worked + currentLog.overtime || "0"} hrs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Site Visitors */}
                            {/* <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h3 className="card-title">Site Visitors</h3>
                                    <div className="divider my-2" />
                                    <div className="space-y-6">
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
                            </div> */}
                        </div>
                    </div>
                )}

                {/* Materials & Equipment Tab */}
                {activeTab === "materials-equipment" && (
                    <TabMaterials materials={log.materials} equipment={log.equipment} />
                )}

                {/* Safety & Quality Tab */}
                {activeTab === "safety-quality" && (
                    <TabSafety safety={log.safety} quality={log.quality} delays={log.delays} />
                )}

                {/* Photos & Documents Tab */}
                {activeTab === "photos-documents" && (
                    <div className="space-y-6">
                        {/* Photos */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <h3 className="card-title">Photos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="relative group">
                                        <img src="/concrete-pouring.png" alt="East wing foundation pour" className="w-full h-48 object-cover rounded" />
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
                                        <img src="/concrete-pouring.png" alt="Drainage installation" className="w-full h-48 object-cover rounded" />
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
                                        <img src="/concrete-pouring.png" alt="Formwork for west wing" className="w-full h-48 object-cover rounded" />
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
