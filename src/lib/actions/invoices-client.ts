/**
 * Client-Side Invoices Actions
 * 
 * Replaces src/app/actions/invoices.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for invoices
type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Partial<Database['public']['Tables']['invoices']['Update']>;

// Extended types for invoices with related data
type InvoiceWithClient = Invoice & {
    client_name: string;
    client_email?: string;
};

type InvoiceWithDetails = Invoice & {
    client_name: string;
    project_name: string;
    total_amount: number;
    items_count: number;
};

// Create client-side invoice actions
const insertInvoice = createInsertAction('invoices', 'high');
const updateInvoice = createUpdateAction('invoices', 'high');
const deleteInvoice = createDeleteAction('invoices', 'high');
const selectInvoices = createSelectAction('invoices');

/**
 * Get all invoices for a business - works offline with server fallback
 */
export const getInvoices = async (businessId: string): Promise<Invoice[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectInvoices({}, businessId);

        if (result.error) {
            console.error("Error fetching invoices from IndexedDB:", result.error);
        }

        const clientData = (result.data || []) as Invoice[];

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Invoices loaded from IndexedDB: ${clientData.length} invoices`);
            return clientData;
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for invoices...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getInvoices: getInvoicesServer } = await import('@/app/actions/invoices');
            const serverData = await getInvoicesServer(businessId);

            if (serverData.length > 0) {
                console.log(`✅ Invoices loaded from server: ${serverData.length} invoices`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('invoices', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} invoices to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache invoices data:', cacheError);
                }

                return serverData;
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for invoices:', serverError);
        }

        console.log('📭 No invoices found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getInvoices:", err);
        return [];
    }
};

/**
 * Get invoice by ID - works offline
 */
export const getInvoiceById = async (businessId: string, id: string): Promise<Invoice | null> => {
    try {
        const invoices = await getInvoices(businessId);
        const invoice = invoices.find(i => i.id === id);

        if (!invoice) {
            console.warn(`Invoice with ID ${id} not found`);
            return null;
        }

        return invoice;
    } catch (err) {
        console.error("Error in getInvoiceById:", err);
        return null;
    }
};

/**
 * Create new invoice - works offline with optimistic updates
 */
export const createInvoice = async (
    data: InvoiceInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: Invoice; error?: string }> => {
    try {
        // Generate invoice number if not provided
        const invoiceNumber = data.invoice_number || `INV-${Date.now()}`;

        // Ensure required fields
        const invoiceData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            invoice_number: invoiceNumber,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: data.status || 'draft',
            created_by: userId || data.created_by,
        };

        const result = await insertInvoice(invoiceData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Invoice };
    } catch (err) {
        console.error("Error in createInvoice:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update invoice - works offline with optimistic updates
 */
export const updateInvoiceById = async (
    id: string,
    data: InvoiceUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: Invoice; error?: string }> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by,
        };

        const result = await updateInvoice(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Invoice };
    } catch (err) {
        console.error("Error in updateInvoiceById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete invoice - works offline with optimistic updates
 */
export const deleteInvoiceById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteInvoice({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteInvoiceById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get invoices with client details - works offline
 */
export const getInvoicesWithClient = async (businessId: string): Promise<InvoiceWithClient[]> => {
    try {
        const invoices = await getInvoices(businessId);

        // TODO: Implement client data caching and joining
        return invoices.map(invoice => ({
            ...invoice,
            client_name: "Loading...", // Placeholder - implement client lookup
            client_email: undefined
        })) as InvoiceWithClient[];

    } catch (err) {
        console.error("Error in getInvoicesWithClient:", err);
        return [];
    }
};

/**
 * Get invoices with full details - works offline
 */
export const getInvoicesWithDetails = async (businessId: string): Promise<InvoiceWithDetails[]> => {
    try {
        const invoices = await getInvoices(businessId);

        // TODO: Implement related data caching and joining
        return invoices.map(invoice => ({
            ...invoice,
            client_name: "Loading...", // Placeholder
            project_name: "Loading...", // Placeholder
            total_amount: invoice.amount || 0,
            items_count: 0 // Placeholder - implement items counting
        })) as InvoiceWithDetails[];

    } catch (err) {
        console.error("Error in getInvoicesWithDetails:", err);
        return [];
    }
};

/**
 * Get invoices by project - works offline
 */
export const getInvoicesByProject = async (businessId: string, projectId: string): Promise<Invoice[]> => {
    try {
        const invoices = await getInvoices(businessId);
        return invoices.filter(invoice => invoice.project_id === projectId);
    } catch (err) {
        console.error("Error in getInvoicesByProject:", err);
        return [];
    }
};

/**
 * Get invoices by client - works offline
 */
export const getInvoicesByClient = async (businessId: string, clientId: string): Promise<Invoice[]> => {
    try {
        const invoices = await getInvoices(businessId);
        return invoices.filter(invoice => invoice.client_id === clientId);
    } catch (err) {
        console.error("Error in getInvoicesByClient:", err);
        return [];
    }
};

/**
 * Get invoices by status - works offline
 */
export const getInvoicesByStatus = async (businessId: string, status: string): Promise<Invoice[]> => {
    try {
        const invoices = await getInvoices(businessId);
        return invoices.filter(invoice => invoice.status === status);
    } catch (err) {
        console.error("Error in getInvoicesByStatus:", err);
        return [];
    }
};

/**
 * Mark invoice as sent - works offline
 */
export const markInvoiceAsSent = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: Invoice; error?: string }> => {
    return updateInvoiceById(id, { status: 'sent' }, businessId, userId);
};

/**
 * Mark invoice as paid - works offline
 */
export const markInvoiceAsPaid = async (
    id: string,
    paymentMethod: string,
    businessId: string,
    userId?: string
): Promise<{ data?: Invoice; error?: string }> => {
    return updateInvoiceById(id, {
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method: paymentMethod
    }, businessId, userId);
};

/**
 * Check if invoice operations are pending sync
 */
export const getInvoiceSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending invoice operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

// Export compatibility functions for existing code
export {
    getInvoices as default,
    createInvoice as insertInvoice,
    updateInvoiceById as updateInvoice,
    deleteInvoiceById as deleteInvoice
};
