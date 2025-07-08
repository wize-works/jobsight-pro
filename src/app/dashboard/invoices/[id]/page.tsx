"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Invoice, InvoiceStatus, invoiceStatusOptions, InvoiceWithDetails } from "@/types/invoices";
import { getInvoiceWitDetailsById } from "@/app/actions/invoices";
import { useBusiness } from "@/lib/business-context";
import { toast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/error-boundary";
import ModalLoading from "@/components/modal-loading";
import InvoiceDetailLoading from "./loading";

// Dynamic imports for modal components
const ModalSend = dynamic(() => import("../components/modal-send"), {
    loading: () => <ModalLoading message="Loading send form..." />,
});

const ModalPayment = dynamic(() => import("../components/modal-payment"), {
    loading: () => <ModalLoading message="Loading payment form..." />,
});

const InvoiceEditModal = dynamic(() => import("../components/modal-edit"), {
    loading: () => <ModalLoading message="Loading edit form..." />,
});

export default function InvoiceDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { business } = useBusiness();
    const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        async function fetchInvoice() {
            if (!business || !id) return;

            try {
                setLoading(true);
                setError(null);
                const invoiceData = await getInvoiceWitDetailsById(business.id, id);

                if (!invoiceData) {
                    setError("Invoice not found.");
                    return;
                }

                setInvoice(invoiceData);
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError("Failed to load invoice details.");
            } finally {
                setLoading(false);
            }
        }

        fetchInvoice();
    }, [business, id]); const getPdf = async () => {
        if (!invoice) return;

        setDownloadingPdf(true);
        try {
            const filename = `Invoice-${invoice.invoice_number}.pdf`;            // Call the server action directly
            const { generateInvoicePdf } = await import('@/app/actions/pdf-generation-gotenberg');
            const result = await generateInvoicePdf(invoice.business_id, invoice.id, filename); if (!result.success || !result.buffer) {
                throw new Error(result.error || 'Failed to generate PDF');
            }

            // Convert buffer to blob and download
            const pdfBlob = new Blob([result.buffer], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error("Failed to download PDF. Please try again.");
        } finally {
            setDownloadingPdf(false);
        }
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <InvoiceDetailLoading />
        );
    }

    if (error || !invoice) {
        return (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Error</h3>
                    <div className="text-xs">{error || "Invoice not found."}</div>
                </div>
            </div>
        );
    }

    // Calculate subtotal
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

    // Calculate tax (assuming 8% tax rate)
    const taxRate = 0.08;
    const tax = subtotal * taxRate;

    // Calculate total
    const total = subtotal + tax;

    return (
        <ErrorBoundary>
            <div>
                {/* Header Section */}
                <ErrorBoundary>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Link href="/dashboard/invoices" className="btn btn-outline">
                                    <i className="far fa-arrow-left"></i> Back to Invoices
                                </Link>
                            </div>
                            <p className="text-base-content/70 mt-1">
                                {(invoice.client?.name ?? "-")} - {(invoice.project?.name ?? "-")}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {invoice.status === "draft" || invoice.status === "pending" || invoice.status === "sent" ? (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    <i className="far fa-edit mr-2"></i> Edit Invoice
                                </button>
                            ) : (
                                <></>
                            )}
                            <Link href={`/printables/invoices/${invoice.id}`} className="btn btn-outline btn-sm" target="_blank">
                                <i className="far fa-print mr-2"></i> Print
                            </Link>
                            <button className="btn btn-outline btn-sm" onClick={getPdf} disabled={downloadingPdf}>
                                {downloadingPdf ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs mr-2"></span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <i className="far fa-download mr-2"></i> Download
                                    </>
                                )}
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowSendModal(true)}>
                                <i className="far fa-paper-plane mr-2"></i> Send
                            </button>
                            {invoice.status === "pending" || invoice.status === "overdue" ? (
                                <button className="btn btn-success btn-sm" onClick={() => setShowPaymentModal(true)}>
                                    <i className="far fa-credit-card mr-2"></i> Record Payment
                                </button>
                            ) : null}
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Invoice Content */}
                <ErrorBoundary>
                    <div className="bg-base-100 p-6 rounded-lg shadow-sm mb-6 print:shadow-none" id="invoice-print">
                        <div className="flex flex-col md:flex-row justify-between mb-8">
                            <div>
                                <img src={invoice.business_info.logo_url ?? "/logo-full.png"} alt="JobSight Logo" className="h-12 mb-4" />
                                <div>
                                    <p className="font-bold">{invoice.business_info.name}</p>
                                    <p>{invoice.business_info.street}</p>
                                    <p>
                                        {invoice.business_info.city}, {invoice.business_info.state} {invoice.business_info.zip}
                                    </p>
                                    <p>{invoice.business_info.country}</p>
                                    <p>Phone: {invoice.business_info.phone}</p>
                                    <p>Email: {invoice.business_info.email}</p>
                                    <p>Tax ID: {invoice.business_info.tax_id}</p>
                                </div>
                            </div>
                            <div className="mt-6 md:mt-0 text-right">
                                <h2 className="text-2xl font-bold text-primary mb-2">INVOICE</h2>
                                <table className="ml-auto">
                                    <tbody>
                                        <tr>
                                            <td className="text-right font-medium pr-4">Invoice #:</td>
                                            <td>{invoice.invoice_number}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-right font-medium pr-4">Issue Date:</td>
                                            <td>{formatDate(invoice.issue_date)}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-right font-medium pr-4">Due Date:</td>
                                            <td>{formatDate(invoice.due_date)}</td>
                                        </tr>
                                        {invoice.paid_date && (
                                            <tr>
                                                <td className="text-right font-medium pr-4">Paid Date:</td>
                                                <td>{formatDate(invoice.paid_date)}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="text-right font-medium pr-4">Status:</td>
                                            <td>
                                                {invoiceStatusOptions.badge(invoice.status as InvoiceStatus)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
                                <div className="p-4 bg-base-200 rounded-lg">
                                    <p className="font-bold">{invoice.billing_address.name}</p>
                                    <p>Attn: {invoice.billing_address.attention}</p>
                                    <p>{invoice.billing_address.street}</p>
                                    <p>
                                        {invoice.billing_address.city}, {invoice.billing_address.state} {invoice.billing_address.zip}
                                    </p>
                                    <p>{invoice.billing_address.country}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Project:</h3>
                                <div className="p-4 bg-base-200 rounded-lg">
                                    <p className="font-bold">{invoice.project?.name}</p>
                                    <p>Invoice for services rendered as part of the project.</p>
                                    <p className="mt-2">
                                        <Link href={`/dashboard/projects/${invoice.project?.id}`} className="link link-primary">
                                            View Project Details
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">Invoice Items:</h3>
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th className="text-right">Quantity</th>
                                            <th className="text-right">Unit Price</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.description}</td>
                                                <td className="text-right">{item.quantity}</td>
                                                <td className="text-right">{formatCurrency(item.unit_price ?? 0)}</td>
                                                <td className="text-right">{formatCurrency(item.amount ?? 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="text-right font-medium">
                                                Subtotal:
                                            </td>
                                            <td className="text-right">{formatCurrency(subtotal)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} className="text-right font-medium">
                                                Tax ({(taxRate * 100).toFixed(0)}%):
                                            </td>
                                            <td className="text-right">{formatCurrency(tax)}</td>
                                        </tr>
                                        <tr className="font-bold">
                                            <td colSpan={3} className="text-right">
                                                Total:
                                            </td>
                                            <td className="text-right">{formatCurrency(total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-2">Notes:</h3>
                                <div className="p-4 bg-base-200 rounded-lg">
                                    <p>{invoice.notes}</p>
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-2">Payment Instructions:</h3>
                            <div className="p-4 bg-base-200 rounded-lg">
                                <p>Please make payment to:</p>
                                <p>{invoice.payment_method}</p>
                            </div>
                        </div>

                        <div className="text-center text-sm text-base-content/70 mt-8">
                            <p>Thank you for your business!</p>
                            <p>
                                If you have any questions about this invoice, please contact us at {invoice.business_info.email} or{" "}
                                {invoice.business_info.phone}.
                            </p>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Modals */}
                {showSendModal && business && (
                    <ModalSend
                        isOpen={showSendModal}
                        invoice={invoice}
                        business={business}
                        onClose={() => setShowSendModal(false)} />
                )}

                {/* Record Payment Modal */}
                {showPaymentModal && (
                    <ModalPayment isOpen={showPaymentModal} total={total} onClose={() => setShowPaymentModal(false)}
                    />
                )}

                {/* Edit Invoice Modal */}
                {invoice && invoice.client && (
                    <InvoiceEditModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        onSave={(updatedInvoice) => {
                            setInvoice(prev => prev ? { ...prev, ...updatedInvoice } : null);
                            setShowEditModal(false);
                        }}
                        invoice={{
                            ...invoice,
                            client: invoice.client
                        }}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}
