// Invoice Items API client types and functions
export interface InvoiceItem {
    id: string;
    business_id: string;
    invoice_id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    tax_rate?: number;
    tax_amount?: number;
    discount_rate?: number;
    discount_amount?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    invoice?: any;
    totals?: {
        subtotal: number;
        discount_amount: number;
        tax_amount: number;
        total: number;
    };
}

// Query parameters
export interface InvoiceItemQuery {
    include?: string;
    invoice_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

// Create/Update types
export interface CreateInvoiceItemData {
    invoice_id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    tax_rate?: number;
    tax_amount?: number;
    discount_rate?: number;
    discount_amount?: number;
    notes?: string;
}

export interface UpdateInvoiceItemData extends Partial<CreateInvoiceItemData> { }

export interface BulkUpsertInvoiceItemData {
    items: Array<CreateInvoiceItemData & { id?: string }>;
}

// API response types
export interface InvoiceItemResponse {
    data: InvoiceItem[];
    count: number;
}

export interface InvoiceItemSingleResponse {
    data: InvoiceItem;
    message: string;
}

export interface BulkUpsertResponse {
    message: string;
    results: Array<{
        success: boolean;
        data?: InvoiceItem;
        item_id?: string;
        error?: string;
    }>;
    success_count: number;
    failure_count: number;
}

// Invoice Items API functions
export const invoiceItemsApi = {
    // Get invoice items
    async getInvoiceItems(params?: InvoiceItemQuery): Promise<InvoiceItemResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/invoice-items?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch invoice items');
        }
        return response.json();
    },

    // Create invoice item
    async createInvoiceItem(data: CreateInvoiceItemData): Promise<InvoiceItemSingleResponse> {
        const response = await fetch('/api/invoice-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create invoice item');
        }
        return response.json();
    },

    // Update invoice item
    async updateInvoiceItem(id: string, data: UpdateInvoiceItemData): Promise<InvoiceItemSingleResponse> {
        const response = await fetch('/api/invoice-items', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update invoice item');
        }
        return response.json();
    },

    // Delete invoice item
    async deleteInvoiceItem(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/invoice-items?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete invoice item');
        }
        return response.json();
    },

    // Bulk upsert invoice items
    async bulkUpsertInvoiceItems(data: BulkUpsertInvoiceItemData): Promise<BulkUpsertResponse> {
        const response = await fetch('/api/invoice-items', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to bulk upsert invoice items');
        }
        return response.json();
    },

    // Get invoice items by invoice ID
    async getInvoiceItemsByInvoiceId(invoiceId: string): Promise<InvoiceItemResponse> {
        return this.getInvoiceItems({ invoice_id: invoiceId });
    },

    // Search invoice items
    async searchInvoiceItems(query: string): Promise<InvoiceItemResponse> {
        return this.getInvoiceItems({ search: query });
    },
};

// Utility functions
export const invoiceItemUtils = {
    // Calculate item subtotal
    calculateSubtotal: (item: InvoiceItem): number => {
        return (item.quantity || 0) * (item.rate || 0);
    },

    // Calculate item total with tax and discount
    calculateTotal: (item: InvoiceItem): number => {
        const subtotal = invoiceItemUtils.calculateSubtotal(item);
        const discount = item.discount_amount || 0;
        const tax = item.tax_amount || 0;
        return subtotal - discount + tax;
    },

    // Calculate tax amount from rate
    calculateTaxAmount: (item: InvoiceItem): number => {
        if (!item.tax_rate) return 0;
        const subtotal = invoiceItemUtils.calculateSubtotal(item);
        return (subtotal * item.tax_rate) / 100;
    },

    // Calculate discount amount from rate
    calculateDiscountAmount: (item: InvoiceItem): number => {
        if (!item.discount_rate) return 0;
        const subtotal = invoiceItemUtils.calculateSubtotal(item);
        return (subtotal * item.discount_rate) / 100;
    },

    // Format currency
    formatCurrency: (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    },

    // Format quantity
    formatQuantity: (quantity: number): string => {
        return quantity.toFixed(2).replace(/\.?0+$/, '');
    },

    // Validate invoice item
    validateInvoiceItem: (item: CreateInvoiceItemData): string[] => {
        const errors: string[] = [];

        if (!item.description?.trim()) {
            errors.push('Description is required');
        }

        if (item.quantity < 0) {
            errors.push('Quantity must be non-negative');
        }

        if (item.rate < 0) {
            errors.push('Rate must be non-negative');
        }

        if (item.amount < 0) {
            errors.push('Amount must be non-negative');
        }

        return errors;
    },

    // Calculate items total
    calculateItemsTotal: (items: InvoiceItem[]): {
        subtotal: number;
        totalDiscount: number;
        totalTax: number;
        total: number;
    } => {
        const subtotal = items.reduce((sum, item) => sum + invoiceItemUtils.calculateSubtotal(item), 0);
        const totalDiscount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
        const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
        const total = subtotal - totalDiscount + totalTax;

        return {
            subtotal,
            totalDiscount,
            totalTax,
            total,
        };
    },

    // Group items by invoice
    groupByInvoice: (items: InvoiceItem[]): Record<string, InvoiceItem[]> => {
        return items.reduce((acc, item) => {
            if (!acc[item.invoice_id]) {
                acc[item.invoice_id] = [];
            }
            acc[item.invoice_id].push(item);
            return acc;
        }, {} as Record<string, InvoiceItem[]>);
    },

    // Sort items by creation date
    sortByCreatedAt: (items: InvoiceItem[], ascending: boolean = true): InvoiceItem[] => {
        return [...items].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });
    },

    // Create invoice item template
    createTemplate: (invoiceId: string): CreateInvoiceItemData => ({
        invoice_id: invoiceId,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
    }),
};
