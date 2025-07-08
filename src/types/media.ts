import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

// Main media types from Supabase schema
export type Media = Database["public"]["Tables"]["media"]["Row"];
export type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
export type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];

// Media Links
export type MediaLink = Database['public']['Tables']['media_links']['Row'];
export type MediaLinkInsert = Database['public']['Tables']['media_links']['Insert'];
export type MediaLinkUpdate = Database['public']['Tables']['media_links']['Update'];

// Media Metadata
export type MediaMetadata = Database['public']['Tables']['media_metadata']['Row'];
export type MediaMetadataInsert = Database['public']['Tables']['media_metadata']['Insert'];
export type MediaMetadataUpdate = Database['public']['Tables']['media_metadata']['Update'];

// Media Tags
export type MediaTag = Database['public']['Tables']['media_tags']['Row'];
export type MediaTagInsert = Database['public']['Tables']['media_tags']['Insert'];
export type MediaTagUpdate = Database['public']['Tables']['media_tags']['Update'];

export type MediaType = "images" | "videos" | "audios" | "files" | "documents";

export const mediaTypeOptions = createOptions<MediaType>({
    images: { label: "Image", badge: "badge-primary" },
    videos: { label: "Video", badge: "badge-secondary" },
    audios: { label: "Audio", badge: "badge-success" },
    files: { label: "File", badge: "badge-warning" },
    documents: { label: "Document", badge: "badge-info" }
});

// Additional types for offline media handling
export interface OfflineMedia extends Media {
    // Flag to indicate if this media is available offline (cached)
    isOfflineAvailable?: boolean;
    // Local blob URL for offline access
    localBlobUrl?: string;
    // Size of cached file in bytes
    cachedSize?: number;
    // When the file was cached locally
    cachedAt?: string;
}

// Upload queue item for offline media uploads
export interface MediaUploadQueueItem {
    id: string;
    businessId: string;
    projectId?: string;
    tempBlobUrl: string; // Local blob URL
    name: string;
    description?: string;
    type: string;
    size: number;
    linkedId?: string;
    linkedType?: string;
    tags?: string[];
    metadata?: Record<string, string>;
    uploadedBy: string; // auth_id
    createdAt: string;
    uploadProgress: number; // 0-100
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
    retryCount: number;
    errorMessage?: string;
    // For camera captures
    captureSource?: 'camera' | 'gallery' | 'file';
    // Geolocation data if available
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    };
}

// Media capture options
export interface MediaCaptureOptions {
    source: 'camera' | 'gallery';
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1
    format?: 'jpeg' | 'png' | 'webp';
    includeLocation?: boolean;
}

// Media cache settings
export interface MediaCacheSettings {
    maxCacheSize: number; // bytes
    maxCacheAge: number; // milliseconds
    enableAutoPinning: boolean; // Auto-pin recent media
    autoPinDays: number; // Days to auto-pin
}

// Media sync status
export interface MediaSyncStatus {
    lastSync: number;
    pendingUploads: number;
    totalCacheSize: number;
    availableOfflineCount: number;
}