import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "./db";
import { createServerClient } from "../lib/supabase";
import { InvoiceInsert, InvoiceUpdate } from "@/types/invoices";

// Fetch all invoices for a business
export async function getInvoices(businessId: string) {
    return await fetchByBusiness("invoices", businessId, "*", {
        orderBy: { column: "issue_date", ascending: false },
    });
}

// Fetch a single invoice by ID
export async function getInvoiceById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("invoices", businessId, "*", {
        filter: { id },
    });

    return {
        data: data?.[0] || null,
        error,
    };
}

// Create a new invoice
export async function createInvoice(invoice: Omit<InvoiceInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("invoices", invoice, businessId);
}

// Update an existing invoice
export async function updateInvoice(id: string, invoice: InvoiceUpdate, businessId: string) {
    return await updateWithBusinessCheck("invoices", id, invoice, businessId);
}

// Delete an invoice
export async function deleteInvoice(id: string, businessId: string) {
    return await deleteWithBusinessCheck("invoices", id, businessId);
}

// Get invoices by client
export async function getInvoicesByClient(clientId: string, businessId: string) {
    return await fetchByBusiness("invoices", businessId, "*", {
        filter: { client_id: clientId },
        orderBy: { column: "issue_date", ascending: false },
    });
}

// Get invoices by project
export async function getInvoicesByProject(projectId: string, businessId: string) {
    return await fetchByBusiness("invoices", businessId, "*", {
        filter: { project_id: projectId },
        orderBy: { column: "issue_date", ascending: false },
    });
}

// Get invoices by status
export async function getInvoicesByStatus(status: string, businessId: string) {
    return await fetchByBusiness("invoices", businessId, "*", {
        filter: { status },
        orderBy: { column: "issue_date", ascending: false },
    });
}

// Get invoices by date range
export async function getInvoicesByDateRange(startDate: string, endDate: string, businessId: string) {
    const supabase = createServerClient();
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") };
    }

    return await supabase
        .from("invoices")
        .select("*")
        .eq("business_id", businessId)
        .gte("issue_date", startDate)
        .lte("issue_date", endDate)
        .order("issue_date", { ascending: false });
}
