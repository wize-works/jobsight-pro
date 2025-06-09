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
    assignment?: EquipmentAssignment;
    onClose: () => void;
    onSave: (assignment: EquipmentAssignment) => void;
    onDelete?: (id: string) => void;
}

export const AssignmentModal = ({ assignment, onClose, onSave, onDelete }: AssignmentModalProps) => {
    const router = useRouter();
    const params = useParams();
    const equipmentId = params?.id as string;
    const [crew, setCrew] = useState(assignment?.crew_id || '');
    const [project, setProject] = useState(assignment?.project_id || '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<EquipmentAssignmentStatus>('available');
    const [notes, setNotes] = useState('');
    const [crews, setCrews] = useState<Crew[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

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
                toast.error('Failed to load crews and projects');
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, []);

    // If we have an assignment record, populate the form
    useEffect(() => {
        if (assignment) {
            setCrew(assignment.crew_id || '');
            setProject(assignment.project_id || '');
            setStartDate(assignment.start_date ? new Date(assignment.start_date).toISOString().split('T')[0] : '');
            setNotes(assignment.notes || '');
        }
    }, [assignment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const assignmentData = {
            equipment_id: equipmentId,
            crew_id: crew,
            project_id: project,
            start_date: new Date(startDate).toISOString(),
            notes,
            ...(assignment?.id && { id: assignment.id }) // Include ID if editing
        } as EquipmentAssignment;

        try {
            if (assignment?.id) {
                // Update existing assignment
                await updateEquipmentAssignment(assignment.id, assignmentData as EquipmentAssignmentUpdate);
                toast.success('Equipment assignment updated successfully');
            } else {
                // Create new assignment
                await createEquipmentAssignment(assignmentData as EquipmentAssignmentInsert);
                toast.success('Equipment assigned successfully');
            }
            onSave(assignmentData);
            onClose();
            router.refresh();
        } catch (error) {
            toast.error(assignment?.id ? 'Failed to update assignment' : 'Failed to assign equipment');
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
            toast.success('Assignment deleted successfully');
            onDelete?.(assignment.id);
            onClose();
            router.refresh();
        } catch (error) {
            toast.error('Failed to delete assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <dialog id="assignment-modal" className="modal modal-open">
            <form method="dialog" className="modal-box space-y-4" onSubmit={handleSubmit}>
                <h3 className="font-bold text-lg">{assignment ? 'Edit' : 'Add'} Equipment Assignment</h3>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Crew</span>
                    </label>
                    {loadingData ? (
                        <select className="select select-bordered select-secondary w-full" disabled>
                            <option>Loading crews...</option>
                        </select>
                    ) : (
                        <select
                            className="select select-bordered select-secondary w-full"
                            value={crew}
                            onChange={(e) => setCrew(e.target.value)}
                            required
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
                        <span className="label-text">Project</span>
                    </label>
                    {loadingData ? (
                        <select className="select select-bordered select-secondary w-full" disabled>
                            <option>Loading projects...</option>
                        </select>
                    ) : (
                        <select
                            className="select select-bordered select-secondary w-full"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                            required
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
                <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Start Date</span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered input-secondary w-full"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">End Date</span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered input-secondary w-full"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Notes</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered textarea-secondary w-full"
                        value={notes}
                        placeholder="Enter any additional notes"
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </div>
                <div className='form-control'>
                    <label className='label'>
                        <span className='label-text'>Status</span>
                    </label>
                    {assignmentStatusOptions.select(
                        status,
                        (value) => {
                            if (assignment) {
                                assignment.status = value;
                            }
                        },
                        "select select-bordered select-secondary w-full"
                    )}
                </div>
                <div className="modal-action">
                    {assignment?.id && (
                        <button
                            type="button"
                            className="btn btn-error"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ?
                                <span className="loading loading-spinner loading-sm"></span> :
                                'Delete'
                            }
                        </button>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || loadingData}
                    >
                        {loading ?
                            <span className="loading loading-spinner loading-sm"></span> :
                            assignment ? 'Update' : 'Assign'
                        }
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </dialog>
    );
};