"use client";

/**
 * Business Client Actions - Offline-First Implementation
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { CreateBusinessParams, Business, BusinessUpdate } from "@/types/business";
import { BusinessOfflineManager } from "@/lib/offline/dexie-db";
import {
    CreateResponse,
    GetResponse,
    UpdateResponse,
    ClientActionErrorType,
    createSuccessResponse,
    createErrorResponse
} from "@/types/client-actions";
import { v4 as uuidv4 } from "uuid";

// Global auth state for client actions
let currentClerkUser: { id: string } | null = null;
let authStateInitialized = false;

// Initialize auth state (should be called from a React component that uses Clerk hooks)
export function initializeAuthState(clerkUser: { id: string } | null) {
    currentClerkUser = clerkUser;
    authStateInitialized = true;

    // Cache the auth_id for offline use
    if (typeof window !== 'undefined' && clerkUser?.id) {
        window.localStorage.setItem('cached_auth_id', clerkUser.id);
    } else if (typeof window !== 'undefined' && !clerkUser) {
        // Clear cached auth when user logs out
        window.localStorage.removeItem('cached_auth_id');
    }
}

// Check if we're online
function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get current authenticated user ID (auth_id) from Clerk auth system
async function getCurrentUserId(): Promise<string | null> {
    // First priority: Use initialized Clerk user state (when online and available)tialized Clerk user state (when online and available)tialized Clerk user state (when online and available)
    if (authStateInitialized && currentClerkUser?.id) {
        return currentClerkUser.id;
    }

    // Second priority: Get from cached auth_id (for offline scenarios or when auth state not initialized)
    if (typeof window !== 'undefined') {
        const cachedAuthId = window.localStorage.getItem('cached_auth_id');
        if (cachedAuthId) {
            return cachedAuthId;
        }
    }

    // If no auth state available, return null (user needs to authenticate)
    console.warn('No authenticated user found. Ensure initializeAuthState() is called from a React component.');
    return null;
}

// Validate that user has access to the specified business (using auth_id)
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business (using auth_id)
        const userBusinessId = await BusinessOfflineManager.getBusinessIdForUser(userAuthId);
        if (userBusinessId === businessId) {
            return true;
        }

        // Also check if user is the owner of the business (using auth_id)
        const business = await BusinessOfflineManager.getBusinessById(businessId);
        if (business && business.owner_id === userAuthId) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error validating user business access:", error);
        return false;
    }
}

// Get the user's authorized business ID using auth_id (the only business they should access)
async function getUserAuthorizedBusinessId(userAuthId: string): Promise<string | null> {
    try {
        // First try to get from user-business mapping (using auth_id)
        const businessId = await BusinessOfflineManager.getBusinessIdForUser(userAuthId);
        if (businessId) {
            return businessId;
        }

        // Fallback: try to find business where user is owner (using auth_id)
        const business = await BusinessOfflineManager.getBusinessByOwnerId(userAuthId);
        if (business) {
            // Create the mapping for future use
            await BusinessOfflineManager.setUserBusinessMapping(userAuthId, business.id, 'owner');
            return business.id;
        }

        return null;
    } catch (error) {
        console.error("Error getting user authorized business ID:", error);
        return null;
    }
}

/**
 * Create a new business - Offline-first implementation
 * @param params.userId - This is the auth_id from the auth provider (not internal user.id)
 */
export async function createBusiness(params: CreateBusinessParams): Promise<CreateResponse<{ businessId: string }>> {
    try {
        const businessId = uuidv4();
        const now = new Date().toISOString();

        // Create business object
        const businessData = {
            id: businessId,
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
            created_at: now,
            updated_at: now,
            created_by: params.userId,
            updated_by: params.userId,
        } as Business;

        // Store locally immediately
        await BusinessOfflineManager.addBusiness(businessData);

        // Add user-business mapping for efficient lookup
        await BusinessOfflineManager.setUserBusinessMapping(params.userId, businessId, 'owner');

        // Queue for server sync
        await BusinessOfflineManager.addToSyncQueue(
            'businesses',
            'insert',
            businessData,
            businessId,
            params.userId
        );

        // If online, try to sync immediately (optional - could be background)
        if (isOnline()) {
            console.log('Online - business creation queued for sync');
        }

        return createSuccessResponse({ businessId });
    } catch (error) {
        console.error("Error in createBusiness:", error);
        return createErrorResponse(
            error instanceof Error ? error.message : "Failed to create business",
            ClientActionErrorType.UNKNOWN_ERROR
        );
    }
}

/**
 * Get business by ID - Cache-first implementation with authorization
 */
