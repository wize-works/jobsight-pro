"use client";

import { useState } from "react";
import Link from "next/link";
import { Invoice, InvoiceStatus, invoiceStatusOptions, InvoiceWithDetails } from "@/types/invoices";
import { useBusiness } from "@/lib/business-context";
import { toast } from "@/hooks/use-toast";
import ModalSend from "./modal-send";
import ModalPayment from "./modal-payment";
async function downloadPdfFromUrl(url: string, filename: string) {
    try {
        // Call our API route to generate the PDF
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
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
};


interface InvoiceDetailProps {
    invoice: InvoiceWithDetails;
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
    const { business } = useBusiness();
    const [showSendModal, setShowSendModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const getPdf = async () => {
        toast.info("This feature is under development. Please check back later.");
        // try {
        //     const url = `${window.location.origin}/printables/invoices/${invoice.id}`;
        //     const filename = `${invoice.invoice_number}.pdf`;

        //     await downloadPdfFromUrl(url, filename);
        //     toast.success("PDF downloaded successfully!");
        // } catch (error) {
        //     console.error('Error downloading PDF:', error);
        //     toast.error("Failed to download PDF. Please try again.");
        // }
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

    // Calculate subtotal
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

    // Calculate tax (assuming 8% tax rate)
    const taxRate = 0.08;
    const tax = subtotal * taxRate;

    // Calculate total
    const total = subtotal + tax;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/invoices" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">Invoice {invoice.invoice_number}</h1>
                        {invoiceStatusOptions.badge(invoice.status as InvoiceStatus)}
                    </div>
                    <p className="text-base-content/70 mt-1">
                        {(invoice.client?.name ?? "-")} - {(invoice.project?.name ?? "-")}
                    </p>
                </div>
                <div className="flex gap-2">
                    {invoice.status === "draft" ? (
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="btn btn-primary btn-sm">
                            <i className="fas fa-edit mr-2"></i> Edit Invoice
                        </Link>
                    ) : (
                        <></>
                    )}
                    <Link href={`/printables/invoices/${invoice.id}`} className="btn btn-outline btn-sm" target="_blank">
                        <i className="fas fa-print mr-2"></i> Print
                    </Link>
                    <button className="btn btn-outline btn-sm" onClick={getPdf}>
                        <i className="fas fa-download mr-2"></i> Download
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowSendModal(true)}>
                        <i className="fas fa-paper-plane mr-2"></i> Send
                    </button>
                    {invoice.status === "pending" || invoice.status === "overdue" ? (
                        <button className="btn btn-success btn-sm" onClick={() => setShowPaymentModal(true)}>
                            <i className="fas fa-credit-card mr-2"></i> Record Payment
                        </button>
                    ) : null}
                </div>
            </div>

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
            </div>            {/* Send Invoice Modal */}
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
        </div>
    );
}
