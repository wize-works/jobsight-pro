// Equipment API client types and functions
export interface Equipment {
    id: string;
    business_id: string;
    name: string;
    type?: string;
    model?: string;
    serial_number?: string;
    description?: string;
    status?: string;
    location?: string;
    purchase_date?: string;
    purchase_price?: number;
    current_value?: number;
    condition?: string;
    manufacturer?: string;
    year?: number;
    hourly_rate?: number;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    assignments?: EquipmentAssignment[];
    maintenance?: EquipmentMaintenance[];
    usage?: EquipmentUsage[];
    specifications?: EquipmentSpecification[];
    stats?: EquipmentStats;
}

export interface EquipmentAssignment {
    id: string;
    business_id: string;
    equipment_id: string;
    employee_id: string;
    project_id?: string;
    start_date: string;
    end_date?: string;
    notes?: string;
    status: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    equipment?: Equipment;
    employee?: any;
    project?: any;
    usage_stats?: {
        total_hours: number;
    };
}

export interface EquipmentUsage {
    id: string;
    business_id: string;
    equipment_id: string;
    employee_id: string;
    project_id?: string;
    start_date: string;
    end_date?: string;
    hours_used: number;
    start_hours?: number;
    end_hours?: number;
    fuel_used?: number;
    notes?: string;
    location?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    equipment?: Equipment;
    employee?: any;
    project?: any;
    assignment?: EquipmentAssignment;
    cost?: {
        hourly_rate: number;
        total_cost: number;
        fuel_cost: number;
    };
}

export interface EquipmentMaintenance {
    id: string;
    business_id: string;
    equipment_id: string;
    maintenance_type: string;
    maintenance_date: string;
    description?: string;
    cost?: number;
    performed_by?: string;
    status: string;
    priority: string;
    scheduled_date?: string;
    completed_date?: string;
    notes?: string;
    parts_used?: string;
    labor_hours?: number;
    next_maintenance_date?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    equipment?: Equipment;
    performer?: any;
    history?: EquipmentMaintenance[];
    cost_analysis?: {
        total_cost: number;
        average_cost: number;
        cost_per_month: number;
        maintenance_frequency: number;
    };
}

export interface EquipmentSpecification {
    id: string;
    business_id: string;
    equipment_id: string;
    specification: string;
    value: string;
    unit?: string;
    category?: string;
    description?: string;
    is_critical: boolean;
    min_value?: string;
    max_value?: string;
    tolerance?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    equipment?: Equipment;
    related?: EquipmentSpecification[];
    validation?: {
        has_min_max: boolean;
        has_tolerance: boolean;
        is_within_range: boolean;
        critical_status: string;
    };
    history?: any[];
}

export interface EquipmentStats {
    total_hours: number;
    maintenance_cost: number;
    active_assignments: number;
    utilization_rate: number;
}

// Query parameters
export interface EquipmentQuery {
    include?: string;
    search?: string;
    status?: string;
    type?: string;
    location?: string;
    limit?: number;
    offset?: number;
}

export interface EquipmentAssignmentQuery {
    include?: string;
    equipment_id?: string;
    employee_id?: string;
    project_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}

export interface EquipmentUsageQuery {
    include?: string;
    equipment_id?: string;
    employee_id?: string;
    project_id?: string;
    start_date?: string;
    end_date?: string;
    min_hours?: number;
    max_hours?: number;
    limit?: number;
    offset?: number;
}

export interface EquipmentMaintenanceQuery {
    include?: string;
    equipment_id?: string;
    maintenance_type?: string;
    status?: string;
    priority?: string;
    start_date?: string;
    end_date?: string;
    min_cost?: number;
    max_cost?: number;
    limit?: number;
    offset?: number;
}

