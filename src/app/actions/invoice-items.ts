"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { InvoiceItem, InvoiceItemInsert, InvoiceItemUpdate } from "@/types/invoice-items";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getInvoiceItems = async (): Promise<InvoiceItem[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("invoice_items", business.id);

    if (error) {
        console.error("Error fetching invoice items:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as InvoiceItem[];
    }

    return data as unknown as InvoiceItem[];
}

export const getInvoiceItemById = async (id: string): Promise<InvoiceItem | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("invoice_items", business.id, id);

    if (error) {
        console.error("Error fetching invoice item by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as InvoiceItem;
    }

    return null;
};

export const createInvoiceItem = async (item: InvoiceItemInsert): Promise<InvoiceItem | null> => {
    const { business } = await withBusinessServer();

    item = await applyCreated<InvoiceItemInsert>(item);

    const { data, error } = await insertWithBusiness("invoice_items", item, business.id);

    if (error) {
        console.error("Error creating invoice item:", error);
        return null;
    }

    return data as unknown as InvoiceItem;
}

export const updateInvoiceItem = async (id: string, item: InvoiceItemUpdate): Promise<InvoiceItem | null> => {
    const { business } = await withBusinessServer();

    item = await applyUpdated<InvoiceItemUpdate>(item);

    const { data, error } = await updateWithBusinessCheck("invoice_items", id, item, business.id);

    if (error) {
        console.error("Error updating invoice item:", error);
        return null;
    }

    return data as unknown as InvoiceItem;
}

export const deleteInvoiceItem = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("invoice_items", id, business.id);

    if (error) {
        console.error("Error deleting invoice item:", error);
        return false;
    }

    return true;
}

export const searchInvoiceItems = async (query: string): Promise<InvoiceItem[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("invoice_items", business.id, "*", {
        filter: {
            or: [
                { description: { ilike: `%${query}%` } },
                { item_name: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "item_name", ascending: true },
    });

    if (error) {
        console.error("Error searching invoice items:", error);
        return [];
    }

    return data as unknown as InvoiceItem[];
};
