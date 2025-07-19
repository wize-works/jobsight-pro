"use client";

import { useState, useEffect } from 'react';
import { InvoiceAutomationRule, RateValidationResult } from '@/types/invoice-automation';
import { Client } from '@/types/clients';
import { Project } from '@/types/projects';
import { useInvoiceAutomationMutation } from '@/hooks/use-invoice-automation';
import { rateUtils } from '@/lib/api/rate-management';
import { useBusiness } from '@/lib/business-context';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    rule: InvoiceAutomationRule | null; // null = create mode
    clients: Client[];
    projects: Project[];
    onRuleCreate: (newRule: InvoiceAutomationRule) => void;
    onRuleUpdate: (updatedRule: InvoiceAutomationRule) => void;
    onRuleDelete: (ruleId: string) => void;
}

export default function RuleModal({
    isOpen,
    onClose,
    rule,
    clients,
    projects,
    onRuleCreate,
    onRuleUpdate,
    onRuleDelete
}: RuleModalProps) {
    const { businessId } = useBusiness();
    const router = useRouter();
    const { createRule, updateRule, deleteRule, loading: hookLoading, error: hookError } = useInvoiceAutomationMutation();

    const isCreating = !rule;
    const [rateValidation, setRateValidation] = useState<RateValidationResult | null>(null);

    const [formData, setFormData] = useState({
        clientId: '',
        projectId: '',
        ruleType: 'time_based' as 'time_based' | 'milestone' | 'retainer',
        frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'project_completion',
        minimumHours: 0,
        roundingRule: 'up' as 'up' | 'down' | 'nearest_quarter',
        includeLabor: true,
        laborMarkup: 0,
        includeEquipment: true,
        equipmentMarkup: 0,
        includeMaterials: true,
        materialMarkup: 0,
        autoGenerate: true,
        requireApproval: false,
        isActive: true
    });

    const filteredProjects = projects.filter(project =>
        !formData.clientId || project.client_id === formData.clientId
    );

    useEffect(() => {
        if (isOpen) {
            if (rule) {
                // Populate with existing data
                setFormData({
                    clientId: rule.clientId || '',
                    projectId: rule.projectId || '',
                    ruleType: rule.ruleType || 'time_based',
                    frequency: rule.frequency || 'weekly',
                    minimumHours: rule.minimumHours || 0,
                    roundingRule: rule.roundingRule || 'up',
                    includeLabor: rule.config?.timeBasedConfig?.includeLabor ?? true,
                    laborMarkup: rule.config?.timeBasedConfig?.laborMarkup || 0,
                    includeEquipment: rule.config?.timeBasedConfig?.includeEquipment ?? true,
                    equipmentMarkup: rule.config?.timeBasedConfig?.equipmentMarkup || 0,
                    includeMaterials: rule.config?.timeBasedConfig?.includeMaterials ?? true,
                    materialMarkup: rule.config?.timeBasedConfig?.materialMarkup || 0,
                    autoGenerate: rule.autoGenerate ?? true,
                    requireApproval: rule.requireApproval ?? false,
                    isActive: rule.isActive ?? true
                });
            } else {
                // Initialize with defaults for creation
                setFormData({
                    clientId: '',
                    projectId: '',
                    ruleType: 'time_based',
                    frequency: 'weekly',
                    minimumHours: 0,
                    roundingRule: 'up',
                    includeLabor: true,
                    laborMarkup: 0,
                    includeEquipment: true,
                    equipmentMarkup: 0,
                    includeMaterials: true,
                    materialMarkup: 0,
                    autoGenerate: true,
                    requireApproval: false,
                    isActive: true
                });
            }

            // Load rate validation
            loadRateValidation();
        }
    }, [rule, isOpen]);

    const loadRateValidation = async () => {
        try {
            const validation = await rateUtils.validateBusinessRates(businessId);
            setRateValidation(validation);
        } catch (error) {
            console.error('Error loading rate validation:', error);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!formData.clientId) {
                toast.error("Please select a client");
                return;
            }

            if (isCreating) {
                const newRule = await createRule({
                    client_id: formData.clientId,
                    project_id: formData.projectId || undefined,
                    rule_type: formData.ruleType,
                    frequency: formData.frequency,
                    minimum_hours: formData.minimumHours,
                    rounding_rule: formData.roundingRule,
                    config: {
                        include_time_entries: formData.includeLabor,
                        include_equipment: formData.includeEquipment,
                        include_materials: formData.includeMaterials,
                        hourly_rate: undefined, // Will use default rates
                    },
                    auto_generate: formData.autoGenerate,
                    require_approval: formData.requireApproval,
                    is_active: formData.isActive
                });

                if (newRule) {
                    onRuleCreate(newRule as any); // Type conversion needed due to interface differences
                    onClose();
                    toast.success("Automation rule created successfully!");
                } else {
                    throw new Error("Failed to create rule");
                }
            } else {
                const updatedRule = await updateRule(rule!.id, {
                    client_id: formData.clientId,
                    project_id: formData.projectId || undefined,
                    rule_type: formData.ruleType,
                    frequency: formData.frequency,
                    minimum_hours: formData.minimumHours,
                    rounding_rule: formData.roundingRule,
                    config: {
                        include_time_entries: formData.includeLabor,
                        include_equipment: formData.includeEquipment,
                        include_materials: formData.includeMaterials,
                        hourly_rate: undefined, // Will use default rates
                    },
                    auto_generate: formData.autoGenerate,
                    require_approval: formData.requireApproval,
                    is_active: formData.isActive
                });

                if (updatedRule) {
                    onRuleUpdate(updatedRule as any); // Type conversion needed due to interface differences
                    toast.success("Automation rule updated successfully!");
                } else {
                    throw new Error("Failed to update rule");
                }
            }
        } catch (error) {
            console.error('Error saving rule:', error);
            toast.error(isCreating ? "Failed to create rule" : "Failed to update rule");
        }
    };

    const handleDelete = async () => {
        if (!rule) return;

        if (confirm('Are you sure you want to delete this automation rule?')) {
            try {
                const success = await deleteRule(rule.id);
                if (success) {
                    onRuleDelete(rule.id);
                    onClose();
                    toast.success("Automation rule deleted successfully!");
                } else {
                    throw new Error("Failed to delete rule");
                }
            } catch (error) {
                console.error('Error deleting rule:', error);
                toast.error("Failed to delete rule");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl p-0 rounded-lg flex flex-col" style={{ maxHeight: "90vh", height: "auto" }}>
                {/* Header */}
                <div className="flex-shrink-0 bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">
                                {isCreating ? 'Create Invoice Automation Rule' : 'Edit Automation Rule'}
                            </h2>
                            {rule && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-error'}`}>
                                        {rule.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="badge badge-outline">
                                        {rule.ruleType === 'time_based' ? 'Time & Materials' :
                                            rule.ruleType === 'milestone' ? 'Milestone' :
                                                rule.ruleType === 'retainer' ? 'Retainer' : rule.ruleType}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            disabled={hookLoading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6" style={{ maxHeight: "calc(90vh - 145px)" }}>
                    {/* Rate Validation Warning */}
                    {rateValidation && !rateValidation.isValid && (
                        <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle"></i>
                            <div>
                                <h3 className="font-semibold">Missing Billing Rates</h3>
                                <p className="text-sm mt-1">
                                    Some crew members or equipment are missing billing rates. Automation rules may not generate complete invoices.
                                </p>
                                {rateValidation.missingRates.crewMembers.length > 0 && (
                                    <p className="text-sm mt-1">
                                        <strong>Crew Members:</strong> {rateValidation.missingRates.crewMembers.join(', ')}
                                    </p>
                                )}
                                {rateValidation.missingRates.equipment.length > 0 && (
                                    <p className="text-sm mt-1">
                                        <strong>Equipment:</strong> {rateValidation.missingRates.equipment.join(', ')}
                                    </p>
                                )}
                                <button
                                    onClick={() => router.push('/dashboard/rate-management')}
                                    className="btn btn-warning btn-sm mt-2"
                                >
                                    Fix Rates
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="card bg-base-100 border border-base-300">
                        <div className="card-body p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <i className="far fa-info-circle text-primary"></i>
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Client *</span>
                                    </label>
                                    <select
                                        value={formData.clientId}
                                        onChange={(e) => handleInputChange('clientId', e.target.value)}
                                        className="select select-bordered select-secondary"
                                        disabled={hookLoading}
                                    >
                                        <option value="">Select a client...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Project (Optional)</span>
                                    </label>
                                    <select
                                        value={formData.projectId}
                                        onChange={(e) => handleInputChange('projectId', e.target.value)}
                                        className="select select-bordered select-secondary"
                                        disabled={hookLoading || !formData.clientId}
                                    >
                                        <option value="">All projects for this client</option>
                                        {filteredProjects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Billing Type *</span>
                                    </label>
                                    <select
                                        value={formData.ruleType}
                                        onChange={(e) => handleInputChange('ruleType', e.target.value)}
                                        className="select select-bordered select-secondary"
                                        disabled={hookLoading}
                                    >
                                        <option value="time_based">Time & Materials</option>
                                        <option value="milestone">Milestone</option>
                                        <option value="retainer">Retainer</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Generation Frequency *</span>
                                    </label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => handleInputChange('frequency', e.target.value)}
                                        className="select select-bordered select-secondary"
                                        disabled={hookLoading}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="project_completion">Project Completion</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Minimum Hours (0 = no minimum)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.minimumHours}
                                        onChange={(e) => handleInputChange('minimumHours', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.25"
                                        className="input input-bordered input-secondary"
                                        disabled={hookLoading}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Time Rounding</span>
                                    </label>
                                    <select
                                        value={formData.roundingRule}
                                        onChange={(e) => handleInputChange('roundingRule', e.target.value)}
                                        className="select select-bordered select-secondary"
                                        disabled={hookLoading}
                                    >
                                        <option value="up">Round Up</option>
                                        <option value="down">Round Down</option>
                                        <option value="nearest_quarter">Round to Nearest Quarter Hour</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Time & Materials Settings */}
                    {formData.ruleType === 'time_based' && (
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-cogs text-primary"></i>
                                    Time & Materials Settings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label cursor-pointer">
                                                <span className="label-text font-medium">Include Labor</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.includeLabor}
                                                    onChange={(e) => handleInputChange('includeLabor', e.target.checked)}
                                                    className="checkbox"
                                                    disabled={hookLoading}
                                                />
                                            </label>
                                        </div>
                                        {formData.includeLabor && (
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Labor Markup (%)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.laborMarkup}
                                                    onChange={(e) => handleInputChange('laborMarkup', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    className="input input-bordered input-secondary"
                                                    disabled={hookLoading}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label cursor-pointer">
                                                <span className="label-text font-medium">Include Equipment</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.includeEquipment}
                                                    onChange={(e) => handleInputChange('includeEquipment', e.target.checked)}
                                                    className="checkbox"
                                                    disabled={hookLoading}
                                                />
                                            </label>
                                        </div>
                                        {formData.includeEquipment && (
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Equipment Markup (%)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.equipmentMarkup}
                                                    onChange={(e) => handleInputChange('equipmentMarkup', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    className="input input-bordered input-secondary"
                                                    disabled={hookLoading}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label cursor-pointer">
                                                <span className="label-text font-medium">Include Materials</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.includeMaterials}
                                                    onChange={(e) => handleInputChange('includeMaterials', e.target.checked)}
                                                    className="checkbox"
                                                    disabled={hookLoading}
                                                />
                                            </label>
                                        </div>
                                        {formData.includeMaterials && (
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Material Markup (%)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.materialMarkup}
                                                    onChange={(e) => handleInputChange('materialMarkup', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    className="input input-bordered input-secondary"
                                                    disabled={hookLoading}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Automation Settings */}
                    <div className="card bg-base-100 border border-base-300">
                        <div className="card-body p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <i className="far fa-robot text-primary"></i>
                                Automation Settings
                            </h3>
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label cursor-pointer">
                                        <span className="label-text font-medium">Auto-generate invoices (if disabled, invoices will be created as drafts)</span>
                                        <input
                                            type="checkbox"
                                            checked={formData.autoGenerate}
                                            onChange={(e) => handleInputChange('autoGenerate', e.target.checked)}
                                            className="checkbox"
                                            disabled={hookLoading}
                                        />
                                    </label>
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer">
                                        <span className="label-text font-medium">Require approval before finalizing invoices</span>
                                        <input
                                            type="checkbox"
                                            checked={formData.requireApproval}
                                            onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                                            className="checkbox"
                                            disabled={hookLoading}
                                        />
                                    </label>
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer">
                                        <span className="label-text font-medium">Rule is active</span>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                            className="checkbox"
                                            disabled={hookLoading}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={hookLoading}
                        >
                            Cancel
                        </button>

                        {rule && (
                            <button
                                onClick={handleDelete}
                                className="btn btn-error gap-2"
                                disabled={hookLoading}
                            >
                                <i className="far fa-trash"></i>
                                Delete
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            className="btn btn-primary gap-2"
                            disabled={hookLoading || !formData.clientId}
                        >
                            {hookLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {isCreating ? 'Creating...' : 'Updating...'}
                                </>
                            ) : (
                                <>
                                    <i className={isCreating ? "far fa-plus" : "far fa-save"}></i>
                                    {isCreating ? 'Create Rule' : 'Update Rule'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
