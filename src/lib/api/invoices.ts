// Invoices API client types and functions
export interface Invoice {
    id: string;
    business_id: string;
    client_id: string;
    project_id?: string;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    amount: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount: number;
    status: string;
    notes?: string;
    terms?: string;
    payment_terms?: string;
    currency: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    client?: any;
    project?: any;
    items?: any[];
    billing_address?: {
        name?: string;
        attention?: string;
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    business_info?: {
        name: string;
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        phone?: string;
        email: string;
        website: string;
        tax_id?: string;
        logo_url?: string;
    };
    calculated_totals?: {
        subtotal: number;
        total_discount: number;
        total_tax: number;
        total: number;
    };
}

// Query parameters
export interface InvoiceQuery {
    include?: string;
    client_id?: string;
    project_id?: string;
    status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}

// Create/Update types
export interface CreateInvoiceData {
    client_id: string;
    project_id?: string;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    amount: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount: number;
    status?: string;
    notes?: string;
    terms?: string;
    payment_terms?: string;
    currency?: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> { }

// API response types
export interface InvoiceResponse {
    data: Invoice[];
    count: number;
}

export interface InvoiceSingleResponse {
    data: Invoice;
    message: string;
}

// Invoices API functions
export const invoicesApi = {
    // Get invoices
    async getInvoices(params?: InvoiceQuery): Promise<InvoiceResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/invoices?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch invoices');
        }
        return response.json();
    },

    // Create invoice
    async createInvoice(data: CreateInvoiceData): Promise<InvoiceSingleResponse> {
        const response = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create invoice');
        }
        return response.json();
    },

    // Update invoice
    async updateInvoice(id: string, data: UpdateInvoiceData): Promise<InvoiceSingleResponse> {
        const response = await fetch('/api/invoices', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update invoice');
        }
        return response.json();
    },

    // Delete invoice
    async deleteInvoice(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/invoices?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete invoice');
        }
        return response.json();
    },

    // Get invoice by ID
    async getInvoiceById(id: string): Promise<Invoice | null> {
        const response = await invoicesApi.getInvoices();
        return response.data.find(invoice => invoice.id === id) || null;
    },

    // Get invoice with details
    async getInvoiceWithDetails(id: string): Promise<Invoice | null> {
        const response = await invoicesApi.getInvoices({
            include: 'details',
            limit: 1
        });
        return response.data.find(invoice => invoice.id === id) || null;
    },

    // Get invoices with client info
    async getInvoicesWithClient(): Promise<InvoiceResponse> {
        return invoicesApi.getInvoices({ include: 'client' });
    },

    // Search invoices
    async searchInvoices(query: string): Promise<InvoiceResponse> {
        return invoicesApi.getInvoices({ search: query });
    },

    // Get invoices by client
    async getInvoicesByClient(clientId: string): Promise<InvoiceResponse> {
        return invoicesApi.getInvoices({ client_id: clientId });
    },

    // Get invoices by project
    async getInvoicesByProject(projectId: string): Promise<InvoiceResponse> {
        return invoicesApi.getInvoices({ project_id: projectId });
    },

    // Get invoices by status
    async getInvoicesByStatus(status: string): Promise<InvoiceResponse> {
        return invoicesApi.getInvoices({ status });
    },

    // Get invoices by date range
    async getInvoicesByDateRange(startDate: string, endDate: string): Promise<InvoiceResponse> {
        return invoicesApi.getInvoices({ start_date: startDate, end_date: endDate });
    },
};

