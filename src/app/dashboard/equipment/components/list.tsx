"use client";

import { useState } from "react";
import Link from "next/link";
import { searchEquipments } from "@/app/actions/equipments";
import type { Equipment, EquipmentStatus } from "@/types/equipment";
import { equipmentStatusOptions } from "@/types/equipment";
import { EquipmentCard } from "./card";

export default function EquipmentList({ initialEquipments }: { initialEquipments: Equipment[] }) {
    const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("equipmentViewType") === "list" ? "list" : "grid"
    );
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);

    // Filter logic
    const filteredEquipments = equipments.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Unique types for filter dropdown
    const equipmentTypes = ["all", ...Array.from(new Set(equipments.map((item) => item.type).filter(Boolean)))];

    // Search handler
    const handleSearch = async () => {
        if (searchTerm.trim() === "") return;
        const results = await searchEquipments(searchTerm);
        setEquipments(results);
    };

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("equipmentViewType", type);
        }
    };

    return (
        <div>
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Equipment Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddEquipmentModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add Equipment
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Total Equipments</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-primary">{equipments.length}</div>
                        <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-tools fa-lg"></i>
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
                            <i className="fas fa-check-circle fa-lg"></i>
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
                            <i className="fas fa-exclamation-triangle fa-lg"></i>
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
                            <i className="fas fa-tools fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Equipment due for maintenance</div>
                </div>

            </div>
            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full">
                            <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search equipment..."
                                    className="grow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </label>
                        </div>
                        <select
                            className="select select-bordered select-secondary w-full"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {equipmentTypes.filter((type) => type !== "all").map((type) => (
                                <option key={type || "unknown"} value={type || "unknown"}>
                                    {type || "Unknown"}
                                </option>
                            ))}
                        </select>
                        <select
                            className="select select-bordered select-secondary w-full"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(equipmentStatusOptions).map(([key, { label }]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="fas fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="fas fa-table-rows"></i> </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewType === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEquipments.map((item) => (
                        <div key={item.id}>
                            <EquipmentCard {...item} />
                        </div>
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
                <div className="text-center py-12">
                    <i className="fas fa-search text-4xl text-base-content/30 mb-4"></i>
                    <h3 className="text-xl font-semibold mb-2">No equipment found</h3>
                    <p className="text-base-content/70">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
