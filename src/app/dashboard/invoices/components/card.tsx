import { invoiceStatusOptions, InvoiceWithClient, InvoiceStatus } from '@/types/invoices';
import Link from 'next/link';

export default function InvoiceCard({ invoice }: { invoice: InvoiceWithClient }) {
    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="card-title">{invoice.invoice_number}</h2>
                    {invoiceStatusOptions.badge(invoice.status as InvoiceStatus)}
                </div>
                <p>Issued: {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "N/A"}</p>
                <p>Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}</p>
                <p>Client: {invoice.client.name}</p>
                <p>Total: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(invoice.amount || 0)}</p>
                <div className='card-actions justify-end mt-4'>
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="btn btn-sm btn-outline">
                        <i className="fas fa-eye mr-2"></i> View
                    </Link>
                </div>
            </div>
        </div>
    );
}