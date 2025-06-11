"use client";

import { EquipmentUsage, EquipmentUsageInsert } from '@/types/equipment_usage';
import { Project } from '@/types/projects';
import { CrewWithDetails } from '@/types/crews';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createEquipmentUsage, updateEquipmentUsage } from '@/app/actions/equipment_usage';
import { getProjects } from '@/app/actions/projects';
import { getCrewsWithDetails } from '@/app/actions/crews';
import { toast } from '@/hooks/use-toast';

interface UsageModalProps {
    isOpen: boolean;
    usage?: EquipmentUsage;
    onClose: () => void;
    onSave: (usage: EquipmentUsage) => void | Promise<void>;
}

export const UsageModal = ({ isOpen, usage, onClose, onSave }: UsageModalProps) => {
    const router = useRouter();
    const params = useParams();
    const equipmentId = params?.id as string;
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        project_id: '',
        crew_id: '',
        start_date: '',
        end_date: '',
        hours_used: '',
        fuel_consumed: '',
    });

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
                toast.error({
                    title: "Error",
                    description: "Error loading project and crew data"
                });
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // Load existing usage data if editing
    useEffect(() => {
        if (usage) {
            setFormData({
                project_id: usage.project_id || '',
                crew_id: usage.crew_id || '',
                start_date: usage.start_date ? new Date(usage.start_date).toISOString().split('T')[0] : '',
                end_date: usage.end_date ? new Date(usage.end_date).toISOString().split('T')[0] : '',
                hours_used: usage.hours_used ? usage.hours_used.toString() : '',
                fuel_consumed: usage.fuel_consumed ? usage.fuel_consumed.toString() : '',
            });
        } else {
            // Reset form for new usage
            setFormData({
                project_id: '',
                crew_id: '',
                start_date: '',
                end_date: '',
                hours_used: '',
                fuel_consumed: '',
            });
        }
    }, [usage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const usageData = {
                equipment_id: equipmentId,
                project_id: formData.project_id || null,
                crew_id: formData.crew_id || null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                hours_used: formData.hours_used ? parseFloat(formData.hours_used) : 0,
                fuel_consumed: formData.fuel_consumed ? parseFloat(formData.fuel_consumed) : null,
                ...(usage?.id && { id: usage.id })
            } as unknown as EquipmentUsage;

            if (usage?.id) {
                await updateEquipmentUsage(usage.id, {
                    ...usageData,
                    id: usage.id,
                });
                toast.success({
                    title: "Success",
                    description: "Usage record updated successfully"
                });
            } else {
                await createEquipmentUsage({
                    ...usageData,
                });
                toast.success({
                    title: "Success",
                    description: "Usage record created successfully"
                });
            }

            onSave(usageData);
            onClose();
            router.refresh();
        } catch (error) {
            console.error('Error saving usage:', error);
            toast.error({
                title: "Error",
                description: usage?.id ? "Failed to update usage record" : "Failed to create usage record"
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
                            {usage ? 'Edit Usage Record' : 'Add Usage Record'}
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
                        {/* Usage Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-info-circle text-primary"></i>
                                    Usage Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project</span>
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
                                                disabled={loading}
                                            >
                                                <option value="">Select a project</option>
                                                {projects.map((project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Crew</span>
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
                                                disabled={loading}
                                            >
                                                <option value="">Select a crew</option>
                                                {crews.map((crew) => (
                                                    <option key={crew.id} value={crew.id}>
                                                        {crew.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Start Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className="input input-bordered input-secondary"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
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
                                </div>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-chart-line text-primary"></i>
                                    Usage Metrics
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Hours Used</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="hours_used"
                                            className="input input-bordered input-secondary"
                                            value={formData.hours_used}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            min={0}
                                            step="0.25"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Fuel Consumed</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="fuel_consumed"
                                            className="input input-bordered input-secondary"
                                            value={formData.fuel_consumed}
                                            onChange={handleInputChange}
                                            placeholder="0.0"
                                            min={0}
                                            step="0.1"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    <div className="flex justify-end gap-3">
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
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {usage ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className={usage ? "fas fa-save" : "fas fa-plus"}></i>
                                    {usage ? 'Update Usage' : 'Create Usage'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};