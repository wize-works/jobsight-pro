"use client";

import React, { useState, useEffect } from "react";
import { CrewWithMemberInfo } from "@/types/crews";
import { assignCrewToProject } from "@/lib/actions/project-crews-client";
import { getCrewsWithDetails } from "@/lib/actions/crews-client";
import { toast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";

interface CrewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onCrewAssigned: (crew: CrewWithMemberInfo) => void;
    assignedCrewIds?: string[];
}

export default function CrewModal({
    isOpen,
    onClose,
    projectId,
    onCrewAssigned,
    assignedCrewIds = []
}: CrewModalProps) {
    const { businessId } = useBusiness();
    const [availableCrews, setAvailableCrews] = useState<CrewWithMemberInfo[]>([]);
    const [selectedCrewId, setSelectedCrewId] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingCrews, setFetchingCrews] = useState(true);

    // Fetch available crews when modal opens
    useEffect(() => {
        if (isOpen) {
            loadAvailableCrews();
        }
    }, [isOpen, businessId]);

    const loadAvailableCrews = async () => {
        try {
            setFetchingCrews(true);
            const crews = await getCrewsWithDetails(businessId);
            // Filter out crews that are already assigned to this project
            const filteredCrews = crews.filter(crew => !assignedCrewIds.includes(crew.id));
            setAvailableCrews(filteredCrews);
        } catch (error) {
            console.error("Error loading available crews:", error);
            toast.error("Failed to load available crews");
        } finally {
            setFetchingCrews(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCrewId) {
            toast.error("Please select a crew to assign");
            return;
        }

        try {
            setLoading(true);

            const result = await assignCrewToProject(
                selectedCrewId,
                projectId,
                new Date().toISOString(), // start_date
                null, // end_date
                null, // notes
                businessId
            );
            if (result.data && !result.error) {
                // Find the assigned crew from the available crews list
                const assignedCrew = availableCrews.find(crew => crew.id === selectedCrewId);
                if (assignedCrew) {
                    onCrewAssigned(assignedCrew);
                }
                toast.success("Crew assigned successfully!");
                handleClose();
            } else {
                toast.error("Failed to assign crew to project");
            }
        } catch (error) {
            console.error("Error assigning crew:", error);
            toast.error("An error occurred while assigning the crew");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedCrewId("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Assign Crew to Project</h3>

                <form onSubmit={handleSubmit}>
                    <div className="form-control w-full mb-4">
                        <label className="label">
                            <span className="label-text">Select Crew</span>
                        </label>

                        {fetchingCrews ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="loading loading-spinner loading-md"></span>
                                <span className="ml-2">Loading crews...</span>
                            </div>
                        ) : availableCrews.length === 0 ? (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                <span>No crews available to assign. All crews may already be assigned to this project.</span>
                            </div>
                        ) : (
                            <select
                                className="select select-bordered w-full"
                                value={selectedCrewId}
                                onChange={(e) => setSelectedCrewId(e.target.value)}
                                required
                            >
                                <option value="">Choose a crew...</option>
                                {availableCrews.map((crew) => (
                                    <option key={crew.id} value={crew.id}>
                                        {crew.name} ({crew.member_count} members)
                                        {crew.leader_name && ` - Led by ${crew.leader_name}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedCrewId && (
                        <div className="alert alert-info mb-4">
                            <i className="fas fa-info-circle"></i>
                            <div>
                                <h4 className="font-semibold">Selected Crew Details</h4>
                                {(() => {
                                    const selectedCrew = availableCrews.find(crew => crew.id === selectedCrewId);
                                    if (selectedCrew) {
                                        return (
                                            <div className="text-sm">
                                                <p><strong>Name:</strong> {selectedCrew.name}</p>
                                                <p><strong>Members:</strong> {selectedCrew.member_count}</p>
                                                {selectedCrew.leader_name && (
                                                    <p><strong>Leader:</strong> {selectedCrew.leader_name}</p>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !selectedCrewId || fetchingCrews}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <i className="far fa-user-plus mr-2"></i>
                                    Assign Crew
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
