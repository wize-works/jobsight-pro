import { EquipmentUsage } from '@/types/equipment_usage';
import { Project } from '@/types/projects';
import { CrewWithDetails } from '@/types/crews';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createEquipmentUsage, updateEquipmentUsage } from '@/app/actions/equipment_usage';
import { getProjects } from '@/app/actions/projects';
import { getCrewsWithDetails } from '@/app/actions/crews';
import { toast } from '@/hooks/use-toast';
import { set } from 'date-fns';

interface UsageModalProps {
    usage?: EquipmentUsage;
    onClose: () => void;
    onSave: (usage: EquipmentUsage) => void | Promise<void>;
}

export const UsageModal = ({ usage, onClose, onSave }: UsageModalProps) => {
    const router = useRouter();
    const params = useParams();
    const equipmentId = params?.id as string;
    const [loading, setLoading] = useState(true);

    // Form state
    const [projectId, setProjectId] = useState<string | null>(null);
    const [crewId, setCrewId] = useState<string | null>(null);
    const [startDate, setstartDate] = useState('');
    const [endDate, setendDate] = useState('');
    const [hoursUsed, setHoursUsed] = useState(0.0);
    const [fuelConsumed, setFuelConsumed] = useState(0.0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data lists
    const [projects, setProjects] = useState<Project[]>([]);
    const [crews, setCrews] = useState<CrewWithDetails[]>([]);

    // Load data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, crewsData] = await Promise.all([
                    getProjects(),
                    getCrewsWithDetails()
                ]);
                setProjects(projectsData);
                setCrews(crewsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Error loading project and crew data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Load existing usage data if editing
    useEffect(() => {
        if (usage) {
            setProjectId(usage.project_id);
            setCrewId(usage.crew_id);
            setstartDate(usage.start_date || '');
            setendDate(usage.end_date || '');
            setHoursUsed(usage.hours_used || 0.0);
            setFuelConsumed(usage.fuel_consumed || 0.0);
        }
    }, [usage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setLoading(true);

        try {
            const data = {
                equipment_id: equipmentId,
                project_id: projectId,
                crew_id: crewId,
                start_date: startDate || null,
                end_date: endDate || null,
                hours_used: hoursUsed || 0,
                fuel_consumed: fuelConsumed || 0,
            };
            if (usage?.id) {
                // Update existing usage
                await updateEquipmentUsage(usage.id, {
                    id: usage.id,
                    equipment_id: equipmentId,
                    business_id: usage.business_id,
                    project_id: projectId,
                    crew_id: crewId,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    hours_used: hoursUsed || 0,
                    fuel_consumed: usage.fuel_consumed ?? null,
                    created_at: usage.created_at,
                    updated_at: new Date().toISOString(),
                    created_by: usage.created_by ?? null,
                    updated_by: usage.updated_by ?? null,
                });
                toast.success('Usage record updated successfully');
            } else {
                // Create new usage
                await createEquipmentUsage({
                    id: crypto.randomUUID(),
                    equipment_id: equipmentId,
                    business_id: usage?.business_id ?? '',
                    project_id: projectId,
                    crew_id: crewId,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    hours_used: hoursUsed || 0,
                    fuel_consumed: fuelConsumed || 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: usage?.created_by ?? null,
                    updated_by: usage?.updated_by ?? null,
                });
                toast.success('Usage record created successfully');
            }

            onSave(data as EquipmentUsage);
            onClose();
        } catch (error) {
            console.error('Error saving usage:', error);
            toast.error('Error saving usage record');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">
                    {usage ? 'Edit Usage Record' : 'Add Usage Record'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Project</span>
                        </label>
                        <select
                            className="select select-bordered select-secondary w-full"
                            value={projectId || ''}
                            onChange={(e) => setProjectId(e.target.value || null)}
                            disabled={loading}
                        >
                            <option value="">Select Project</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Crew</span>
                        </label>
                        <select
                            className="select select-bordered select-secondary w-full"
                            value={crewId || ''}
                            onChange={(e) => setCrewId(e.target.value || null)}
                            disabled={loading}
                        >
                            <option value="">Select Crew</option>
                            {crews.map((crew) => (
                                <option key={crew.id} value={crew.id}>
                                    {crew.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Start Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered input-secondary"
                                value={startDate}
                                onChange={(e) => setstartDate(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">End Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered input-secondary"
                                value={endDate}
                                onChange={(e) => setendDate(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 mb-4'>
                        <div className="form-control mb-4">
                            <label className="label w-full">
                                <span className="label-text">Hours Used</span>
                            </label>
                            <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="input input-bordered input-secondary w-full"
                                placeholder="Enter hours"
                                value={hoursUsed}
                                onChange={(e) => setHoursUsed(Number(e.target.value))}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-control mb-4">
                            <label className="label w-full">
                                <span className="label-text">Fuel Consumed</span>
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                className="input input-bordered input-secondary w-full"
                                placeholder="Enter fuel consumed (optional)"
                                value={fuelConsumed || 0}
                                onChange={(e) => setFuelConsumed(Number(e.target.value))}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="modal-action">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || loading}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            disabled={isSubmitting || loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};