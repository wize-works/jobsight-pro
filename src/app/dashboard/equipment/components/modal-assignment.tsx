import {
    assignmentStatusOptions,
    EquipmentAssignment,
    EquipmentAssignmentStatus,
    type EquipmentAssignmentInsert,
    type EquipmentAssignmentUpdate,
} from '@/types/equipment-assignments';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createEquipmentAssignment, updateEquipmentAssignment, deleteEquipmentAssignment } from '@/app/actions/equipment-assignments';
import { getCrews } from '@/app/actions/crews';
import { getProjects } from '@/app/actions/projects';
import { toast } from '@/hooks/use-toast';
import type { Crew } from '@/types/crews';
import type { Project } from '@/types/projects';

type AssignmentModalProps = {
    isOpen: boolean;
    assignment?: EquipmentAssignment;
    onClose: () => void;
    onSave: (assignment: EquipmentAssignment) => void;
    onDelete?: (id: string) => void;
}

export const AssignmentModal = ({ isOpen, assignment, onClose, onSave, onDelete }: AssignmentModalProps) => {
    const router = useRouter();
    const params = useParams();
    const equipmentId = params?.id as string;
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        crew_id: '',
        project_id: '',
        start_date: '',
        end_date: '',
        status: 'available' as EquipmentAssignmentStatus,
        notes: ''
    });

    const [crews, setCrews] = useState<Crew[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Load crews and projects
    useEffect(() => {
        const loadData = async () => {
            try {
                const [crewData, projectData] = await Promise.all([
                    getCrews(),
                    getProjects()
                ]);
                setCrews(crewData);
                setProjects(projectData);
            } catch (error) {
                toast.error({
                    title: "Error",
                    description: "Failed to load crews and projects"
                });
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, []);    // If we have an assignment record, populate the form
    useEffect(() => {
        if (assignment) {
            setFormData({
                crew_id: assignment.crew_id || '',
                project_id: assignment.project_id || '',
                start_date: assignment.start_date ? new Date(assignment.start_date).toISOString().split('T')[0] : '',
                end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : '',
                status: (assignment.status as EquipmentAssignmentStatus) || 'available',
                notes: assignment.notes || ''
            });
        } else {
            // Reset form for new assignment
            setFormData({
                crew_id: '',
                project_id: '',
                start_date: '',
                end_date: '',
                status: 'available',
                notes: ''
            });
        }
    }, [assignment]); const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'status' ? value as EquipmentAssignmentStatus : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const assignmentData = {
                equipment_id: equipmentId,
                crew_id: formData.crew_id,
                project_id: formData.project_id,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
                status: formData.status,
                notes: formData.notes || null,
                ...(assignment?.id && { id: assignment.id })
            } as EquipmentAssignment;

            if (assignment?.id) {
                await updateEquipmentAssignment(assignment.id, assignmentData as EquipmentAssignmentUpdate);
                toast.success({
                    title: "Success",
                    description: "Equipment assignment updated successfully"
                });
            } else {
                await createEquipmentAssignment(assignmentData as EquipmentAssignmentInsert);
                toast.success({
                    title: "Success",
                    description: "Equipment assigned successfully"
                });
            }
            onSave(assignmentData);
            onClose();
            router.refresh();
        } catch (error) {
            console.error("Error saving assignment:", error);
            toast.error({
                title: "Error",
                description: assignment?.id ? "Failed to update assignment" : "Failed to assign equipment"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!assignment?.id || !confirm('Are you sure you want to delete this assignment?')) {
            return;
        }

        setLoading(true);
        try {
            await deleteEquipmentAssignment(assignment.id);
            toast.success({
                title: "Success",
                description: "Assignment deleted successfully"
            });
            onDelete?.(assignment.id);
            onClose();
            router.refresh();
        } catch (error) {
            console.error("Error deleting assignment:", error);
            toast.error({
                title: "Error",
                description: "Failed to delete assignment"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {assignment ? 'Edit Equipment Assignment' : 'Add Equipment Assignment'}
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-info-circle text-primary"></i>
                                    Assignment Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Crew *</span>
                                        </label>
                                        {loadingData ? (
                                            <select className="select select-bordered select-secondary" disabled>
                                                <option>Loading crews...</option>
                                            </select>
                                        ) : (
                                            <select
                                                name="crew_id"
                                                className="select select-bordered select-secondary"
                                                value={formData.crew_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Select a crew</option>
                                                {crews.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project *</span>
                                        </label>
                                        {loadingData ? (
                                            <select className="select select-bordered select-secondary" disabled>
                                                <option>Loading projects...</option>
                                            </select>
                                        ) : (
                                            <select
                                                name="project_id"
                                                className="select select-bordered select-secondary"
                                                value={formData.project_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Select a project</option>
                                                {projects.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Start Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className="input input-bordered input-secondary"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            className="input input-bordered input-secondary"
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status</span>
                                        </label>
                                        <select
                                            name="status"
                                            className="select select-bordered select-secondary"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(assignmentStatusOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-sticky-note text-primary"></i>
                                    Additional Notes
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Notes</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        className="textarea textarea-bordered textarea-secondary"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Enter any additional notes about this assignment"
                                        rows={4}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    <div className="flex justify-between">
                        <div>
                            {assignment?.id && (
                                <button
                                    type="button"
                                    className="btn btn-error gap-2"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-trash"></i>
                                            Delete Assignment
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary gap-2"
                                onClick={handleSubmit}
                                disabled={loading || loadingData || !formData.crew_id || !formData.project_id || !formData.start_date}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        {assignment ? 'Updating...' : 'Assigning...'}
                                    </>
                                ) : (
                                    <>
                                        <i className={assignment ? "fas fa-save" : "fas fa-plus"}></i>
                                        {assignment ? 'Update Assignment' : 'Create Assignment'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};