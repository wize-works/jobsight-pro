"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Invoice, InvoiceStatus, invoiceStatusOptions, InvoiceWithClient, InvoiceWithDetails } from "@/types/invoices";
import { formatCurrency } from "@/utils/formatters";
import InvoiceCard from './components/card';
import { useBusiness } from '@/lib/business-context';
import { useInvoices, useInvoiceWithDetails } from '@/hooks/useInvoices';
import ErrorBoundary from "@/components/error-boundary";
import ModalLoading from "@/components/modal-loading";
import InvoicesListLoading from "./loading";
import { FeatureGate } from "@/components/subscription/FeatureGate";

// Lazy load modal components for better performance
const InvoiceNewModal = dynamic(() => import("./components/modal-new"), {
    loading: () => <ModalLoading message="Loading invoice form..." />,
    ssr: false
});

const InvoiceEditModal = dynamic(() => import("./components/modal-edit"), {
    loading: () => <ModalLoading message="Loading edit form..." />,
    ssr: false
});

const InvoiceSendModal = dynamic(() => import("./components/modal-send"), {
    loading: () => <ModalLoading message="Loading send form..." />,
    ssr: false
});

export default function InvoicesPage() {
    const { businessId, business } = useBusiness();

    // Use the invoices hook with client data
    const {
        invoices: hookInvoices,
        loading: invoicesLoading,
        error: invoicesError,
        refetch: refetchInvoices
    } = useInvoices({ include: 'client' });

    const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
    const [initialInvoices, setInitialInvoices] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>();
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && window.localStorage.getItem("invoiceViewType") === "list" ? "list" : "grid"
    );
    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithClient | null>(null);
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceWithDetails | null>(null);

    // Sync hook data with local state for filtering
    useEffect(() => {
        if (hookInvoices) {
            setFilteredInvoices(hookInvoices);
            setInitialInvoices(hookInvoices);
        }
        if (invoicesError) {
            setError(invoicesError);
        }
    }, [hookInvoices, invoicesError]);

    useEffect(() => {
        async function fetchInvoices() {
            // This effect is no longer needed since we're using the hook
            // The hook handles fetching automatically
        }

        // fetchInvoices(); // Commented out since hook handles this
    }, [businessId]);

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("invoiceViewType", type);
        }
    };

    const handleEditInvoice = (invoice: InvoiceWithClient) => {
        setSelectedInvoice(invoice);
        setShowEditModal(true);
    };

    const handleNewInvoice = () => {
        setShowNewModal(true);
    };

    const handleSendInvoice = async (invoice: InvoiceWithClient) => {
        if (!businessId) return;

        try {
            // We need to fetch invoice details using the hook or API directly
            // For now, let's use a direct API call since we need it on-demand
            const { invoicesApi } = await import('@/lib/api/invoices');
            const invoiceDetails = await invoicesApi.getInvoiceWithDetails(invoice.id);
            if (invoiceDetails) {
                setSelectedInvoice(invoice);
                setSelectedInvoiceDetails(invoiceDetails as any);
                setShowSendModal(true);
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error);
        }
    };

    const handleSaveNewInvoice = (newInvoice: any) => {
        // Refresh the invoices from the hook
        refetchInvoices();
    };

    const handleSaveEditInvoice = (updatedInvoice: any) => {
        // Update the filtered invoices locally and refresh from hook
        setFilteredInvoices(prev => prev.map(inv =>
            inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv
        ));
        refetchInvoices();
    };

    if (invoicesLoading) {
        return (
            <InvoicesListLoading viewType={viewType} />
        );
    }

    if (error) {
        return (
            <div className="container mx-auto">
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Error</h3>
                        <div className="text-xs">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <ErrorBoundary>
                <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">Invoices</h1>
                            <p className="text-sm text-base-content/50">Manage your invoices efficiently</p>
                        </div>                        <div className="flex items-center space-x-6">
                            <FeatureGate
                                feature="invoicing"
                                requiredPlan="pro"
                                fallback={
                                    <button
                                        className="btn btn-primary btn-disabled"
                                        disabled
                                        title="Invoicing requires Pro plan or higher"
                                    >
                                        <i className="far fa-lock mr-2"></i> New Invoice
                                    </button>
                                }
                            >
                                <button
                                    className="btn btn-primary"
                                    onClick={handleNewInvoice}
                                >
                                    <i className="far fa-plus mr-2"></i> New Invoice
                                </button>
                            </FeatureGate>
                        </div>
                    </div>

                    {/* Invoice Statistics */}
                    <ErrorBoundary>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="stat bg-base-100 shadow-lg">
                                <div className="stat-title">Total Invoices</div>
                                <div className="flex items-center justify-between">
                                    <div className="stat-value text-primary">{filteredInvoices.length}</div>
                                    <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                                        <i className="far fa-money-bill-wave text-primary text-2xl"></i>
                                    </div>
                                </div>
                                <div className="stat-desc">All invoices in the system</div>
                            </div>
                            <div className="stat bg-base-100 shadow-lg">
                                <div className="stat-title">Total Amount</div>
                                <div className="flex items-center justify-between">
                                    <div className="stat-value text-accent">
                                        {formatCurrency(filteredInvoices.reduce((sum: number, invoice: any) => sum + (invoice?.amount || 0), 0))}
                                    </div>
                                    <div className="stat-icon text-accent bg-accent/20 rounded-full h-12 w-12 flex items-center justify-center">
                                        <i className="far fa-dollar-sign text-accent text-2xl"></i>
                                    </div>
                                </div>
                                <div className="stat-desc">Total amount of all invoices</div>
                            </div>
                            <div className="stat bg-base-100 shadow-lg">
                                <div className="stat-title">Paid Invoices</div>
                                <div className="flex items-center justify-between">
                                    <div className="stat-value text-success">
                                        {filteredInvoices.filter(invoice => invoice.status === "paid").length}
                                    </div>
                                    <div className="stat-icon text-success bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                                        <i className="far fa-check-circle text-success text-2xl"></i>
                                    </div>
                                </div>
                                <div className="stat-desc">Invoices marked as paid</div>
                            </div>
                            <div className="stat bg-base-100 shadow-lg">
                                <div className="stat-title">Overdue Invoices</div>
                                <div className="flex items-center justify-between">
                                    <div className="stat-value text-error">
                                        {filteredInvoices.filter(invoice => invoice.status === "overdue").length}
                                    </div>
                                    <div className="stat-icon text-error bg-error/20 rounded-full h-12 w-12 flex items-center justify-center">
                                        <i className="far fa-exclamation-triangle text-error text-2xl"></i>
                                    </div>
                                </div>
                                <div className="stat-desc">Invoices that are overdue</div>
                            </div>
                        </div>
                    </ErrorBoundary>

                    {/* Search and Filters */}
                    <ErrorBoundary>
                        <div className="card bg-base-100 shadow-lg mb-6">
                            <div className="card-body p-2">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                                        <i className="far fa-search"></i>
                                        <input
                                            type="text"
                                            placeholder="Search invoices..."
                                            className="input input-bordered w-full"
                                            onChange={(e) => {
                                                const query = e.target.value.toLowerCase();
                                                setFilteredInvoices(initialInvoices.filter(invoice =>
                                                    invoice.invoice_number.toLowerCase().includes(query) ||
                                                    invoice.client?.name?.toLowerCase().includes(query)
                                                ));
                                            }}
                                        />
                                    </label>
                                    {invoiceStatusOptions.select(
                                        invoiceStatus,
                                        (value: InvoiceStatus | "all") => {
                                            setInvoiceStatus(value);
                                            if (value === "all") {
                                                setFilteredInvoices(initialInvoices);
                                            } else {
                                                setFilteredInvoices(initialInvoices.filter(invoice => invoice.status === value));
                                            }
                                        },
                                        "select-secondary w-full"
                                    )}
                                    <div className="flex items-center gap-2">
                                        <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="far fa-grid-2"></i> </button>
                                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="far fa-table-rows"></i> </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ErrorBoundary>

                    {/* Invoice List/Grid */}
                    <ErrorBoundary>
                        {viewType === "grid" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                {filteredInvoices.map((invoice) => (
                                    <InvoiceCard
                                        key={invoice.id}
                                        invoice={invoice}
                                        onEdit={handleEditInvoice}
                                        onSend={handleSendInvoice}
                                    />
                                ))}
                            </div>
                        )}
                        {viewType === "list" && (
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="overflow-x-auto mb-6">
                                        <table className="table w-full">
                                            <thead>
                                                <tr>
                                                    <th>Invoice Number</th>
                                                    <th>Issued Date</th>
                                                    <th>Due Date</th>
                                                    <th>Paid Date</th>
                                                    <th>Client</th>
                                                    <th>Total Amount</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredInvoices.map((invoice) => (
                                                    <tr key={invoice.id}>
                                                        <td>{invoice.invoice_number}</td>
                                                        <td>{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "N/A"}</td>
                                                        <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}</td>
                                                        <td>{invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : "N/A"}</td>
                                                        <td>{invoice.client?.name}</td>
                                                        <td>{formatCurrency(invoice.amount ?? 0)}</td>
                                                        <td>{invoiceStatusOptions.badge(invoice.status as InvoiceStatus)}</td>
                                                        <td>
                                                            <div className="flex gap-2 justify-end">
                                                                {invoice.status === "draft" || invoice.status === "pending" || invoice.status === "sent" ? (
                                                                    <button
                                                                        className="btn btn-sm btn-ghost"
                                                                        onClick={() => handleEditInvoice(invoice)}
                                                                    >
                                                                        <i className="far fa-edit"></i>
                                                                    </button>
                                                                ) : null}
                                                                <button
                                                                    className="btn btn-sm btn-ghost"
                                                                    onClick={() => handleSendInvoice(invoice)}
                                                                >
                                                                    <i className="far fa-paper-plane"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ErrorBoundary>

                    {/* New Invoice Modal */}
                    <InvoiceNewModal
                        isOpen={showNewModal}
                        onClose={() => setShowNewModal(false)}
                        onSave={handleSaveNewInvoice}
                    />

                    {/* Edit Invoice Modal */}
                    {selectedInvoice && (
                        <InvoiceEditModal
                            isOpen={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedInvoice(null);
                            }}
                            onSave={handleSaveEditInvoice}
                            invoice={selectedInvoice}
                        />
                    )}
                    {/* Send Invoice Modal */}
                    {selectedInvoiceDetails && business && (
                        <InvoiceSendModal
                            isOpen={showSendModal}
                            onClose={() => {
                                setShowSendModal(false);
                                setSelectedInvoice(null);
                                setSelectedInvoiceDetails(null);
                            }}
                            invoice={selectedInvoiceDetails}
                            business={business}
                        />
                    )}
                </div>
            </ErrorBoundary>
        </div>
    );
}
