import InvoiceDetail from "../components/detail";
import { getInvoiceById, getInvoiceWitDetailsById } from "@/app/actions/invoices";
import { InvoiceWithDetails } from "@/types/invoices";

// In a real application, you would fetch the invoice data based on the id parameter
export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const invoice = await getInvoiceWitDetailsById(id);

    if (!invoice) {
        return <div>Invoice not found.</div>;
    }

    return <InvoiceDetail invoice={invoice} />;
}
