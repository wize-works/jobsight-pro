"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Invoice, InvoiceInsert, InvoiceUpdate } from "@/types/invoices";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getInvoices = async (): Promise<Invoice[]> => {
    const { business } = await withBusinessServer();

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("invoices", business.id, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching invoice by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Invoice;
    }

    return null;
};

export const createInvoice = async (invoice: InvoiceInsert): Promise<Invoice | null> => {
    const { business } = await withBusinessServer();

    invoice = await applyCreated<InvoiceInsert>(invoice);

    const { data, error } = await insertWithBusiness("invoices", invoice, business.id);

    if (error) {
        console.error("Error creating invoice:", error);
        return null;
    }

    return data as unknown as Invoice;
}

export const updateInvoice = async (id: string, invoice: InvoiceUpdate): Promise<Invoice | null> => {
    const { business } = await withBusinessServer();

    invoice = await applyUpdated<InvoiceUpdate>(invoice);

    const { data, error } = await updateWithBusinessCheck("invoices", id, invoice, business.id);

    if (error) {
        console.error("Error updating invoice:", error);
        return null;
    }

    return data as unknown as Invoice;
}

export const deleteInvoice = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("invoices", id, business.id);

    if (error) {
        console.error("Error deleting invoice:", error);
        return false;
    }

    return true;
}

export const searchInvoices = async (query: string): Promise<Invoice[]> => {
    const { business } = await withBusinessServer();

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
