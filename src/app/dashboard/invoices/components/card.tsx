import { useState } from 'react';
import { invoiceStatusOptions, InvoiceWithClient, InvoiceStatus, paymentMethodOptions, PaymentMethod } from '@/types/invoices';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

async function downloadPdfFromUrl(url: string, filename: string) {
    try {
        // Call our API route to generate the PDF
        const response = await fetch('/api/generate-pdf-gotenberg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, filename }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        // Convert response to blob
        const pdfBlob = await response.blob();

        // Create download link
        const downloadUrl = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return true;
    } catch (error) {
        console.error('Error downloading PDF:', error);
        throw error;
    }
}

interface InvoiceCardProps {
    invoice: InvoiceWithClient;
    onEdit?: (invoice: InvoiceWithClient) => void;
    onSend?: (invoice: InvoiceWithClient) => void;
}

export default function InvoiceCard({ invoice, onEdit, onSend }: InvoiceCardProps) {
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const formatCurrency = (amount: number | undefined | null) => {
        if (!amount) return "$0.00";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString();
    };

    const getInvoiceInitials = () => {
        return invoice.invoice_number
            .split(/[-_\s]/)
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getDueStatus = () => {
        if (!invoice.due_date || invoice.status === 'paid') return null;

        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) return { status: 'overdue', days: Math.abs(daysUntilDue) };
        if (daysUntilDue <= 7) return { status: 'due_soon', days: daysUntilDue };
        return { status: 'upcoming', days: daysUntilDue };
    };

    const dueStatus = getDueStatus();

    const getTaxAmount = () => {
        if (!invoice.amount || !invoice.tax_rate) return 0;
        return (invoice.amount * invoice.tax_rate) / 100;
    };

    const getSubtotal = () => {
        if (!invoice.amount) return 0;
        return invoice.amount - getTaxAmount();
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-shadow duration-200">
            <div className="card-body p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="avatar avatar-placeholder">
                            <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center">
                                <span className="text-xl font-bold text-secondary">
                                    {getInvoiceInitials()}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="card-title text-lg font-semibold truncate">
                                {invoice.invoice_number}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                {invoice.payment_method && paymentMethodOptions.badge(invoice.payment_method as PaymentMethod)}
                                {invoice.tax_rate && (
                                    <span className="badge badge-outline badge-sm">{invoice.tax_rate}% Tax</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {invoiceStatusOptions.badge(invoice.status as InvoiceStatus)}
                        {dueStatus && (
                            <div className={`text-xs px-2 py-1 rounded ${dueStatus.status === 'overdue' ? 'bg-error/20 text-error' :
                                dueStatus.status === 'due_soon' ? 'bg-warning/20 text-warning' :
                                    'bg-info/20 text-info'
                                }`}>
                                {dueStatus.status === 'overdue' ? 'Overdue' :
                                    dueStatus.status === 'due_soon' ? 'Due Soon' :
                                        'Upcoming'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Information */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-building w-4 text-base-content/60" />
                        {invoice.client?.name ? (
                            <span className="font-medium">{invoice.client.name}</span>
                        ) : (
                            <span className="text-base-content/50 italic">Client not specified</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-calendar-alt w-4 text-base-content/60" />
                        <span className="text-base-content/60">Issued:</span>
                        {invoice.issue_date ? (
                            <span className="text-base-content/80">{formatDate(invoice.issue_date)}</span>
                        ) : (
                            <span className="text-base-content/50 italic">Date not set</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-calendar-check w-4 text-base-content/60" />
                        <span className="text-base-content/60">Due:</span>
                        {invoice.due_date ? (
                            <span className="text-base-content/80">{formatDate(invoice.due_date)}</span>
                        ) : (
                            <span className="text-base-content/50 italic">Due date not set</span>
                        )}
                    </div>

                    {invoice.paid_date && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-check-circle w-4 text-base-content/60" />
                            <span className="text-base-content/60">Paid:</span>
                            <span className="text-base-content/80">{formatDate(invoice.paid_date)}</span>
                        </div>
                    )}

                    {invoice.notes && (
                        <div className="flex items-start gap-2 text-sm">
                            <i className="fas fa-sticky-note w-4 text-base-content/60 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <span className="text-base-content/60">Notes:</span>
                                <p className="text-base-content/80 text-xs mt-1 line-clamp-2">
                                    {invoice.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics Section */}
                <div className="divider my-3"></div>

                <div className="stats stats-horizontal w-full mb-auto">
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-primary">{formatCurrency(getSubtotal())}</div>
                        <div className="stat-title text-xs">Subtotal</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-secondary">{formatCurrency(getTaxAmount())}</div>
                        <div className="stat-title text-xs">Tax</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-success">{formatCurrency(invoice.amount)}</div>
                        <div className="stat-title text-xs">Total</div>
                    </div>
                </div>

                {/* Due Date Alert */}
                {dueStatus && invoice.status !== 'paid' && (
                    <div className={`alert py-2 mb-4 ${dueStatus.status === 'overdue' ? 'alert-error' :
                        dueStatus.status === 'due_soon' ? 'alert-warning' :
                            'alert-info'
                        }`}>
                        <i className="fas fa-calendar-alt text-sm" />
                        <div className="text-sm">
                            <div className="font-medium">
                                Due: {formatDate(invoice.due_date)}
                            </div>
                            <div className="text-xs">
                                {dueStatus.status === 'overdue'
                                    ? `${dueStatus.days} days overdue`
                                    : dueStatus.status === 'due_soon'
                                        ? `Due in ${dueStatus.days} days`
                                        : `Due in ${dueStatus.days} days`
                                }
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="card-actions justify-between items-center pt-2">
                    <div className="flex gap-1">                        <button
                        className="btn btn-ghost btn-sm btn-circle"
                        title="Download invoice"
                        disabled={downloadingPdf}
                        onClick={async (e) => {
                            e.stopPropagation();
                            setDownloadingPdf(true);
                            try {
                                const url = `${window.location.origin}/api/invoices/${invoice.id}/html?businessId=${invoice.business_id}`;
                                const filename = `Invoice-${invoice.invoice_number}.pdf`;
                                await downloadPdfFromUrl(url, filename);
                                toast.success("PDF downloaded successfully!");
                            } catch (error) {
                                console.error('Error downloading PDF:', error);
                                toast.error("Failed to download PDF. Please try again.");
                            } finally {
                                setDownloadingPdf(false);
                            }
                        }}
                    >
                        {downloadingPdf ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <i className="fas fa-download text-sm" />
                        )}
                    </button><button
                        className="btn btn-ghost btn-sm btn-circle"
                        title="Send invoice"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onSend) {
                                onSend(invoice);
                            }
                        }}
                    >
                            <i className="fas fa-paper-plane text-sm" />
                        </button>
                        {onEdit && invoice.status !== "paid" && (
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="Edit invoice"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(invoice);
                                }}
                            >
                                <i className="fas fa-edit text-sm" />
                            </button>
                        )}
                    </div>
                    <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <i className="fas fa-eye mr-1" />
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}