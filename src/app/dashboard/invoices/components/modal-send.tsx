import { toast } from "@/hooks/use-toast";
import { Business } from "@/types/business";
import { InvoiceWithDetails } from "@/types/invoices";
import { formatDate } from "@/utils/formatters";
import { formatCurrency } from "@/utils/formatters";
export default function ModalSend({ invoice, business, onClose }: {
    invoice: InvoiceWithDetails;

    business: Business;
    onClose?: () => void;
}) {
    // Calculate total from invoice details
    const total =
        invoice.items?.reduce(
            (sum, item) => sum + (item.quantity ?? 1) * (item.unit_price ?? 0),
            0
        ) ?? 0;

    async function handleSendInvoice(formData: FormData): Promise<void> {
        try {
            const recipientEmail = formData.get('email') as string;
            const subject = formData.get('subject') as string;
            const message = formData.get('message') as string;
            const attachPDF = formData.get('attachPDF') === 'on';

            if (!recipientEmail) {
                toast.error("Please enter a recipient email address.");
                return;
            }

            if (!business) {
                toast.error("Business information is not available. Please select a business.");
                return;
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

            // Close the modal after sending 
            onClose?.();
            toast.success("Invoice sent successfully!");

        } catch (error) {
            console.error("Error sending invoice:", error);
            toast.error(error instanceof Error ? error.message : "Failed to send invoice. Please try again later.");
        }
    }

    return (
        <div className="modal modal-open">
            <div className="modal modal-open">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Send Invoice</h3>
                    <form action={handleSendInvoice}>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Recipient Email</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="input input-bordered"
                                placeholder="Enter email address"
                                defaultValue={invoice.client?.contact_email || ""}
                                required
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Subject</span>
                            </label>
                            <input
                                type="text"
                                name="subject"
                                className="input input-bordered"
                                defaultValue={`Invoice ${invoice.invoice_number} from ${business.name || "JobSight Technologies Partner"}`}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Message</span>
                            </label>
                            <textarea
                                name="message"
                                className="textarea textarea-bordered"
                                rows={5}
                                defaultValue={`Dear ${invoice.billing_address.attention || invoice.billing_address.name},

Please find attached invoice ${invoice.invoice_number} for the ${invoice.project?.name || "work"} project in the amount of ${formatCurrency(
                                    total,
                                )}.

Payment is due by ${invoice.due_date ? formatDate(invoice.due_date) : ""}.

Thank you for your business.

Best regards,

${business.name || "JobSight Technologies Partner"}

by JobSight Technologies`}
                            ></textarea>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label cursor-pointer justify-start gap-2">
                                <input type="checkbox" name="attachPDF" className="checkbox" defaultChecked />
                                <span className="label-text">Attach PDF copy of invoice</span>
                            </label>
                        </div>
                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => onClose?.()}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" >
                                Send Invoice
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}