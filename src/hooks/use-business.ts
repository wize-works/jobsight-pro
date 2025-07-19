import { useCallback, useState } from 'react';
import { businessApi, BusinessApiResponse } from '@/lib/api/business';
import { CreateBusinessParams } from '@/types/business';

export function useBusiness() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getUserBusiness = useCallback(async (userId?: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.getUserBusiness(userId);
            if (!result.success) {
                setError(result.error || 'Failed to fetch business');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch business';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getBusinessById = useCallback(async (businessId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.getBusinessById(businessId);
            if (!result.success) {
                setError(result.error || 'Failed to fetch business');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch business';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createBusiness = useCallback(async (params: Omit<CreateBusinessParams, 'userId'>) => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.createBusiness(params);
            if (!result.success) {
                setError(result.error || 'Failed to create business');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create business';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBusiness = useCallback(async (businessId: string, data: Partial<CreateBusinessParams>) => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.updateBusiness(businessId, data);
            if (!result.success) {
                setError(result.error || 'Failed to update business');
                return false;
            }
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update business';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBusinessFromForm = useCallback(async (formData: FormData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.updateBusinessFromForm(formData);
            if (!result.success) {
                setError(result.error || 'Failed to update business');
                return false;
            }
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update business';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const checkUserBusinessStatus = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.checkUserBusinessStatus();
            if (!result.success) {
                setError(result.error || 'Failed to check business status');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to check business status';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const checkBusinessStatus = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.checkBusinessStatus();
            if (!result.success) {
                setError(result.error || 'Failed to check business status');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to check business status';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const assignSubscriptionToBusiness = useCallback(async (businessId: string, subscriptionId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await businessApi.assignSubscriptionToBusiness(businessId, subscriptionId);
            if (!result.success) {
                setError(result.error || 'Failed to assign subscription');
                return false;
            }
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to assign subscription';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        // State
        loading,
        error,

        // Actions
        getUserBusiness,
        getBusinessById,
        createBusiness,
        updateBusiness,
        updateBusinessFromForm,
        checkUserBusinessStatus,
        checkBusinessStatus,
        assignSubscriptionToBusiness,
    };
}
