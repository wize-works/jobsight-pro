"use server";
//
// Do not use this file
// This file is replaced by the media action file.
// 
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Document, DocumentInsert, DocumentUpdate } from "@/types/documents";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getDocuments = async (): Promise<Document[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("documents", business.id);

    if (error) {
        console.error("Error fetching documents:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Document[];
    }

    return data as unknown as Document[];
}

export const getDocumentById = async (id: string): Promise<Document | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("documents", business.id, "*", {
        filter: { id: id }
    });

    if (error) {
        console.error("Error fetching document by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Document;
    }

    return null;
};

export const createDocument = async (doc: DocumentInsert): Promise<Document | null> => {
    const { business } = await withBusinessServer();

    doc = await applyCreated<DocumentInsert>(doc);

    const { data, error } = await insertWithBusiness("documents", doc, business.id);

    if (error) {
        console.error("Error creating document:", error);
        return null;
    }

    return data as unknown as Document;
}

export const updateDocument = async (id: string, doc: DocumentUpdate): Promise<Document | null> => {
    const { business } = await withBusinessServer();

    doc = await applyUpdated<DocumentUpdate>(doc);

    const { data, error } = await updateWithBusinessCheck("documents", id, doc, business.id);

    if (error) {
        console.error("Error updating document:", error);
        return null;
    }

    return data as unknown as Document;
}

export const deleteDocument = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("documents", id, business.id);

    if (error) {
        console.error("Error deleting document:", error);
        return false;
    }

    return true;
}

export const searchDocuments = async (query: string): Promise<Document[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("documents", business.id, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error searching documents:", error);
        return [];
    }

    return data as unknown as Document[];
};
