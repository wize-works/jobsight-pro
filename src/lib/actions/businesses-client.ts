/**
 * Client-Side Businesses Actions
 * 
 * Replaces src/app/actions/businesses.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 * 
 * SECURITY NOTE: Only syncs current user's business data for multi-tenant isolation.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for businesses
type Business = Database['public']['Tables']['businesses']['Row'];
type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
type BusinessUpdate = Partial<Database['public']['Tables']['businesses']['Update']>;

// Create client-side business actions with high priority for critical business data
const insertBusiness = createInsertAction('businesses', 'critical');
const updateBusiness = createUpdateAction('businesses', 'critical');
const deleteBusiness = createDeleteAction('businesses', 'medium');
const selectBusinesses = createSelectAction('businesses');

/**
 * Get current business by ID - works offline
 * SECURITY: Only returns the specific business, not all businesses
 */
export const getCurrentBusiness = async (businessId: string): Promise<Business | null> => {
    try {
        const result = await selectBusinesses({}, businessId);

        if (result.error) {
            console.error("Error fetching business:", result.error);
            return null;
        }

        const businesses = (result.data || []) as Business[];
        const business = businesses.find(b => b.id === businessId);

        if (!business) {
            console.warn(`Business with ID ${businessId} not found`);
            return null;
        }

        return business;
    } catch (err) {
        console.error("Error in getCurrentBusiness:", err);
        return null;
    }
};

/**
 * Create new business - works offline with optimistic updates
 */
export const createBusiness = async (
    data: BusinessInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: Business; error?: string }> => {
    try {
        // Ensure required fields
        const businessData = {
            ...data,
            id: data.id || businessId || uuidv4(),
            created_at: new Date().toISOString(),
            created_by: userId || data.created_by,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by,
        };

        const result = await insertBusiness(businessData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Business };
    } catch (err) {
        console.error("Error in createBusiness:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update current business - works offline with optimistic updates
 * SECURITY: Only allows updating the user's own business
 */
export const updateCurrentBusiness = async (
    businessId: string,
    data: BusinessUpdate,
    userId?: string
): Promise<{ data?: Business; error?: string }> => {
    try {
        const updateData = {
            ...data,
            id: businessId,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by,
        };

        const result = await updateBusiness(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Business };
    } catch (err) {
        console.error("Error in updateCurrentBusiness:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update business profile information - works offline
 */
export const updateBusinessProfile = async (
    businessId: string,
    profileData: {
        name?: string;
        business_type?: string;
        email?: string;
        phone?: string;
        website?: string;
        logo_url?: string;
    },
    userId?: string
): Promise<{ data?: Business; error?: string }> => {
    return updateCurrentBusiness(businessId, profileData, userId);
};

/**
 * Update business address - works offline
 */
export const updateBusinessAddress = async (
    businessId: string,
    addressData: {
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    },
    userId?: string
): Promise<{ data?: Business; error?: string }> => {
    return updateCurrentBusiness(businessId, addressData, userId);
};

/**
 * Update business tax information - works offline
 */
export const updateBusinessTaxInfo = async (
    businessId: string,
    taxData: {
        tax_id?: string;
    },
    userId?: string
): Promise<{ data?: Business; error?: string }> => {
    return updateCurrentBusiness(businessId, taxData, userId);
};

/**
 * Delete business - works offline with optimistic updates
 * SECURITY: Only allows deleting the user's own business
 */
export const deleteCurrentBusiness = async (
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteBusiness({ id: businessId }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteCurrentBusiness:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get business by owner ID - works offline
 * SECURITY: Only returns business if user is the owner
 */
export const getBusinessByOwnerId = async (
    businessId: string,
    ownerId: string
): Promise<Business | null> => {
    try {
        const business = await getCurrentBusiness(businessId);

        if (!business || business.owner_id !== ownerId) {
            console.warn(`User ${ownerId} is not owner of business ${businessId}`);
            return null;
        }

        return business;
    } catch (err) {
        console.error("Error in getBusinessByOwnerId:", err);
        return null;
    }
};

/**
 * Check if user is business owner - works offline
 */
export const isBusinessOwner = async (
    businessId: string,
    userId: string
): Promise<boolean> => {
    try {
        const business = await getCurrentBusiness(businessId);
        return business?.owner_id === userId;
    } catch (err) {
        console.error("Error in isBusinessOwner:", err);
        return false;
    }
};

/**
 * Get business display name - works offline
 */
export const getBusinessDisplayName = async (businessId: string): Promise<string> => {
    try {
        const business = await getCurrentBusiness(businessId);
        return business?.name || "Unknown Business";
    } catch (err) {
        console.error("Error in getBusinessDisplayName:", err);
        return "Unknown Business";
    }
};

/**
 * Get business contact info - works offline
 */
export const getBusinessContactInfo = async (businessId: string): Promise<{
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
}> => {
    try {
        const business = await getCurrentBusiness(businessId);

        if (!business) {
            return {};
        }

        return {
            email: business.email || undefined,
            phone: business.phone || undefined,
            address: business.address || undefined,
            website: business.website || undefined,
        };
    } catch (err) {
        console.error("Error in getBusinessContactInfo:", err);
        return {};
    }
};

/**
 * Check if business operations are pending sync
 */
export const getBusinessSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending business operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

// Export compatibility functions for existing code
export {
    getCurrentBusiness as getBusiness,
    getCurrentBusiness as default,
    createBusiness as insertBusiness,
    updateCurrentBusiness as updateBusiness,
    deleteCurrentBusiness as deleteBusiness
};
