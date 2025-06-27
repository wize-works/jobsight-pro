/**
 * Client-Side Invoice Items Actions
 * 
 * Replaces src/app/actions/invoice-items.ts with offline-first implementation.
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

// Extract Supabase types for invoice items
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];
type InvoiceItemUpdate = Partial<Database['public']['Tables']['invoice_items']['Update']>;

// Extended types for invoice items with calculations
type InvoiceItemWithCalculations = InvoiceItem & {
    subtotal: number;
    total_with_tax: number;
};

// Create client-side invoice item actions
const insertInvoiceItem = createInsertAction('invoice_items', 'high');
const updateInvoiceItem = createUpdateAction('invoice_items', 'high');
const deleteInvoiceItem = createDeleteAction('invoice_items', 'high');
const selectInvoiceItems = createSelectAction('invoice_items');

/**
 * Get all invoice items for a business - works offline
 */
export const getInvoiceItems = async (businessId: string): Promise<InvoiceItem[]> => {
    try {
        const result = await selectInvoiceItems({}, businessId);

        if (result.error) {
            console.error("Error fetching invoice items:", result.error);
            return [];
        }

        return (result.data || []) as InvoiceItem[];
    } catch (err) {
        console.error("Error in getInvoiceItems:", err);
        return [];
    }
};

/**
 * Get invoice items by invoice ID - works offline
 */
export const getInvoiceItemsByInvoiceId = async (
    businessId: string,
    invoiceId: string
): Promise<InvoiceItem[]> => {
    try {
        const items = await getInvoiceItems(businessId);
        return items.filter(item => item.invoice_id === invoiceId);
    } catch (err) {
        console.error("Error in getInvoiceItemsByInvoiceId:", err);
        return [];
    }
};

/**
 * Get invoice item by ID - works offline
 */
export const getInvoiceItemById = async (businessId: string, id: string): Promise<InvoiceItem | null> => {
    try {
        const items = await getInvoiceItems(businessId);
        const item = items.find(i => i.id === id);

        if (!item) {
            console.warn(`Invoice item with ID ${id} not found`);
            return null;
        }

        return item;
    } catch (err) {
        console.error("Error in getInvoiceItemById:", err);
        return null;
    }
};

/**
 * Create new invoice item - works offline with optimistic updates
 */