export interface EquipmentSpecificationQuery {
    include?: string;
    equipment_id?: string;
    specification?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

// Create/Update types
export interface CreateEquipmentData {
    name: string;
    type?: string;
    model?: string;
    serial_number?: string;
    description?: string;
    status?: string;
    location?: string;
    purchase_date?: string;
    purchase_price?: number;
    current_value?: number;
    condition?: string;
    manufacturer?: string;
    year?: number;
}

export interface UpdateEquipmentData extends Partial<CreateEquipmentData> { }

export interface CreateEquipmentAssignmentData {
    equipment_id: string;
    employee_id: string;
    project_id?: string;
    start_date: string;
    end_date?: string;
    notes?: string;
    status?: string;
}

export interface UpdateEquipmentAssignmentData extends Partial<CreateEquipmentAssignmentData> { }

export interface CreateEquipmentUsageData {
    equipment_id: string;
    employee_id: string;
    project_id?: string;
    start_date: string;
    end_date?: string;
    hours_used: number;
    start_hours?: number;
    end_hours?: number;
    fuel_used?: number;
    notes?: string;
    location?: string;
}

export interface UpdateEquipmentUsageData extends Partial<CreateEquipmentUsageData> { }

export interface CreateEquipmentMaintenanceData {
    equipment_id: string;
    maintenance_type: string;
    maintenance_date: string;
    description?: string;
    cost?: number;
    performed_by?: string;
    status?: string;
    priority?: string;
    scheduled_date?: string;
    completed_date?: string;
    notes?: string;
    parts_used?: string;
    labor_hours?: number;
    next_maintenance_date?: string;
}

export interface UpdateEquipmentMaintenanceData extends Partial<CreateEquipmentMaintenanceData> { }

export interface CreateEquipmentSpecificationData {
    equipment_id: string;
    specification: string;
    value: string;
    unit?: string;
    category?: string;
    description?: string;
    is_critical?: boolean;
    min_value?: string;
    max_value?: string;
    tolerance?: string;
}

export interface UpdateEquipmentSpecificationData extends Partial<CreateEquipmentSpecificationData> { }

// API response types
export interface EquipmentResponse {
    data: Equipment[];
    count: number;
}

export interface EquipmentAssignmentResponse {
    data: EquipmentAssignment[];
    count: number;
}

export interface EquipmentUsageResponse {
    data: EquipmentUsage[];
    count: number;
}

export interface EquipmentMaintenanceResponse {
    data: EquipmentMaintenance[];
    count: number;
}

export interface EquipmentSpecificationResponse {
    data: EquipmentSpecification[];
    count: number;
}

// Equipment API functions
export const equipmentApi = {
    // Equipment CRUD
    async getEquipment(params?: EquipmentQuery): Promise<EquipmentResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/equipment?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch equipment');
        }
        return response.json();
    },

    async createEquipment(data: CreateEquipmentData): Promise<{ data: Equipment; message: string }> {
        const response = await fetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create equipment');
        }
        return response.json();
    },

    async updateEquipment(id: string, data: UpdateEquipmentData): Promise<{ data: Equipment; message: string }> {
        const response = await fetch('/api/equipment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update equipment');
        }
        return response.json();
    },

    async deleteEquipment(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/equipment?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete equipment');
        }
        return response.json();
    },

    // Equipment Assignments
    async getEquipmentAssignments(params?: EquipmentAssignmentQuery): Promise<EquipmentAssignmentResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/equipment-assignments?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch equipment assignments');
        }
        return response.json();
    },

    async createEquipmentAssignment(data: CreateEquipmentAssignmentData): Promise<{ data: EquipmentAssignment; message: string }> {
        const response = await fetch('/api/equipment-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create equipment assignment');
        }
        return response.json();
    },

    async updateEquipmentAssignment(id: string, data: UpdateEquipmentAssignmentData): Promise<{ data: EquipmentAssignment; message: string }> {
        const response = await fetch('/api/equipment-assignments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update equipment assignment');
        }
        return response.json();
    },

    async deleteEquipmentAssignment(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/equipment-assignments?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete equipment assignment');
        }
        return response.json();
    },

    // Equipment Usage
    async getEquipmentUsage(params?: EquipmentUsageQuery): Promise<EquipmentUsageResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/equipment-usage?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch equipment usage');
        }
        return response.json();
    },

    async createEquipmentUsage(data: CreateEquipmentUsageData): Promise<{ data: EquipmentUsage; message: string }> {
        const response = await fetch('/api/equipment-usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create equipment usage');
        }
        return response.json();
    },

    async updateEquipmentUsage(id: string, data: UpdateEquipmentUsageData): Promise<{ data: EquipmentUsage; message: string }> {
        const response = await fetch('/api/equipment-usage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update equipment usage');
        }
        return response.json();
    },

    async deleteEquipmentUsage(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/equipment-usage?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete equipment usage');
        }
        return response.json();
    },

    // Equipment Maintenance
    async getEquipmentMaintenance(params?: EquipmentMaintenanceQuery): Promise<EquipmentMaintenanceResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/equipment-maintenance?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch equipment maintenance');
        }
        return response.json();
    },

    async createEquipmentMaintenance(data: CreateEquipmentMaintenanceData): Promise<{ data: EquipmentMaintenance; message: string }> {
        const response = await fetch('/api/equipment-maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create equipment maintenance');
        }
        return response.json();
    },

    async updateEquipmentMaintenance(id: string, data: UpdateEquipmentMaintenanceData): Promise<{ data: EquipmentMaintenance; message: string }> {
        const response = await fetch('/api/equipment-maintenance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update equipment maintenance');
        }
        return response.json();
    },

    async deleteEquipmentMaintenance(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/equipment-maintenance?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete equipment maintenance');
        }
        return response.json();
    },

    // Equipment Specifications
    async getEquipmentSpecifications(params?: EquipmentSpecificationQuery): Promise<EquipmentSpecificationResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/equipment-specifications?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch equipment specifications');
        }
        return response.json();
    },

    async createEquipmentSpecification(data: CreateEquipmentSpecificationData): Promise<{ data: EquipmentSpecification; message: string }> {
        const response = await fetch('/api/equipment-specifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create equipment specification');
        }
        return response.json();
    },

    async updateEquipmentSpecification(id: string, data: UpdateEquipmentSpecificationData): Promise<{ data: EquipmentSpecification; message: string }> {
        const response = await fetch('/api/equipment-specifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update equipment specification');
        }
        return response.json();
    },

    async deleteEquipmentSpecification(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/equipment-specifications?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete equipment specification');
        }
        return response.json();
    },
};

