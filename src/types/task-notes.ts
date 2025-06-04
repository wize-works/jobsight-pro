import type { Database } from "@/types/supabase";

export interface TaskNote {
    id: string;
    task_id: string;
    business_id: string;
    content: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
}

export interface TaskNoteInsert {
    task_id: string;
    business_id: string;
    content: string;
    author_id?: string;
    created_by?: string;
    created_at?: string;
}

export interface TaskNoteUpdate {
    content?: string;
    updated_by?: string;
    updated_at?: string;
}