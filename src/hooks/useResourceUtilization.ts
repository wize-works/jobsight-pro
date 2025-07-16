'use client';

import { useState, useEffect } from 'react';
import {
    ResourceUtilizationData,
    ResourceUtilizationFilters,
    CrewUtilizationData,
    EquipmentUtilizationData,
    ResourceUtilizationSummary,
    resourceUtilizationAPI,
    resourceUtilizationUtils
} from '@/lib/api/resource-utilization';

/**
 * Hook to get complete resource utilization data
 */
export function useResourceUtilization(filters?: ResourceUtilizationFilters) {
    const [data, setData] = useState<ResourceUtilizationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await resourceUtilizationAPI.getResourceUtilization(filters);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch resource utilization data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters?.dateRange?.start, filters?.dateRange?.end, filters?.crewType, filters?.equipmentType]);

    return { data, loading, error, refetch: fetchData };
}

/**
 * Hook to get crew utilization data
 */
export function useCrewUtilization(filters?: ResourceUtilizationFilters) {
    const [crews, setCrews] = useState<CrewUtilizationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCrews = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await resourceUtilizationAPI.getCrewUtilization(filters);
            setCrews(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch crew utilization data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCrews();
    }, [filters?.dateRange?.start, filters?.dateRange?.end, filters?.crewType]);

    return { crews, loading, error, refetch: fetchCrews };
}

/**
 * Hook to get equipment utilization data
 */
export function useEquipmentUtilization(filters?: ResourceUtilizationFilters) {
    const [equipment, setEquipment] = useState<EquipmentUtilizationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await resourceUtilizationAPI.getEquipmentUtilization(filters);
            setEquipment(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch equipment utilization data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, [filters?.dateRange?.start, filters?.dateRange?.end, filters?.equipmentType]);

    return { equipment, loading, error, refetch: fetchEquipment };
}

/**
 * Hook to get resource utilization summary
 */
export function useResourceUtilizationSummary(filters?: ResourceUtilizationFilters) {
    const [summary, setSummary] = useState<ResourceUtilizationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await resourceUtilizationAPI.getSummary(filters);
            setSummary(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch resource utilization summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [filters?.dateRange?.start, filters?.dateRange?.end, filters?.crewType, filters?.equipmentType]);

    return { summary, loading, error, refetch: fetchSummary };
}

/**
 * Hook for resource utilization filters management
 */
export function useResourceUtilizationFilters() {
    const [filters, setFilters] = useState<ResourceUtilizationFilters>({
        dateRange: resourceUtilizationUtils.getDefaultDateRange(),
        crewType: 'all',
        equipmentType: 'all'
    });

    const setDateRange = (start: string, end: string) => {
        setFilters(prev => ({
            ...prev,
            dateRange: { start, end }
        }));
    };

    const setCrewType = (crewType: string) => {
        setFilters(prev => ({
            ...prev,
            crewType: crewType === 'all' ? undefined : crewType
        }));
    };

    const setEquipmentType = (equipmentType: string) => {
        setFilters(prev => ({
            ...prev,
            equipmentType: equipmentType === 'all' ? undefined : equipmentType
        }));
    };

    const resetFilters = () => {
        setFilters({
            dateRange: resourceUtilizationUtils.getDefaultDateRange(),
            crewType: 'all',
            equipmentType: 'all'
        });
    };

    return {
        filters,
        setDateRange,
        setCrewType,
        setEquipmentType,
        resetFilters
    };
}

/**
 * Combined hook for resource utilization dashboard
 */
