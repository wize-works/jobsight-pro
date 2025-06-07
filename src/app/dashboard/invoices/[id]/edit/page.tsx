import { getInvoiceItemsByInvoiceId } from "@/app/actions/invoice-items";
import { getInvoiceById } from "@/app/actions/invoices";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import EditInvoiceForm from "./edit-invoice-form";
import { notFound, redirect } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: invoiceId } = await params;

    let invoice, invoiceItems, clients, projects;

    try {
        // Fetch all necessary data in parallel
        [invoice, invoiceItems, clients, projects] = await Promise.all([
            getInvoiceById(invoiceId),
            getInvoiceItemsByInvoiceId(invoiceId),
            getClients(),
            getProjects(),
        ]);
    } catch (error) {
        console.error("Error fetching invoice data:", error);
        notFound();
    }

    if (!invoice) {
        notFound();
    }

    // Check invoice status and redirect if not draft
    if (invoice.status !== "draft") {
        redirect(`/dashboard/invoices/${invoiceId}`);
    }

    return (
        <EditInvoiceForm
            invoice={invoice}
            invoiceItems={invoiceItems}
            clients={clients}
            projects={projects}
            invoiceId={invoiceId}
        />
    );
}
