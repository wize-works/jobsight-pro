/**
 * Business Client Actions - Offline-First Implementation
 * 
 * Provides offline-first business management operations including:
 * - Business creation and setup
 * - Business profile management 
 * - Business status and subscription checks
 * - User-business relationship management
 * 
 * All operations support offline queueing and sync when online.
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
type BusinessUpdate = Partial<Database['public']['Tables']['businesses']['Update']> & { id: string };

// Extended types for business operations
type CreateBusinessParams = {
    userId: string;
    businessName: string;
    businessType?: string;
    phoneNumber?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    email?: string;
};

// Create client-side business actions
const insertBusiness = createInsertAction('businesses', 'high');
const updateBusiness = createUpdateAction('businesses', 'high');
const deleteBusiness = createDeleteAction('businesses', 'medium');
const selectBusinesses = createSelectAction('businesses');

/**
 * Get all businesses - works offline
 */
export const getBusinesses = async (businessId: string): Promise<Business[]> => {
    try {
        const result = await selectBusinesses({}, businessId);

        if (result.error) {
            console.error("Error fetching businesses:", result.error);
            return [];
        }

        return (result.data || []) as Business[];
    } catch (err) {
        console.error("Error in getBusinesses:", err);
        return [];
    }
};

/**
 * Get business by ID - works offline
 */
export const getBusinessById = async (businessId: string, id: string): Promise<Business | null> => {
    try {
        const result = await selectBusinesses({ id }, businessId);

        if (result.error) {
            console.error("Error fetching business by ID:", result.error);
            return null;
        }

        const businesses = result.data as Business[];
        return businesses.length > 0 ? businesses[0] : null;
    } catch (err) {
        console.error("Error in getBusinessById:", err);
        return null;
    }
};

/**
 * Create a new business with complete setup
 * Handles business creation and user assignment in one operation
 */
export const createBusinessWithSetup = async (params: CreateBusinessParams): Promise<Business | null> => {
    try {
        const businessData: BusinessInsert = {
            id: uuidv4(),
            name: params.businessName,
            business_type: params.businessType || "General Contractor",
            address: params.address || null,
            city: params.city || null,
            state: params.state || null,
            zip: params.zipCode || null,
            country: params.country || null,
            phone: params.phoneNumber || null,
            email: params.email || null,
            website: params.website || null,
            owner_id: params.userId,
            logo_url: null,
            tax_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: params.userId,
            updated_by: params.userId,
        };

        const result = await insertBusiness(businessData, params.userId);

        if (result.error) {
            console.error("Error creating business:", result.error);
            return null;
        }

        return result.data as Business;
    } catch (err) {
        console.error("Error in createBusinessWithSetup:", err);
        return null;
    }
};

/**
 * Update business profile information
 */
export const updateBusinessProfile = async (
    businessId: string,
    data: Partial<CreateBusinessParams>,
    userId: string
): Promise<Business | null> => {
    try {
        const updateData: BusinessUpdate = {
            id: businessId,
            name: data.businessName,
            business_type: data.businessType,
            phone: data.phoneNumber,
            website: data.website,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zipCode,
            country: data.country,
            email: data.email,
            updated_at: new Date().toISOString(),
            updated_by: userId,
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key =>
            updateData[key as keyof BusinessUpdate] === undefined &&
            delete updateData[key as keyof BusinessUpdate]
        );

        const result = await updateBusiness(updateData, businessId);

        if (result.error) {
            console.error("Error updating business profile:", result.error);
            return null;
        }

        return result.data as Business;
    } catch (err) {
        console.error("Error in updateBusinessProfile:", err);
        return null;
    }
};

/**
 * Get current user's business
 * Returns the business associated with the current user
 */
export const getUserBusiness = async (userId: string): Promise<Business | null> => {
    try {
        // Query businesses where the user is the owner
        const result = await selectBusinesses({ owner_id: userId }, userId);

        if (result.error) {
            console.error("Error getting user business:", result.error);
            return null;
        }

        const businesses = result.data as Business[];
        return businesses.length > 0 ? businesses[0] : null;
    } catch (err) {
        console.error("Error in getUserBusiness:", err);
        return null;
    }
};

/**
 * Check if user has a business
 * Returns business status information
 */
export const checkUserBusinessStatus = async (userId: string): Promise<{
    success: boolean;
    hasBusiness: boolean;
    businessId?: string;
    error?: string;
}> => {
    try {
        const business = await getUserBusiness(userId);

        return {
            success: true,
            hasBusiness: !!business,
            businessId: business?.id || undefined,
        };
    } catch (err) {
        console.error("Error in checkUserBusinessStatus:", err);
        return {
            success: false,
            hasBusiness: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
};

/**
 * Check business and subscription status
 * Returns comprehensive business and subscription information
 */
export const checkBusinessStatus = async (userId: string): Promise<{
    success: boolean;
    hasBusiness: boolean;
    hasSubscription: boolean;
    businessId?: string;
    error?: string;
}> => {
    try {
        const business = await getUserBusiness(userId);

        // TODO: Check subscription status once business_subscriptions client action is integrated
        const hasSubscription = false; // Placeholder until subscription check is implemented

        return {
            success: true,
            hasBusiness: !!business,
            hasSubscription,
            businessId: business?.id || undefined,
        };
    } catch (err) {
        console.error("Error in checkBusinessStatus:", err);
        return {
            success: false,
            hasBusiness: false,
            hasSubscription: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
};

/**
 * Update business from form data
 * Handles form-based business updates
 */
export const updateBusinessFromForm = async (
    businessId: string,
    formData: Record<string, any>,
    userId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const updateData: BusinessUpdate = {
            id: businessId,
            ...formData,
            updated_at: new Date().toISOString(),
            updated_by: userId,
        };

        // Remove the id field if it was in formData
        const { id: formId, ...restData } = updateData;

        const finalUpdateData: BusinessUpdate = {
            id: businessId,
            ...restData,
            updated_at: new Date().toISOString(),
            updated_by: userId,
        };

        const result = await updateBusiness(finalUpdateData, businessId);

        if (result.error) {
            console.error("Error updating business from form:", result.error);
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in updateBusinessFromForm:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error"
        };
    }
};

/**
 * Assign subscription to business
 * Links a subscription plan to the business
 */
export const assignSubscriptionToBusiness = async (
    userId: string,
    businessId: string,
    subscriptionId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // This will be implemented once business_subscriptions integration is complete
        // For now, this is a placeholder that queues the operation
        const updateData: BusinessUpdate = {
            id: businessId,
            updated_at: new Date().toISOString(),
            updated_by: userId,
        };

        const result = await updateBusiness(updateData, businessId);

        if (result.error) {
            console.error("Error assigning subscription to business:", result.error);
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in assignSubscriptionToBusiness:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error"
        };
    }
};

// Helper functions for business validation and analytics
export const validateBusinessData = (business: Partial<BusinessInsert>): string[] => {
    const errors: string[] = [];

    if (!business.name?.trim()) {
        errors.push('Business name is required');
    }

    if (business.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.email)) {
        errors.push('Invalid email format');
    }

    if (business.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(business.phone)) {
        errors.push('Invalid phone number format');
    }

    return errors;
};

export const getBusinessAnalytics = async (businessId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    totalRevenue: number;
    totalClients: number;
} | null> => {
    try {
        // This will be implemented with proper analytics aggregation
        // For now, return placeholder data
        return {
            totalProjects: 0,
            activeProjects: 0,
            totalRevenue: 0,
            totalClients: 0,
        };
    } catch (err) {
        console.error("Error in getBusinessAnalytics:", err);
        return null;
    }
};
