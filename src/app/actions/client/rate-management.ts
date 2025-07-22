/**
 * Rate Management Service - Client-side actions with offline-first architecture
 * Part of the invoice automation system (Phase 2 - Rate Management)
 */

'use client';

import { db } from '@/lib/offline/dexie-db';
import { BillingRate, RateValidationResult } from '@/types/invoice-automation';
import { getCurrentUserId, isOnline } from './auth-utils';
import { v4 as uuidv4 } from 'uuid';
import { CrewMember } from '@/types/crew-members';
import { Equipment } from '@/types/equipment';

// Helper to get current user and business context
async function getCurrentUserContext(): Promise<{ userId: string | null; businessId: string | null }> {
    // Get user ID from auth utils
    const userId = await getCurrentUserId();

    // Get business ID from localStorage
    const businessId = typeof window !== 'undefined' ?
        localStorage.getItem('businessId') : null;

    return { userId, businessId };
}

// Helper function to add sync operation to queue
async function addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    businessId: string,
    userId?: string
): Promise<void> {
    const syncItem = {
        id: uuidv4(),
        table,
        operation,
        data,
        businessId,
        userId,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    };

    await db.syncQueue.add(syncItem);
}

// Validate that user has access to the specified business
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business
        const userBusinessId = await db.userBusinessMappings.get(userAuthId);
        if (userBusinessId?.businessId === businessId) {
            return true;
        }

        // If no mapping found locally, check with business table
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            // Create the mapping for future use
            await db.userBusinessMappings.put({
                userId: userAuthId,
                businessId: businessId,
                role: 'owner',
                lastUpdated: Date.now()
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error validating business access:', error);
        return false;
    }
}

/**
 * Set hourly rate for a crew member
 */
export async function setCrewMemberRate(
    crewMemberId: string,
    rate: BillingRate
): Promise<{ success: true } | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();

        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to modify rates for this business." };
        }

        // Get current crew member
        const crewMember = await db.crewMembers.get(crewMemberId);
        if (!crewMember) {
            return { error: "Crew member not found." };
        }

        // Verify crew member belongs to this business
        if (crewMember.business_id !== businessId) {
            return { error: "Access denied. Crew member does not belong to this business." };
        }

        const now = new Date().toISOString();

        // Update crew member with new rates
        const updatedCrewMember: CrewMember = {
            ...crewMember,
            hourly_rate: rate.hourlyRate,
            overtime_rate: rate.overtimeRate || null,
            doubletime_rate: rate.doubletimeRate || null,
            updated_at: now,
            updated_by: userId
        };

        // Update locally first (optimistic update)
        await db.crewMembers.put(updatedCrewMember);

        // Queue for sync with server
        await addToSyncQueue(
            'crew_members',
            'update',
            updatedCrewMember,
            businessId,
            userId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-members/${crewMemberId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hourly_rate: rate.hourlyRate,
                        overtime_rate: rate.overtimeRate,
                        doubletime_rate: rate.doubletimeRate,
                        businessId
                    }),
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('crew_members')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });
                }
            } catch (error) {
                console.warn('Failed to sync crew member rate to server immediately:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error setting crew member rate:', error);
        return { error: error instanceof Error ? error.message : "Failed to set crew member rate" };
    }
}

/**
 * Get hourly rate for a crew member
 */
export async function getCrewMemberRate(
    crewMemberId: string,
    date?: string
): Promise<BillingRate | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();

        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to view rates for this business." };
        }

        // Get crew member
        const crewMember = await db.crewMembers.get(crewMemberId);
        if (!crewMember) {
            return { error: "Crew member not found." };
        }

        // Verify crew member belongs to this business
        if (crewMember.business_id !== businessId) {
            return { error: "Access denied. Crew member does not belong to this business." };
        }

        // Return current rates
        const billingRate: BillingRate = {
            hourlyRate: crewMember.hourly_rate || 0,
            overtimeRate: crewMember.overtime_rate || undefined,
            doubletimeRate: crewMember.doubletime_rate || undefined,
            effectiveDate: date || new Date().toISOString()
        };

        return billingRate;

    } catch (error) {
        console.error('Error getting crew member rate:', error);
        return { error: error instanceof Error ? error.message : "Failed to get crew member rate" };
    }
}

