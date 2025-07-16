import { useState, useEffect } from 'react';
import { equipmentApi } from '@/lib/api/equipment';
import type {
    Equipment,
    EquipmentAssignment,
    EquipmentUsage,
    EquipmentMaintenance,
    EquipmentSpecification,
    EquipmentQuery,
    EquipmentAssignmentQuery,
    EquipmentUsageQuery,
    EquipmentMaintenanceQuery,
    EquipmentSpecificationQuery,
    CreateEquipmentData,
    UpdateEquipmentData,
    CreateEquipmentAssignmentData,
    UpdateEquipmentAssignmentData,
    CreateEquipmentUsageData,
    UpdateEquipmentUsageData,
    CreateEquipmentMaintenanceData,
    UpdateEquipmentMaintenanceData,
    CreateEquipmentSpecificationData,
    UpdateEquipmentSpecificationData,
} from '@/lib/api/equipment';

// Generic hook state interface
interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiListState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    count: number;
}

// Equipment hooks
export function useEquipment(params?: EquipmentQuery) {
    const [state, setState] = useState<UseApiListState<Equipment>>({
        data: [],
        loading: true,
        error: null,
        count: 0,
    });

    const fetchEquipment = async (queryParams?: EquipmentQuery) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const response = await equipmentApi.getEquipment(queryParams || params);
            setState({
                data: response.data,
                loading: false,
                error: null,
                count: response.count,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch equipment',
            }));
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    return {
        ...state,
        refetch: fetchEquipment,
    };
}

export function useEquipmentMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createEquipment = async (data: CreateEquipmentData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.createEquipment(data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create equipment';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const updateEquipment = async (id: string, data: UpdateEquipmentData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.updateEquipment(id, data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update equipment';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const deleteEquipment = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.deleteEquipment(id);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete equipment';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    return {
        createEquipment,
        updateEquipment,
        deleteEquipment,
        loading,
        error,
    };
}

// Equipment Assignments hooks
export function useEquipmentAssignments(params?: EquipmentAssignmentQuery) {
    const [state, setState] = useState<UseApiListState<EquipmentAssignment>>({
        data: [],
        loading: true,
        error: null,
        count: 0,
    });

    const fetchAssignments = async (queryParams?: EquipmentAssignmentQuery) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const response = await equipmentApi.getEquipmentAssignments(queryParams || params);
            setState({
                data: response.data,
                loading: false,
                error: null,
                count: response.count,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch assignments',
            }));
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    return {
        ...state,
        refetch: fetchAssignments,
    };
}

export function useEquipmentAssignmentMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createAssignment = async (data: CreateEquipmentAssignmentData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.createEquipmentAssignment(data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create assignment';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const updateAssignment = async (id: string, data: UpdateEquipmentAssignmentData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.updateEquipmentAssignment(id, data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update assignment';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const deleteAssignment = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.deleteEquipmentAssignment(id);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete assignment';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    return {
        createAssignment,
        updateAssignment,
        deleteAssignment,
        loading,
        error,
    };
}

// Equipment Usage hooks
export function useEquipmentUsage(params?: EquipmentUsageQuery) {
    const [state, setState] = useState<UseApiListState<EquipmentUsage>>({
        data: [],
        loading: true,
        error: null,
        count: 0,
    });

    const fetchUsage = async (queryParams?: EquipmentUsageQuery) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const response = await equipmentApi.getEquipmentUsage(queryParams || params);
            setState({
                data: response.data,
                loading: false,
                error: null,
                count: response.count,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch usage',
            }));
        }
    };

    useEffect(() => {
        fetchUsage();
    }, []);

    return {
        ...state,
        refetch: fetchUsage,
    };
}

export function useEquipmentUsageMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createUsage = async (data: CreateEquipmentUsageData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.createEquipmentUsage(data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create usage record';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const updateUsage = async (id: string, data: UpdateEquipmentUsageData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.updateEquipmentUsage(id, data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update usage record';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const deleteUsage = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.deleteEquipmentUsage(id);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete usage record';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    return {
        createUsage,
        updateUsage,
        deleteUsage,
        loading,
        error,
    };
}

