"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    InvoiceAutomationRule
} from '@/types/invoice-automation';
import { Client } from '@/types/clients';
import { Project } from '@/types/projects';
import { RateValidationResult } from '@/types/invoice-automation';
import { validateRates } from '@/app/actions/client/rate-management';
import { rateUtils } from '@/lib/api/rate-management';
import { getClients } from '@/app/actions/clients';
import { getProjects } from '@/app/actions/projects';
import { useBusiness } from '@/lib/business-context';
import { toast } from '@/hooks/use-toast';
import { useInvoiceAutomation } from '@/hooks/useInvoiceAutomation';
import RuleModal from './components/rule-modal';

export default function InvoiceAutomationPage() {
    const router = useRouter();
    const { businessId } = useBusiness();
    const {
        rules,
        loading: rulesLoading,
        error: rulesError,
        fetchRules,
        deleteRule,
        generateInvoice: generateInvoiceFromRule
    } = useInvoiceAutomation();

    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [rateValidation, setRateValidation] = useState<RateValidationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [testingRule, setTestingRule] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showRateWarning, setShowRateWarning] = useState(false);

    // Modal states
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<InvoiceAutomationRule | null>(null);

    // Load data
    useEffect(() => {
        if (businessId) {
            loadData();
        }
    }, [businessId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [clientsData, projectsData, validationData] = await Promise.all([
                getClients(businessId),
                getProjects(businessId),
                rateUtils.validateBusinessRates(businessId)
            ]);

            // Fetch rules separately using the hook
            fetchRules();

            setClients(clientsData);
            setProjects(projectsData);
            setRateValidation(validationData);

            // Show warning if rates are missing
            if (!validationData.isValid) {
                setShowRateWarning(true);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load invoice automation data');
        } finally {
            setLoading(false);
        }
    };

    const handleTestRule = async (ruleId: string) => {
        try {
            setTestingRule(ruleId);

            // Generate a test date range (last 30 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const dateRange = {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            };

            // Generate a preview invoice using the rule
            const result = await generateInvoiceFromRule(ruleId, dateRange);

            if (result && result.success) {
                toast.success('Test completed successfully! Preview generated.');
                // Navigate to preview page with the generated invoice data
                router.push(`/dashboard/invoice-automation/preview?ruleId=${ruleId}`);
            } else {
                toast.error(result?.error || 'Failed to generate test invoice');
            }
        } catch (error) {
            console.error('Error testing rule:', error);
            toast.error('Failed to test rule');
        } finally {
            setTestingRule(null);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        try {
            const success = await deleteRule(ruleId);

            if (success) {
                toast.success('Rule deleted successfully');
            } else {
                toast.error('Failed to delete rule');
            }
        } catch (error) {
            console.error('Error deleting rule:', error);
            toast.error('Failed to delete rule');
        }
        setDeleteConfirm(null);
    };

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client?.name || 'Unknown Client';
    };

    const getProjectName = (projectId: string | undefined) => {
        if (!projectId) return 'All Projects';
        const project = projects.find(p => p.id === projectId);
        return project?.name || 'Unknown Project';
    };

    const formatFrequency = (frequency: string | undefined) => {
        if (!frequency) return 'Manual';
        return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    };

    const getRuleTypeLabel = (type: string) => {
        switch (type) {
            case 'time_based': return 'Time & Materials';
            case 'milestone': return 'Milestone';
            case 'retainer': return 'Retainer';
            default: return type;
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return (
            <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Invoice Automation</h1>
                    <p className="text-base-content/70 mt-2">
                        Automate invoice generation from your daily logs
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedRule(null);
                        setRuleModalOpen(true);
                    }}
                    className="btn btn-primary"
                >
                    <i className="far fa-plus mr-2"></i>
                    Create New Rule
                </button>
            </div>

            {/* Rate Validation Warning */}
            {showRateWarning && rateValidation && !rateValidation.isValid && (
                <div className="alert alert-warning mb-6">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-semibold">Missing Billing Rates</h3>
                        <p className="text-sm mt-1">
                            Some crew members or equipment are missing billing rates. Invoice automation may not generate complete invoices.
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
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/dashboard/rate-management')}
                            className="btn btn-warning btn-sm"
                        >
                            Fix Rates
                        </button>
                        <button
                            onClick={() => setShowRateWarning(false)}
                            className="btn btn-circle btn-ghost btn-sm"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Rules List */}
            {rules.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl opacity-20 mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2">No automation rules yet</h3>
                    <p className="text-base-content/70 mb-6">
                        Create your first rule to start automating invoice generation
                    </p>
                    <button
                        onClick={() => {
                            setSelectedRule(null);
                            setRuleModalOpen(true);
                        }}
                        className="btn btn-primary"
                    >
                        <i className="far fa-plus mr-2"></i>
                        Create First Rule
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {rules.map((rule) => (
                        <div key={rule.id} className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <h3 className="card-title">
                                                {getRuleTypeLabel(rule.rule_type)} Rule
                                            </h3>
                                            {getStatusBadge(rule.is_active)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="text-sm font-medium text-base-content/70">Client</label>
                                                <p className="text-sm font-medium">{getClientName(rule.client_id)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-base-content/70">Project</label>
                                                <p className="text-sm font-medium">{getProjectName(rule.project_id)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-base-content/70">Type</label>
                                                <p className="text-sm font-medium">{getRuleTypeLabel(rule.rule_type)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-base-content/70">Frequency</label>
                                                <p className="text-sm font-medium">
                                                    {formatFrequency(rule.frequency)}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-base-content/70">Auto Generate</label>
                                                <p className="text-sm font-medium">
                                                    {rule.auto_generate ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-base-content/70">Requires Approval</label>
                                                <p className="text-sm font-medium">
                                                    {rule.require_approval ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleTestRule(rule.id)}
                                            disabled={testingRule === rule.id}
                                            className="btn btn-success btn-sm"
                                            title="Test Rule"
                                        >
                                            {testingRule === rule.id ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <i className="far fa-play"></i>
                                            )}
                                            Test
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedRule(rule as any); // Type conversion needed due to interface differences
                                                setRuleModalOpen(true);
                                            }}
                                            className="btn btn-primary btn-sm"
                                            title="Edit Rule"
                                        >
                                            <i className="far fa-edit"></i>
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => router.push(`/dashboard/invoice-automation/edit/${rule.id}`)}
                                            className="btn btn-warning btn-sm"
                                            title="Edit"
                                        >
                                            <i className="far fa-edit"></i>
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => setDeleteConfirm(rule.id)}
                                            className="btn btn-error btn-sm"
                                            title="Delete"
                                        >
                                            <i className="far fa-trash"></i>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Delete Automation Rule</h3>
                        <p className="py-4">
                            Are you sure you want to delete this automation rule? This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteRule(deleteConfirm)}
                                className="btn btn-error"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rule Modal */}
            <RuleModal
                isOpen={ruleModalOpen}
                onClose={() => {
                    setRuleModalOpen(false);
                    setSelectedRule(null);
                }}
                rule={selectedRule}
                clients={clients}
                projects={projects}
                onRuleCreate={(newRule) => {
                    fetchRules(); // Refresh the rules from the hook
                    setRuleModalOpen(false);
                    setSelectedRule(null);
                }}
                onRuleUpdate={(updatedRule) => {
                    fetchRules(); // Refresh the rules from the hook
                    setRuleModalOpen(false);
                    setSelectedRule(null);
                }}
                onRuleDelete={(ruleId) => {
                    fetchRules(); // Refresh the rules from the hook
                    setRuleModalOpen(false);
                    setSelectedRule(null);
                }}
            />
        </div>
    );
}
