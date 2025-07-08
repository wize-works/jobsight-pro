/**
 * Stripe Payment Events Management - Client-side actions with offline-first architecture
 * Part of the offline-first architecture implementation (Phase 5 - Financial System)
 */

'use client';

import { db } from '@/lib/offline/dexie-db';
import { StripePaymentEvent, StripePaymentEventInsert, StripePaymentEventUpdate } from '@/types/stripe-payment-events';

// Global auth state for client actions
let currentClerkUser: { id: string } | null = null;
let currentBusinessId: string | null = null;
let authStateInitialized = false;

// Initialize auth state (should be called from a React component that uses Clerk hooks)
export function initializeAuthState(clerkUser: { id: string } | null, businessId?: string | null) {
    currentClerkUser = clerkUser;
    currentBusinessId = businessId || null;
    authStateInitialized = true;
}

// Helper to get current user with cached fallback
function getCurrentUser(): { id: string; businessId: string } {
    // Try getting from initialized state first
    if (authStateInitialized && currentClerkUser?.id && currentBusinessId) {
        return {
            id: currentClerkUser.id,
            businessId: currentBusinessId
        };
    }

    // Fallback to cached values for offline scenarios
    if (typeof window !== 'undefined') {
        const cachedAuthId = window.localStorage.getItem('cached_auth_id');
        const cachedBusinessId = window.localStorage.getItem('cached_business_id');

        if (cachedAuthId && cachedBusinessId) {
            return {
                id: cachedAuthId,
                businessId: cachedBusinessId
            };
        }
    }

    throw new Error('User must be authenticated and have a business context');
}

/**
 * Create a new Stripe payment event record
 */
export async function createStripePaymentEvent(data: Omit<StripePaymentEventInsert, 'id' | 'created_at'>): Promise<StripePaymentEvent> {
    const user = getCurrentUser();

    const paymentEvent: StripePaymentEvent = {
        id: crypto.randomUUID(),
        business_id: user.businessId,
        event_id: data.event_id,
        event_type: data.event_type,
        data: data.data || null,
        created_at: new Date().toISOString()
    };

    // Store locally
    await db.stripePaymentEvents.put(paymentEvent);

    // Queue for sync
    await db.syncQueue.add({
        id: `stripe_payment_event_insert_${paymentEvent.id}_${Date.now()}`,
        table: 'stripePaymentEvents',
        operation: 'insert',
        data: paymentEvent,
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });

    return paymentEvent;
}

/**
 * Update an existing Stripe payment event record
 */
export async function updateStripePaymentEvent(
    id: string,
    updates: Partial<Omit<StripePaymentEventUpdate, 'id' | 'business_id'>>
): Promise<StripePaymentEvent> {
    const user = getCurrentUser();

    // Get existing payment event
    const existingEvent = await db.stripePaymentEvents.get(id);
    if (!existingEvent) {
        throw new Error('Stripe payment event not found');
    }

    // Verify business ownership
    if (existingEvent.business_id !== user.businessId) {
        throw new Error('Access denied: Stripe payment event belongs to different business');
    }

    const updatedEvent: StripePaymentEvent = {
        ...existingEvent,
        ...updates
    };

    // Update locally
    await db.stripePaymentEvents.put(updatedEvent);

    // Queue for sync
    await db.syncQueue.add({
        id: `stripe_payment_event_update_${id}_${Date.now()}`,
        table: 'stripePaymentEvents',
        operation: 'update',
        data: updatedEvent,
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });

    return updatedEvent;
}

/**
 * Delete a Stripe payment event record
 */
export async function deleteStripePaymentEvent(id: string): Promise<void> {
    const user = getCurrentUser();

    // Get existing payment event
    const existingEvent = await db.stripePaymentEvents.get(id);
    if (!existingEvent) {
        throw new Error('Stripe payment event not found');
    }

    // Verify business ownership
    if (existingEvent.business_id !== user.businessId) {
        throw new Error('Access denied: Stripe payment event belongs to different business');
    }

    // Delete locally
    await db.stripePaymentEvents.delete(id);

    // Queue for sync
    await db.syncQueue.add({
        id: `stripe_payment_event_delete_${id}_${Date.now()}`,
        table: 'stripePaymentEvents',
        operation: 'delete',
        data: { id },
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });
}

