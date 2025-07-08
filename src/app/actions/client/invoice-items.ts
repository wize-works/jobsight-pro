/**
 * Invoice Items Management - Client-side actions with offline-first architecture
 * Part of the offline-first architecture implementation (Phase 5 - Financial System)
 */

'use client';

import { db } from '@/lib/offline/dexie-db';
import { InvoiceItem, InvoiceItemInsert, InvoiceItemUpdate } from '@/types/invoice-items';

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
 * Create a new invoice item
 */
export async function createInvoiceItem(data: Omit<InvoiceItemInsert, 'id' | 'created_at' | 'updated_at'>): Promise<InvoiceItem> {
    const user = getCurrentUser();

    const invoiceItem: InvoiceItem = {
        id: crypto.randomUUID(),
        invoice_id: data.invoice_id,
        business_id: user.businessId,
        description: data.description || null,
        quantity: data.quantity || null,
        unit_price: data.unit_price || null,
        amount: data.amount || null,
        tax_rate: data.tax_rate || null,
        tax_amount: data.tax_amount || null,
        total_price: data.total_price || null,
        created_at: new Date().toISOString(),
        created_by: user.id,
        updated_at: null,
        updated_by: null
    };

    // Store locally
    await db.invoiceItems.put(invoiceItem);

    // Queue for sync
    await db.syncQueue.add({
        id: `invoice_item_insert_${invoiceItem.id}_${Date.now()}`,
        table: 'invoiceItems',
        operation: 'insert',
        data: invoiceItem,
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });

    return invoiceItem;
}

/**
 * Update an existing invoice item
 */
export async function updateInvoiceItem(
    id: string,
    updates: Partial<Omit<InvoiceItemUpdate, 'id' | 'business_id' | 'updated_at' | 'updated_by'>>
): Promise<InvoiceItem> {
    const user = getCurrentUser();

    // Get existing invoice item
    const existingItem = await db.invoiceItems.get(id);
    if (!existingItem) {
        throw new Error('Invoice item not found');
    }

    // Verify business ownership
    if (existingItem.business_id !== user.businessId) {
        throw new Error('Access denied: Invoice item belongs to different business');
    }

    const updatedItem: InvoiceItem = {
        ...existingItem,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user.id
    };

    // Update locally
    await db.invoiceItems.put(updatedItem);

    // Queue for sync
    await db.syncQueue.add({
        id: `invoice_item_update_${id}_${Date.now()}`,
        table: 'invoiceItems',
        operation: 'update',
        data: updatedItem,
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });

    return updatedItem;
}

/**
 * Delete an invoice item
 */
export async function deleteInvoiceItem(id: string): Promise<void> {
    const user = getCurrentUser();

    // Get existing invoice item
    const existingItem = await db.invoiceItems.get(id);
    if (!existingItem) {
        throw new Error('Invoice item not found');
    }

    // Verify business ownership
    if (existingItem.business_id !== user.businessId) {
        throw new Error('Access denied: Invoice item belongs to different business');
    }

    // Delete locally
    await db.invoiceItems.delete(id);

    // Queue for sync
    await db.syncQueue.add({
        id: `invoice_item_delete_${id}_${Date.now()}`,
        table: 'invoiceItems',
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
 * Get invoice item by ID
 */
export async function getInvoiceItemById(id: string): Promise<InvoiceItem | null> {
    const user = getCurrentUser();

    const item = await db.invoiceItems.get(id);

    // Verify business ownership
    if (item && item.business_id !== user.businessId) {
        throw new Error('Access denied: Invoice item belongs to different business');
    }

    return item || null;
}

/**
 * Get all invoice items for an invoice
 */
export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const user = getCurrentUser();

    const items = await db.invoiceItems
        .where('business_id')
        .equals(user.businessId)
        .filter(item => item.invoice_id === invoiceId)
        .toArray();

    return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/**
 * Get all invoice items for the current business
 */
export async function getAllInvoiceItems(): Promise<InvoiceItem[]> {
    const user = getCurrentUser();

    const items = await db.invoiceItems
        .where('business_id')
        .equals(user.businessId)
        .toArray();

    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Search invoice items by description
 */
export async function searchInvoiceItems(query: string): Promise<InvoiceItem[]> {
    const user = getCurrentUser();
    const searchLower = query.toLowerCase();

    const items = await db.invoiceItems
        .where('business_id')
        .equals(user.businessId)
        .filter(item => {
            const matchesDescription = item.description ? item.description.toLowerCase().includes(searchLower) : false;
            return matchesDescription;
        })
        .toArray();

    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Calculate invoice totals from items
 */
export async function calculateInvoiceTotals(invoiceId: string): Promise<{
    subtotal: number;
    taxAmount: number;
    total: number;
}> {
    const items = await getInvoiceItems(invoiceId);

    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const total = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

    return {
        subtotal,
        taxAmount,
        total
    };
}

/**
 * Bulk create invoice items
 */
export async function bulkCreateInvoiceItems(items: Array<Omit<InvoiceItemInsert, 'id' | 'created_at' | 'updated_at'>>): Promise<InvoiceItem[]> {
    const user = getCurrentUser();
    const createdItems: InvoiceItem[] = [];

    for (const itemData of items) {
        const invoiceItem: InvoiceItem = {
            id: crypto.randomUUID(),
            invoice_id: itemData.invoice_id,
            business_id: user.businessId,
            description: itemData.description || null,
            quantity: itemData.quantity || null,
            unit_price: itemData.unit_price || null,
            amount: itemData.amount || null,
            tax_rate: itemData.tax_rate || null,
            tax_amount: itemData.tax_amount || null,
            total_price: itemData.total_price || null,
            created_at: new Date().toISOString(),
            created_by: user.id,
            updated_at: null,
            updated_by: null
        };

        createdItems.push(invoiceItem);
    }

    // Store all locally
    await db.invoiceItems.bulkPut(createdItems);

    // Queue all for sync
    for (const item of createdItems) {
        await db.syncQueue.add({
            id: `invoice_item_insert_${item.id}_${Date.now()}`,
            table: 'invoiceItems',
            operation: 'insert',
            data: item,
            businessId: user.businessId,
            userId: user.id,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });
    }

    return createdItems;
}

/**
 * Delete all items for an invoice
 */
export async function deleteInvoiceItems(invoiceId: string): Promise<void> {
    const user = getCurrentUser();

    // Get existing items
    const existingItems = await getInvoiceItems(invoiceId);

    // Delete locally
    await db.invoiceItems
        .where('invoice_id')
        .equals(invoiceId)
        .delete();

    // Queue deletions for sync
    for (const item of existingItems) {
        await db.syncQueue.add({
            id: `invoice_item_delete_${item.id}_${Date.now()}`,
            table: 'invoiceItems',
            operation: 'delete',
            data: { id: item.id },
            businessId: user.businessId,
            userId: user.id,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });
    }
}

/**
 * Sync invoice items with server (called by sync service)
 */
export async function syncInvoiceItems(businessId: string): Promise<{
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
                    result.syncedCount++;

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
                result.errorCount++;
                result.errors.push(`Invoice item ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

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
        console.error('Error during invoice items sync:', error);
        result.success = false;
        result.errors.push(`Invoice items sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}
