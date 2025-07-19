/**
 * Invoice approval API functions
 * Replaces action imports with proper API client functions
 */

export interface InvoiceApprovalResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Approve an invoice
 */
export async function approveInvoiceApi(
    businessId: string,
    invoiceId: string,
    approvedBy: string,
    comments?: string
): Promise<InvoiceApprovalResponse> {
    try {
        const response = await fetch('/api/invoices/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                invoiceId,
                approvedBy,
                comments
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to approve invoice' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error approving invoice:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to approve invoice'
        };
    }
}

/**
 * Reject an invoice
 */
export async function rejectInvoiceApi(
    businessId: string,
    invoiceId: string,
    rejectedBy: string,
    comments: string
): Promise<InvoiceApprovalResponse> {
    try {
        const response = await fetch('/api/invoices/reject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                invoiceId,
                rejectedBy,
                comments
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to reject invoice' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error rejecting invoice:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reject invoice'
        };
    }
}

/**
 * Bulk approve invoices
 */
export async function bulkApproveInvoicesApi(
    businessId: string,
    invoiceIds: string[],
    approvedBy: string,
    comments?: string
): Promise<InvoiceApprovalResponse> {
    try {
        const response = await fetch('/api/invoices/bulk-approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                invoiceIds,
                approvedBy,
                comments
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to bulk approve invoices' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error bulk approving invoices:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to bulk approve invoices'
        };
    }
}

/**
 * Get pending invoice approvals
 */
export async function getPendingApprovalsApi(businessId: string): Promise<InvoiceApprovalResponse> {
    try {
        const response = await fetch(`/api/invoices/pending-approvals?businessId=${businessId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to fetch pending approvals' };
        }

        const data = await response.json();
        return { success: true, data: data.data };
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch pending approvals'
        };
    }
}