/**
 * Get Stripe payment event by ID
 */
export async function getStripePaymentEventById(id: string): Promise<StripePaymentEvent | null> {
    const user = getCurrentUser();

    const event = await db.stripePaymentEvents.get(id);

    // Verify business ownership
    if (event && event.business_id !== user.businessId) {
        throw new Error('Access denied: Stripe payment event belongs to different business');
    }

    return event || null;
}

/**
 * Get Stripe payment event by event ID
 */
export async function getStripePaymentEventByEventId(eventId: string): Promise<StripePaymentEvent | null> {
    const user = getCurrentUser();

    const event = await db.stripePaymentEvents
        .where('business_id')
        .equals(user.businessId)
        .filter(event => event.event_id === eventId)
        .first();

    return event || null;
}

/**
 * Get all Stripe payment events for the current business
 */
export async function getStripePaymentEvents(): Promise<StripePaymentEvent[]> {
    const user = getCurrentUser();

    const events = await db.stripePaymentEvents
        .where('business_id')
        .equals(user.businessId)
        .toArray();

    return events.sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Get Stripe payment events by event type
 */
export async function getStripePaymentEventsByType(eventType: string): Promise<StripePaymentEvent[]> {
    const user = getCurrentUser();

    const events = await db.stripePaymentEvents
        .where('business_id')
        .equals(user.businessId)
        .filter(event => event.event_type === eventType)
        .toArray();

    return events.sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Get recent Stripe payment events (last 30 days)
 */
export async function getRecentStripePaymentEvents(): Promise<StripePaymentEvent[]> {
    const user = getCurrentUser();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    const events = await db.stripePaymentEvents
        .where('business_id')
        .equals(user.businessId)
        .filter(event => {
            return Boolean(event.created_at && event.created_at >= cutoffDate);
        })
        .toArray();

    return events.sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Search Stripe payment events by event type
 */
export async function searchStripePaymentEvents(query: string): Promise<StripePaymentEvent[]> {
    const user = getCurrentUser();
    const searchLower = query.toLowerCase();

    const events = await db.stripePaymentEvents
        .where('business_id')
        .equals(user.businessId)
        .filter(event => {
            const matchesEventType = event.event_type.toLowerCase().includes(searchLower);
            const matchesEventId = event.event_id.toLowerCase().includes(searchLower);
            return matchesEventType || matchesEventId;
        })
        .toArray();

    return events.sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Get payment event statistics
 */
export async function getPaymentEventStatistics(): Promise<{
    total: number;
    recentCount: number;
    eventTypeCounts: Record<string, number>;
}> {
    const user = getCurrentUser();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    const allEvents = await db.stripePaymentEvents
        .where('business_id')
        .equals(user.businessId)
        .toArray();

    const recentEvents = allEvents.filter(event =>
        event.created_at && event.created_at >= cutoffDate
    );

    const eventTypeCounts: Record<string, number> = {};
    allEvents.forEach(event => {
        eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;
    });

    return {
        total: allEvents.length,
        recentCount: recentEvents.length,
        eventTypeCounts
    };
}

/**
 * Sync Stripe payment events with server (called by sync service)
 */
export async function syncStripePaymentEvents(businessId: string): Promise<{
    success: boolean;
    syncedCount: number;
    errorCount: number;
    errors: string[];
}> {
    const result = {
        success: true,
        syncedCount: 0,
        errorCount: 0,
        errors: [] as string[]
    };

    try {
        // Get pending payment event sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('stripePaymentEvents')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending Stripe payment event sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/stripe-payment-events', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/stripe-payment-events/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/stripe-payment-events/${item.data.id}?businessId=${businessId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        break;

                    default:
                        throw new Error(`Unknown operation: ${item.operation}`);
                }

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue.update(item.id, { synced: true });
                    result.syncedCount++;

                    // Update local data with server response for create/update operations
                    if (item.operation !== 'delete') {
                        const serverData = await response.json();
                        await db.stripePaymentEvents.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync Stripe payment event ${item.id}:`, error);
                result.errorCount++;
                result.errors.push(`Payment event ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        if (result.errorCount > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during Stripe payment events sync:', error);
        result.success = false;
        result.errors.push(`Payment events sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}
