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
    const [activeTab, setActiveTab] = useState<"overview" | "materials" | "equipment" | "notes">("overview");
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
        <div className="">
            {/* Header with basic info */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/daily-logs" className="btn btn-circle btn-sm">
                                <i className="far fa-arrow-left"></i>
                            </Link>
                            <h1 className="text-2xl font-bold">Daily Log Details</h1>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                            <span className="badge badge-lg badge-primary">
                                {currentLog.project?.name}
                            </span>
                            {currentLog.crew && (
                                <span className="badge badge-lg badge-secondary">
                                    Crew: {currentLog.crew.name}
                                </span>
                            )}
                            <span className="badge badge-lg">
                                {format(new Date(currentLog.date), "MMMM d, yyyy")}
                            </span>
                            <span className="badge badge-lg badge-info">
                                {currentLog.hours_worked || 0} hours worked
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <i className="far fa-edit fa-fw mr-2"></i>
                            Edit Log
                        </button>
                        <button className="btn btn-outline">
                            <i className="far fa-print fa-fw mr-2"></i>
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tabs tabs-box">
                <button
                    className={`tab tab-bordered ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    <i className="far fa-clipboard-list fa-fw mr-2"></i>
                    Overview
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === "materials" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("materials")}
                >
                    <i className="far fa-boxes fa-fw mr-2"></i>
                    Materials ({currentLog.materials.length})
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === "equipment" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("equipment")}
                >
                    <i className="far fa-truck-container fa-fw mr-2"></i>
                    Equipment ({currentLog.equipment.length})
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === "notes" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("notes")}
                >
                    <i className="far fa-sticky-note fa-fw mr-2"></i>
                    Notes
                </button>
            </div>

            {/* Content Area */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="card bg-base-200 shadow-sm">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="far fa-check-circle fa-fw mr-2 text-success"></i>
                                            Work Completed
                                        </h3>
                                        <p className="whitespace-pre-line">{currentLog.work_completed || "No work completed information provided."}</p>
                                    </div>
                                </div>
                                <div className="card bg-base-200 shadow-sm">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="far fa-exclamation-triangle fa-fw mr-2 text-warning"></i>
                                            Safety Concerns
                                        </h3>
                                        <p className="whitespace-pre-line">{currentLog.safety || "No safety concerns reported."}</p>
                                    </div>
                                </div>
                                <div className="card bg-base-200 shadow-sm">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="far fa-hourglass-half fa-fw mr-2 text-error"></i>
                                            Delays
                                        </h3>
                                        <p className="whitespace-pre-line">{currentLog.delays || "No delays reported."}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-200 shadow-sm">
                                <div className="card-body">
                                    <h3 className="card-title text-lg">
                                        <i className="far fa-chart-line fa-fw mr-2 text-info"></i>
                                        Quality Assessment
                                    </h3>
                                    <p className="whitespace-pre-line">{currentLog.quality || "No quality assessment provided."}</p>
                                </div>
                            </div>

                            <div className="card bg-base-200 shadow-sm">
                                <div className="card-body">
                                    <h3 className="card-title text-lg">
                                        <i className="far fa-sticky-note fa-fw mr-2 text-primary"></i>
                                        Additional Notes
                                    </h3>
                                    <p className="whitespace-pre-line">{currentLog.notes || "No additional notes provided."}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="stat bg-base-200 shadow-sm">
                                    <div className="stat-figure text-primary">
                                        <i className="far fa-dollar-sign fa-3x"></i>
                                    </div>
                                    <div className="stat-title">Total Material Cost</div>
                                    <div className="stat-value text-primary">${totalMaterialCost.toFixed(2)}</div>
                                    <div className="stat-desc">{currentLog.materials.length} materials used</div>
                                </div>
                                <div className="stat bg-base-200 shadow-sm">
                                    <div className="stat-figure text-secondary">
                                        <i className="far fa-clock fa-3x"></i>
                                    </div>
                                    <div className="stat-title">Equipment Usage</div>
                                    <div className="stat-value text-secondary">{totalEquipmentHours} hrs</div>
                                    <div className="stat-desc">{currentLog.equipment.length} equipment items</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Materials Tab */}
                    {activeTab === "materials" && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Materials Used</h2>
                                <div className="text-lg font-semibold">Total: ${totalMaterialCost.toFixed(2)}</div>
                            </div>

                            {currentLog.materials.length === 0 ? (
                                <div className="alert alert-info">
                                    <i className="far fa-info-circle mr-2"></i>
                                    No materials were recorded for this daily log.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Material</th>
                                                <th className="text-right">Quantity</th>
                                                <th className="text-right">Cost Per Unit</th>
                                                <th className="text-right">Total Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentLog.materials.map(material => {
                                                const quantityNum = extractNumber(material.quantity);
                                                const unitCost = Number(material.cost_per_unit) || 0;
                                                const totalCost = quantityNum * unitCost;

                                                return (
                                                    <tr key={material.id}>
                                                        <td>{material.name}</td>
                                                        <td className="text-right">{material.quantity || 0}</td>
                                                        <td className="text-right">${unitCost.toFixed(2)}</td>
                                                        <td className="text-right font-semibold">${totalCost.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan={3} className="text-right">Total</th>
                                                <th className="text-right">${totalMaterialCost.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Equipment Tab */}
                    {activeTab === "equipment" && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Equipment Used</h2>
                                <div className="text-lg font-semibold">Total: {totalEquipmentHours} hours</div>
                            </div>

                            {currentLog.equipment.length === 0 ? (
                                <div className="alert alert-info">
                                    <i className="far fa-info-circle mr-2"></i>
                                    No equipment usage was recorded for this daily log.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Equipment</th>
                                                <th className="text-right">Hours Used</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentLog.equipment.map(equip => (
                                                <tr key={equip.id}>
                                                    <td>{equip.name}</td>
                                                    <td className="text-right">{equip.hours || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th className="text-right">Total Hours</th>
                                                <th className="text-right">{totalEquipmentHours}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === "notes" && (
                        <div className="space-y-6">
                            <div className="card bg-base-200 shadow-sm">
                                <div className="card-body">
                                    <h3 className="card-title">Notes</h3>
                                    <div className="whitespace-pre-line min-h-[200px]">
                                        {currentLog.notes || "No notes were recorded for this daily log."}
                                    </div>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Add a note</span>
                                </label>
                                <textarea className="textarea textarea-bordered h-24" placeholder="Add additional notes here..."></textarea>
                                <div className="mt-2 flex justify-end">
                                    <button className="btn btn-primary">
                                        <i className="far fa-save mr-2"></i>
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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