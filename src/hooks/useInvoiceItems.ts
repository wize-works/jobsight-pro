import { useState, useEffect } from 'react';
import { invoiceItemsApi, invoiceItemUtils, InvoiceItem, InvoiceItemQuery, CreateInvoiceItemData, UpdateInvoiceItemData } from '@/lib/api/invoice-items';

// Hook for fetching invoice items
export const useInvoiceItems = (query?: InvoiceItemQuery) => {
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchInvoiceItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.getInvoiceItems(query);
            setInvoiceItems(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoiceItems();
    }, [JSON.stringify(query)]);

    return {
        invoiceItems,
        loading,
        error,
        count,
        refetch: fetchInvoiceItems,
    };
};

// Hook for invoice items by invoice ID
export const useInvoiceItemsByInvoice = (invoiceId: string) => {
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoiceItemsByInvoice = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.getInvoiceItemsByInvoiceId(invoiceId);
            setInvoiceItems(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (invoiceId) {
            fetchInvoiceItemsByInvoice();
        }
    }, [invoiceId]);

    return {
        invoiceItems,
        loading,
        error,
        refetch: fetchInvoiceItemsByInvoice,
    };
};

// Hook for creating invoice items
export const useCreateInvoiceItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createInvoiceItem = async (data: CreateInvoiceItemData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.createInvoiceItem(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice item');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createInvoiceItem,
        loading,
        error,
    };
};

// Hook for updating invoice items
export const useUpdateInvoiceItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateInvoiceItem = async (id: string, data: UpdateInvoiceItemData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.updateInvoiceItem(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update invoice item');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateInvoiceItem,
        loading,
        error,
    };
};

// Hook for deleting invoice items
export const useDeleteInvoiceItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteInvoiceItem = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await invoiceItemsApi.deleteInvoiceItem(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete invoice item');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        deleteInvoiceItem,
        loading,
        error,
    };
};

// Hook for bulk upsert invoice items
export const useBulkUpsertInvoiceItems = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const bulkUpsertInvoiceItems = async (invoiceId: string, items: CreateInvoiceItemData[]) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.bulkUpsertInvoiceItems({ items });
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to bulk upsert invoice items');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        bulkUpsertInvoiceItems,
        loading,
        error,
    };
};

// Hook for invoice item mutations (create, update, delete)
export const useInvoiceItemMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createInvoiceItem = async (data: CreateInvoiceItemData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.createInvoiceItem(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice item');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateInvoiceItem = async (id: string, data: UpdateInvoiceItemData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.updateInvoiceItem(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update invoice item');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteInvoiceItem = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await invoiceItemsApi.deleteInvoiceItem(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete invoice item');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const bulkUpsertInvoiceItems = async (invoiceId: string, items: CreateInvoiceItemData[]) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.bulkUpsertInvoiceItems({ items });
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to bulk upsert invoice items');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createInvoiceItem,
        updateInvoiceItem,
        deleteInvoiceItem,
        bulkUpsertInvoiceItems,
        loading,
        error,
    };
};

// Hook for invoice item by ID
export const useInvoiceItem = (id: string) => {
    const [invoiceItem, setInvoiceItem] = useState<InvoiceItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoiceItem = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceItemsApi.getInvoiceItems();
            const data = response.data.find(item => item.id === id) || null;
            setInvoiceItem(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice item');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchInvoiceItem();
        }
    }, [id]);

    return {
        invoiceItem,
        loading,
        error,
        refetch: fetchInvoiceItem,
    };
};

// Hook for calculating invoice totals
export const useInvoiceCalculations = (invoiceId: string) => {
    const { invoiceItems, loading, error } = useInvoiceItemsByInvoice(invoiceId);
    const [calculations, setCalculations] = useState({
        subtotal: 0,
        total_tax: 0,
        total_discount: 0,
        total: 0,
    });

    useEffect(() => {
        if (invoiceItems.length > 0) {
            const calculations = invoiceItemUtils.calculateItemsTotal(invoiceItems);
            setCalculations({
                subtotal: calculations.subtotal,
                total_tax: calculations.totalTax,
                total_discount: calculations.totalDiscount,
                total: calculations.total,
            });
        }
    }, [invoiceItems]);

    return {
        calculations,
        invoiceItems,
        loading,
        error,
    };
};

// Hook for invoice item validation
export const useInvoiceItemValidation = () => {
    const [errors, setErrors] = useState<string[]>([]);

    const validateInvoiceItem = (data: CreateInvoiceItemData): boolean => {
        const validationErrors = invoiceItemUtils.validateInvoiceItem(data);
        setErrors(validationErrors);
        return validationErrors.length === 0;
    };

    return {
        validateInvoiceItem,
        errors,
    };
};

// Hook for invoice item filters
export const useInvoiceItemFilters = () => {
    const [filters, setFilters] = useState<InvoiceItemQuery>({});
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyFilters = async (newFilters: InvoiceItemQuery) => {
        try {
            setLoading(true);
            setError(null);
            setFilters(newFilters);
            const response = await invoiceItemsApi.getInvoiceItems(newFilters);
            setInvoiceItems(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to apply filters');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({});
    };

    return {
        filters,
        invoiceItems,
        loading,
        error,
        applyFilters,
        clearFilters,
    };
};
