/**
 * Invoice Management - Client-side actions with offline-first architecture
 * Part of the offline-first architecture implementation (Phase 5 - Financial System)
 */

'use client';

import { db } from '@/lib/offline/dexie-db';
import { Invoice, InvoiceInsert, InvoiceUpdate } from '@/types/invoices';

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
 * Create a new invoice
 */
export async function createInvoice(data: Omit<InvoiceInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const user = await getCurrentUser();
    if (!user?.businessId) {
        throw new Error('User must be authenticated and have a business context');
    }

    const invoice: Invoice = {
        id: crypto.randomUUID(),
        business_id: user.businessId,
        invoice_number: data.invoice_number,
        client_id: data.client_id,
        project_id: data.project_id,
        amount: data.amount || null,
        tax_rate: data.tax_rate || null,
        status: data.status || 'draft',
        issue_date: data.issue_date || null,
        due_date: data.due_date || null,
        paid_date: data.paid_date || null,
        payment_method: data.payment_method || null,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        created_by: user.id,
        updated_at: null,
        updated_by: null
    };

    // Store locally
    await db.invoices.put(invoice);

    // Queue for sync
    await db.syncQueue.add({
        id: `invoice_insert_${invoice.id}_${Date.now()}`,
        table: 'invoices',
        operation: 'insert',
        data: invoice,
        businessId: user.businessId,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    });

    return invoice;
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(
    id: string,
    updates: Partial<Omit<InvoiceUpdate, 'id' | 'business_id' | 'updated_at' | 'updated_by'>>
): Promise<Invoice> {
    const user = await getCurrentUser();
    if (!user?.businessId) {
        throw new Error('User must be authenticated and have a business context');
    }

    // Get existing invoice
    const existingInvoice = await db.invoices.get(id);
    if (!existingInvoice) {
        throw new Error('Invoice not found');
    }

    // Verify business ownership
    if (existingInvoice.business_id !== user.businessId) {
        throw new Error('Access denied: Invoice belongs to different business');
    }

    const updatedInvoice: Invoice = {
        ...existingInvoice,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user.id
    };

    // Update locally
    await db.invoices.put(updatedInvoice);

    // Queue for sync
    await db.syncQueue.add({
        id: `invoice_update_${id}_${Date.now()}`,
        table: 'invoices',
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
 * Delete an invoice
 */
export async function deleteInvoice(id: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user?.businessId) {
        throw new Error('User must be authenticated and have a business context');
    }

    // Get existing invoice
    const existingInvoice = await db.invoices.get(id);
    if (!existingInvoice) {
        throw new Error('Invoice not found');
    }

    // Verify business ownership
    if (existingInvoice.business_id !== user.businessId) {
        throw new Error('Access denied: Invoice belongs to different business');
    }

    // Delete locally
    await db.invoices.delete(id);

    // Queue for sync
    await db.syncQueue.add({
        id: `invoice_delete_${id}_${Date.now()}`,
        table: 'invoices',
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
 * Get invoice by ID
 */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
    const user = await getCurrentUser();
    if (!user?.businessId) {
        throw new Error('User must be authenticated and have a business context');
    }

    const invoice = await db.invoices.get(id);

    // Verify business ownership
    if (invoice && invoice.business_id !== user.businessId) {
        throw new Error('Access denied: Invoice belongs to different business');
    }

    return invoice || null;
}

/**
 * Get all invoices for the current business
 */
export async function getInvoices(): Promise<Invoice[]> {
    const user = getCurrentUser();

    const invoices = await db.invoices
        .where('business_id')
        .equals(user.businessId)
        .toArray();

    return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get invoices by status
 */
export async function getInvoicesByStatus(status: string): Promise<Invoice[]> {
    const user = getCurrentUser();

    const invoices = await db.invoices
        .where('business_id')
        .equals(user.businessId)
        .filter(invoice => invoice.status === status)
        .toArray();

    return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get invoices by client
 */
export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    const user = getCurrentUser();

    const invoices = await db.invoices
        .where('business_id')
        .equals(user.businessId)
        .filter(invoice => invoice.client_id === clientId)
        .toArray();

    return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get invoices by project
 */
export async function getInvoicesByProject(projectId: string): Promise<Invoice[]> {
    const user = getCurrentUser();

    const invoices = await db.invoices
        .where('business_id')
        .equals(user.businessId)
        .filter(invoice => invoice.project_id === projectId)
        .toArray();

    return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Search invoices by invoice number or notes
 */
export async function searchInvoices(query: string): Promise<Invoice[]> {
    const user = getCurrentUser();
    const searchLower = query.toLowerCase();

    const invoices = await db.invoices
        .where('business_id')
        .equals(user.businessId)
        .filter(invoice => {
            const matchesInvoiceNumber = invoice.invoice_number.toLowerCase().includes(searchLower);
            const matchesNotes = invoice.notes ? invoice.notes.toLowerCase().includes(searchLower) : false;
            return matchesInvoiceNumber || matchesNotes;
        })
        .toArray();

    return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get overdue invoices
 */
export async function getOverdueInvoices(): Promise<Invoice[]> {
    const user = getCurrentUser();
    const today = new Date().toISOString().split('T')[0];

    const invoices = await db.invoices
        .where('business_id')
        .equals(user.businessId)
        .filter(invoice => {
            return Boolean(
                invoice.status !== 'paid' &&
                invoice.due_date &&
                invoice.due_date < today
            );
        })
        .toArray();

    return invoices.sort((a, b) => {
        const dateA = a.due_date || '';
        const dateB = b.due_date || '';
        return dateA.localeCompare(dateB);
    });
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(
    id: string,
    paymentDate?: string,
    paymentMethod?: string
): Promise<Invoice> {
    return await updateInvoice(id, {
        status: 'paid',
        paid_date: paymentDate || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod
    });
}

/**
 * Generate next invoice number
 */
export async function generateInvoiceNumber(): Promise<string> {
    const user = await getCurrentUser();
    if (!user?.businessId) {
        throw new Error('User must be authenticated and have a business context');
    }

    // Get latest invoice number for this business
    const latestInvoice = await db.invoices
        .where('business_id')
        .equals(user.businessId)
        .toArray()
        .then(invoices =>
            invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        );

    if (!latestInvoice) {
        return 'INV-0001';
    }

    // Extract number from invoice number (assumes format INV-XXXX)
    const match = latestInvoice.invoice_number.match(/INV-(\d+)/);
    if (!match) {
        return 'INV-0001';
    }

    const nextNumber = parseInt(match[1]) + 1;
    return `INV-${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Get invoice summary statistics
 */
export async function getInvoiceSummary(): Promise<{
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
}> {
    const user = await getCurrentUser();
    if (!user?.businessId) {
        throw new Error('User must be authenticated and have a business context');
    }

    const invoices = await getInvoices();
    const today = new Date().toISOString().split('T')[0];

    const summary = {
        total: invoices.length,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0
    };

    invoices.forEach(invoice => {
        const amount = invoice.amount || 0;
        summary.totalAmount += amount;

        switch (invoice.status) {
            case 'draft':
                summary.draft++;
                break;
            case 'sent':
                summary.sent++;
                summary.outstandingAmount += amount;
                break;
            case 'paid':
                summary.paid++;
                summary.paidAmount += amount;
                break;
        }

        // Check if overdue
        if (invoice.status !== 'paid' && invoice.due_date && invoice.due_date < today) {
            summary.overdue++;
        }
    });

    return summary;
}

/**
 * Sync invoices with server (called by sync service)
 */
export async function syncInvoices(businessId: string): Promise<{
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
                    result.syncedCount++;

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
                result.errorCount++;
                result.errors.push(`Invoice ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

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
        console.error('Error during invoice sync:', error);
        result.success = false;
        result.errors.push(`Invoice sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}
