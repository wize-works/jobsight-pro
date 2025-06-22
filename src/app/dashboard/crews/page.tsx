"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Crew, CrewInsert, CrewStatus, CrewWithDetails, CrewWithStats } from "@/types/crews";
import { createCrew, getCrewsWithDetails } from "@/app/actions/crews";
import { toast } from "@/hooks/use-toast";
import { CrewCard } from "./components/card";
import { crewStatusOptions, crewTypeOptions } from "@/types/crews";
import CrewsListLoading from "./loading";
import { useBusiness } from "@/lib/business-context";
import ErrorBoundary from "@/components/error-boundary";
import ModalLoading from "@/components/modal-loading";

// Lazy load modal component for better performance
const ModalEdit = dynamic(() => import("./components/modal-edit"), {
    loading: () => <ModalLoading message="Loading crew form..." />,
    ssr: false
});

export default function CrewsList() {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [crews, setCrews] = useState<CrewWithDetails[]>([]);
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
        specialty: "",
        status: "active",
        notes: "",
    });

    useEffect(() => {
        const fetchCrews = async () => {
            try {
                const data = await getCrewsWithDetails(businessId);
                setCrews(data);
            } catch (error) {
                console.error("Error fetching crews:", error);
                toast.error("Failed to load crews. Please try again later.");
            }
            setLoading(false);
        };
        if (businessId) {
            fetchCrews();
        }
    }, [businessId]);

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
    }; if (loading) {
        return (
            <CrewsListLoading viewType={viewType} />
        );
    }

    return (
        <>
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Crew Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddCrewModal(true)}>
                    <i className="far fa-plus mr-2"></i> Add Crew
                </button>
            </div>            <ErrorBoundary fallback={() => (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="alert alert-error">
                        <i className="far fa-exclamation-triangle"></i>
                        <span>Failed to load crew statistics</span>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Total Crews</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-primary">{crews.length}</div>
                            <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-users fa-lg text-primary"></i>
                            </div>
                        </div>
                        <div className="stat-desc">All crews in the system</div>
                    </div>

                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Total Members</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-secondary">{crews.reduce((total, crew) => total + crew.member_count, 0)}</div>
                            <div className="stat-icon text-secondary bg-secondary/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-users fa-lg text-secondary"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Total crew members across all crews</div>
                    </div>

                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Active Crews</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-accent">{crews.filter(crew => crew.status === "active").length}</div>
                            <div className="stat-icon text-accent bg-accent/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-users fa-lg text-accent"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Currently working</div>
                    </div>
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Available Crews</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-success">{crews.filter(crew => crew.status === "available").length}</div>
                            <div className="stat-icon text-success bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-users fa-lg text-success"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Ready for new projects</div>
                    </div>
                </div>
            </ErrorBoundary>

            <ErrorBoundary fallback={() => (
                <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                    <div className="card-body p-2">
                        <div className="alert alert-error">
                            <i className="far fa-exclamation-triangle"></i>
                            <span>Failed to load search and filters</span>
                        </div>
                    </div>
                </div>
            )}>
                <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                    <div className="card-body p-2">
                        <div className="flex flex-col md:flex-row gap-6">
                            <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                                <i className="far fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    className="grow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </label>
                            {crewStatusOptions.select(
                                statusFilter as CrewStatus | null | undefined,
                                (value) => setStatusFilter(value as CrewStatus | "all"),
                                "select-bordered select-secondary w-full"
                            )}
                            <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                                <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="far fa-grid-2"></i> </button>
                                <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="far fa-table-rows"></i> </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>

            <ErrorBoundary fallback={() => (
                <div className="card bg-base-100 shadow-sm mb-6">
                    <div className="card-body text-center">
                        <i className="far fa-exclamation-triangle text-3xl text-error mb-2"></i>
                        <h3 className="text-lg font-semibold">Failed to load crews</h3>
                        <p className="text-base-content/70">There was an error loading the crew list</p>
                        <button
                            className="btn btn-primary mt-4"
                            onClick={() => window.location.reload()}
                        >
                            <i className="far fa-refresh mr-2"></i> Try Again
                        </button>
                    </div>
                </div>
            )}>
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
                                                <span className="text-base-content/40"><i className="far fa-screwdriver-wrench ml-2"></i> No current project</span>
                                            )}
                                        </td>
                                        <td><span className={`${crew.leader_id ? "text-primary" : "text-base-content/40"}`}>{crew.leader}</span></td>
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

                {crews.length === 0 && (
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body text-center">
                            <i className="far fa-users text-3xl text-base-content/30 mb-2"></i>
                            <h3 className="text-lg font-semibold">No crews found</h3>
                            <p className="text-base-content/70">Try adjusting your search or filters</p>
                            <div className="flex m-auto justify-center mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAddCrewModal(true)}
                                >
                                    <i className="far fa-plus mr-2"></i> Add Your First Crew
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </ErrorBoundary>


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