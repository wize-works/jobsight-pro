import { getInvoiceItemsByInvoiceId } from "@/app/actions/invoice-items";
import { getInvoiceById } from "@/app/actions/invoices";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { Project } from "@/types/projects";
import { Client } from "@/types/clients";
import { Invoice } from "@/types/invoices";
import { InvoiceItem } from "@/types/invoice-items";
import EditInvoiceForm from "./edit-invoice-form";
import { notFound } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: invoiceId } = await params;

    try {
        // Fetch all necessary data in parallel
        const [invoice, invoiceItems, clients, projects] = await Promise.all([
            getInvoiceById(invoiceId),
            getInvoiceItemsByInvoiceId(invoiceId),
            getClients(),
            getProjects(),
        ]);

        if (!invoice) {
            notFound();
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
    } catch (error) {
        console.error("Error fetching invoice data:", error);
        notFound();
    }
}