// Utility functions
export const equipmentUtils = {
    // Filter equipment by status
    filterByStatus: (equipment: Equipment[], status: string) => {
        return equipment.filter(eq => eq.status === status);
    },

    // Get equipment utilization rate
    getUtilizationRate: (equipment: Equipment): number => {
        return equipment.stats?.utilization_rate || 0;
    },

    // Calculate total maintenance cost
    getTotalMaintenanceCost: (equipment: Equipment): number => {
        return equipment.stats?.maintenance_cost || 0;
    },

    // Get active assignments count
    getActiveAssignmentsCount: (equipment: Equipment): number => {
        return equipment.stats?.active_assignments || 0;
    },

    // Format currency
    formatCurrency: (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    },

    // Format hours
    formatHours: (hours: number): string => {
        return `${hours.toFixed(1)} hrs`;
    },

    // Get equipment age in years
    getEquipmentAge: (purchaseDate: string): number => {
        const purchase = new Date(purchaseDate);
        const now = new Date();
        return Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365));
    },

    // Calculate depreciation
    calculateDepreciation: (equipment: Equipment): number => {
        if (!equipment.purchase_price || !equipment.purchase_date) return 0;

        const age = equipmentUtils.getEquipmentAge(equipment.purchase_date);
        const depreciationRate = 0.1; // 10% per year
        const depreciation = equipment.purchase_price * depreciationRate * age;

        return Math.max(0, equipment.purchase_price - depreciation);
    },
};
