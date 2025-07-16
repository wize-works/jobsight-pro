import { useState, useCallback } from 'react';
import { BillingRate } from '@/types/invoice-automation';
import {
    crewMemberRateApi,
    equipmentRateApi,
    businessRateApi,
    CrewMemberRateRequest,
    EquipmentRateRequest,
    BusinessRateRequest
} from '@/lib/api/rate-management';

interface UseRateManagementResult {
    isLoading: boolean;
    error: string | null;
    updateCrewMemberRate: (request: CrewMemberRateRequest) => Promise<BillingRate>;
    getCrewMemberRate: (crewMemberId: string, businessId: string) => Promise<BillingRate>;
    updateEquipmentRate: (request: EquipmentRateRequest) => Promise<BillingRate>;
    getEquipmentRate: (equipmentId: string, businessId: string) => Promise<BillingRate>;
    updateBusinessRate: (request: BusinessRateRequest) => Promise<BillingRate>;
    getBusinessRate: (businessId: string) => Promise<BillingRate>;
    clearError: () => void;
}

/**
 * Hook for rate management operations
 */
export const useRateManagement = (): UseRateManagementResult => {
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

    const updateCrewMemberRate = useCallback(async (request: CrewMemberRateRequest): Promise<BillingRate> => {
        return handleApiCall(() => crewMemberRateApi.updateRate(request));
    }, [handleApiCall]);

    const getCrewMemberRate = useCallback(async (crewMemberId: string, businessId: string): Promise<BillingRate> => {
        return handleApiCall(() => crewMemberRateApi.getRate(crewMemberId, businessId));
    }, [handleApiCall]);

    const updateEquipmentRate = useCallback(async (request: EquipmentRateRequest): Promise<BillingRate> => {
        return handleApiCall(() => equipmentRateApi.updateRate(request));
    }, [handleApiCall]);

    const getEquipmentRate = useCallback(async (equipmentId: string, businessId: string): Promise<BillingRate> => {
        return handleApiCall(() => equipmentRateApi.getRate(equipmentId, businessId));
    }, [handleApiCall]);

    const updateBusinessRate = useCallback(async (request: BusinessRateRequest): Promise<BillingRate> => {
        return handleApiCall(() => businessRateApi.updateRate(request));
    }, [handleApiCall]);

    const getBusinessRate = useCallback(async (businessId: string): Promise<BillingRate> => {
        return handleApiCall(() => businessRateApi.getRate(businessId));
    }, [handleApiCall]);

    return {
        isLoading,
        error,
        updateCrewMemberRate,
        getCrewMemberRate,
        updateEquipmentRate,
        getEquipmentRate,
        updateBusinessRate,
        getBusinessRate,
        clearError,
    };
};
