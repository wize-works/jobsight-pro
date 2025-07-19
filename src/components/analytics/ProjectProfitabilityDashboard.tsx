"use client";

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { useBusiness } from '@/lib/business-context';
import {
    getProjectProfitabilityDataClient
} from '@/lib/project-profitability/client';
import type {
    ProjectProfitabilityData,
    ProjectProfitabilitySummary
} from '@/lib/project-profitability/server';

interface ProjectProfitabilityDashboardProps {
    className?: string;
}

const ProjectProfitabilityDashboard: React.FC<ProjectProfitabilityDashboardProps> = ({
    className = ""
}) => {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectProfitabilityData[]>([]);
    const [summary, setSummary] = useState<ProjectProfitabilitySummary>({
        totalProjects: 0,
        totalBudget: 0,
        totalSpend: 0,
        totalProfit: 0,
        averageMargin: 0,
        profitableProjects: 0,
        unprofitableProjects: 0,
        atRiskProjects: 0
    });

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState('all');
    const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);

    // Load project profitability data
    const loadProjectProfitabilityData = async () => {
        if (!businessId) return;

        setLoading(true);
        try {
            const filters = {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                riskLevel: riskFilter !== 'all' ? riskFilter : undefined,
            };

            const data = await getProjectProfitabilityDataClient(filters);
            setProjects(data.projects);
            setSummary(data.summary);
        } catch (error) {
            console.error('Error loading project profitability data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjectProfitabilityData();
    }, [businessId, statusFilter, riskFilter]);

    // Filter projects for display
    const displayProjects = showOnlyAtRisk
        ? projects.filter(p => p.riskLevel === 'high' || p.profitMargin < 5)
        : projects;

    // Helper functions for styling
    const getRiskBadgeClass = (riskLevel: string) => {
        switch (riskLevel) {
            case 'high': return 'badge-error';
            case 'medium': return 'badge-warning';
            case 'low': return 'badge-success';
            default: return 'badge-neutral';
        }
    };

    const getProfitClass = (profit: number) => {
        if (profit > 0) return 'text-success';
        if (profit < 0) return 'text-error';
        return 'text-warning';
    };

    const getMarginClass = (margin: number) => {
        if (margin >= 15) return 'text-success';
        if (margin >= 5) return 'text-warning';
        return 'text-error';
    };

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="skeleton h-8 w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-24"></div>
                    ))}
                </div>
                <div className="skeleton h-96"></div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Project Profitability Analysis</h2>
                    <p className="text-base-content/70">Track project performance and identify profitability opportunities</p>
                </div>
                <button
                    onClick={loadProjectProfitabilityData}
                    className="btn btn-primary"
                    disabled={loading}
                >
                    <i className="far fa-refresh"></i>
                    Refresh Data
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-figure text-primary">
                        <i className="far fa-dollar-sign text-2xl"></i>
                    </div>
                    <div className="stat-title">Total Budget</div>
                    <div className="stat-value text-primary">{formatCurrency(summary.totalBudget)}</div>
                    <div className="stat-desc">Across {summary.totalProjects} projects</div>
                </div>

                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-figure text-success">
                        <i className="far fa-chart-line text-2xl"></i>
                    </div>
                    <div className="stat-title">Total Profit</div>
                    <div className={`stat-value ${getProfitClass(summary.totalProfit)}`}>
                        {formatCurrency(summary.totalProfit)}
                    </div>
                    <div className="stat-desc">{summary.averageMargin.toFixed(1)}% avg margin</div>
                </div>

                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-figure text-info">
                        <i className="far fa-chart-pie text-2xl"></i>
                    </div>
                    <div className="stat-title">Profitable Projects</div>
                    <div className="stat-value text-info">{summary.profitableProjects}</div>
                    <div className="stat-desc">of {summary.totalProjects} total</div>
                </div>

                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-figure text-warning">
                        <i className="far fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <div className="stat-title">At Risk</div>
                    <div className="stat-value text-warning">{summary.atRiskProjects}</div>
                    <div className="stat-desc">High risk projects</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="text-lg font-semibold mb-4">Filters & Analysis</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            <select
                                className="select select-bordered select-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Risk Level</span>
                            </label>
                            <select
                                className="select select-bordered select-sm"
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value)}
                            >
                                <option value="all">All Risk Levels</option>
                                <option value="low">Low Risk</option>
                                <option value="medium">Medium Risk</option>
                                <option value="high">High Risk</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="cursor-pointer label">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={showOnlyAtRisk}
                                    onChange={(e) => setShowOnlyAtRisk(e.target.checked)}
                                />
                                <span className="label-text ml-2">Show only at-risk projects</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects List */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Project Profitability Details</h3>
                        <div className="text-sm text-base-content/60">
                            Showing {displayProjects.length} of {projects.length} projects
                        </div>
                    </div>

                    {displayProjects.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="far fa-chart-line text-4xl text-base-content/30 mb-4"></i>
                            <h4 className="text-lg font-semibold mb-2">No projects found</h4>
                            <p className="text-base-content/60">
                                {projects.length === 0
                                    ? "No project data available. Create some projects to see profitability analysis."
                                    : "No projects match the current filters. Try adjusting your filter criteria."
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayProjects.map((project) => (
                                <div key={project.id} className="border border-base-300 rounded-lg p-4 hover:bg-base-50 transition-colors">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                        {/* Project Info */}
                                        <div className="lg:col-span-4">
                                            <div>
                                                <h3 className="font-bold text-lg">{project.name}</h3>
                                                <p className="text-base-content/70">{project.clientName}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className={`badge ${getRiskBadgeClass(project.riskLevel)}`}>
                                                        {project.riskLevel} risk
                                                    </div>
                                                    <span className="text-sm text-base-content/60">
                                                        {project.progress}% complete
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Summary */}
                                        <div className="lg:col-span-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-base-content/60">Budget</div>
                                                    <div className="font-semibold">{formatCurrency(project.budget)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-base-content/60">Spent</div>
                                                    <div className="font-semibold">{formatCurrency(project.currentSpend)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-base-content/60">Profit</div>
                                                    <div className={`font-semibold ${getProfitClass(project.profit)}`}>
                                                        {formatCurrency(project.profit)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-base-content/60">Margin</div>
                                                    <div className={`font-semibold ${getMarginClass(project.profitMargin)}`}>
                                                        {project.profitMargin.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cost Breakdown */}
                                        <div className="lg:col-span-3">
                                            <div className="text-sm text-base-content/60 mb-2">Cost Breakdown</div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Labor:</span>
                                                    <span>{formatCurrency(project.laborCosts)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Materials:</span>
                                                    <span>{formatCurrency(project.materialCosts)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Equipment:</span>
                                                    <span>{formatCurrency(project.equipmentCosts)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Overhead:</span>
                                                    <span>{formatCurrency(project.overheadCosts)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="lg:col-span-1 flex flex-col gap-2">
                                            <button className="btn btn-primary btn-sm">
                                                <i className="far fa-chart-line"></i>
                                            </button>
                                            <button className="btn btn-ghost btn-sm">
                                                <i className="far fa-external-link"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Project Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <progress
                                            className="progress progress-primary w-full"
                                            value={project.progress}
                                            max="100"
                                        ></progress>
                                    </div>

                                    {/* Budget Utilization */}
                                    <div className="mt-2">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Budget Utilization</span>
                                            <span>{project.budgetUtilization.toFixed(1)}%</span>
                                        </div>
                                        <progress
                                            className={`progress w-full ${project.budgetUtilization > 90 ? 'progress-error' :
                                                project.budgetUtilization > 75 ? 'progress-warning' :
                                                    'progress-success'
                                                }`}
                                            value={project.budgetUtilization}
                                            max="100"
                                        ></progress>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {displayProjects.length > 0 && displayProjects.length < projects.length && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => setShowOnlyAtRisk(false)}
                                className="btn btn-ghost btn-sm mt-2"
                            >
                                Show All Projects
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectProfitabilityDashboard;
