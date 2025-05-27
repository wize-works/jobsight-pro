"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Invoice, InvoiceInsert, InvoiceUpdate } from "@/types/invoices";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getInvoices = async (): Promise<Invoice[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch invoices.");
        return [];
    }

    const { data, error } = await fetchByBusiness("invoices", businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch invoices.");
        return null;
    }

    const { data, error } = await fetchByBusiness("invoices", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create an invoice.");
        return null;
    }

    const { data, error } = await insertWithBusiness("invoices", invoice, businessId);

    if (error) {
        console.error("Error creating invoice:", error);
        return null;
    }

    return data as unknown as Invoice;
}

export const updateInvoice = async (id: string, invoice: InvoiceUpdate): Promise<Invoice | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update an invoice.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("invoices", id, invoice, businessId);

    if (error) {
        console.error("Error updating invoice:", error);
        return null;
    }

    return data as unknown as Invoice;
}

export const deleteInvoice = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete an invoice.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("invoices", id, businessId);

    if (error) {
        console.error("Error deleting invoice:", error);
        return false;
    }

    return true;
}

export const searchInvoices = async (query: string): Promise<Invoice[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search invoices.");
        return [];
    }

    const { data, error } = await fetchByBusiness("invoices", businessId, "*", {
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
