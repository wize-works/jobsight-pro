"use client";

import { useState } from "react";
import Link from "next/link";
import { searchEquipments } from "@/app/actions/equipments";
import type { Equipment } from "@/types/equipment";
import { EquipmentCard } from "./card";

const statusOptions = {
    in_use: { label: "In Use", color: "badge-primary" },
    available: { label: "Available", color: "badge-success" },
    maintenance: { label: "Maintenance", color: "badge-warning" },
    repair: { label: "Under Repair", color: "badge-error" },
    retired: { label: "Retired", color: "badge-neutral" },
};

export default function EquipmentList({ initialEquipments }: { initialEquipments: Equipment[] }) {
    const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewType, setViewType] = useState<"grid" | "table">(
        typeof window !== "undefined" && localStorage.getItem("equipmentViewType") === "table" ? "table" : "grid"
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

    const updateViewType = (type: "grid" | "table") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("equipmentViewType", type);
        }
    };

    // Helper to safely get status option
    const getStatusOption = (status: string | null | undefined) => {
        if (!status) return undefined;
        if (Object.prototype.hasOwnProperty.call(statusOptions, status)) {
            return statusOptions[status as keyof typeof statusOptions];
        }
        return undefined;
    };

    return (
        <div>
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Equipment Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddEquipmentModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add Equipment
                </button>
            </div>
            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="input input-bordered input-secondary flex items-center gap-2">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    className="grow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </label>
                        </div>
                        <select
                            className="select select-bordered select-secondary"
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
                            className="select select-bordered select-secondary"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(statusOptions).map(([value, { label }]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <div className="tabs tabs-boxed tabs-sm">
                            <button className={`tab tab-secondary ${viewType === "grid" ? "tab-active" : ""}`} onClick={() => updateViewType("grid")}> <i className="fas fa-grid-2"></i> </button>
                            <button className={`tab ${viewType === "table" ? "tab-active" : ""}`} onClick={() => updateViewType("table")}> <i className="fas fa-th-list"></i> </button>
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
                                    <td><span className={`badge ${getStatusOption(item.status)?.color || "badge-neutral"}`}>{getStatusOption(item.status)?.label || item.status || "-"}</span></td>
                                    {/* Assignment info is not available directly on Equipment. Show '-' or 'Unassigned'. */}
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