export function useResourceUtilizationDashboard(initialFilters?: ResourceUtilizationFilters) {
    const { filters, setDateRange, setCrewType, setEquipmentType, resetFilters } = useResourceUtilizationFilters();

    // Apply initial filters if provided
    useEffect(() => {
        if (initialFilters) {
            if (initialFilters.dateRange) {
                setDateRange(initialFilters.dateRange.start, initialFilters.dateRange.end);
            }
            if (initialFilters.crewType) {
                setCrewType(initialFilters.crewType);
            }
            if (initialFilters.equipmentType) {
                setEquipmentType(initialFilters.equipmentType);
            }
        }
    }, [initialFilters]);

    const { data, loading, error, refetch } = useResourceUtilization(filters);

    const refreshData = async () => {
        await refetch();
    };

    return {
        // Data
        data,
        crews: data?.crews || [],
        equipment: data?.equipment || [],
        summary: data?.summary || null,

        // Loading states
        loading,
        error,

        // Filters
        filters,
        setDateRange,
        setCrewType,
        setEquipmentType,
        resetFilters,

        // Actions
        refreshData,
        refetch
    };
}

/**
 * Hook for resource utilization analytics
 */
export function useResourceUtilizationAnalytics(data?: ResourceUtilizationData) {
    const analytics = {
        // Crew analytics
        topPerformingCrews: data?.crews
            .sort((a, b) => b.utilizationRate - a.utilizationRate)
            .slice(0, 5) || [],

        underutilizedCrews: data?.crews
            .filter(crew => crew.utilizationRate < 50)
            .sort((a, b) => a.utilizationRate - b.utilizationRate) || [],

        // Equipment analytics
        mostProfitableEquipment: data?.equipment
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5) || [],

        highMaintenanceEquipment: data?.equipment
            .filter(eq => eq.maintenanceHours > 0)
            .sort((a, b) => b.maintenanceHours - a.maintenanceHours) || [],

        // Summary calculations
        totalRevenue: data?.equipment.reduce((sum, eq) => sum + eq.revenue, 0) || 0,

        totalActiveHours: {
            crews: data?.crews.reduce((sum, crew) => sum + crew.activeHours, 0) || 0,
            equipment: data?.equipment.reduce((sum, eq) => sum + eq.activeHours, 0) || 0
        },

        averageEfficiency: data?.crews.length
            ? data.crews.reduce((sum, crew) => sum + crew.efficiency, 0) / data.crews.length
            : 0,

        // Utilization distribution
        utilizationDistribution: {
            idle: {
                crews: data?.crews.filter(c => c.utilizationRate < 50).length || 0,
                equipment: data?.equipment.filter(e => e.utilizationRate < 50).length || 0
            },
            normal: {
                crews: data?.crews.filter(c => c.utilizationRate >= 50 && c.utilizationRate < 80).length || 0,
                equipment: data?.equipment.filter(e => e.utilizationRate >= 50 && e.utilizationRate < 80).length || 0
            },
            high: {
                crews: data?.crews.filter(c => c.utilizationRate >= 80).length || 0,
                equipment: data?.equipment.filter(e => e.utilizationRate >= 80).length || 0
            }
        }
    };

    return analytics;
}

/**
 * Hook for resource utilization export functionality
 */
export function useResourceUtilizationExport() {
    const [exporting, setExporting] = useState(false);

    const exportToCSV = async (data: ResourceUtilizationData, filename: string = 'resource-utilization') => {
        try {
            setExporting(true);

            // Create CSV content
            const csvContent = [
                // Header
                ['Type', 'Name', 'Category', 'Total Hours', 'Active Hours', 'Utilization Rate', 'Additional Info'].join(','),

                // Crew data
                ...data.crews.map(crew => [
                    'Crew',
                    crew.name,
                    crew.type,
                    crew.totalHours,
                    crew.activeHours,
                    `${crew.utilizationRate.toFixed(1)}%`,
                    `${crew.activeProjects} projects, ${crew.efficiency.toFixed(1)}% efficiency`
                ].join(',')),

                // Equipment data
                ...data.equipment.map(eq => [
                    'Equipment',
                    eq.name,
                    eq.type,
                    eq.totalHours,
                    eq.activeHours,
                    `${eq.utilizationRate.toFixed(1)}%`,
                    `$${eq.revenue.toFixed(2)} revenue, ${eq.maintenanceHours}h maintenance`
                ].join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        } finally {
            setExporting(false);
        }
    };

    return { exportToCSV, exporting };
}
