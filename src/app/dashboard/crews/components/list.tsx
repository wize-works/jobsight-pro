"use client";

import { useState } from "react";
import Link from "next/link";
import { Crew, CrewInsert, CrewWithDetails, CrewWithStats } from "@/types/crews";
import { createCrew } from "@/app/actions/crews";
import { toast } from "@/hooks/use-toast";
import { CrewCard } from "./card";

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
    const [crews, setCrews] = useState<CrewWithDetails[]>(initialCrews || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddCrewModal, setShowAddCrewModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("crewsViewType") === "list" ? "list" : "grid"
    );
    const [newCrew, setNewCrew] = useState<{
        name: string;
        notes?: string;
        specialty?: string;
        status?: string;
    }>({
        name: "",
        notes: "",
        specialty: "",
        status: "active",
    });

    const filteredCrews = crews.filter((crew) => {
        const matchesSearchTerm = crew.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || crew.status === statusFilter;
        return matchesSearchTerm && matchesStatus;
    });

    const handleAddCrew = async () => {

        setIsSubmitting(true);

        try {
            const created = await createCrew(newCrew as CrewInsert);
            if (created) {
                setCrews(prev => [...prev, created as CrewWithDetails]);
            }

            setNewCrew({
                name: "",
                notes: "",
                specialty: "",
                status: "active",
            });
            toast.success("Crew created successfully!");
            setShowAddCrewModal(false);
        }
        catch (error) {
            toast.error("Error creating crew. Please try again.");
            console.error("Error creating crew:", error);
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
                    <i className="fas fa-plus mr-2"></i> Add Crew
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
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="fas fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="fas fa-table-rows"></i> </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewType === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCrews.map((crew) => (
                        <div key={crew.id}>
                            <CrewCard
                                crew={crew}
                                onEdit={() => { }}
                                onDelete={() => { }}
                                onView={() => { }}
                                onAdd={() => { }}
                                onRemove={() => { }}
                                onStatusChange={() => { }} />
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
                                                <i className="fas fa-project-diagram ml-2"></i> {crew.current_project}
                                            </Link>
                                        ) : (
                                            <span className="text-base-300"><i className="fas fa-project-diagram ml-2"></i> No current project</span>
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
                <dialog id="add_crew_modal" className={`modal ${showAddCrewModal ? 'modal-open' : ''}`}>
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Crew</h3>

                        <form className="space-y-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Crew Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter crew name"
                                    className="input input-bordered w-full"
                                    value={newCrew.name}
                                    onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Status</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={newCrew.status}
                                    onChange={(e) => setNewCrew({ ...newCrew, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="available">Available</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Specialty</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Electrical, Plumbing, etc."
                                    className="input input-bordered w-full"
                                    value={newCrew.specialty || ''}
                                    onChange={(e) => setNewCrew({ ...newCrew, specialty: e.target.value })}
                                />
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Notes</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    placeholder="Additional information about this crew"
                                    value={newCrew.notes || ''}
                                    onChange={(e) => setNewCrew({ ...newCrew, notes: e.target.value })}
                                ></textarea>
                            </div>
                        </form>

                        <div className="modal-action">
                            <button
                                className="btn btn-primary"
                                onClick={handleAddCrew}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <span className="loading loading-spinner"></span> : <><i className="fas fa-plus mr-2"></i> Create Crew</>}
                            </button>
                            <button
                                className="btn"
                                onClick={() => setShowAddCrewModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setShowAddCrewModal(false)}>close</button>
                    </form>
                </dialog>
            )}
        </>
    );
};