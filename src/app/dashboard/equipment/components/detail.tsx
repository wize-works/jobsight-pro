"use client";

import type { Equipment, EquipmentStatus, EquipmentUpdate, EquipmentWithDetails } from "@/types/equipment";
import { equipmentStatusOptions } from "@/types/equipment";
import { maintenanceTypeOptions, type EquipmentMaintenance, type EquipmentMaintenanceType } from "@/types/equipment-maintenance";
import type { EquipmentUsage, EquipmentUsageWithDetails } from "@/types/equipment_usage";
import type { EquipmentAssignment, EquipmentAssignmentWithDetails } from "@/types/equipment-assignments";
import type { EquipmentSpecification } from "@/types/equipment-specifications";
import { setEquipmentLocation } from "@/app/actions/equipments";
import { useState } from "react";
import Link from "next/link";
import { Media } from "@/types/media";
import { MaintenanceModal } from "./maintenance-modal";
import { AssignmentModal } from "./assignment-modal";
import { UsageModal } from "./usage-modal";
import QRCode from "@/components/qrcode";
import { Suspense } from "react";

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
    usages: EquipmentUsageWithDetails[];
    assignments: EquipmentAssignmentWithDetails[];
    specifications: EquipmentSpecification[];
    documents: Media[];
}) {
    const [activeTab, setActiveTab] = useState("details");
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [showSpecificationModal, setShowSpecificationModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [maintenanceList, setMaintenanceList] = useState<EquipmentMaintenance[]>(maintenances) || [];
    const [usageList, setUsageList] = useState<EquipmentUsageWithDetails[]>(usages) || [];
    const [assignmentList, setAssignmentList] = useState<EquipmentAssignmentWithDetails[]>(assignments) || [];
    const [selectedMaintenance, setSelectedMaintenance] = useState<EquipmentMaintenance | undefined>();
    const [selectedUsage, setSelectedUsage] = useState<EquipmentUsage | undefined>();
    const [selectedAssignment, setSelectedAssignment] = useState<EquipmentAssignment | undefined>();
    const [location, setLocation] = useState<string>(equipment.location || "");

    const handleAddMaintenance = async (maintenance: EquipmentMaintenance) => {
        // If we're editing, update the existing record
        if (selectedMaintenance) {
            setMaintenanceList(maintenanceList.map((m) =>
                m.id === selectedMaintenance.id ? maintenance : m
            ));
        } else {
            // For new records
            setMaintenanceList([maintenance, ...maintenanceList]);
        }
    };

    const handleAddUsage = async (usage: EquipmentUsage) => {
        // If we're editing, update the existing record
        if (selectedUsage) {
            setUsageList(usageList.map((u) =>
                u.id === selectedUsage.id ? usage : u
            ));
        } else {
            // For new records
            setUsageList([usage, ...usageList]);
        }
    };

    const handleAddAssignment = async (assignment: EquipmentAssignment) => {
        // If we're editing, update the existing record
        if (selectedAssignment) {
            setAssignmentList(assignmentList.map((a) =>
                a.id === selectedAssignment.id ? assignment : a
            ));
        } else {
            // For new records
            setAssignmentList([assignment, ...assignmentList]);
        }
    };

    const handleDeleteAssignment = (id: string) => {
        setAssignmentList(assignmentList.filter((a) => a.id !== id));
    };

    const closeMaintenanceModal = () => {
        setShowMaintenanceModal(false);
        setSelectedMaintenance(undefined);
    };

    const closeUsageModal = () => {
        setShowUsageModal(false);
        setSelectedUsage(undefined);
    };

    const closeAssignmentModal = () => {
        setShowAssignmentModal(false);
        setSelectedAssignment(undefined);
    };

    const handleEditMaintenance = (maintenance: EquipmentMaintenance) => {
        setSelectedMaintenance(maintenance);
        setShowMaintenanceModal(true);
    };

    const handleEditUsage = (usage: EquipmentUsage) => {
        setSelectedUsage(usage);
        setShowUsageModal(true);
    };

    const handleEditAssignment = (assignment: EquipmentAssignment) => {
        setSelectedAssignment(assignment);
        setShowAssignmentModal(true);
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
                                {equipmentStatusOptions.badge(equipment.status as EquipmentStatus)}
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

                            <div className="mb-1 flex justify-between">
                                <span>Location:</span>
                                <div>
                                    <span className="badge badge-primary mr-2">{location || "No location assigned"}</span>

                                    <button className="btn btn-secondary btn-xs join-item" type="button" onClick={() => navigator.geolocation.getCurrentPosition((position) => {
                                        const { latitude, longitude } = position.coords;
                                        setLocation(`Lat: ${latitude}, Lon: ${longitude}`);
                                        setEquipmentLocation({ id: equipment.id, location: `Lat: ${latitude}, Lon: ${longitude}` } as EquipmentUpdate);
                                    })}>
                                        <i className="fas fa-map-marker-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="mb-1 flex justify-end gap-2">
                                {location && location !== "No location assigned" && (
                                    <>
                                        <Link href={`https://maps.apple.com/?q=${location}`} className="btn btn-accent btn-xs">
                                            <i className="fab fa-apple fa-lg"></i> View on Map
                                        </Link>
                                        <Link href={`https://google.com/maps/place/${location}`} className="btn btn-accent btn-xs">
                                            <i className="fab fa-google fa-lg"></i> View on Map
                                        </Link>
                                        <Link
                                            href={(() => {
                                                const match = location.match(/Lat: ([-\d.]+), Lon: ([-\d.]+)/);
                                                if (match) {
                                                    const [_, lat, lon] = match;
                                                    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15&layers=M&marker=color:red|${lat},${lon}`;
                                                }
                                                return '#';
                                            })()}
                                            className="btn btn-accent btn-xs"
                                        >
                                            <i className="fas fa-map fa-lg"></i> View on Map
                                        </Link>
                                    </>
                                )}
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
                    <div role="tablist" className="tabs tabs-box">
                        <button className={`tab ${activeTab === "details" ? "tab-active" : ""}`} onClick={() => setActiveTab("details")}>Details</button>
                        <button className={`tab ${activeTab === "maintenance" ? "tab-active" : ""}`} onClick={() => setActiveTab("maintenance")}>Maintenance History</button>
                        <button className={`tab ${activeTab === "usage" ? "tab-active" : ""}`} onClick={() => setActiveTab("usage")}>Usage History</button>
                        <button className={`tab ${activeTab === "assignments" ? "tab-active" : ""}`} onClick={() => setActiveTab("assignments")}>Assignments</button>
                        <button className={`tab ${activeTab === "cost" ? "tab-active" : ""}`} onClick={() => setActiveTab("cost")}>Cost Analysis</button>
                    </div>
                    <div className="card bg-base-100 shadow-lg">
                        {/* Tab content */}
                        {activeTab === "details" && (
                            <div className="card-body">
                                <h2 className="font-bold mb-2">Details</h2>
                                <div className="mb-6">Description: {equipment.description}</div>
                                <div>
                                    <h3 className="font-bold mb-2">Specifications</h3>
                                    <table className="table table-zebra w-full">
                                        <tbody>
                                            {specifications.length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="text-center bg-warning/20">No specification details have been added.</td>
                                                </tr>
                                            )}
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
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold mb-2">Maintenance Records</h2>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowMaintenanceModal(true)}
                                    >
                                        <i className="fas fa-plus"></i> Add Maintenance
                                    </button>
                                </div>
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr className="font-bold">
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Cost</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {maintenanceList.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center bg-warning/20">No maintenance records available.</td>
                                            </tr>
                                        )}
                                        {maintenanceList.map((m) => (
                                            <tr key={m.id}>
                                                <td>{new Date(m.maintenance_date!).toLocaleDateString()}</td>
                                                <td>
                                                    {maintenanceTypeOptions.badge(m.maintenance_type as EquipmentMaintenanceType)}
                                                </td>
                                                <td>{m.description || "No description"}</td>
                                                <td>{m.cost ? `$${m.cost.toLocaleString()}` : "Not set"}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleEditMaintenance(m)}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-error"
                                                            onClick={() => {
                                                                if (confirm("Are you sure you want to delete this maintenance record?")) {
                                                                    setMaintenanceList(maintenanceList.filter((item) => item.id !== m.id));
                                                                }
                                                            }}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {showMaintenanceModal && (
                                    <MaintenanceModal
                                        onClose={closeMaintenanceModal}
                                        onSave={handleAddMaintenance}
                                        maintenance={selectedMaintenance}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === "usage" && (
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold">Usage Records</h2>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowUsageModal(true)}
                                    >
                                        <i className="fas fa-plus"></i> Add Usage
                                    </button>
                                </div>
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr className="font-bold">
                                            <th>Project</th>
                                            <th>Crew</th>
                                            <th>Start Time</th>
                                            <th>End Time</th>
                                            <th>Hours</th>
                                            <th>Fuel</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usageList.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center bg-warning/20">No usage records available.</td>
                                            </tr>
                                        )}
                                        {usageList.map((u) => (
                                            <tr key={u.id}>
                                                <td>{u.project_name}</td>
                                                <td>{u.crew_name}</td>
                                                <td>{u.start_date ? new Date(u.start_date).toLocaleDateString() : "Not set"}</td>
                                                <td>{u.end_date ? new Date(u.end_date).toLocaleDateString() : "In progress"}</td>
                                                <td>{u.hours_used || "Not set"}</td>
                                                <td>{u.fuel_consumed || "Not set"}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleEditUsage(u)}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-error"
                                                            onClick={() => {
                                                                if (confirm("Are you sure you want to delete this usage record?")) {
                                                                    setUsageList(usageList.filter((item) => item.id !== u.id));
                                                                }
                                                            }}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {showUsageModal && (
                                    <UsageModal
                                        onClose={closeUsageModal}
                                        onSave={handleAddUsage}
                                        usage={selectedUsage}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === "assignments" && (
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold">Assignments</h2>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowAssignmentModal(true)}
                                    >
                                        <i className="fas fa-plus"></i> Add Assignment
                                    </button>
                                </div>
                                <table className="table table-zebra table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Crew</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignmentList.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center bg-warning/20">No assignment records available.</td>
                                            </tr>
                                        )}
                                        {assignmentList.map((a) => (
                                            <tr key={a.id}>
                                                <td>{a.project_name}</td>
                                                <td>{a.start_date}</td>
                                                <td>{a.end_date}</td>
                                                <td>{a.crew_name}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleEditAssignment(a)}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-error"
                                                            onClick={() => {
                                                                if (confirm("Are you sure you want to delete this assignment record?")) {
                                                                    setAssignmentList(assignmentList.filter((item) => item.id !== a.id));
                                                                }
                                                            }}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {showAssignmentModal && (
                                    <AssignmentModal
                                        assignment={selectedAssignment}
                                        onClose={closeAssignmentModal}
                                        onSave={handleAddAssignment}
                                        onDelete={handleDeleteAssignment}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === "cost" && (
                            <div className="card-body">
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
                                    {/* <ul> TODO: Implement cost breakdown
                                        <li>Maintenance Costs: {maintenances.reduce((acc, m) => acc + (m.cost || 0), 0) ? `$${maintenances.reduce((acc, m) => acc + (m.cost || 0), 0).toLocaleString()}` : "Not set"}</li>
                                        <li>Usage Costs: {usages.reduce((acc, u: EquipmentUsage) => acc + (u.cost || 0), 0) ? `$${usages.reduce((acc, u) => acc + (u.cost || 0), 0).toLocaleString()}` : "Not set"}</li>
                                        <li>Total Cost: {equipment.purchase_price && equipment.current_value
                                            ? `$${(equipment.purchase_price - equipment.current_value + maintenances.reduce((acc, m) => acc + (m.cost || 0), 0) + usages.reduce((acc, u) => acc + (u.cost || 0), 0)).toLocaleString()}`
                                            : "Not set"}</li>
                                    </ul> */}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
