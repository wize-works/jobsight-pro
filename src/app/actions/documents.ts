"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Document, DocumentInsert, DocumentUpdate } from "@/types/documents";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getDocuments = async (): Promise<Document[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch documents.");
        return [];
    }

    const { data, error } = await fetchByBusiness("documents", businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch documents.");
        return null;
    }

    const { data, error } = await fetchByBusiness("documents", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a document.");
        return null;
    }

    const { data, error } = await insertWithBusiness("documents", doc, businessId);

    if (error) {
        console.error("Error creating document:", error);
        return null;
    }

    return data as unknown as Document;
}

export const updateDocument = async (id: string, doc: DocumentUpdate): Promise<Document | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a document.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("documents", id, doc, businessId);

    if (error) {
        console.error("Error updating document:", error);
        return null;
    }

    return data as unknown as Document;
}

export const deleteDocument = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a document.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("documents", id, businessId);

    if (error) {
        console.error("Error deleting document:", error);
        return false;
    }

    return true;
}

export const searchDocuments = async (query: string): Promise<Document[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search documents.");
        return [];
    }

    const { data, error } = await fetchByBusiness("documents", businessId, "*", {
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
