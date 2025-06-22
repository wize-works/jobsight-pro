"use client";

import { useState } from "react";
import Link from "next/link";
import { searchEquipments } from "@/app/actions/equipments";
import { getEquipmentSpecificationsByEquipmentId } from "@/app/actions/equipment-specifications";
import type { Equipment, EquipmentStatus, EquipmentType, EquipmentWithDetails } from "@/types/equipment";
import type { EquipmentSpecification } from "@/types/equipment-specifications";
import { equipmentStatusOptions, equipmentTypeOptions } from "@/types/equipment";
import { EquipmentCard } from "./card";
import EquipmentNewModal from "./modal-new";
import EquipmentEditModal from "./modal-edit";
import { useBusiness } from "@/lib/business-context";

export default function EquipmentList({ initialEquipments }: { initialEquipments: Equipment[] }) {
    const { businessId } = useBusiness();
    const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("equipmentViewType") === "list" ? "list" : "grid"
    );
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithDetails | null>(null);
    const [selectedSpecifications, setSelectedSpecifications] = useState<EquipmentSpecification[]>([]);

    // Filter logic
    const filteredEquipments = equipments.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Unique types for filter dropdown    // Unique types for filter dropdown
    const equipmentTypes = ["all", ...Array.from(new Set(equipments.map((item) => item.type).filter(Boolean)))];

    // Search handler
    const handleSearch = async () => {
        if (searchTerm.trim() === "") return;
        const results = await searchEquipments(businessId, searchTerm);
        setEquipments(results);
    };

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("equipmentViewType", type);
        }
    };

    const handleEditEquipment = async (equipment: Equipment) => {
        try {
            const specifications = await getEquipmentSpecificationsByEquipmentId(businessId, equipment.id);
            setSelectedEquipment(equipment as EquipmentWithDetails);
            setSelectedSpecifications(specifications);
            setShowEditEquipmentModal(true);
        } catch (error) {
            console.error("Error fetching equipment specifications:", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Equipment Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddEquipmentModal(true)}>
                    <i className="far fa-plus mr-2"></i> Add Equipment
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Total Equipments</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-primary">{equipments.length}</div>
                        <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-tools fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All equipment items</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Active Equipments</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-success">
                            {equipments.filter((item) => item.status === "in_use").length}
                        </div>
                        <div className="stat-icon text-success bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-check-circle fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Currently in use</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Available Equipments</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-warning">
                            {equipments.filter((item) => item.status === "available").length}
                        </div>
                        <div className="stat-icon text-warning bg-warning/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-exclamation-triangle fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Not currently in use</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Maintenance Due</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-error">
                            {equipments.filter((item) => item.next_maintenance && new Date(item.next_maintenance) <= new Date()).length}
                        </div>
                        <div className="stat-icon text-error bg-error/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-tools fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Equipment due for maintenance</div>
                </div>

            </div>
            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full">
                            <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                                <i className="far fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search equipment..."
                                    className="grow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </label>
                        </div>
                        {equipmentTypeOptions.select(
                            typeFilter as EquipmentType,
                            (value) => setTypeFilter(value),
                            "select-secondary w-full"
                        )}
                        {equipmentStatusOptions.select(
                            statusFilter as EquipmentStatus,
                            (value) => setStatusFilter(value),
                            "select-secondary w-full"
                        )}
                        <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="far fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="far fa-table-rows"></i> </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewType === "grid" ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipments.map((item) => (
                    <EquipmentCard
                        key={item.id}
                        equipment={item}
                        onEdit={handleEditEquipment}
                    />
                ))}
            </div>
            ) : (
                <div className="overflow-x-auto card bg-base-100 shadow-sm mb-6">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Location</th>
                                <th>Next Maintenance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipments.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>{item.type || "-"}</td>
                                    <td>{equipmentStatusOptions.badge(item.status as EquipmentStatus)}</td>
                                    <td>-</td>
                                    <td>{item.location || "-"}</td>
                                    <td>{item.next_maintenance ? new Date(item.next_maintenance).toLocaleDateString() : "-"}</td>
                                    <td>
                                        <Link href={`/dashboard/equipment/${item.id}`} className="btn btn-sm btn-outline">
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredEquipments.length === 0 && (
                <div className="card bg-base-100 shadow-sm mb-6">
                    <div className="card-body text-center">
                        <i className="far fa-excavator text-3xl text-base-content/30 mb-2"></i>
                        <h3 className="text-lg font-semibold">No equipment found</h3>
                        <p className="text-base-content/70">Try adjusting your search or filters</p>
                        <div className="flex m-auto justify-center mt-4">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddEquipmentModal(true)}
                            >
                                <i className="far fa-plus mr-2"></i> Add Your First Equipment
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showAddEquipmentModal && (
                <EquipmentNewModal isOpen={showAddEquipmentModal} onClose={() => setShowAddEquipmentModal(false)} onSave={function (equipment: any): void {
                    setEquipments([...equipments, equipment]);
                }} />
            )}
            {showEditEquipmentModal && selectedEquipment && (
                <EquipmentEditModal
                    isOpen={showEditEquipmentModal}
                    onClose={() => setShowEditEquipmentModal(false)}
                    equipment={selectedEquipment}
                    specifications={selectedSpecifications}
                    onSave={function (updatedEquipment: EquipmentWithDetails): void {
                        setEquipments(equipments.map((item) => item.id === updatedEquipment.id ? updatedEquipment : item));
                    }}
                />
            )}
        </div>
    );
}
