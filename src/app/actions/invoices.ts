"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Invoice, InvoiceInsert, InvoiceUpdate, InvoiceWithClient, InvoiceWithDetails } from "@/types/invoices";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

export const getInvoices = async (): Promise<Invoice[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("invoices", business.id);

    if (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Invoice[];
    }

    return data as unknown as Invoice[];
}

export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("invoices", business.id, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching invoice by ID:", error);
        return null;
    } if (data && data[0]) {
        console.log("Debug: Invoice fetched from database:", JSON.stringify(data[0], null, 2));
        console.log("Debug: Invoice status from DB:", data[0].status);
        return data[0] as unknown as Invoice;
    }

    return null;
};

export const createInvoice = async (invoice: InvoiceInsert): Promise<Invoice | null> => {
    const { business } = await ensureBusinessOrRedirect();

    invoice = await applyCreated<InvoiceInsert>(invoice);

    const { data, error } = await insertWithBusiness("invoices", invoice, business.id);

    if (error) {
        console.error("Error creating invoice:", error);
        return null;
    }

    return data as unknown as Invoice;
}

export const updateInvoice = async (id: string, invoice: InvoiceUpdate): Promise<Invoice | null> => {
    const { business } = await ensureBusinessOrRedirect();

    invoice = await applyUpdated<InvoiceUpdate>(invoice);

    const { data, error } = await updateWithBusinessCheck("invoices", id, invoice, business.id);

    if (error) {
        console.error("Error updating invoice:", error);
        return null;
    }

    return data as unknown as Invoice;
}

export const deleteInvoice = async (id: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const { error } = await deleteWithBusinessCheck("invoices", id, business.id);

    if (error) {
        console.error("Error deleting invoice:", error);
        return false;
    }

    return true;
}

export const searchInvoices = async (query: string): Promise<Invoice[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("invoices", business.id, "*", {
        filter: {
            or: [
                { invoice_number: { ilike: `%${query}%` } },
                { notes: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "invoice_number", ascending: true },
    });

    if (error) {
        console.error("Error searching invoices:", error);
        return [];
    }

    return data as unknown as Invoice[];
};

export const getInvoicesWithClient = async (): Promise<InvoiceWithClient[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("invoices", business.id);

    if (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }
    const clientIds = data.map((invoice: Invoice) => invoice.client_id).filter(id => id);
    const { data: clientData, error: clientError } = await fetchByBusiness("clients", business.id, "*", {
        filter: {
            id: { in: clientIds },
        },
    });

    if (clientError) {
        console.error("Error fetching clients for invoices:", clientError);
        return data as unknown as InvoiceWithClient[];
    }

    const detailData = data.map((invoice: Invoice) => {
        const client = (clientData ?? []).find((client: any) => client.id === invoice.client_id);
        return {
            ...invoice,
            client: client || null,
        } as InvoiceWithClient;
    });

    return detailData;
};

export const getInvoiceWitDetailsById = async (id: string): Promise<InvoiceWithDetails | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("invoices", business.id, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching invoices:", error);
        return null;
    }

    if (!data || data.length === 0) {
        return null;
    }

    const { data: itemsData, error: itemsError } = await fetchByBusiness("invoice_items", business.id, "*", {
        filter: {
            invoice_id: { eq: id },
        },
    });

    const clientIds = data.map((invoice: Invoice) => invoice.client_id).filter(id => id);
    const { data: clientData, error: clientError } = await fetchByBusiness("clients", business.id, "*", {
        filter: {
            id: { in: clientIds },
        },
    });

    if (clientError) {
        console.error("Error fetching clients for invoices:", clientError);
        return data[0] as unknown as InvoiceWithDetails;
    }

    const projectId = data[0].project_id;
    const { data: project, error: projectError } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: projectId },
    });

    const detailData = data.map((invoice: Invoice) => {
        const client = (clientData ?? []).find((client: any) => client.id === invoice.client_id);
        return {
            ...invoice,
            items: itemsData || [],
            client: client || null,
            project: (project?.[0]) || null,
            billing_address: {
                name: client?.name,
                attention: client?.contact_name || null,
                street: client?.address || null,
                city: client?.city || null,
                state: client?.state || null,
                zip: client?.zip || null,
                country: client?.country || null,
            },
            business_info: {
                name: business.name,
                street: business?.address || null,
                city: business?.city || null,
                state: business?.state || null,
                zip: business?.zip || null,
                country: business?.country || null,
                phone: business?.phone || null,
                email: business?.email || null,
                website: business?.website || null,
                tax_id: business?.tax_id || null,
                logo_url: business?.logo_url || null,
            }
        } as InvoiceWithDetails;
    });

    return detailData[0] || null;
};