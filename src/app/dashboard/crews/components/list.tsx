"use client";

import { useState } from "react";
import Link from "next/link";
import { Crew, CrewInsert, CrewWithDetails, CrewWithStats } from "@/types/crews";
import { createCrew } from "@/app/actions/crews";
import { toast } from "@/hooks/use-toast";
import { CrewCard } from "./card";
import { useBusiness } from "@/lib/business-context";
import ModalEdit from "./modal-edit";

const statusOptions: {
    [key: string]: { label: string; value: string };
} = {
    all: { label: "All", value: "all" },
    active: { label: "Active", value: "active" },
    available: { label: "Available", value: "available" },
};

interface CrewListProps {
    initialCrews: CrewWithDetails[];
};

export default function CrewsList({ initialCrews }: CrewListProps) {
    const { businessId } = useBusiness();
    const [crews, setCrews] = useState<CrewWithDetails[]>(initialCrews || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); const [showAddCrewModal, setShowAddCrewModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("crewsViewType") === "list" ? "list" : "grid"
    );

    // Create an empty crew object for adding new crews
    const emptyCrewForAdd = {
        id: "",
        business_id: businessId,
        name: "",
        specialty: "",
        status: "active",
        notes: "",
        leader_id: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_by: null,
        updated_at: new Date().toISOString(),
    } as Crew;

    const filteredCrews = crews.filter((crew) => {
        const matchesSearchTerm = crew.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || crew.status === statusFilter;
        return matchesSearchTerm && matchesStatus;
    });

    const handleAddCrew = async (formData: any) => {
        setIsSubmitting(true);

        try {
            const crewData = {
                name: formData.name,
                specialty: formData.specialty || null,
                status: formData.status,
                notes: formData.notes || null,
                leader_id: formData.leader_id || null,
            } as CrewInsert;

            const created = await createCrew(businessId, crewData);
            if (created) {
                setCrews(prev => [...prev, created as CrewWithDetails]);
            }

            toast.success("Crew created successfully!");
            setShowAddCrewModal(false);
            return { success: true };
        }
        catch (error) {
            toast.error("Error creating crew. Please try again.");
            console.error("Error creating crew:", error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("crewsViewType", type);
        }
    };

    return (
        <>
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Crew Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddCrewModal(true)}>
                    <i className="far fa-plus mr-2"></i> Add Crew
                </button>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <label className="input input-bordered input-secondary flex items-center gap-2">
                                <i className="far fa-search"></i>
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
                        <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="far fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="far fa-table-rows"></i> </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewType === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCrews.map((crew) => (
                        <div key={crew.id}>
                            <CrewCard crew={crew} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto card bg-base-100 shadow-sm mb-6">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Leader</th>
                                <th>Members</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCrews.map((crew) => (
                                <tr key={crew.id}>
                                    <td className="flex flex-col">
                                        {crew.name}
                                        {crew.current_project_id ? (
                                            <Link href={`/dashboard/projects/${crew.current_project_id}`} className="text-primary">
                                                <i className="far fa-screwdriver-wrench ml-2"></i> {crew.current_project}
                                            </Link>
                                        ) : (
                                            <span className="text-base-300"><i className="far fa-screwdriver-wrench ml-2"></i> No current project</span>
                                        )}
                                    </td>
                                    <td><span className={`${crew.leader_id ? "text-primary" : "text-base-300"}`}>{crew.leader}</span></td>
                                    <td>{crew.member_count}</td>
                                    <td><span className={`badge ${crew.status === "active" ? "badge-primary" : "badge-neutral"}`}>{crew.status}</span></td>
                                    <td>
                                        <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-sm btn-outline">
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showAddCrewModal && (
                <ModalEdit
                    title="Add New Crew"
                    loading={isSubmitting}
                    onClose={() => setShowAddCrewModal(false)}
                    onSubmit={handleAddCrew}
                />
            )}
        </>
    );
};