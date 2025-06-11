"use client";

import { toast } from "@/hooks/use-toast";
import { Business } from "@/types/business";
import { InvoiceWithDetails } from "@/types/invoices";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { useState } from "react";

interface ModalSendProps {
    invoice: InvoiceWithDetails;
    business: Business;
    isOpen: boolean;
    onClose: () => void;
}

export default function ModalSend({ invoice, business, isOpen, onClose }: ModalSendProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Calculate total from invoice details
    const total = invoice.items?.reduce(
        (sum, item) => sum + (item.quantity ?? 1) * (item.unit_price ?? 0),
        0
    ) ?? 0;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const formData = new FormData(e.currentTarget);
            const recipientEmail = formData.get('email') as string;
            const subject = formData.get('subject') as string;
            const message = formData.get('message') as string;
            const attachPDF = formData.get('attachPDF') === 'on';

            if (!recipientEmail) {
                throw new Error("Please enter a recipient email address");
            }

            if (!business) {
                throw new Error("Business information is not available. Please select a business");
            }

            // Send email via our API
            const response = await fetch('/api/send-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipientEmail,
                    recipientName: invoice.billing_address.attention || invoice.billing_address.name,
                    subject,
                    message,
                    invoiceData: invoice,
                    businessInfo: {
                        name: business.name,
                        address: `${business.address || ''}, ${business.city || ''}, ${business.state || ''} ${business.zip || ''}`.trim(),
                        phone: business.phone,
                        email: business.email
                    },
                    attachPDF
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send invoice');
            }

            toast.success({
                title: "Success",
                description: "Invoice sent successfully!"
            });
            onClose();
        } catch (err: any) {
            const errorMessage = err.message || "Failed to send invoice. Please try again later.";
            setError(errorMessage);
            toast.error({
                title: "Error",
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            Send Invoice
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Invoice Summary */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-file-invoice text-primary"></i>
                                    Invoice Summary
                                </h3>
                                <div className="bg-base-50 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-base-content/70">Invoice Number</p>
                                            <p className="font-semibold">{invoice.invoice_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-base-content/70">Total Amount</p>
                                            <p className="font-semibold text-lg">{formatCurrency(total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-base-content/70">Client</p>
                                            <p className="font-semibold">{invoice.billing_address.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-base-content/70">Due Date</p>
                                            <p className="font-semibold">
                                                {invoice.due_date ? formatDate(invoice.due_date) : "Not specified"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email Configuration */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-envelope text-primary"></i>
                                    Email Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Recipient Email *</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="input input-bordered input-secondary w-full"
                                            placeholder="Enter email address"
                                            defaultValue={invoice.client?.contact_email || ""}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Subject *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="subject"
                                            className="input input-bordered input-secondary w-full"
                                            placeholder="Email subject line"
                                            defaultValue={`Invoice ${invoice.invoice_number} from ${business.name || "JobSight Technologies Partner"}`}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email Message */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-comment-alt text-primary"></i>
                                    Email Message
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Message Body</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        className="textarea textarea-bordered textarea-secondary w-full"
                                        rows={10}
                                        placeholder="Enter your message..."
                                        defaultValue={`Dear ${invoice.billing_address.attention || invoice.billing_address.name},

Please find attached invoice ${invoice.invoice_number} for the ${invoice.project?.name || "work"} project in the amount of ${formatCurrency(total)}.

Payment is due by ${invoice.due_date ? formatDate(invoice.due_date) : ""}.

Thank you for your business.

Best regards,

${business.name || "JobSight Technologies Partner"}

by JobSight Technologies`}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attachment Options */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-paperclip text-primary"></i>
                                    Attachment Options
                                </h3>
                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="checkbox"
                                            name="attachPDF"
                                            className="checkbox checkbox-primary"
                                            defaultChecked
                                            disabled={loading}
                                        />
                                        <div>
                                            <span className="label-text font-medium">Attach PDF copy of invoice</span>
                                            <p className="text-sm text-base-content/70 mt-1">
                                                Include a PDF version of the invoice as an email attachment
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget.closest('form');
                                if (form) {
                                    handleSubmit({ preventDefault: () => { }, currentTarget: form } as any);
                                }
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Send Invoice
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}