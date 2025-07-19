/**
 * Daily Log Billing Component
 * Displays processed billing information from daily logs
 */

'use client';

import { useState, useEffect } from 'react';
import { DailyLog } from '@/types/daily-logs';

// Define the types locally since we're not using server actions anymore
interface BillableItem {
    id: string;
    daily_log_id: string;
    type: 'labor' | 'equipment' | 'material';
    source_id: string;
    source_name: string;
    quantity: number;
    unit: string;
    rate: number;
    subtotal: number;
    date: string;
    description?: string;
    metadata?: any;
    // Additional properties for UI compatibility
    amount?: number;
    hours?: number;
    crew_member_id?: string;
    equipment_id?: string;
    material_id?: string;
}

interface DailyLogBillingSummary {
    daily_log_id: string;
    date: string;
    project_id: string;
    project_name: string;
    billableItems: BillableItem[];
    totalAmount: number;
    laborCost: number;
    equipmentCost: number;
    materialCost: number;
}

interface DailyLogBillingProps {
    businessId: string;
    projectId?: string;
    dateRange?: {
        start: string;
        end: string;
    };
}

export default function DailyLogBilling({ businessId, projectId, dateRange }: DailyLogBillingProps) {
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [billingSummaries, setBillingSummaries] = useState<DailyLogBillingSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [projectCosts, setProjectCosts] = useState<any>(null);

    useEffect(() => {
        loadDailyLogs();
    }, [businessId, projectId, dateRange]);

    const loadDailyLogs = async () => {
        setLoading(true);
        try {
            // Get daily logs via API
            const response = await fetch('/api/daily-logs');
            if (!response.ok) {
                throw new Error('Failed to fetch daily logs');
            }

            const result = await response.json();
            if (!result.success || !result.data) {
                console.error('Failed to load daily logs:', result.error);
                return;
            }

            const logs = result.data;

            // Filter by project if specified
            const filteredLogs = projectId
                ? logs.filter((log: DailyLog) => log.project_id === projectId)
                : logs;

            // Filter by date range if specified
            const dateFilteredLogs = dateRange
                ? filteredLogs.filter((log: DailyLog) =>
                    log.date >= dateRange.start && log.date <= dateRange.end
                )
                : filteredLogs;

            setDailyLogs(dateFilteredLogs);

            // Auto-process if we have logs
            if (dateFilteredLogs.length > 0) {
                await processAllLogs(dateFilteredLogs.map((log: DailyLog) => log.id));
            }

        } catch (error) {
            console.error('Error loading daily logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const processAllLogs = async (logIds: string[]) => {
        setProcessing(true);
        try {
            const response = await fetch('/api/daily-log-billing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    daily_log_ids: logIds,
                    include_labor: true,
                    include_equipment: true,
                    include_materials: true,
                    billing_date: new Date().toISOString().split('T')[0]
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setBillingSummaries(result.data.billing_summaries || []);
                console.log('Batch processing completed:', result.data.totals);
            } else {
                console.error('Failed to process logs via API');
                setBillingSummaries([]);
            }
        } catch (error) {
            console.error('Error processing logs:', error);
            setBillingSummaries([]);
        } finally {
            setProcessing(false);
        }
    };

    const processSelectedLog = async (logId: string) => {
        setProcessing(true);
        try {
            const response = await fetch('/api/daily-log-billing', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    daily_log_id: logId,
                    include_labor: true,
                    include_equipment: true,
                    include_materials: true,
                    billing_date: new Date().toISOString().split('T')[0]
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setSelectedLogId(logId);
                // Could set a single log summary here if needed
                console.log('Individual log processing completed:', result.data);
            } else {
                console.error('Failed to process individual log via API');
            }
        } catch (error) {
            console.error('Error processing log:', error);
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getBillableItemIcon = (type: string) => {
        switch (type) {
            case 'labor': return '👷';
            case 'equipment': return '🚜';
            case 'material': return '📦';
            default: return '📄';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Daily Log Billing</h1>
                <p className="text-gray-600">
                    Process daily logs to extract billable items and calculate costs.
                </p>
            </div>

            {/* Project Summary */}
            {projectCosts && (
                <div className="mb-6">
                    <div className="stats stats-vertical lg:stats-horizontal shadow">
                        <div className="stat">
                            <div className="stat-title">Total Project Cost</div>
                            <div className="stat-value text-primary">{formatCurrency(projectCosts.totalCost)}</div>
                            <div className="stat-desc">{projectCosts.totalHours} hours total</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Labor Cost</div>
                            <div className="stat-value text-secondary">{formatCurrency(projectCosts.breakdown.labor.total)}</div>
                            <div className="stat-desc">{projectCosts.breakdown.labor.hours} hours</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Equipment Cost</div>
                            <div className="stat-value text-accent">{formatCurrency(projectCosts.breakdown.equipment.total)}</div>
                            <div className="stat-desc">{projectCosts.breakdown.equipment.hours} hours</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Materials Cost</div>
                            <div className="stat-value text-info">{formatCurrency(projectCosts.breakdown.materials.total)}</div>
                            <div className="stat-desc">{projectCosts.breakdown.materials.items} items</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mb-6">
                <button
                    className="btn btn-primary"
                    onClick={() => processAllLogs(dailyLogs.map(log => log.id))}
                    disabled={processing || dailyLogs.length === 0}
                >
                    {processing ? 'Processing...' : 'Process All Logs'}
                </button>
                <div className="badge badge-outline">
                    {dailyLogs.length} daily logs found
                </div>
            </div>

            {/* Daily Logs List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Logs Column */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Daily Logs</h2>
                    <div className="space-y-4">
                        {dailyLogs.map(log => {
                            const summary = billingSummaries.find(s => s.daily_log_id === log.id);
                            return (
                                <div
                                    key={log.id}
                                    className={`card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${selectedLogId === log.id ? 'ring-2 ring-primary' : ''
                                        }`}
                                    onClick={() => setSelectedLogId(log.id)}
                                >
                                    <div className="card-body p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">{log.date}</h3>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {log.hours_worked || 0} hours worked
                                                </p>
                                                {log.work_completed && (
                                                    <p className="text-sm line-clamp-2">{log.work_completed}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {summary ? (
                                                    <div>
                                                        <div className="text-lg font-bold text-primary">
                                                            {formatCurrency(summary.totalAmount)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {summary.billableItems.length} items
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            processSelectedLog(log.id);
                                                        }}
                                                        disabled={processing}
                                                    >
                                                        {processing ? 'Processing...' : 'Process'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {summary && summary.billableItems && summary.billableItems.length > 0 && (
                                            <div className="mt-3 flex gap-2">
                                                <div className="badge badge-sm badge-secondary">
                                                    👷 {summary.billableItems.filter(item => item.type === 'labor').length}
                                                </div>
                                                <div className="badge badge-sm badge-accent">
                                                    🚜 {summary.billableItems.filter(item => item.type === 'equipment').length}
                                                </div>
                                                <div className="badge badge-sm badge-info">
                                                    📦 {summary.billableItems.filter(item => item.type === 'material').length}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Billing Details Column */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Billing Details</h2>
                    {selectedLogId && billingSummaries.find(s => s.daily_log_id === selectedLogId) ? (
                        <BillingSummaryDetails
                            summary={billingSummaries.find(s => s.daily_log_id === selectedLogId)!}
                        />
                    ) : (
                        <div className="card bg-base-100 shadow-md">
                            <div className="card-body text-center text-gray-500">
                                Select a daily log to view billing details
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface BillingSummaryDetailsProps {
    summary: DailyLogBillingSummary;
}

function BillingSummaryDetails({ summary }: BillingSummaryDetailsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getBillableItemIcon = (type: string) => {
        switch (type) {
            case 'labor': return '👷';
            case 'equipment': return '🚜';
            case 'material': return '📦';
            default: return '📄';
        }
    };

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h3 className="card-title">Summary for {summary.date}</h3>
                    <div className="stats stats-vertical">
                        <div className="stat">
                            <div className="stat-title">Total Cost</div>
                            <div className="stat-value text-primary">{formatCurrency(summary.totalAmount || 0)}</div>
                            <div className="stat-desc">{summary.billableItems.filter(item => item.hours).reduce((sum, item) => sum + (item.hours || 0), 0)} hours</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billable Items */}
            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <h3 className="card-title">Billable Items ({summary.billableItems.length})</h3>
                    <div className="space-y-2">
                        {summary.billableItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-base-200 rounded">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{getBillableItemIcon(item.type)}</span>
                                    <div>
                                        <div className="font-medium">{item.source_name || item.description}</div>
                                        <div className="text-sm text-gray-600">
                                            {item.quantity} {item.unit || 'units'} × {formatCurrency(item.rate)}
                                        </div>
                                        {item.description && (
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{formatCurrency(item.subtotal || item.amount || 0)}</div>
                                    <div className="badge badge-sm badge-outline">{item.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