// Equipment Maintenance hooks
export function useEquipmentMaintenance(params?: EquipmentMaintenanceQuery) {
    const [state, setState] = useState<UseApiListState<EquipmentMaintenance>>({
        data: [],
        loading: true,
        error: null,
        count: 0,
    });

    const fetchMaintenance = async (queryParams?: EquipmentMaintenanceQuery) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const response = await equipmentApi.getEquipmentMaintenance(queryParams || params);
            setState({
                data: response.data,
                loading: false,
                error: null,
                count: response.count,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch maintenance records',
            }));
        }
    };

    useEffect(() => {
        fetchMaintenance();
    }, []);

    return {
        ...state,
        refetch: fetchMaintenance,
    };
}

export function useEquipmentMaintenanceMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createMaintenance = async (data: CreateEquipmentMaintenanceData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.createEquipmentMaintenance(data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create maintenance record';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const updateMaintenance = async (id: string, data: UpdateEquipmentMaintenanceData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.updateEquipmentMaintenance(id, data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update maintenance record';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const deleteMaintenance = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.deleteEquipmentMaintenance(id);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete maintenance record';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    return {
        createMaintenance,
        updateMaintenance,
        deleteMaintenance,
        loading,
        error,
    };
}

// Equipment Specifications hooks
export function useEquipmentSpecifications(params?: EquipmentSpecificationQuery) {
    const [state, setState] = useState<UseApiListState<EquipmentSpecification>>({
        data: [],
        loading: true,
        error: null,
        count: 0,
    });

    const fetchSpecifications = async (queryParams?: EquipmentSpecificationQuery) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const response = await equipmentApi.getEquipmentSpecifications(queryParams || params);
            setState({
                data: response.data,
                loading: false,
                error: null,
                count: response.count,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch specifications',
            }));
        }
    };

    useEffect(() => {
        fetchSpecifications();
    }, []);

    return {
        ...state,
        refetch: fetchSpecifications,
    };
}

export function useEquipmentSpecificationMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSpecification = async (data: CreateEquipmentSpecificationData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.createEquipmentSpecification(data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create specification';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const updateSpecification = async (id: string, data: UpdateEquipmentSpecificationData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.updateEquipmentSpecification(id, data);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update specification';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const deleteSpecification = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await equipmentApi.deleteEquipmentSpecification(id);
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete specification';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    return {
        createSpecification,
        updateSpecification,
        deleteSpecification,
        loading,
        error,
    };
}

// Utility hooks
export function useEquipmentStats(equipmentId: string) {
    const [stats, setStats] = useState<{
        totalHours: number;
        maintenanceCost: number;
        activeAssignments: number;
        utilizationRate: number;
    } | null>(null);

    const { data: equipment } = useEquipment({
        include: 'stats',
        // This would need to be modified to filter by ID if the API supports it
    });

    useEffect(() => {
        if (equipment) {
            const targetEquipment = equipment.find(eq => eq.id === equipmentId);
            if (targetEquipment?.stats) {
                setStats({
                    totalHours: targetEquipment.stats.total_hours,
                    maintenanceCost: targetEquipment.stats.maintenance_cost,
                    activeAssignments: targetEquipment.stats.active_assignments,
                    utilizationRate: targetEquipment.stats.utilization_rate,
                });
            }
        }
    }, [equipment, equipmentId]);

    return stats;
}

export function useEquipmentSearch(searchQuery: string) {
    const [searchResults, setSearchResults] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await equipmentApi.getEquipment({
                search: query,
                limit: 20,
            });
            setSearchResults(response.data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Search failed');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch(searchQuery);
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return {
        searchResults,
        loading,
        error,
        performSearch,
    };
}

export function useEquipmentFilters() {
    const [filters, setFilters] = useState<{
        status?: string;
        type?: string;
        location?: string;
    }>({});

    const { data: equipment, loading, error, refetch } = useEquipment(filters);

    const updateFilters = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const clearFilters = () => {
        setFilters({});
    };

    return {
        equipment,
        loading,
        error,
        filters,
        updateFilters,
        clearFilters,
        refetch,
    };
}
