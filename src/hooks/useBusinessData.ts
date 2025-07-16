import { useState, useCallback } from 'react';
import { CrewMember } from '@/types/crew-members';
import { Equipment } from '@/types/equipment';
import { crewMembersApi, equipmentApi, businessDataApi } from '@/lib/api/business-data';

interface UseBusinessDataResult {
    isLoading: boolean;
    error: string | null;
    getCrewMembers: (businessId: string) => Promise<CrewMember[]>;
    getEquipment: (businessId: string) => Promise<Equipment[]>;
    getCrewMemberById: (businessId: string, id: string) => Promise<CrewMember>;
    getEquipmentById: (businessId: string, id: string) => Promise<Equipment>;
    getAllBusinessData: (businessId: string) => Promise<{ crewMembers: CrewMember[], equipment: Equipment[] }>;
    clearError: () => void;
}

/**
 * Hook for business data operations (crew members and equipment)
 */
export const useBusinessData = (): UseBusinessDataResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleApiCall = useCallback(async <T>(
        apiCall: () => Promise<T>
    ): Promise<T> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await apiCall();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getCrewMembers = useCallback(async (businessId: string): Promise<CrewMember[]> => {
        return handleApiCall(() => crewMembersApi.getAll(businessId));
    }, [handleApiCall]);

    const getEquipment = useCallback(async (businessId: string): Promise<Equipment[]> => {
        return handleApiCall(() => equipmentApi.getAll(businessId));
    }, [handleApiCall]);

    const getCrewMemberById = useCallback(async (businessId: string, id: string): Promise<CrewMember> => {
        return handleApiCall(() => crewMembersApi.getById(id, businessId));
    }, [handleApiCall]);

    const getEquipmentById = useCallback(async (businessId: string, id: string): Promise<Equipment> => {
        return handleApiCall(() => equipmentApi.getById(id, businessId));
    }, [handleApiCall]);

    const getAllBusinessData = useCallback(async (businessId: string): Promise<{ crewMembers: CrewMember[], equipment: Equipment[] }> => {
        return handleApiCall(() => businessDataApi.getAll(businessId));
    }, [handleApiCall]);

    return {
        isLoading,
        error,
        getCrewMembers,
        getEquipment,
        getCrewMemberById,
        getEquipmentById,
        getAllBusinessData,
        clearError,
    };
};
