"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProjectProfitabilityDashboard from '@/components/analytics/ProjectProfitabilityDashboard';
import ResourceUtilizationDashboard from '@/components/analytics/ResourceUtilizationDashboard';

type ActiveReportType = 'profitability' | 'resources' | 'financial' | 'compliance';

export default function ReportsPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as ActiveReportType | null;
    const [activeReport, setActiveReport] = useState<ActiveReportType>(
        tabParam && ['profitability', 'resources', 'financial', 'compliance'].includes(tabParam)
            ? tabParam
            : 'profitability'
    );

    // Update activeReport when URL parameter changes
    useEffect(() => {
        if (tabParam && ['profitability', 'resources', 'financial', 'compliance'].includes(tabParam)) {
            setActiveReport(tabParam);
        }
    }, [tabParam]);

    const reportTabs = [
        {
            id: 'profitability' as const,
            title: 'Project Profitability',
            icon: 'fa-chart-line',
            description: 'Analyze project costs, profits, and margins'
        },
        {
            id: 'resources' as const,
            title: 'Resource Utilization',
            icon: 'fa-users-cog',
            description: 'Track crew and equipment utilization'
        },
        {
            id: 'financial' as const,
            title: 'Financial Overview',
            icon: 'fa-dollar-sign',
            description: 'Revenue, expenses, and cash flow analysis'
        },
        {
            id: 'compliance' as const,
            title: 'Safety & Compliance',
            icon: 'fa-shield-alt',
            description: 'Safety metrics and compliance tracking'
        }
    ];

    const renderReportContent = () => {
        switch (activeReport) {
            case 'profitability':
                return <ProjectProfitabilityDashboard />;
            case 'resources':
                return <ResourceUtilizationDashboard />;
            case 'financial':
                return <ComingSoonReport title="Financial Overview" icon="fa-dollar-sign" />;
            case 'compliance':
                return <ComingSoonReport title="Safety & Compliance" icon="fa-shield-alt" />;
            default:
                return <ComingSoonReport title="Report" icon="fa-chart-bar" />;
        }
    };

    return (
        <div className="container mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Advanced Reports & Analytics</h1>
                    <p className="text-base-content/70 mt-2">
                        Get deep insights into your business performance with comprehensive reporting
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm">
                        <i className="far fa-download"></i>
                        Export Reports
                    </button>
                    <button className="btn btn-primary btn-sm">
                        <i className="far fa-calendar"></i>
                        Schedule Reports
                    </button>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="bg-base-100 rounded-lg shadow-lg">
                <div className="tabs tabs-box bg-base-200 p-2">
                    {reportTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveReport(tab.id)}
                            className={`tab tab-lg flex-1 ${activeReport === tab.id ? 'tab-active' : ''}`}
                        >
                            <i className={`far ${tab.icon} mr-2`}></i>
                            <div className="hidden md:block">
                                <div className="font-semibold">{tab.title}</div>
                                <div className="text-xs opacity-70">{tab.description}</div>
                            </div>
                            <div className="md:hidden font-semibold">{tab.title}</div>
                        </button>
                    ))}
                </div>

                {/* Report Content */}
                <div className="p-6">
                    {renderReportContent()}
                </div>
            </div>
        </div>
    );
}

// Coming Soon Component for other reports
function ComingSoonReport({ title, icon }: { title: string; icon: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-primary/10 rounded-full p-6 mb-4">
                <i className={`far ${icon} text-4xl text-primary`}></i>
            </div>
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-base-content/70 mb-6 max-w-md">
                This advanced reporting feature is currently in development.
                It will provide comprehensive insights and analytics for your business operations.
            </p>
            <div className="space-y-2 text-sm text-base-content/60">
                <div className="flex items-center gap-2">
                    <i className="far fa-check text-success"></i>
                    <span>Real-time data visualization</span>
                </div>
                <div className="flex items-center gap-2">
                    <i className="far fa-check text-success"></i>
                    <span>Exportable reports (PDF, Excel, CSV)</span>
                </div>
                <div className="flex items-center gap-2">
                    <i className="far fa-check text-success"></i>
                    <span>Automated scheduling and delivery</span>
                </div>
                <div className="flex items-center gap-2">
                    <i className="far fa-check text-success"></i>
                    <span>Custom filtering and date ranges</span>
                </div>
            </div>
            <button className="btn btn-primary btn-sm mt-6">
                <i className="far fa-bell"></i>
                Notify Me When Ready
            </button>
        </div>
    );
}