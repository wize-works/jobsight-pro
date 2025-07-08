import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

export type DocumentType = "report" | "invoice" | "contract" | "specification" | "other";
export type DocumentStatus = "draft" | "review" | "approved" | "rejected" | "archived";

export const documentTyppeOptions = createOptions<DocumentType>({
    report: { label: "Report", badge: "badge-primary" },
    invoice: { label: "Invoice", badge: "badge-secondary" },
    contract: { label: "Contract", badge: "badge-success" },
    specification: { label: "Specification", badge: "badge-info" },
    other: { label: "Other", badge: "badge-neutral" }
});

export const documentStatusOptions = createOptions<DocumentStatus>({
    draft: { label: "Draft", badge: "badge-warning" },
    review: { label: "Review", badge: "badge-info" },
    approved: { label: "Approved", badge: "badge-success" },
    rejected: { label: "Rejected", badge: "badge-error" },
    archived: { label: "Archived", badge: "badge-secondary" }
});

// Extended types for offline functionality and search
export interface DocumentWithDetails extends Document {
    projectName?: string;
    mediaFileName?: string;
    fileExtension?: string;
    sizeFormatted?: string;
}

export interface DocumentSearchFilters {
    projectId?: string;
    type?: DocumentType;
    status?: DocumentStatus;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    sortBy?: 'name' | 'created_at' | 'updated_at' | 'size';
    sortOrder?: 'asc' | 'desc';
}

export interface DocumentOperationResult {
    success: boolean;
    document?: Document;
    error?: string;
}

export interface DocumentListResult {
    success: boolean;
    documents: DocumentWithDetails[];
    total: number;
    error?: string;
}

// Document access and permission types for offline use
export interface DocumentAccess {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
}

// Document version tracking for offline conflict resolution
export interface DocumentVersion {
    id: string;
    documentId: string;
    version: number;
    checksum?: string;
    lastModified: string;
    modifiedBy?: string;
}

// Sync queue item for document operations
export interface DocumentSyncQueueItem {
    id: string;
    documentId: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    businessId: string;
    userId?: string;
    timestamp: number;
    retryCount: number;
}