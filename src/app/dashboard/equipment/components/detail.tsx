"use client";

import type { Equipment, EquipmentWithDetails } from "@/types/equipment";
import type { EquipmentMaintenance } from "@/types/equipment-maintenance";
import type { EquipmentUsage } from "@/types/equipment_usage";
import type { EquipmentAssignment, EquipmentAssignmentWithDetails } from "@/types/equipment-assignments";
import type { EquipmentSpecification } from "@/types/equipment-specifications";
import { useState } from "react";
import Link from "next/link";
import { Media } from "@/types/media";
import { MaintenanceModal } from "./maintenance-modal";
import QRCode from "@/components/qrcode";
import { Suspense } from "react";

const statusOptions = {
    in_use: { label: "In Use", color: "badge-primary" },
    available: { label: "Available", color: "badge-success" },
    maintenance: { label: "Maintenance", color: "badge-warning" },
    repair: { label: "Under Repair", color: "badge-error" },
    retired: { label: "Retired", color: "badge-neutral" },
};

export default function EquipmentDetail({
    equipment,
    maintenances,
    usages,
    assignments,
    specifications,
    documents,
}: {
    equipment: EquipmentWithDetails;
    maintenances: EquipmentMaintenance[];
    usages: EquipmentUsage[];
    assignments: EquipmentAssignmentWithDetails[];
    specifications: EquipmentSpecification[];
    documents: Media[];
}) {
    const [activeTab, setActiveTab] = useState("details");
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showSpecificationModal, setShowSpecificationModal] = useState(false);
    const [maintenanceList, setMaintenanceList] = useState<EquipmentMaintenance[]>(maintenances) || [];
    console.log("Maintenance List:", maintenanceList);
    const getStatusOption = (status: string | null | undefined) => {
        if (!status) return undefined;
        if (Object.prototype.hasOwnProperty.call(statusOptions, status)) {
            return statusOptions[status as keyof typeof statusOptions];
        }
        return undefined;
    };

    const handleAddMaintenance = async (data: {
        maintenance_type: string;
        maintenance_date: string;
        description: string;
        cost?: number;
    }) => {
        // TODO: Replace with API call to add maintenance record
        // For now, just update local state
        setMaintenanceList([
            {
                id: Math.random().toString(36).substring(2), // temp id
                equipment_id: equipment.id,
                ...data,
            } as EquipmentMaintenance,
            ...maintenanceList,
        ]);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/equipment" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{equipment.name}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/equipment/${equipment.id}/edit`} className="btn btn-primary btn-sm">
                        <i className="fas fa-edit"></i> Edit
                    </Link>
                    <button className="btn btn-error btn-sm" onClick={() => {
                        // Handle delete action here
                        if (confirm("Are you sure you want to delete this equipment?")) {
                            // Call delete function
                        }
                    }}>
                        <i className="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-6">
                <div className="flex flex-col gap-6 col-span-1">
                    <div className="card bg-base-100 shadow-lg">
                        <figure className="px-4 pt-4">
                            <img src={equipment.image_url || "/default-equipment.png"} alt={equipment.name} className="rounded-xl w-full h-48 object-cover" />
                        </figure>
                        <div className="card-body">
                            <h2 className="card-title">Current Status</h2>
                            <div className="mb-1 flex justify-between">
                                <span>Status:</span>
                                <span className={`badge ${getStatusOption(equipment.status)?.color || "badge-neutral"}`}>
                                    {getStatusOption(equipment.status)?.label || equipment.status || "-"}
                                </span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Location:</span>
                                <span>{equipment.location}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Type:</span>
                                <span>{equipment.type}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Assigned To:</span>
                                <span>{equipment.assigned_to || "Unassigned"}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Next Maintenance:</span>
                                <span>{equipment.next_maintenance || "Not set"}</span>
                            </div>

                            <div className="divider"></div>

                            <h2 className="card-title">Financial</h2>
                            <div className="mb-1 flex justify-between">
                                <span>Purchase Date:</span>
                                <span>{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : "Not set"}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Purchase Price:</span>
                                <span>{equipment.purchase_price ? `$${equipment.purchase_price.toLocaleString()}` : "Not set"}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Current Value:</span>
                                <span>{equipment.current_value ? `$${equipment.current_value.toLocaleString()}` : "Not set"}</span>
                            </div>
                            <div className="mb-1 flex justify-between">
                                <span>Depreciation Rate:</span>
                                <span>{equipment.purchase_price && equipment.current_value && equipment.purchase_date
                                    ? (() => {
                                        const ageYears = (new Date().getTime() - new Date(equipment.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                                        if (ageYears > 0) {
                                            const rate = ((equipment.purchase_price - equipment.current_value) / equipment.purchase_price / ageYears) * 100;
                                            return `${rate.toFixed(1)}%/yr`;
                                        }
                                        return "Not set";
                                    })()
                                    : "Not set"}</span>
                            </div>

                            <div className="divider"></div>

                            <h2 className="card-title">Documents</h2>
                            {documents && documents.length > 0 ? (
                                <ul className="list-disc pl-5">
                                    {documents.map((doc, index) => (
                                        <li key={index} className="mb-1">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {doc.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-gray-500">No documents available.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6 col-span-2">
                    {/* Tabs UI */}
                    <div className="tabs tabs-boxed my-6">
                        <button className={`tab ${activeTab === "details" ? "tab-active" : ""}`} onClick={() => setActiveTab("details")}>Details</button>
                        <button className={`tab ${activeTab === "maintenance" ? "tab-active" : ""}`} onClick={() => setActiveTab("maintenance")}>Maintenance History</button>
                        <button className={`tab ${activeTab === "usage" ? "tab-active" : ""}`} onClick={() => setActiveTab("usage")}>Usage History</button>
                        <button className={`tab ${activeTab === "assignments" ? "tab-active" : ""}`} onClick={() => setActiveTab("assignments")}>Assignments</button>
                        <button className={`tab ${activeTab === "cost" ? "tab-active" : ""}`} onClick={() => setActiveTab("cost")}>Cost Analysis</button>
                    </div>
                    <div className="card bg-base-100 shadow-lg p-4">
                        {/* Tab content */}
                        {activeTab === "details" && (
                            <div>
                                <h2 className="font-bold mb-2">Details</h2>
                                <div className="mb-2">Description: {equipment.description}</div>
                                <div>
                                    <h3 className="font-bold mb-2">Specifications</h3>
                                    <table className="table table-zebra w-full">
                                        <tbody>
                                            {specifications.map((spec) => (
                                                <tr key={spec.id}>
                                                    <td>{spec.name}</td>
                                                    <td>{spec.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-start items-center mt-6">
                                    <div className="bg-base-200 p-4 rounded-lg mt-4 mr-4">
                                        <Suspense fallback={<div>Loading QR Code...</div>}>
                                            <QRCode width={150}
                                                text={`https://pro.jobsight.co/dashboard/equipment/${equipment.id}`}
                                            />
                                        </Suspense>
                                    </div>
                                    <div className="flex flex-col justify-center items-start">
                                        <span>Scan the QR code to view equipment details on your mobile device.</span>
                                        <span className="text-sm text-gray-500 mt-1">You can print the equipment details for your records.</span>
                                        <Link href={`/printables/equipment/${equipment.id}`} className="btn btn-outline btn-primary mt-2">
                                            <i className="fas fa-print"></i> Print Details
                                        </Link>
                                        <span className="divider my-2">Or</span>
                                        <span className="text-sm text-gray-500 mt-1">You can also print the QR code to attach to the equipment.</span>
                                        <Link href={`/printables/equipment/${equipment.id}/qr`} className="btn btn-outline btn-sm btn-primary mt-2">
                                            <i className="fas fa-qrcode"></i> Print QR Code
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === "maintenance" && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold mb-2">Maintenance Records</h2>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowMaintenanceModal(true)}
                                    >
                                        <i className="fas fa-plus"></i> Add Maintenance
                                    </button>
                                </div>
                                <ul>
                                    {maintenanceList.map((m) => (
                                        <li key={m.id}>{m.maintenance_type} - {m.description} ({m.maintenance_date})</li>
                                    ))}
                                </ul>
                                {showMaintenanceModal && (
                                    <MaintenanceModal />
                                )}
                            </div>
                        )}
                        {activeTab === "usage" && (
                            <div>
                                <h2 className="font-bold mb-2">Usage Records</h2>
                                <ul>
                                    {usages.map((u) => (
                                        <li key={u.id}>Project: {u.project_id}, Crew: {u.crew_id}, Hours: {u.hours_used}, Fuel: {u.fuel_consumed}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {activeTab === "assignments" && (
                            <div>
                                <h2 className="font-bold mb-2">Assignments</h2>
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Crew</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignments.map((a) => (
                                            <tr key={a.id}>
                                                <td>{a.project_name}</td>
                                                <td>{a.start_date}</td>
                                                <td>{a.end_date}</td>
                                                <td>{a.crew_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === "cost" && (
                            <div>
                                <h2 className="font-bold mb-2">Cost Analysis</h2>
                                <div className="mb-2">
                                    <p>Purchase Price: {equipment.purchase_price ? `$${equipment.purchase_price.toLocaleString()}` : "Not set"}</p>
                                    <p>Current Value: {equipment.current_value ? `$${equipment.current_value.toLocaleString()}` : "Not set"}</p>
                                    <p>Depreciation Rate: {equipment.purchase_price && equipment.current_value && equipment.purchase_date
                                        ? (() => {
                                            const ageYears = (new Date().getTime() - new Date(equipment.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                                            if (ageYears > 0) {
                                                const rate = ((equipment.purchase_price - equipment.current_value) / equipment.purchase_price / ageYears) * 100;
                                                return `${rate.toFixed(1)}%/yr`;
                                            }
                                            return "Not set";
                                        })()
                                        : "Not set"}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">Cost Breakdown</h3>
                                    <ul>
                                        <li>Maintenance Costs: {maintenances.reduce((acc, m) => acc + (m.cost || 0), 0) ? `$${maintenances.reduce((acc, m) => acc + (m.cost || 0), 0).toLocaleString()}` : "Not set"}</li>
                                        <li>Usage Costs: {usages.reduce((acc, u: EquipmentUsage) => acc + (u.cost || 0), 0) ? `$${usages.reduce((acc, u) => acc + (u.cost || 0), 0).toLocaleString()}` : "Not set"}</li>
                                        <li>Total Cost: {equipment.purchase_price && equipment.current_value
                                            ? `$${(equipment.purchase_price - equipment.current_value + maintenances.reduce((acc, m) => acc + (m.cost || 0), 0) + usages.reduce((acc, u) => acc + (u.cost || 0), 0)).toLocaleString()}`
                                            : "Not set"}</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
