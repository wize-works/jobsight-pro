"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { InvoiceItem, InvoiceItemInsert, InvoiceItemUpdate } from "@/types/invoice-items";
import { getUserBusiness } from "@/app/actions/business";
import { auth } from "@clerk/nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";


export const getInvoiceItems = async (businessId: string): Promise<InvoiceItem[]> => {


    const { data, error } = await fetchByBusiness("invoice_items", businessId);

    if (error) {
        console.error("Error fetching invoice items:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as InvoiceItem[];
    }

    return data as unknown as InvoiceItem[];
}

export const getInvoiceItemById = async (businessId: string, id: string): Promise<InvoiceItem | null> => {


    const { data, error } = await fetchByBusiness("invoice_items", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching invoice item by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as InvoiceItem;
    }

    return null;
};

export const createInvoiceItem = async (businessId: string, item: InvoiceItemInsert): Promise<InvoiceItem | null> => {


    item = await applyCreated<InvoiceItemInsert>(item);

    const { data, error } = await insertWithBusiness("invoice_items", item, businessId);

    if (error) {
        console.error("Error creating invoice item:", error);
        return null;
    }

    return data as unknown as InvoiceItem;
}

export const updateInvoiceItem = async (businessId: string, id: string, item: InvoiceItemUpdate): Promise<InvoiceItem | null> => {


    item = await applyUpdated<InvoiceItemUpdate>(item);

    const { data, error } = await updateWithBusinessCheck("invoice_items", id, item, businessId);

    if (error) {
        console.error("Error updating invoice item:", error);
        return null;
    }

    return data as unknown as InvoiceItem;
}

export const deleteInvoiceItem = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("invoice_items", id, businessId);

    if (error) {
        console.error("Error deleting invoice item:", error);
        return false;
    }

    return true;
}

export const searchInvoiceItems = async (businessId: string, query: string): Promise<InvoiceItem[]> => {


    const { data, error } = await fetchByBusiness("invoice_items", businessId, "*", {
        filter: {
            or: [
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "created_at", ascending: true },
    });

    if (error) {
        console.error("Error searching invoice items:", error);
        return [];
    }

    return data as unknown as InvoiceItem[];
};

export const getInvoiceItemsByInvoiceId = async (businessId: string, invoiceId: string): Promise<InvoiceItem[]> => {


    const { data, error } = await fetchByBusiness("invoice_items", businessId, "*", {
        filter: { invoice_id: { eq: invoiceId } },
        orderBy: { column: "created_at", ascending: true },
    });

    if (error) {
        console.error("Error fetching invoice items:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as InvoiceItem[];
    }

    return data as unknown as InvoiceItem[];
}

export const upsertInvoiceItems = async (businessId: string, items: InvoiceItemInsert[]): Promise<InvoiceItem[] | null> => {


    if (!items || items.length === 0) {
        return null;
    }

    const createdItems: InvoiceItem[] = [];

    for (let item of items) {
        if (!item.id) {
            item = await applyCreated<InvoiceItemInsert>(item);
            const createdItem = await createInvoiceItem(businessId, item);
            if (createdItem) {
                createdItems.push(createdItem);
            }

            throw new Error("Invoice item must have an ID for upsert operation");
        } else {
            item = await applyUpdated<InvoiceItemUpdate>(item);
            const updatedItem = await updateInvoiceItem(businessId, item.id, item);
            if (updatedItem) {
                createdItems.push(updatedItem);
            }
        }
    }
    console.log("Upserted invoice items:", createdItems);
    return createdItems;
}