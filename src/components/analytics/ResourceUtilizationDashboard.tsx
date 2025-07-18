"use client";

import React, { useState, useEffect } from 'react';
import { useBusiness } from '@/lib/business-context';
import { formatCurrency } from '@/utils/formatters';
import { useResourceUtilization } from '@/hooks/useResourceUtilization';

interface CrewUtilization {
    id: string;
    name: string;
    type: string;
    totalHours: number;
    activeHours: number;
    utilizationRate: number;
    activeProjects: number;
    efficiency: number;
    averageHoursPerDay: number;
}

interface EquipmentUtilization {
    id: string;
    name: string;
    type: string;
    totalHours: number;
    activeHours: number;
    utilizationRate: number;
    maintenanceHours: number;
    downTime: number;
    costPerHour: number;
    revenue: number;
}

interface ResourceUtilizationSummary {
    totalCrews: number;
    averageCrewUtilization: number;
    totalEquipment: number;
    averageEquipmentUtilization: number;
    highUtilizationCrews: number;
    highUtilizationEquipment: number;
    idleCrews: number;
    idleEquipment: number;
}

interface ResourceUtilizationDashboardProps {
    filters?: {
        dateRange?: { start: string; end: string };
        crewType?: string;
        equipmentType?: string;
    };
}

export default function ResourceUtilizationDashboard({ filters }: ResourceUtilizationDashboardProps) {
    const { businessId } = useBusiness();

    // Filter states
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        end: new Date().toISOString().split('T')[0]
    });
    const [crewTypeFilter, setCrewTypeFilter] = useState<string>('all');
    const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>('all');

    // Use the resource utilization hook
    const { data, loading, error } = useResourceUtilization({
        dateRange: { start: dateRange.start, end: dateRange.end },
        crewType: crewTypeFilter !== 'all' ? crewTypeFilter : undefined,
        equipmentType: equipmentTypeFilter !== 'all' ? equipmentTypeFilter : undefined
    });

    // Extract data from hook result
    const crewData = data?.crews || [];
    const equipmentData = data?.equipment || [];
    const summary = data?.summary || {
        totalCrews: 0,
        averageCrewUtilization: 0,
        totalEquipment: 0,
        averageEquipmentUtilization: 0,
        highUtilizationCrews: 0,
        highUtilizationEquipment: 0,
        idleCrews: 0,
        idleEquipment: 0
    };

    const getUtilizationColor = (rate: number) => {
        if (rate >= 80) return 'text-success';
        if (rate >= 60) return 'text-warning';
        return 'text-error';
    };

    const getUtilizationBadge = (rate: number) => {
        if (rate >= 80) return 'badge-success';
        if (rate >= 60) return 'badge-warning';
        return 'badge-error';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-2">Loading resource utilization data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="far fa-exclamation-triangle"></i>
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Start Date</span>
                            </label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="input input-bordered input-sm"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">End Date</span>
                            </label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="input input-bordered input-sm"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Crew Type</span>
                            </label>
                            <select
                                value={crewTypeFilter}
                                onChange={(e) => setCrewTypeFilter(e.target.value)}
                                className="select select-bordered select-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="electrical">Electrical</option>
                                <option value="plumbing">Plumbing</option>
                                <option value="concrete">Concrete</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Equipment Type</span>
                            </label>
                            <select
                                value={equipmentTypeFilter}
                                onChange={(e) => setEquipmentTypeFilter(e.target.value)}
                                className="select select-bordered select-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="heavy">Heavy Machinery</option>
                                <option value="concrete">Concrete</option>
                                <option value="lifting">Lifting</option>
                                <option value="material">Material Handling</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-primary">
                        <i className="far fa-users fa-2x"></i>
                    </div>
                    <div className="stat-title">Crew Utilization</div>
                    <div className="stat-value text-primary">{summary.averageCrewUtilization.toFixed(1)}%</div>
                    <div className="stat-desc">{summary.totalCrews} total crews</div>
                </div>

                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-secondary">
                        <i className="far fa-cogs fa-2x"></i>
                    </div>
                    <div className="stat-title">Equipment Utilization</div>
                    <div className="stat-value text-secondary">{summary.averageEquipmentUtilization.toFixed(1)}%</div>
                    <div className="stat-desc">{summary.totalEquipment} total equipment</div>
                </div>

                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-success">
                        <i className="far fa-chart-line fa-2x"></i>
                    </div>
                    <div className="stat-title">High Utilization</div>
                    <div className="stat-value text-success">{summary.highUtilizationCrews + summary.highUtilizationEquipment}</div>
                    <div className="stat-desc">Resources above 80%</div>
                </div>

                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-warning">
                        <i className="far fa-exclamation-triangle fa-2x"></i>
                    </div>
                    <div className="stat-title">Idle Resources</div>
                    <div className="stat-value text-warning">{summary.idleCrews + summary.idleEquipment}</div>
                    <div className="stat-desc">Resources below 50%</div>
                </div>
            </div>

            {/* Crew Utilization Table */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title">
                        <i className="far fa-users mr-2"></i>
                        Crew Utilization
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Crew Name</th>
                                    <th>Type</th>
                                    <th>Utilization</th>
                                    <th>Active Hours</th>
                                    <th>Projects</th>
                                    <th>Efficiency</th>
                                    <th>Avg Hours/Day</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crewData.map((crew) => (
                                    <tr key={crew.id}>
                                        <td className="font-medium">{crew.name}</td>
                                        <td>
                                            <span className="badge badge-outline">{crew.type}</span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className={`badge ${getUtilizationBadge(crew.utilizationRate)}`}>
                                                    {crew.utilizationRate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>{crew.activeHours}h / {crew.totalHours}h</td>
                                        <td>{crew.activeProjects}</td>
                                        <td>
                                            <span className={getUtilizationColor(crew.efficiency)}>
                                                {crew.efficiency}%
                                            </span>
                                        </td>
                                        <td>{crew.averageHoursPerDay.toFixed(1)}h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Equipment Utilization Table */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title">
                        <i className="far fa-cogs mr-2"></i>
                        Equipment Utilization
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Equipment Name</th>
                                    <th>Type</th>
                                    <th>Utilization</th>
                                    <th>Active Hours</th>
                                    <th>Maintenance</th>
                                    <th>Cost/Hour</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipmentData.map((equipment) => (
                                    <tr key={equipment.id}>
                                        <td className="font-medium">{equipment.name}</td>
                                        <td>
                                            <span className="badge badge-outline">{equipment.type}</span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className={`badge ${getUtilizationBadge(equipment.utilizationRate)}`}>
                                                    {equipment.utilizationRate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>{equipment.activeHours}h / {equipment.totalHours}h</td>
                                        <td>
                                            <span className="text-warning">
                                                {equipment.maintenanceHours}h
                                            </span>
                                        </td>
                                        <td>{formatCurrency(equipment.costPerHour)}/h</td>
                                        <td className="text-success font-medium">
                                            {formatCurrency(equipment.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
