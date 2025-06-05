"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Invoice, InvoiceStatus, invoiceStatusOptions, InvoiceWithDetails } from "@/types/invoices";
import QRCode from "@/components/qrcode";


interface InvoiceDetailProps {
    invoice: InvoiceWithDetails;
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
    const [showSendModal, setShowSendModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

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
        <div className="text-xs">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6 print:shadow-none" id="invoice-print">
                <div className="flex flex-row justify-between mb-8">
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

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-lg2 font-semibold mb-2">Bill To:</h3>
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
                        <h3 className="text-lg2 font-semibold mb-2">Project:</h3>
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
                    <h3 className="text-lg2 font-semibold mb-4">Invoice Items:</h3>
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
                        <h3 className="text-lg2 font-semibold mb-2">Notes:</h3>
                        <div className="p-4 bg-base-200 rounded-lg">
                            <p>{invoice.notes}</p>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h3 className="text-lg2 font-semibold mb-2">Payment Instructions:</h3>
                    <div className="p-4 bg-base-200 rounded-lg">
                        <p>Please make payment to:</p>
                        <p>{invoice.payment_method}</p>
                    </div>
                </div>

                <div className="text-center text-sm text-base-content/70 my-8">
                    <p>Thank you for your business!</p>
                    <p>
                        If you have any questions about this invoice, please contact us at {invoice.business_info.email} or{" "}
                        {invoice.business_info.phone}.
                    </p>
                </div>
                <div className="flex justify-start mb-4">
                    <div className="flex items-center">
                        <QRCode width={150} text={`https://pro.jobsight.co/dashboard/invoices/${invoice.id}`} />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg2 font-semibold">View Invoice Online</h3>
                        <p className="text-sm text-base-content/70 mt-2">
                            Scan the QR code to view this invoice online.
                        </p>
                        <p className="mt-4">
                            Brought to you by{" "}
                            <Link href="https://jobsight.co" className="link link-primary">JobSight</Link>
                            , your all-in-one business management solution.
                        </p>
                        <Image src="/logo-full.png" alt="JobSight Logo" className="mt-4" height={150} width={150} />
                    </div>
                </div>
            </div>
        </div>
    );
}