/**
 * Set hourly rate for equipment
 */
export async function setEquipmentRate(
    equipmentId: string,
    rate: BillingRate
): Promise<{ success: true } | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();

        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to modify rates for this business." };
        }

        // Get current equipment
        const equipment = await db.equipment.get(equipmentId);
        if (!equipment) {
            return { error: "Equipment not found." };
        }

        // Verify equipment belongs to this business
        if (equipment.business_id !== businessId) {
            return { error: "Access denied. Equipment does not belong to this business." };
        }

        const now = new Date().toISOString();

        // Update equipment with new rate
        const updatedEquipment: Equipment = {
            ...equipment,
            hourly_rate: rate.hourlyRate,
            updated_at: now,
            updated_by: userId
        };

        // Update locally first (optimistic update)
        await db.equipment.put(updatedEquipment);

        // Queue for sync with server
        await addToSyncQueue(
            'equipment',
            'update',
            updatedEquipment,
            businessId,
            userId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment/${equipmentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hourly_rate: rate.hourlyRate,
                        businessId
                    }),
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipment')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });
                }
            } catch (error) {
                console.warn('Failed to sync equipment rate to server immediately:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error setting equipment rate:', error);
        return { error: error instanceof Error ? error.message : "Failed to set equipment rate" };
    }
}

/**
 * Get hourly rate for equipment
 */
export async function getEquipmentRate(
    equipmentId: string,
    date?: string
): Promise<BillingRate | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();

        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to view rates for this business." };
        }

        // Get equipment
        const equipment = await db.equipment.get(equipmentId);
        if (!equipment) {
            return { error: "Equipment not found." };
        }

        // Verify equipment belongs to this business
        if (equipment.business_id !== businessId) {
            return { error: "Access denied. Equipment does not belong to this business." };
        }

        // Return current rate
        const billingRate: BillingRate = {
            hourlyRate: equipment.hourly_rate || 0,
            effectiveDate: date || new Date().toISOString()
        };

        return billingRate;

    } catch (error) {
        console.error('Error getting equipment rate:', error);
        return { error: error instanceof Error ? error.message : "Failed to get equipment rate" };
    }
}

/**
 * Get rates for multiple crew members
 */
export async function getCrewMemberRates(
    crewMemberIds: string[],
    date?: string
): Promise<Record<string, BillingRate> | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();

        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to view rates for this business." };
        }

        // Get crew members
        const crewMembers = await db.crewMembers
            .where('id')
            .anyOf(crewMemberIds)
            .and(cm => cm.business_id === businessId)
            .toArray();

        const rates: Record<string, BillingRate> = {};

        crewMembers.forEach(crewMember => {
            rates[crewMember.id] = {
                hourlyRate: crewMember.hourly_rate || 0,
                overtimeRate: crewMember.overtime_rate || undefined,
                doubletimeRate: crewMember.doubletime_rate || undefined,
                effectiveDate: date || new Date().toISOString()
            };
        });

        return rates;

    } catch (error) {
        console.error('Error getting crew member rates:', error);
        return { error: error instanceof Error ? error.message : "Failed to get crew member rates" };
    }
}

/**
 * Get rates for multiple equipment
 */
export async function getEquipmentRates(
    equipmentIds: string[],
    date?: string
): Promise<Record<string, BillingRate> | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();

        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to view rates for this business." };
        }

        // Get equipment
        const equipment = await db.equipment
            .where('id')
            .anyOf(equipmentIds)
            .and(eq => eq.business_id === businessId)
            .toArray();

        const rates: Record<string, BillingRate> = {};

        equipment.forEach(eq => {
            rates[eq.id] = {
                hourlyRate: eq.hourly_rate || 0,
                effectiveDate: date || new Date().toISOString()
            };
        });

        return rates;

    } catch (error) {
        console.error('Error getting equipment rates:', error);
        return { error: error instanceof Error ? error.message : "Failed to get equipment rates" };
    }
}

/**
 * Validate rates for a business
 * Note: This function is called from both client and server contexts
 * When called from client-side rate management, skip auth validation
 */