export async function getBusinessById(businessId: string): Promise<GetResponse<Business>> {
    try {
        // Get current authenticated user (auth_id)
        const userId = await getCurrentUserId();
        if (!userId) {
            return createErrorResponse(
                "Authentication required",
                ClientActionErrorType.AUTHENTICATION_REQUIRED
            );
        }

        // Validate that user has access to this business (using auth_id)
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return createErrorResponse(
                "Access denied to this business",
                ClientActionErrorType.ACCESS_DENIED
            );
        }

        // First, try to get from local database
        const cachedBusiness = await BusinessOfflineManager.getBusinessById(businessId);

        if (cachedBusiness) {
            // Check if data is fresh (within 5 minutes)
            const hasFreshData = await BusinessOfflineManager.hasFreshData(businessId, 'businesses');

            if (hasFreshData || !isOnline()) {
                return createSuccessResponse(cachedBusiness);
            }
        }

        // If not in cache or data is stale, and we're online, fetch from server
        if (isOnline()) {
            try {
                // Use the user's business endpoint to ensure proper authorization
                const response = await fetch(`/api/business/user/${userId}`);
                if (response.ok) {
                    const business = await response.json();
                    // Verify the returned business matches the requested one
                    if (business && business.id === businessId) {
                        // Store in local database
                        await BusinessOfflineManager.addBusiness(business);
                        // Update sync metadata
                        await BusinessOfflineManager.updateSyncMetadata(businessId, 'businesses');
                        return createSuccessResponse(business);
                    } else if (business && business.id !== businessId) {
                        return createErrorResponse(
                            "Requested business ID doesn't match user's business",
                            ClientActionErrorType.ACCESS_DENIED
                        );
                    }
                }
            } catch (error) {
                console.error("Failed to fetch business from server:", error);
            }
        }

        // Return cached version if available, even if stale
        if (cachedBusiness) {
            return createSuccessResponse(cachedBusiness);
        }

        return createErrorResponse(
            "Business not found",
            ClientActionErrorType.NOT_FOUND
        );
    } catch (error) {
        console.error("Error in getBusinessById:", error);
        return createErrorResponse(
            error instanceof Error ? error.message : "Failed to get business",
            ClientActionErrorType.UNKNOWN_ERROR
        );
    }
}

/**
 * Get user's business - Cache-first implementation with user-business mapping
 * @param userId - This is the auth_id from the auth provider (not internal user.id)
 */
export async function getUserBusiness(userId: string): Promise<GetResponse<Business>> {
    try {
        // First, try to get business ID from user-business mapping
        const businessId = await BusinessOfflineManager.getBusinessIdForUser(userId);

        if (businessId) {
            // Use the existing getBusinessById function
            return await getBusinessById(businessId);
        }

        // If no mapping found and we're online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/business/user/${userId}`);
                if (response.ok) {
                    const business = await response.json();
                    if (business) {
                        // Store business in local database
                        await BusinessOfflineManager.addBusiness(business);
                        // Store user-business mapping for future offline access
                        await BusinessOfflineManager.setUserBusinessMapping(userId, business.id, 'owner');
                        // Update sync metadata
                        await BusinessOfflineManager.updateSyncMetadata(business.id, 'businesses');
                        return createSuccessResponse(business);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user business from server:", error);
            }
        }

        // If offline and no mapping, try to find by owner_id (less efficient)
        const businessByOwner = await BusinessOfflineManager.getBusinessByOwnerId(userId);
        if (businessByOwner) {
            // Create mapping for future use
            await BusinessOfflineManager.setUserBusinessMapping(userId, businessByOwner.id, 'owner');
            return createSuccessResponse(businessByOwner);
        }

        return createErrorResponse(
            "No business found for user",
            ClientActionErrorType.NOT_FOUND
        );
    } catch (error) {
        console.error("Error in getUserBusiness:", error);
        return createErrorResponse(
            error instanceof Error ? error.message : "Failed to get user business",
            ClientActionErrorType.UNKNOWN_ERROR
        );
    }
}

/**
 * Update business - Offline-first implementation with authorization
 * @param userId - This is the auth_id from the auth provider (not internal user.id)
 */
