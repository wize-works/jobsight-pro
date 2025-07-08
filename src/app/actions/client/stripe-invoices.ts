/**
 * Stripe Invoices Management - Client-side actions with offline-first architecture
 * Part of the offline-first architecture implementation (Phase 5 - Financial System)
 */

'use client';

import { db } from '@/lib/offline/dexie-db';
import { StripeInvoice, StripeInvoiceInsert, StripeInvoiceUpdate } from '@/types/stripe-invoices';

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
 * Create a new Stripe invoice record
 */
export async function createStripeInvoice(data: Omit<StripeInvoiceInsert, 'id' | 'created_at'>): Promise<StripeInvoice> {
    const user = getCurrentUser();

    const stripeInvoice: StripeInvoice = {
        id: crypto.randomUUID(),
        business_id: user.businessId,
        stripe_invoice_id: data.stripe_invoice_id,
        amount_due: data.amount_due || null,
        amount_paid: data.amount_paid || null,
        status: data.status || null,
        due_date: data.due_date || null,
        paid_at: data.paid_at || null,
        created_at: new Date().toISOString()
    };

    // Store locally
    await db.stripeInvoices.put(stripeInvoice);

    // Queue for sync
    await db.syncQueue.add({
        id: `stripe_invoice_insert_${stripeInvoice.id}_${Date.now()}`,
        table: 'stripeInvoices',
        operation: 'insert',
        data: stripeInvoice,
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });

    return stripeInvoice;
}

/**
 * Update an existing Stripe invoice record
 */
export async function updateStripeInvoice(
    id: string,
    updates: Partial<Omit<StripeInvoiceUpdate, 'id' | 'business_id'>>
): Promise<StripeInvoice> {
    const user = getCurrentUser();

    // Get existing Stripe invoice
    const existingInvoice = await db.stripeInvoices.get(id);
    if (!existingInvoice) {
        throw new Error('Stripe invoice not found');
    }

    // Verify business ownership
    if (existingInvoice.business_id !== user.businessId) {
        throw new Error('Access denied: Stripe invoice belongs to different business');
    }

    const updatedInvoice: StripeInvoice = {
        ...existingInvoice,
        ...updates
    };

    // Update locally
    await db.stripeInvoices.put(updatedInvoice);

    // Queue for sync
    await db.syncQueue.add({
        id: `stripe_invoice_update_${id}_${Date.now()}`,
        table: 'stripeInvoices',
        operation: 'update',
        data: updatedInvoice,
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });

    return updatedInvoice;
}

/**
 * Delete a Stripe invoice record
 */
export async function deleteStripeInvoice(id: string): Promise<void> {
    const user = getCurrentUser();

    // Get existing Stripe invoice
    const existingInvoice = await db.stripeInvoices.get(id);
    if (!existingInvoice) {
        throw new Error('Stripe invoice not found');
    }

    // Verify business ownership
    if (existingInvoice.business_id !== user.businessId) {
        throw new Error('Access denied: Stripe invoice belongs to different business');
    }

    // Delete locally
    await db.stripeInvoices.delete(id);

    // Queue for sync
    await db.syncQueue.add({
        id: `stripe_invoice_delete_${id}_${Date.now()}`,
        table: 'stripeInvoices',
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
 * Get Stripe invoice by ID
 */
export async function getStripeInvoiceById(id: string): Promise<StripeInvoice | null> {
    const user = getCurrentUser();

    const invoice = await db.stripeInvoices.get(id);

    // Verify business ownership
    if (invoice && invoice.business_id !== user.businessId) {
        throw new Error('Access denied: Stripe invoice belongs to different business');
    }

    return invoice || null;
}

/**
 * Get Stripe invoice by Stripe invoice ID
 */
export async function getStripeInvoiceByStripeId(stripeInvoiceId: string): Promise<StripeInvoice | null> {
    const user = getCurrentUser();

    const invoice = await db.stripeInvoices
        .where('business_id')
        .equals(user.businessId)
        .filter(invoice => invoice.stripe_invoice_id === stripeInvoiceId)
        .first();

    return invoice || null;
}

/**
 * Get all Stripe invoices for the current business
 */
export async function getStripeInvoices(): Promise<StripeInvoice[]> {
    const user = getCurrentUser();

    const invoices = await db.stripeInvoices
        .where('business_id')
        .equals(user.businessId)
        .toArray();

    return invoices.sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Get Stripe invoices by status
 */
export async function getStripeInvoicesByStatus(status: string): Promise<StripeInvoice[]> {
    const user = getCurrentUser();

    const invoices = await db.stripeInvoices
        .where('business_id')
        .equals(user.businessId)
        .filter(invoice => invoice.status === status)
        .toArray();

    return invoices.sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Sync Stripe invoices with server (called by sync service)
 */
export async function syncStripeInvoices(businessId: string): Promise<{
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
        // Get pending Stripe invoice sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('stripeInvoices')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending Stripe invoice sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/stripe-invoices', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/stripe-invoices/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/stripe-invoices/${item.data.id}?businessId=${businessId}`, {
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
                        await db.stripeInvoices.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync Stripe invoice ${item.id}:`, error);
                result.errorCount++;
                result.errors.push(`Stripe invoice ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

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
        console.error('Error during Stripe invoices sync:', error);
        result.success = false;
        result.errors.push(`Stripe invoices sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}
