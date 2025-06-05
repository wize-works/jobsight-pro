"use client";

import { useState } from "react";
import Link from "next/link";

// Define TypeScript interfaces
interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface Address {
    name: string;
    attention: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

interface CompanyInfo {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
}

interface PaymentInstructions {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    swift: string;
}

interface Invoice {
    id: string;
    client: string;
    clientId: string;
    project: string;
    projectId: string;
    amount: number;
    status: string;
    issueDate: string;
    dueDate: string;
    paidDate: string | null;
    paymentMethod: string;
    notes: string;
    items: InvoiceItem[];
    billingAddress: Address;
    companyInfo: CompanyInfo;
    paymentInstructions: PaymentInstructions;
}

interface InvoiceDetailProps {
    invoice: Invoice;
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

    // Get status badge color
    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "paid":
                return "badge-success";
            case "pending":
                return "badge-warning";
            case "overdue":
                return "badge-error";
            case "draft":
                return "badge-ghost";
            default:
                return "badge-ghost";
        }
    };

    // Calculate subtotal
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);

    // Calculate tax (assuming 8% tax rate)
    const taxRate = 0.08;
    const tax = subtotal * taxRate;

    // Calculate total
    const total = subtotal + tax;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/invoices" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">Invoice {invoice.id}</h1>
                        <div className={`badge ${getStatusBadgeColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </div>
                    </div>
                    <p className="text-base-content/70 mt-1">
                        {invoice.client} - {invoice.project}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                        <i className="fas fa-print mr-2"></i> Print
                    </button>
                    <button className="btn btn-outline btn-sm">
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
                        <img src="/logo-full.png" alt="JobSight Logo" className="h-12 mb-4" />
                        <div>
                            <p className="font-bold">{invoice.companyInfo.name}</p>
                            <p>{invoice.companyInfo.street}</p>
                            <p>
                                {invoice.companyInfo.city}, {invoice.companyInfo.state} {invoice.companyInfo.zip}
                            </p>
                            <p>{invoice.companyInfo.country}</p>
                            <p>Phone: {invoice.companyInfo.phone}</p>
                            <p>Email: {invoice.companyInfo.email}</p>
                            <p>Tax ID: {invoice.companyInfo.taxId}</p>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 text-right">
                        <h2 className="text-2xl font-bold text-primary mb-2">INVOICE</h2>
                        <table className="ml-auto">
                            <tbody>
                                <tr>
                                    <td className="text-right font-medium pr-4">Invoice #:</td>
                                    <td>{invoice.id}</td>
                                </tr>
                                <tr>
                                    <td className="text-right font-medium pr-4">Issue Date:</td>
                                    <td>{formatDate(invoice.issueDate)}</td>
                                </tr>
                                <tr>
                                    <td className="text-right font-medium pr-4">Due Date:</td>
                                    <td>{formatDate(invoice.dueDate)}</td>
                                </tr>
                                {invoice.paidDate && (
                                    <tr>
                                        <td className="text-right font-medium pr-4">Paid Date:</td>
                                        <td>{formatDate(invoice.paidDate)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="text-right font-medium pr-4">Status:</td>
                                    <td>
                                        <div className={`badge ${getStatusBadgeColor(invoice.status)}`}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </div>
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
                            <p className="font-bold">{invoice.billingAddress.name}</p>
                            <p>Attn: {invoice.billingAddress.attention}</p>
                            <p>{invoice.billingAddress.street}</p>
                            <p>
                                {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.zip}
                            </p>
                            <p>{invoice.billingAddress.country}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Project:</h3>
                        <div className="p-4 bg-base-200 rounded-lg">
                            <p className="font-bold">{invoice.project}</p>
                            <p>Invoice for services rendered as part of the project.</p>
                            <p className="mt-2">
                                <Link href={`/dashboard/projects/${invoice.projectId}`} className="link link-primary">
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
                                        <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="text-right">{formatCurrency(item.amount)}</td>
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
                        <table className="mt-2">
                            <tbody>
                                <tr>
                                    <td className="font-medium pr-4">Bank:</td>
                                    <td>{invoice.paymentInstructions.bankName}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium pr-4">Account Name:</td>
                                    <td>{invoice.paymentInstructions.accountName}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium pr-4">Account Number:</td>
                                    <td>{invoice.paymentInstructions.accountNumber}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium pr-4">Routing Number:</td>
                                    <td>{invoice.paymentInstructions.routingNumber}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium pr-4">SWIFT Code:</td>
                                    <td>{invoice.paymentInstructions.swift}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center text-sm text-base-content/70 mt-8">
                    <p>Thank you for your business!</p>
                    <p>
                        If you have any questions about this invoice, please contact us at {invoice.companyInfo.email} or{" "}
                        {invoice.companyInfo.phone}.
                    </p>
                </div>
            </div>

            {/* Send Invoice Modal */}
            {showSendModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Send Invoice</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Recipient Email</span>
                            </label>
                            <input
                                type="email"
                                className="input input-bordered"
                                placeholder="Enter email address"
                                defaultValue="michael.t@oakridge.com"
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Subject</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered"
                                defaultValue={`Invoice ${invoice.id} from JobSight Construction`}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Message</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                rows={5}
                                defaultValue={`Dear ${invoice.billingAddress.attention},

Please find attached invoice ${invoice.id} for the ${invoice.project} project in the amount of ${formatCurrency(
                                    total,
                                )}.

Payment is due by ${formatDate(invoice.dueDate)}.

Thank you for your business.

Best regards,
JobSight Construction`}
                            ></textarea>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label cursor-pointer justify-start gap-2">
                                <input type="checkbox" className="checkbox" defaultChecked />
                                <span className="label-text">Attach PDF copy of invoice</span>
                            </label>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label cursor-pointer justify-start gap-2">
                                <input type="checkbox" className="checkbox" defaultChecked />
                                <span className="label-text">Include payment link</span>
                            </label>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowSendModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowSendModal(false)}>
                                Send Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Record Payment</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Payment Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered"
                                defaultValue={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Payment Method</span>
                            </label>
                            <select className="select select-bordered w-full">
                                <option>Credit Card</option>
                                <option>Bank Transfer</option>
                                <option>Check</option>
                                <option>Cash</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Amount</span>
                            </label>
                            <input type="number" className="input input-bordered" defaultValue={total} />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Reference Number</span>
                            </label>
                            <input type="text" className="input input-bordered" placeholder="e.g., Check #, Transaction ID" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Notes</span>
                            </label>
                            <textarea className="textarea textarea-bordered" placeholder="Add payment notes"></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowPaymentModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-success" onClick={() => setShowPaymentModal(false)}>
                                Record Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
