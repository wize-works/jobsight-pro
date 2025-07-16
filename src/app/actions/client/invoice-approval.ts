"use server";

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Helper function to get supabase client with null check
function getSupabaseClient() {
    const supabase = createServerClient();
    if (!supabase) {
        throw new Error('Database connection failed');
    }
    return supabase;
}

export interface ApprovalResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface ApprovalListResult {
    success: boolean;
    data?: any[];
    error?: string;
}

/**
 * Submit an invoice for approval
 */
export async function submitInvoiceForApproval(
    businessId: string,
    invoiceId: string,
    submittedBy: string,
    comments?: string
): Promise<ApprovalResult> {
    try {
        const supabase = getSupabaseClient();

        // Get current invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .eq('business_id', businessId)
            .single();

        if (invoiceError || !invoice) {
            return {
                success: false,
                error: 'Invoice not found'
            };
        }

        // Check if invoice is in draft status
        if (invoice.status !== 'draft') {
            return {
                success: false,
                error: 'Invoice must be in draft status to submit for approval'
            };
        }

        // Update invoice status to pending approval
        const { data: updatedInvoice, error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'pending_approval',
                updated_at: new Date().toISOString()
            })
            .eq('id', invoiceId)
            .eq('business_id', businessId)
            .select()
            .single();

        if (updateError) {
            return {
                success: false,
                error: 'Failed to update invoice status'
            };
        }

        revalidatePath('/dashboard/invoices');
        revalidatePath('/dashboard/invoices/approvals');

        return {
            success: true,
            data: updatedInvoice
        };

    } catch (error) {
        console.error('Error submitting invoice for approval:', error);
        return {
            success: false,
            error: 'Failed to submit invoice for approval'
        };
    }
}

/**
 * Approve an invoice
 */
export async function approveInvoice(
    businessId: string,
    invoiceId: string,
    approvedBy: string,
    comments?: string
): Promise<ApprovalResult> {
    try {
        const supabase = getSupabaseClient();

        // Get current invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .eq('business_id', businessId)
            .single();

        if (invoiceError || !invoice) {
            return {
                success: false,
                error: 'Invoice not found'
            };
        }

        // Check if invoice is pending approval
        if (invoice.status !== 'pending_approval') {
            return {
                success: false,
                error: 'Invoice must be pending approval to approve'
            };
        }

        // Update invoice status to approved
        const { data: updatedInvoice, error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('id', invoiceId)
            .eq('business_id', businessId)
            .select()
            .single();

        if (updateError) {
            return {
                success: false,
                error: 'Failed to update invoice status'
            };
        }

        revalidatePath('/dashboard/invoices');
        revalidatePath('/dashboard/invoices/approvals');

        return {
            success: true,
            data: updatedInvoice
        };

    } catch (error) {
        console.error('Error approving invoice:', error);
        return {
            success: false,
            error: 'Failed to approve invoice'
        };
    }
}

/**
 * Reject an invoice
 */
export async function rejectInvoice(
    businessId: string,
    invoiceId: string,
    rejectedBy: string,
    comments: string
): Promise<ApprovalResult> {
    try {
        const supabase = getSupabaseClient();

        // Get current invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .eq('business_id', businessId)
            .single();

        if (invoiceError || !invoice) {
            return {
                success: false,
                error: 'Invoice not found'
            };
        }

        // Check if invoice is pending approval
        if (invoice.status !== 'pending_approval') {
            return {
                success: false,
                error: 'Invoice must be pending approval to reject'
            };
        }

        // Update invoice status back to draft
        const { data: updatedInvoice, error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'draft',
                updated_at: new Date().toISOString()
            })
            .eq('id', invoiceId)
            .eq('business_id', businessId)
            .select()
            .single();

        if (updateError) {
            return {
                success: false,
                error: 'Failed to update invoice status'
            };
        }

        revalidatePath('/dashboard/invoices');
        revalidatePath('/dashboard/invoices/approvals');

        return {
            success: true,
            data: updatedInvoice
        };

    } catch (error) {
        console.error('Error rejecting invoice:', error);
        return {
            success: false,
            error: 'Failed to reject invoice'
        };
    }
}

/**
 * Get all invoices pending approval
 */
export async function getPendingApprovals(businessId: string): Promise<ApprovalListResult> {
    try {
        const supabase = getSupabaseClient();

        const { data: invoices, error } = await supabase
            .from('invoices')
            .select(`
                *,
                clients:client_id (
                    id,
                    name
                ),
                projects:project_id (
                    id,
                    name
                )
            `)
            .eq('business_id', businessId)
            .eq('status', 'pending_approval')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending approvals:', error);
            return {
                success: false,
                error: 'Failed to fetch pending approvals'
            };
        }

        return {
            success: true,
            data: invoices || []
        };

    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return {
            success: false,
            error: 'Failed to fetch pending approvals'
        };
    }
}

/**
 * Bulk approve multiple invoices
 */
export async function bulkApproveInvoices(
    businessId: string,
    invoiceIds: string[],
    approvedBy: string,
    comments?: string
): Promise<ApprovalResult> {
    try {
        const supabase = getSupabaseClient();

        // Get all invoices to approve
        const { data: invoices, error: fetchError } = await supabase
            .from('invoices')
            .select('*')
            .eq('business_id', businessId)
            .in('id', invoiceIds)
            .eq('status', 'pending_approval');

        if (fetchError) {
            return {
                success: false,
                error: 'Failed to fetch invoices for bulk approval'
            };
        }

        if (!invoices || invoices.length === 0) {
            return {
                success: false,
                error: 'No pending invoices found for approval'
            };
        }

        // Update all invoices to approved status
        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('business_id', businessId)
            .in('id', invoiceIds)
            .eq('status', 'pending_approval');

        if (updateError) {
            return {
                success: false,
                error: 'Failed to update invoice statuses'
            };
        }

        revalidatePath('/dashboard/invoices');
        revalidatePath('/dashboard/invoices/approvals');

        return {
            success: true,
            data: invoices[0] // Return first invoice as representative
        };

    } catch (error) {
        console.error('Error bulk approving invoices:', error);
        return {
            success: false,
            error: 'Failed to bulk approve invoices'
        };
    }
}

/**
 * Get approval history for an invoice
 */
export async function getApprovalHistory(
    businessId: string,
    invoiceId: string
): Promise<ApprovalListResult> {
    try {
        const supabase = getSupabaseClient();

        const { data: history, error } = await supabase
            .from('invoice_approval_history')
            .select('*')
            .eq('business_id', businessId)
            .eq('invoice_id', invoiceId)
            .order('performed_at', { ascending: false });

        if (error) {
            console.error('Error fetching approval history:', error);
            return {
                success: false,
                error: 'Failed to fetch approval history'
            };
        }

        return {
            success: true,
            data: history || []
        };

    } catch (error) {
        console.error('Error fetching approval history:', error);
        return {
            success: false,
            error: 'Failed to fetch approval history'
        };
    }
}