export async function updateBusiness(
    businessId: string,
    userId: string,
    data: Partial<CreateBusinessParams>
): Promise<UpdateResponse<Business>> {
    try {
        // Validate that the provided userId (auth_id) matches the authenticated user
        const currentUserId = await getCurrentUserId();
        if (!currentUserId || currentUserId !== userId) {
            return createErrorResponse(
                "Authentication required or user mismatch",
                ClientActionErrorType.AUTHENTICATION_REQUIRED
            );
        }

        // Validate that user has access to this business (using auth_id)
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return createErrorResponse(
                "Access denied to this business",
                ClientActionErrorType.ACCESS_DENIED
            );
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<Business> = {
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
            updated_at: now,
            updated_by: userId,
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key =>
            updateData[key as keyof Business] === undefined && delete updateData[key as keyof Business]
        );

        // Update locally first (optimistic update)
        await BusinessOfflineManager.updateBusiness(businessId, updateData);

        // Queue for server sync
        await BusinessOfflineManager.addToSyncQueue(
            'businesses',
            'update',
            { id: businessId, ...updateData },
            businessId,
            userId
        );

        // Get updated business to return
        const updatedBusiness = await BusinessOfflineManager.getBusinessById(businessId);

        return createSuccessResponse(updatedBusiness || undefined);
    } catch (error) {
        console.error("Error in updateBusiness:", error);
        return createErrorResponse(
            error instanceof Error ? error.message : "Failed to update business",
            ClientActionErrorType.UNKNOWN_ERROR
        );
    }
}

/**
 * Update business from form data - Offline-first implementation
 */
export async function updateBusinessFromForm(formData: FormData): Promise<{
    success: boolean;
    error?: string
}> {
    try {
        const businessId = formData.get("id") as string;
        if (!businessId) {
            return { success: false, error: "Business ID is required" };
        }

        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: "User ID is required" };
        }

        const now = new Date().toISOString();

        // Convert form data to object
        const data: Record<string, any> = {};
        formData.forEach((value, key) => {
            if (key !== "id") {
                data[key] = value;
            }
        });

        // Add timestamp
        data.updated_at = now;
        data.updated_by = userId;

        // Update locally first (optimistic update)
        await BusinessOfflineManager.updateBusiness(businessId, data);

        // Queue for server sync
        await BusinessOfflineManager.addToSyncQueue(
            'businesses',
            'update',
            { id: businessId, ...data },
            businessId,
            userId
        );

        return { success: true };
    } catch (error) {
        console.error("Error in updateBusinessFromForm:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update business"
        };
    }
}

/**
 * Check user business status - Cache-first implementation
 * @param userId - This is the auth_id from the auth provider (not internal user.id)
 */
export async function checkUserBusinessStatus(userId: string): Promise<{
    success: boolean;
    hasBusiness: boolean;
    businessId?: string | null;
    error?: string;
}> {
    try {
        const businessResponse = await getUserBusiness(userId);

        return {
            success: true,
            hasBusiness: businessResponse.success && !!businessResponse.data,
            businessId: businessResponse.data?.id || null
        };
    } catch (error) {
        console.error("Error in checkUserBusinessStatus:", error);
        return {
            success: false,
            hasBusiness: false,
            error: error instanceof Error ? error.message : "Internal server error"
        };
    }
}

/**
 * Check business status - Cache-first implementation
 * @param userId - This is the auth_id from the auth provider (not internal user.id)
 */
export async function checkBusinessStatus(userId: string): Promise<{
    success: boolean;
    hasBusiness: boolean;
    hasSubscription?: boolean;
    businessId?: string | null;
    error?: string;
}> {
    try {
        const businessResponse = await getUserBusiness(userId);

        // TODO: Implement subscription check from cache/server
        // For now, we'll return basic business status

        return {
            success: true,
            hasBusiness: businessResponse.success && !!businessResponse.data,
            hasSubscription: false, // TODO: Implement subscription check
            businessId: businessResponse.data?.id || null
        };
    } catch (error) {
        console.error("Error in checkBusinessStatus:", error);
        return {
            success: false,
            hasBusiness: false,
            error: error instanceof Error ? error.message : "Internal server error"
        };
    }
}

/**
 * Assign subscription to business - Offline-first implementation
 * @param userId - This is the auth_id from the auth provider (not internal user.id)
 */
export async function assignSubscriptionToBusiness(
    userId: string,
    businessId: string,
    subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const now = new Date().toISOString();

        const subscriptionData = {
            business_id: businessId,
            plan_id: subscriptionId,
            status: "incomplete",
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        };

        // TODO: Add business_subscriptions table to Dexie schema
        // For now, we'll queue this for server sync only
        await BusinessOfflineManager.addToSyncQueue(
            'business_subscriptions',
            'insert',
            subscriptionData,
            businessId,
            userId
        );

        return { success: true };
    } catch (error) {
        console.error("Error in assignSubscriptionToBusiness:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to assign subscription"
        };
    }
}