"use client";

import { useBusinessData } from "@/hooks/use-business-data";
import { Crew, CrewWithMemberInfo } from "@/types/crews";
import { set } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import ErrorBoundary from "@/components/error-boundary";
import { toast } from "@/hooks/use-toast";

interface CrewsTabProps {
    projectId: string;
    crews: CrewWithMemberInfo[];
    onCrewsUpdated?: (crews: CrewWithMemberInfo[]) => void;
}

export default function CrewsTab({ projectId, crews, onCrewsUpdated }: CrewsTabProps) {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [availableCrews, setAvailableCrews] = useState<CrewWithMemberInfo[]>([]);

    const loadAvailableCrews = async () => {
        try {
            const response = await fetch('/api/crews/available/with-member-info');
            if (!response.ok) {
                throw new Error('Failed to fetch available crews');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error loading available crews:", error);
            return [];
        }
    };

    useEffect(() => {
        async function loadCrews() {
            try {
                setLoading(true);
                const available = await loadAvailableCrews();
                // Filter out crews that are already assigned to this project
                const assignedCrewIds = crews.map(crew => crew.id);
                const filteredAvailable = available.filter((crew: CrewWithMemberInfo) => !assignedCrewIds.includes(crew.id));
                setAvailableCrews(filteredAvailable);

            } catch (error) {
                console.error("Error loading crews:", error);
            } finally {
                setLoading(false);
            }
        }

        loadCrews();
    }, [crews, businessId]);

    const handleRemoveCrew = async (crewId: string, crewName: string) => {
        try {
            // Find the project-crew assignment to delete
            const response = await fetch(`/api/project-crews?projectId=${projectId}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch project crews');
            }

            const projectCrews = await response.json();
            const assignment = projectCrews.data?.find((pc: any) => pc.crew_id === crewId);

            if (!assignment) {
                throw new Error('Assignment not found');
            }

            // Delete the assignment
            const deleteResponse = await fetch(`/api/project-crews/${assignment.id}`, {
                method: 'DELETE',
            });

            if (!deleteResponse.ok) {
                throw new Error('Failed to remove crew');
            }

            toast.success(`${crewName} removed from project successfully!`);

            // Update the local crews list by removing the crew
            if (onCrewsUpdated) {
                const updatedCrews = crews.filter(crew => crew.id !== crewId);
                onCrewsUpdated(updatedCrews);
            }

            // Refresh available crews list
            const available = await loadAvailableCrews();
            setAvailableCrews(available);
        } catch (error) {
            console.error("Error removing crew:", error);
            toast.error("An error occurred while removing the crew");
        }
    };

    const handleAssignCrew = async (crewId: string, crewName: string) => {
        try {
            const response = await fetch('/api/project-crews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    project_id: projectId,
                    crew_id: crewId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to assign crew');
            }

            toast.success(`${crewName} assigned to project successfully!`);

            // Find the assigned crew and add it to the crews list
            const assignedCrew = availableCrews.find(crew => crew.id === crewId);
            if (assignedCrew && onCrewsUpdated) {
                const updatedCrews = [...crews, assignedCrew];
                onCrewsUpdated(updatedCrews);
            }

            // Refresh available crews list to remove the assigned crew
            const available = await loadAvailableCrews();
            setAvailableCrews(available);
        } catch (error) {
            console.error("Error assigning crew:", error);
            toast.error("An error occurred while assigning the crew");
        }
    };


    if (loading) {
        return (
            <div className="">
                {/* Assigned Crews Skeleton */}
                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card bg-base-100 shadow-lg animate-pulse">
                                <div className="card-body">
                                    <div className="flex items-center justify-between space-x-6">
                                        <div className="skeleton h-5 w-32"></div>
                                        <div className="skeleton h-4 w-20"></div>
                                    </div>
                                    <div className="skeleton h-3 w-40 mt-2"></div>
                                    <div className="flex justify-end space-x-6 mt-4">
                                        <div className="skeleton h-8 w-16"></div>
                                        <div className="skeleton h-8 w-20"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="divider my-6 skeleton h-3 w-full"></div>

                {/* Available Crews Skeleton */}
                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card bg-base-100 shadow-lg animate-pulse">
                                <div className="card-body">
                                    <div className="flex items-center justify-between space-x-6">
                                        <div className="skeleton h-5 w-32"></div>
                                        <div className="skeleton h-4 w-20"></div>
                                    </div>
                                    <div className="skeleton h-3 w-40 mt-2"></div>
                                    <div className="flex justify-end space-x-6 mt-4">
                                        <div className="skeleton h-8 w-16"></div>
                                        <div className="skeleton h-8 w-20"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary fallback={(error) => (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Failed to load crews</h3>
                    <div className="text-xs">Crew information is temporarily unavailable.</div>
                </div>
            </div>
        )}>
            <div className="">
                {loading ? (
                    <div className="loading loading-spinner loading-lg"></div>
                ) : crews.length === 0 ? (
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title">No crews assigned yet</h2>
                            <p className="text-base-content/70">Start by creating a new crew to manage your project effectively.</p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {crews.map((crew) => (
                                <div key={crew.id} className="card bg-base-100 shadow-lg flex justify-between">
                                    <div className="card-body">
                                        <div className="flex items-center justify-between space-x-6">
                                            <div className="text-lg font-semibold">{crew.name}</div>
                                            <div className="badge badge-outline">{crew.member_count} members</div>
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            {!crew.leader_name ? "No leader assigned" : `Led by ${crew.leader_name}`}
                                        </div>
                                        <div className="flex justify-end space-x-6">
                                            <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-sm btn-ghost">
                                                <i className="far fa-eye"></i>
                                                View
                                            </Link>                                            <button className="btn btn-sm btn-error" onClick={() => handleRemoveCrew(crew.id, crew.name)}>
                                                <i className="far fa-user-minus"></i>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="divider my-6">Available Crews</div>

                {availableCrews.length > 0 && (
                    <div className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {availableCrews.map((crew) => (
                                <div key={crew.id} className="card bg-base-100 shadow-lg flex justify-between">
                                    <div className="card-body">
                                        <div className="flex items-center justify-between space-x-6">
                                            <div className="text-lg font-semibold">{crew.name}</div>
                                            <div className="badge badge-outline">{crew.member_count} members</div>
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            {!crew.leader_name ? "No leader assigned" : `Led by ${crew.leader_name}`}
                                        </div>
                                        <div className="flex justify-end space-x-6">
                                            <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-sm btn-ghost">
                                                <i className="far fa-eye"></i>
                                                View
                                            </Link>                                            <button className="btn btn-sm btn-success" onClick={() => handleAssignCrew(crew.id, crew.name)}>
                                                <i className="far fa-user-plus"></i>
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>)}
            </div>
        </ErrorBoundary>
    );
};