export const createInvoiceItem = async (
    data: InvoiceItemInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: InvoiceItem; error?: string }> => {
    try {
        // Calculate amounts
        const quantity = data.quantity || 0;
        const unitPrice = data.unit_price || 0;
        const taxRate = data.tax_rate || 0;

        const amount = quantity * unitPrice;
        const taxAmount = amount * (taxRate / 100);
        const totalPrice = amount + taxAmount;

        // Ensure required fields
        const itemData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            amount,
            tax_amount: taxAmount,
            total_price: totalPrice,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: userId || data.created_by,
        };

        const result = await insertInvoiceItem(itemData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as InvoiceItem };
    } catch (err) {
        console.error("Error in createInvoiceItem:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update invoice item - works offline with optimistic updates
 */
export const updateInvoiceItemById = async (
    id: string,
    data: InvoiceItemUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: InvoiceItem; error?: string }> => {
    try {
        // Recalculate amounts if quantity, unit price, or tax rate changed
        let calculatedData = { ...data };

        if (data.quantity !== undefined || data.unit_price !== undefined || data.tax_rate !== undefined) {
            // Get current item to merge with updates
            const currentItem = await getInvoiceItemById(businessId, id);
            if (currentItem) {
                const quantity = data.quantity !== undefined ? (data.quantity || 0) : (currentItem.quantity || 0);
                const unitPrice = data.unit_price !== undefined ? (data.unit_price || 0) : (currentItem.unit_price || 0);
                const taxRate = data.tax_rate !== undefined ? (data.tax_rate || 0) : (currentItem.tax_rate || 0);

                const amount = quantity * unitPrice;
                const taxAmount = amount * (taxRate / 100);
                const totalPrice = amount + taxAmount;

                calculatedData = {
                    ...calculatedData,
                    amount,
                    tax_amount: taxAmount,
                    total_price: totalPrice,
                };
            }
        }

        const updateData = {
            ...calculatedData,
            id,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by,
        };

        const result = await updateInvoiceItem(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as InvoiceItem };
    } catch (err) {
        console.error("Error in updateInvoiceItemById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete invoice item - works offline with optimistic updates
 */
export const deleteInvoiceItemById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteInvoiceItem({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteInvoiceItemById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get invoice items with calculations - works offline
 */
export const getInvoiceItemsWithCalculations = async (
    businessId: string,
    invoiceId?: string
): Promise<InvoiceItemWithCalculations[]> => {
    try {
        let items = await getInvoiceItems(businessId);

        if (invoiceId) {
            items = items.filter(item => item.invoice_id === invoiceId);
        }

        return items.map(item => ({
            ...item,
            subtotal: (item.quantity || 0) * (item.unit_price || 0),
            total_with_tax: item.total_price || 0
        })) as InvoiceItemWithCalculations[];

    } catch (err) {
        console.error("Error in getInvoiceItemsWithCalculations:", err);
        return [];
    }
};

/**
 * Calculate invoice totals from items - works offline
 */
export const calculateInvoiceTotals = async (
    businessId: string,
    invoiceId: string
): Promise<{
    subtotal: number;
    totalTax: number;
    grandTotal: number;
    itemCount: number;
}> => {
    try {
        const items = await getInvoiceItemsByInvoiceId(businessId, invoiceId);

        const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
        const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
        const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
        const itemCount = items.length;

        return {
            subtotal,
            totalTax,
            grandTotal,
            itemCount
        };
    } catch (err) {
        console.error("Error in calculateInvoiceTotals:", err);
        return {
            subtotal: 0,
            totalTax: 0,
            grandTotal: 0,
            itemCount: 0
        };
    }
};

/**
 * Duplicate invoice item - works offline
 */
export const duplicateInvoiceItem = async (
    id: string,
    businessId: string,
    newInvoiceId?: string,
    userId?: string
): Promise<{ data?: InvoiceItem; error?: string }> => {
    try {
        const originalItem = await getInvoiceItemById(businessId, id);

        if (!originalItem) {
            return { error: "Original invoice item not found" };
        }

        const duplicateData: InvoiceItemInsert = {
            id: uuidv4(),
            invoice_id: newInvoiceId || originalItem.invoice_id,
            business_id: businessId,
            description: originalItem.description,
            quantity: originalItem.quantity,
            unit_price: originalItem.unit_price,
            tax_rate: originalItem.tax_rate,
            amount: originalItem.amount,
            tax_amount: originalItem.tax_amount,
            total_price: originalItem.total_price,
            created_at: new Date().toISOString(),
            created_by: userId || originalItem.created_by,
            updated_at: new Date().toISOString(),
            updated_by: userId || originalItem.updated_by,
        };

        return createInvoiceItem(duplicateData, businessId, userId);
    } catch (err) {
        console.error("Error in duplicateInvoiceItem:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Bulk create invoice items - works offline
 */
export const createBulkInvoiceItems = async (
    items: InvoiceItemInsert[],
    businessId: string,
    userId?: string
): Promise<{ success: boolean; created: number; errors: string[] }> => {
    try {
        const createPromises = items.map(item =>
            createInvoiceItem(item, businessId, userId)
        );

        const results = await Promise.all(createPromises);

        // Count successful creations and collect errors
        const successfulCreations = results.filter(result => !result.error).length;
        const errors = results
            .filter(result => result.error)
            .map(result => result.error!)
            .filter(Boolean);

        return {
            success: errors.length === 0,
            created: successfulCreations,
            errors
        };
    } catch (err) {
        console.error("Error in createBulkInvoiceItems:", err);
        return {
            success: false,
            created: 0,
            errors: [err instanceof Error ? err.message : "Unknown error"]
        };
    }
};

/**
 * Check if invoice item operations are pending sync
 */
export const getInvoiceItemSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending invoice item operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

// Export compatibility functions for existing code
export {
    getInvoiceItems as default,
    createInvoiceItem as insertInvoiceItem,
    updateInvoiceItemById as updateInvoiceItem,
    deleteInvoiceItemById as deleteInvoiceItem
};
