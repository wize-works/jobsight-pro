/**
 * Daily Log Billing Demo Page
 * Demonstrates the daily log billing processing functionality
 */

'use client';

import { useState, useEffect } from 'react';
import DailyLogBilling from '@/components/daily-log-billing';

export default function DailyLogBillingPage() {
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would come from authentication context
        // For demo purposes, we'll use a sample business ID
        const sampleBusinessId = 'demo-business-123';
        setBusinessId(sampleBusinessId);

        // Set default date range to last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setDateRange({
            start: thirtyDaysAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        });

        setLoading(false);
    }, []);

    const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!businessId) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No Business Selected</h2>
                    <p className="text-gray-600">Please select a business to view daily log billing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Daily Log Billing Processing</h1>
                    <p className="text-gray-600">
                        Process daily logs to extract billable items and calculate costs using your configured rates.
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Filters</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Project ID (Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        placeholder="Enter project ID"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Start Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered"
                                        value={dateRange.start}
                                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">End Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered"
                                        value={dateRange.end}
                                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Component */}
                <DailyLogBilling
                    businessId={businessId}
                    projectId={projectId || undefined}
                    dateRange={dateRange.start && dateRange.end ? dateRange : undefined}
                />
            </div>
        </div>
    );
}
