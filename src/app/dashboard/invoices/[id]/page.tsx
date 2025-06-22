import InvoiceDetail from "../components/detail";
import { getInvoiceById, getInvoiceWitDetailsById } from "@/app/actions/invoices";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { InvoiceWithDetails } from "@/types/invoices";
import ErrorBoundary from "@/components/error-boundary";

// In a real application, you would fetch the invoice data based on the id parameter
export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { business } = await withBusinessServer();
    const invoice = await getInvoiceWitDetailsById(business.id, id);

    if (!invoice) {
        return <div>Invoice not found.</div>;
    }

    return (
        <ErrorBoundary fallback={() => (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Invoice Details Error</h3>
                    <div className="text-xs">Failed to load invoice details. Please refresh the page.</div>
                </div>
            </div>
        )}>
            <InvoiceDetail invoice={invoice} />
        </ErrorBoundary>
    );
}
