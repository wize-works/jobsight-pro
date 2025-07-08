/**
 * Financial System Sync Service - Coordinated sync for financial entities
 * Part of the offline-first architecture implementation (Phase 5 - Financial System)
 */

import { db } from "./dexie-db";

// Types for sync operations
interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

/**
 * Sync invoices for a specific business
 */
async function syncInvoices(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending invoice sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('invoices')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending invoice sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/invoices', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/invoices/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/invoices/${item.data.id}?businessId=${businessId}`, {
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
                    result.synced++;

                    // Update local data with server response for create/update operations
                    if (item.operation !== 'delete') {
                        const serverData = await response.json();
                        await db.invoices.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync invoice item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Invoice ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `invoices_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'invoices'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during invoices sync:', error);
        result.success = false;
        result.errors.push(`Invoices sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Sync invoice items for a specific business
 */
async function syncInvoiceItems(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending invoice item sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('invoiceItems')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending invoice item sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/invoice-items', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/invoice-items/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/invoice-items/${item.data.id}?businessId=${businessId}`, {
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
                    result.synced++;

                    // Update local data with server response for create/update operations
                    if (item.operation !== 'delete') {
                        const serverData = await response.json();
                        await db.invoiceItems.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync invoice item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Invoice item ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `invoiceItems_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'invoiceItems'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during invoice items sync:', error);
        result.success = false;
        result.errors.push(`Invoice items sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Sync Stripe invoices for a specific business
 */
async function syncStripeInvoices(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
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
                    result.synced++;

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
                result.failed++;
                result.errors.push(`Stripe invoice ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `stripeInvoices_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'stripeInvoices'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during Stripe invoices sync:', error);
        result.success = false;
        result.errors.push(`Stripe invoices sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Sync Stripe payment events for a specific business
 */
async function syncStripePaymentEvents(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
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
                    result.synced++;

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
                console.error(`Failed to sync payment event ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Payment event ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `stripePaymentEvents_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'stripePaymentEvents'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during payment events sync:', error);
        result.success = false;
        result.errors.push(`Payment events sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Full sync for all financial system entities
 */
export async function syncFinancialSystem(businessId: string): Promise<{
    success: boolean;
    invoices: SyncResult;
    invoiceItems: SyncResult;
    stripeInvoices: SyncResult;
    stripePaymentEvents: SyncResult;
}> {
    console.log(`Starting financial system sync for business ${businessId}`);

    const [invoices, invoiceItems, stripeInvoices, stripePaymentEvents] = await Promise.all([
        syncInvoices(businessId),
        syncInvoiceItems(businessId),
        syncStripeInvoices(businessId),
        syncStripePaymentEvents(businessId)
    ]);

    const overallSuccess = invoices.success && invoiceItems.success && stripeInvoices.success && stripePaymentEvents.success;

    console.log(`Financial system sync completed for business ${businessId}. Success: ${overallSuccess}`);

    return {
        success: overallSuccess,
        invoices,
        invoiceItems,
        stripeInvoices,
        stripePaymentEvents
    };
}

/**
 * Sync specific financial system entity
 */
export async function syncFinancialEntity(
    businessId: string,
    entity: 'invoices' | 'invoiceItems' | 'stripeInvoices' | 'stripePaymentEvents'
): Promise<SyncResult> {
    switch (entity) {
        case 'invoices':
            return syncInvoices(businessId);
        case 'invoiceItems':
            return syncInvoiceItems(businessId);
        case 'stripeInvoices':
            return syncStripeInvoices(businessId);
        case 'stripePaymentEvents':
            return syncStripePaymentEvents(businessId);
        default:
            throw new Error(`Unknown financial entity: ${entity}`);
    }
}

/**
 * Check if financial system needs syncing
 */
export async function hasFinancialSystemPendingSync(businessId: string): Promise<boolean> {
    const tables = ['invoices', 'invoiceItems', 'stripeInvoices', 'stripePaymentEvents'];

    for (const table of tables) {
        const pendingCount = await db.syncQueue
            .where('table')
            .equals(table)
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        if (pendingCount > 0) {
            return true;
        }
    }

    return false;
}
