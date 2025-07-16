export interface CrewUtilizationData {
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

export interface EquipmentUtilizationData {
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

export interface ResourceUtilizationSummary {
    totalCrews: number;
    averageCrewUtilization: number;
    totalEquipment: number;
    averageEquipmentUtilization: number;
    highUtilizationCrews: number;
    highUtilizationEquipment: number;
    idleCrews: number;
    idleEquipment: number;
}

export interface ResourceUtilizationFilters {
    dateRange?: { start: string; end: string };
    crewType?: string;
    equipmentType?: string;
}

export interface ResourceUtilizationData {
    crews: CrewUtilizationData[];
    equipment: EquipmentUtilizationData[];
    summary: ResourceUtilizationSummary;
}

/**
 * Resource Utilization API Client
 * Type-safe API client for resource utilization operations
 */
export class ResourceUtilizationAPI {
    private static baseUrl = '/api/resource-utilization';

    /**
     * Get resource utilization data with optional filters
     */
    static async getResourceUtilizationData(filters?: ResourceUtilizationFilters): Promise<ResourceUtilizationData> {
        const searchParams = new URLSearchParams();

        if (filters?.dateRange) {
            searchParams.append('startDate', filters.dateRange.start);
            searchParams.append('endDate', filters.dateRange.end);
        }

        if (filters?.crewType) {
            searchParams.append('crewType', filters.crewType);
        }

        if (filters?.equipmentType) {
            searchParams.append('equipmentType', filters.equipmentType);
        }

        const queryString = searchParams.toString();
        const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch resource utilization data: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get crew utilization data only
     */
    static async getCrewUtilizationData(filters?: ResourceUtilizationFilters): Promise<CrewUtilizationData[]> {
        const data = await this.getResourceUtilizationData(filters);
        return data.crews;
    }

    /**
     * Get equipment utilization data only
     */
    static async getEquipmentUtilizationData(filters?: ResourceUtilizationFilters): Promise<EquipmentUtilizationData[]> {
        const data = await this.getResourceUtilizationData(filters);
        return data.equipment;
    }

    /**
     * Get resource utilization summary only
     */
    static async getResourceUtilizationSummary(filters?: ResourceUtilizationFilters): Promise<ResourceUtilizationSummary> {
        const data = await this.getResourceUtilizationData(filters);
        return data.summary;
    }
}

/**
 * Helper functions for common resource utilization operations
 */
export const resourceUtilizationAPI = {
    // Get complete resource utilization data
    getResourceUtilization: (filters?: ResourceUtilizationFilters) =>
        ResourceUtilizationAPI.getResourceUtilizationData(filters),

    // Get crew utilization data
    getCrewUtilization: (filters?: ResourceUtilizationFilters) =>
        ResourceUtilizationAPI.getCrewUtilizationData(filters),

    // Get equipment utilization data
    getEquipmentUtilization: (filters?: ResourceUtilizationFilters) =>
        ResourceUtilizationAPI.getEquipmentUtilizationData(filters),

    // Get summary statistics
    getSummary: (filters?: ResourceUtilizationFilters) =>
        ResourceUtilizationAPI.getResourceUtilizationSummary(filters),
};

/**
 * Utility functions for resource utilization analysis
 */
export const resourceUtilizationUtils = {
    /**
     * Calculate utilization rate
     */
    calculateUtilizationRate: (activeHours: number, totalHours: number): number => {
        return totalHours > 0 ? Math.min(100, (activeHours / totalHours) * 100) : 0;
    },

    /**
     * Determine utilization status
     */
    getUtilizationStatus: (utilizationRate: number): 'idle' | 'normal' | 'high' | 'overutilized' => {
        if (utilizationRate < 50) return 'idle';
        if (utilizationRate < 80) return 'normal';
        if (utilizationRate < 100) return 'high';
        return 'overutilized';
    },

    /**
     * Get utilization color for UI
     */
    getUtilizationColor: (utilizationRate: number): string => {
        if (utilizationRate < 50) return 'text-red-600';
        if (utilizationRate < 80) return 'text-green-600';
        if (utilizationRate < 100) return 'text-yellow-600';
        return 'text-red-600';
    },

    /**
     * Format hours for display
     */
    formatHours: (hours: number): string => {
        return `${hours.toFixed(1)}h`;
    },

    /**
     * Format currency for display
     */
    formatCurrency: (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    /**
     * Calculate working days between dates
     */
    calculateWorkingDays: (startDate: string, endDate: string): number => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.floor(daysDiff * (5 / 7)); // Assume 5 working days per week
    },

    /**
     * Get default date range (last 30 days)
     */
    getDefaultDateRange: (): { start: string; end: string } => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
    }
};
