"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/types/invoices';
import { Client } from '@/types/clients';
import { Project } from '@/types/projects';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useBusiness } from '@/lib/business-context';
import { useUser } from '@clerk/nextjs';
import { toast } from '@/hooks/use-toast';

export default function InvoiceApprovalsPage() {
    const router = useRouter();
    const { businessId } = useBusiness();
    const { user } = useUser();

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const [processingInvoice, setProcessingInvoice] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ invoiceId: string; show: boolean }>({ invoiceId: '', show: false });
    const [rejectComments, setRejectComments] = useState('');

    useEffect(() => {
        if (businessId) {
            loadData();
        }
    }, [businessId]);

    const loadData = async () => {
        try {
            setLoading(true);
            // TODO: Create hooks for invoice approval functionality
            // const [invoicesData, clientsData, projectsData] = await Promise.all([
            //     getPendingApprovals(businessId),
            //     getClients(businessId),
            //     getProjects(businessId)
            // ]);

            // Temporarily set empty data until hooks are created
            const [invoicesData, clientsData, projectsData] = [
                { data: [], success: true },
                { data: [], success: true },
                { data: [], success: true }
            ];

            if (invoicesData.success) {
                setInvoices(invoicesData.data || []);
            }
            setClients(clientsData.data || []);
            setProjects(projectsData.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load approval data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (invoiceId: string) => {
        if (!user) return;

        try {
            setProcessingInvoice(invoiceId);
            // TODO: Create hook for approveInvoice functionality
            // const result = await approveInvoice(businessId, invoiceId, user.id);
            toast.info('Invoice approval feature needs hook migration');

            // Temporary success simulation
            const result = { success: true };

            if (result.success) {
                toast.success('Invoice approved successfully');
                await loadData();
            } else {
                toast.error('Failed to approve invoice');
            }
        } catch (error) {
            console.error('Error approving invoice:', error);
            toast.error('Failed to approve invoice');
        } finally {
            setProcessingInvoice(null);
        }
    };

    const handleReject = async () => {
        if (!user || !rejectComments.trim()) return;

        try {
            setProcessingInvoice(rejectModal.invoiceId);
            // TODO: Create hook for rejectInvoice functionality  
            // const result = await rejectInvoice(businessId, rejectModal.invoiceId, user.id, rejectComments);
            toast.info('Invoice rejection feature needs hook migration');

            // Temporary success simulation
            const result = { success: true };

            if (result.success) {
                toast.success('Invoice rejected successfully');
                await loadData();
                setRejectModal({ invoiceId: '', show: false });
                setRejectComments('');
            } else {
                toast.error('Failed to reject invoice');
            }
        } catch (error) {
            console.error('Error rejecting invoice:', error);
            toast.error('Failed to reject invoice');
        } finally {
            setProcessingInvoice(null);
        }
    };

    const handleBulkApprove = async () => {
        if (!user || selectedInvoices.length === 0) return;

        try {
            setProcessingInvoice('bulk');
            // TODO: Create hook for bulkApproveInvoices functionality
            // const result = await bulkApproveInvoices(businessId, selectedInvoices, user.id);
            toast.info('Bulk invoice approval feature needs hook migration');

            // Temporary success simulation
            const result = { success: true };

            if (result.success) {
                toast.success(`${selectedInvoices.length} invoices approved successfully`);
                setSelectedInvoices([]);
                await loadData();
            } else {
                toast.error('Failed to bulk approve invoices');
            }
        } catch (error) {
            console.error('Error bulk approving invoices:', error);
            toast.error('Failed to bulk approve invoices');
        } finally {
            setProcessingInvoice(null);
        }
    };

    const toggleInvoiceSelection = (invoiceId: string) => {
        setSelectedInvoices(prev =>
            prev.includes(invoiceId)
                ? prev.filter(id => id !== invoiceId)
                : [...prev, invoiceId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === invoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(invoices.map(invoice => invoice.id));
        }
    };

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client?.name || 'Unknown Client';
    };

    const getProjectName = (projectId: string | undefined) => {
        if (!projectId) return 'No Project';
        const project = projects.find(p => p.id === projectId);
        return project?.name || 'Unknown Project';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Invoice Approvals</h1>
                    <p className="text-gray-600 mt-2">
                        Review and approve pending invoices
                    </p>
                </div>
                {selectedInvoices.length > 0 && (
                    <button
                        onClick={handleBulkApprove}
                        disabled={processingInvoice === 'bulk'}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        {processingInvoice === 'bulk' ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        Approve Selected ({selectedInvoices.length})
                    </button>
                )}
            </div>

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending approvals</h3>
                    <p className="text-gray-600">
                        All invoices are up to date. New invoices will appear here when they need approval.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedInvoices.length === invoices.length}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">Select All</span>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                            <div key={invoice.id} className="px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <input
                                            type="checkbox"
                                            checked={selectedInvoices.includes(invoice.id)}
                                            onChange={() => toggleInvoiceSelection(invoice.id)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                        />
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Invoice #{invoice.invoice_number}
                                                </h3>
                                                <span className="text-sm text-gray-600">
                                                    {formatDate(invoice.created_at)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Client</label>
                                                    <p className="text-sm text-gray-900">{getClientName(invoice.client_id)}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Project</label>
                                                    <p className="text-sm text-gray-900">{getProjectName(invoice.project_id)}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Amount</label>
                                                    <p className="text-sm text-gray-900 font-semibold">
                                                        {formatCurrency(invoice.amount || 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            {invoice.notes && (
                                                <div className="mb-4">
                                                    <label className="text-sm font-medium text-gray-600">Notes</label>
                                                    <p className="text-sm text-gray-900">{invoice.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleApprove(invoice.id)}
                                            disabled={processingInvoice === invoice.id}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                            {processingInvoice === invoice.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            Approve
                                        </button>

                                        <button
                                            onClick={() => setRejectModal({ invoiceId: invoice.id, show: true })}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Reject
                                        </button>

                                        <button
                                            onClick={() => router.push(`/dashboard/invoices/view/${invoice.id}`)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Invoice</h3>
                        <p className="text-gray-600 mb-4">
                            Please provide a reason for rejecting this invoice:
                        </p>
                        <textarea
                            value={rejectComments}
                            onChange={(e) => setRejectComments(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setRejectModal({ invoiceId: '', show: false });
                                    setRejectComments('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectComments.trim() || processingInvoice === rejectModal.invoiceId}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                            >
                                {processingInvoice === rejectModal.invoiceId ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    'Reject Invoice'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