export async function validateRates(businessId: string, skipAuth: boolean = false): Promise<RateValidationResult> {
    try {
        // Skip authentication validation if called from authenticated client-side context
        if (!skipAuth) {
            const { userId } = await getCurrentUserContext();

            if (!userId) {
                return {
                    isValid: false,
                    missingRates: { crewMembers: [], equipment: [] },
                    warnings: ["Authentication required"]
                };
            }

            // Validate user has access to this business
            const hasAccess = await validateUserBusinessAccess(userId, businessId);
            if (!hasAccess) {
                return {
                    isValid: false,
                    missingRates: { crewMembers: [], equipment: [] },
                    warnings: ["Access denied to business"]
                };
            }
        }

        // Get all crew members and equipment for this business
        const crewMembers = await db.crewMembers
            .where('business_id')
            .equals(businessId)
            .toArray();

        const equipment = await db.equipment
            .where('business_id')
            .equals(businessId)
            .toArray();

        const missingRates = {
            crewMembers: crewMembers
                .filter(cm => cm.is_billable && (!cm.hourly_rate || cm.hourly_rate === 0))
                .map(cm => cm.name),
            equipment: equipment
                .filter(eq => eq.is_billable && (!eq.hourly_rate || eq.hourly_rate === 0))
                .map(eq => eq.name)
        };

        const warnings: string[] = [];

        // Check for crew members without overtime rates
        const crewMembersWithoutOvertimeRates = crewMembers
            .filter(cm => cm.is_billable && cm.hourly_rate && cm.hourly_rate > 0 && !cm.overtime_rate && !cm.doubletime_rate && cm.overtime_rate !== 0 && !cm.doubletime_rate && cm.doubletime_rate !== 0)
            .length;

        if (crewMembersWithoutOvertimeRates > 0) {
            warnings.push(`${crewMembersWithoutOvertimeRates} crew members don't have overtime rates set`);
        }

        // Check for non-billable resources
        const nonBillableCrewMembers = crewMembers.filter(cm => !cm.is_billable).length;
        const nonBillableEquipment = equipment.filter(eq => !eq.is_billable).length;

        if (nonBillableCrewMembers > 0) {
            warnings.push(`${nonBillableCrewMembers} crew members are marked as non-billable`);
        }

        if (nonBillableEquipment > 0) {
            warnings.push(`${nonBillableEquipment} equipment items are marked as non-billable`);
        }

        const isValid = missingRates.crewMembers.length === 0 && missingRates.equipment.length === 0;

        return {
            isValid,
            missingRates,
            warnings
        };

    } catch (error) {
        console.error('Error validating rates:', error);
        return {
            isValid: false,
            missingRates: { crewMembers: [], equipment: [] },
            warnings: ["Error validating rates"]
        };
    }
}

/**
 * Bulk update crew member rates
 */
export async function bulkUpdateCrewMemberRates(
    updates: { crewMemberId: string; rate: BillingRate }[]
): Promise<{ success: true } | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();

        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to modify rates for this business." };
        }

        const now = new Date().toISOString();

        // Process updates
        for (const update of updates) {
            const result = await setCrewMemberRate(update.crewMemberId, update.rate);
            if ('error' in result) {
                return { error: `Failed to update rate for crew member ${update.crewMemberId}: ${result.error}` };
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error bulk updating crew member rates:', error);
        return { error: error instanceof Error ? error.message : "Failed to bulk update crew member rates" };
    }
}

/**
 * Bulk update equipment rates
 */
export async function bulkUpdateEquipmentRates(
    updates: { equipmentId: string; rate: BillingRate }[]
): Promise<{ success: true } | { error: string }> {
    try {
        const { userId, businessId } = await getCurrentUserContext();
        console.log("Bulk updating equipment rates", userId, businessId, updates);
        if (!userId) {
            return { error: "Authentication required. Please sign in to continue." };
        }

        if (!businessId) {
            return { error: "Business context required. Please select a business." };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { error: "Access denied. You don't have permission to modify rates for this business." };
        }

        // Process updates
        for (const update of updates) {
            const result = await setEquipmentRate(update.equipmentId, update.rate);
            if ('error' in result) {
                return { error: `Failed to update rate for equipment ${update.equipmentId}: ${result.error}` };
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error bulk updating equipment rates:', error);
        return { error: error instanceof Error ? error.message : "Failed to bulk update equipment rates" };
    }
}
