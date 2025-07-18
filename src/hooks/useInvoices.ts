import { useState, useEffect } from 'react';
import { invoicesApi, Invoice, InvoiceQuery, CreateInvoiceData, UpdateInvoiceData } from '@/lib/api/invoices';
import { InvoiceWithDetails } from '@/types/invoices';

// Hook for fetching invoices
export const useInvoices = (query?: InvoiceQuery) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.getInvoices(query);
            setInvoices(Array.isArray(response.data) ? response.data : []);
            setCount(response.pagination.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
            setInvoices([]); // Ensure invoices is always an array
            setCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [JSON.stringify(query)]);

    return {
        invoices,
        loading,
        error,
        count,
        refetch: fetchInvoices,
    };
};

// Hook for creating invoices
export const useCreateInvoice = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createInvoice = async (data: CreateInvoiceData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.createInvoice(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createInvoice,
        loading,
        error,
    };
};

// Hook for updating invoices
export const useUpdateInvoice = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateInvoice = async (id: string, data: UpdateInvoiceData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.updateInvoice(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateInvoice,
        loading,
        error,
    };
};

// Hook for deleting invoices
export const useDeleteInvoice = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteInvoice = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await invoicesApi.deleteInvoice(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        deleteInvoice,
        loading,
        error,
    };
};

// Hook for invoice mutations (create, update, delete)
export const useInvoiceMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createInvoice = async (data: CreateInvoiceData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.createInvoice(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateInvoice = async (id: string, data: UpdateInvoiceData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.updateInvoice(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteInvoice = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await invoicesApi.deleteInvoice(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createInvoice,
        updateInvoice,
        deleteInvoice,
        loading,
        error,
    };
};

// Hook for invoice by ID
export const useInvoice = (id: string) => {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await invoicesApi.getInvoiceById(id);
            setInvoice(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchInvoice();
        }
    }, [id]);

    return {
        invoice,
        loading,
        error,
        refetch: fetchInvoice,
    };
};

// Hook for invoice with details
export const useInvoiceWithDetails = (id: string) => {
    const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoiceWithDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await invoicesApi.getInvoiceWithDetails(id);
            setInvoice(data as any);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchInvoiceWithDetails();
        }
    }, [id]);

    return {
        invoice,
        loading,
        error,
        refetch: fetchInvoiceWithDetails,
    };
};

// Hook for invoices by client
export const useInvoicesByClient = (clientId: string) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoicesByClient = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.getInvoicesByClient(clientId);
            setInvoices(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch client invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchInvoicesByClient();
        }
    }, [clientId]);

    return {
        invoices,
        loading,
        error,
        refetch: fetchInvoicesByClient,
    };
};

// Hook for invoices by project
export const useInvoicesByProject = (projectId: string) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoicesByProject = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.getInvoicesByProject(projectId);
            setInvoices(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch project invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchInvoicesByProject();
        }
    }, [projectId]);

    return {
        invoices,
        loading,
        error,
        refetch: fetchInvoicesByProject,
    };
};

// Hook for searching invoices
export const useInvoiceSearch = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchInvoices = async (query: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoicesApi.searchInvoices(query);
            setInvoices(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search invoices');
        } finally {
            setLoading(false);
        }
    };

    return {
        invoices,
        loading,
        error,
        searchInvoices,
    };
};

// Hook for invoice filters
export const useInvoiceFilters = () => {
    const [filters, setFilters] = useState<InvoiceQuery>({});
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyFilters = async (newFilters: InvoiceQuery) => {
        try {
            setLoading(true);
            setError(null);
            setFilters(newFilters);
            const response = await invoicesApi.getInvoices(newFilters);
            setInvoices(response.data);
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
        invoices,
        loading,
        error,
        applyFilters,
        clearFilters,
    };
};