// Utility functions
export const invoiceUtils = {
    // Calculate invoice total
    calculateTotal: (invoice: Invoice): number => {
        const subtotal = invoice.amount || 0;
        const tax = invoice.tax_amount || 0;
        const discount = invoice.discount_amount || 0;
        return subtotal + tax - discount;
    },

    // Check if invoice is overdue
    isOverdue: (invoice: Invoice): boolean => {
        if (!invoice.due_date || invoice.status === 'paid') return false;
        return new Date(invoice.due_date) < new Date();
    },

    // Check if invoice is paid
    isPaid: (invoice: Invoice): boolean => {
        return invoice.status === 'paid';
    },

    // Check if invoice is draft
    isDraft: (invoice: Invoice): boolean => {
        return invoice.status === 'draft';
    },

    // Check if invoice is sent
    isSent: (invoice: Invoice): boolean => {
        return invoice.status === 'sent';
    },

    // Get invoice status color
    getStatusColor: (status: string): string => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'text-green-600';
            case 'sent':
                return 'text-blue-600';
            case 'overdue':
                return 'text-red-600';
            case 'draft':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    },

    // Get invoice status badge color
    getStatusBadgeColor: (status: string): string => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'sent':
                return 'bg-blue-100 text-blue-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    },

    // Format currency
    formatCurrency: (amount: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    },

    // Format date
    formatDate: (date: string): string => {
        return new Date(date).toLocaleDateString();
    },

    // Calculate days until due
    getDaysUntilDue: (invoice: Invoice): number => {
        if (!invoice.due_date) return 0;
        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        const diffTime = dueDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Get due date status
    getDueDateStatus: (invoice: Invoice): 'paid' | 'overdue' | 'due_soon' | 'on_time' => {
        if (invoice.status === 'paid') return 'paid';

        const daysUntilDue = invoiceUtils.getDaysUntilDue(invoice);

        if (daysUntilDue < 0) return 'overdue';
        if (daysUntilDue <= 7) return 'due_soon';
        return 'on_time';
    },

    // Validate invoice data
    validateInvoice: (invoice: CreateInvoiceData): string[] => {
        const errors: string[] = [];

        if (!invoice.client_id?.trim()) {
            errors.push('Client is required');
        }

        if (!invoice.invoice_number?.trim()) {
            errors.push('Invoice number is required');
        }

        if (!invoice.invoice_date?.trim()) {
            errors.push('Invoice date is required');
        }

        if (invoice.amount < 0) {
            errors.push('Amount must be non-negative');
        }

        if (invoice.total_amount < 0) {
            errors.push('Total amount must be non-negative');
        }

        return errors;
    },

    // Generate invoice number
    generateInvoiceNumber: (prefix: string = 'INV', existingNumbers: string[] = []): string => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        let counter = 1;
        let invoiceNumber = `${prefix}-${year}${month}-${String(counter).padStart(3, '0')}`;

        while (existingNumbers.includes(invoiceNumber)) {
            counter++;
            invoiceNumber = `${prefix}-${year}${month}-${String(counter).padStart(3, '0')}`;
        }

        return invoiceNumber;
    },

    // Filter invoices by status
    filterByStatus: (invoices: Invoice[], status: string): Invoice[] => {
        return invoices.filter(invoice => invoice.status === status);
    },

    // Filter overdue invoices
    filterOverdue: (invoices: Invoice[]): Invoice[] => {
        return invoices.filter(invoice => invoiceUtils.isOverdue(invoice));
    },

    // Sort invoices by date
    sortByDate: (invoices: Invoice[], ascending: boolean = false): Invoice[] => {
        return [...invoices].sort((a, b) => {
            const dateA = new Date(a.invoice_date);
            const dateB = new Date(b.invoice_date);
            return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });
    },

    // Sort invoices by due date
    sortByDueDate: (invoices: Invoice[], ascending: boolean = true): Invoice[] => {
        return [...invoices].sort((a, b) => {
            const dueDateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
            const dueDateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
            return ascending ? dueDateA.getTime() - dueDateB.getTime() : dueDateB.getTime() - dueDateA.getTime();
        });
    },

    // Get invoice summary
    getInvoiceSummary: (invoices: Invoice[]) => {
        const total = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
        const paid = invoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.total_amount, 0);
        const pending = invoices.filter(invoice => invoice.status !== 'paid').reduce((sum, invoice) => sum + invoice.total_amount, 0);
        const overdue = invoices.filter(invoice => invoiceUtils.isOverdue(invoice)).reduce((sum, invoice) => sum + invoice.total_amount, 0);

        return {
            total_amount: total,
            paid_amount: paid,
            pending_amount: pending,
            overdue_amount: overdue,
            total_count: invoices.length,
            paid_count: invoices.filter(invoice => invoice.status === 'paid').length,
            pending_count: invoices.filter(invoice => invoice.status !== 'paid').length,
            overdue_count: invoices.filter(invoice => invoiceUtils.isOverdue(invoice)).length,
        };
    },

    // Create invoice template
    createTemplate: (clientId: string): CreateInvoiceData => ({
        client_id: clientId,
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        amount: 0,
        total_amount: 0,
        status: 'draft',
        currency: 'USD',
    }),
};
