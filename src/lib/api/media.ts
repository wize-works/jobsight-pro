// Media API client types and functions
export interface Media {
    id: string;
    business_id: string;
    project_id: string | null;
    url: string;
    name: string | null;
    description: string | null;
    type: string | null;
    size: number | null;
    uploaded_by: string | null;
    uploaded_at: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}

// Media Links for relationships
export interface MediaLink {
    id: string;
    business_id: string;
    media_id: string;
    linked_id: string;
    linked_type: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}

// Query parameters
export interface MediaQuery {
    search?: string;
    type?: string;
    equipment_id?: string;
    project_id?: string;
    client_id?: string;
    daily_log_id?: string;
    include?: string;
    limit?: number;
    offset?: number;
}

// Create/Update types
export interface CreateMediaData {
    url: string;
    name?: string;
    description?: string;
    type?: string;
    size?: number;
    uploaded_by?: string;
    uploaded_at?: string;
    project_id?: string;
}

export interface UpdateMediaData extends Partial<CreateMediaData> { }

// Upload types
export interface UploadUrlResponse {
    uploadUrl: string;
    fileUrl: string;
    fileName: string;
}

export interface UploadResponse {
    success: boolean;
    media?: Media;
    error?: string;
}

// API response types
export interface MediaResponse {
    data: Media[];
    count: number;
}

export interface MediaSingleResponse {
    data: Media;
    message: string;
}

// Media API functions
export const mediaApi = {
    // Get media
    async getMedia(params?: MediaQuery): Promise<MediaResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/media?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch media');
        }
        return response.json();
    },

    // Create media
    async createMedia(data: CreateMediaData): Promise<MediaSingleResponse> {
        const response = await fetch('/api/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create media');
        }
        return response.json();
    },

    // Update media
    async updateMedia(id: string, data: UpdateMediaData): Promise<MediaSingleResponse> {
        const response = await fetch('/api/media', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update media');
        }
        return response.json();
    },

    // Delete media
    async deleteMedia(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/media?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete media');
        }
        return response.json();
    },

    // Get media by ID
    async getMediaById(id: string): Promise<Media | null> {
        const response = await mediaApi.getMedia();
        return response.data.find(media => media.id === id) || null;
    },

    // Search media
    async searchMedia(query: string): Promise<MediaResponse> {
        return mediaApi.getMedia({ search: query });
    },

    // Get media by type
    async getMediaByType(type: string): Promise<MediaResponse> {
        return mediaApi.getMedia({ type });
    },

    // Get media by equipment
    async getMediaByEquipment(equipmentId: string): Promise<MediaResponse> {
        return mediaApi.getMedia({ equipment_id: equipmentId });
    },

    // Get media by project
    async getMediaByProject(projectId: string): Promise<MediaResponse> {
        return mediaApi.getMedia({ project_id: projectId });
    },

    // Get media by client
    async getMediaByClient(clientId: string): Promise<MediaResponse> {
        return mediaApi.getMedia({ client_id: clientId });
    },

    // Get media by daily log
    async getMediaByDailyLog(dailyLogId: string): Promise<MediaResponse> {
        return mediaApi.getMedia({ daily_log_id: dailyLogId });
    },

    // Get upload URL for Azure Blob Storage
    async getUploadUrl(type: string, filename: string): Promise<UploadUrlResponse> {
        const response = await fetch('/api/media/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, filename }),
        });

        if (!response.ok) {
            throw new Error('Failed to get upload URL');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to get upload URL');
        }

        return result.data;
    },

    // Upload file to Azure Blob Storage
    async uploadFile(uploadUrl: string, file: File): Promise<void> {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': file.type || 'application/octet-stream',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
        }
    },
};

// Utility functions
export const mediaUtils = {
    // Get file extension from URL
    getFileExtension: (url: string): string => {
        const pathname = new URL(url).pathname;
        return pathname.split('.').pop()?.toLowerCase() || '';
    },

    // Get media type from URL
    getMediaTypeFromUrl: (url: string): string => {
        const extension = mediaUtils.getFileExtension(url);

        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
        const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
        const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

        if (imageExts.includes(extension)) return 'images';
        if (videoExts.includes(extension)) return 'videos';
        if (audioExts.includes(extension)) return 'audios';
        if (docExts.includes(extension)) return 'documents';

        return 'files';
    },

    // Format file size
    formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Check if media is image
    isImage: (media: Media): boolean => {
        return media.type === 'images' || mediaUtils.getMediaTypeFromUrl(media.url) === 'images';
    },

    // Check if media is video
    isVideo: (media: Media): boolean => {
        return media.type === 'videos' || mediaUtils.getMediaTypeFromUrl(media.url) === 'videos';
    },

    // Check if media is audio
    isAudio: (media: Media): boolean => {
        return media.type === 'audios' || mediaUtils.getMediaTypeFromUrl(media.url) === 'audios';
    },

    // Check if media is document
    isDocument: (media: Media): boolean => {
        return media.type === 'documents' || mediaUtils.getMediaTypeFromUrl(media.url) === 'documents';
    },

    // Get media icon class
    getIconClass: (media: Media): string => {
        if (mediaUtils.isImage(media)) return 'bi-image';
        if (mediaUtils.isVideo(media)) return 'bi-play-circle';
        if (mediaUtils.isAudio(media)) return 'bi-volume-up';
        if (mediaUtils.isDocument(media)) return 'bi-file-earmark-text';
        return 'bi-file-earmark';
    },

    // Get media type badge color
    getTypeBadgeColor: (media: Media): string => {
        if (mediaUtils.isImage(media)) return 'bg-blue-100 text-blue-800';
        if (mediaUtils.isVideo(media)) return 'bg-red-100 text-red-800';
        if (mediaUtils.isAudio(media)) return 'bg-green-100 text-green-800';
        if (mediaUtils.isDocument(media)) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    },

    // Sort media by date
    sortByDate: (media: Media[], ascending: boolean = false): Media[] => {
        return [...media].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });
    },

    // Sort media by name
    sortByName: (media: Media[], ascending: boolean = true): Media[] => {
        return [...media].sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
    },

    // Sort media by size
    sortBySize: (media: Media[], ascending: boolean = false): Media[] => {
        return [...media].sort((a, b) => {
            const sizeA = a.size || 0;
            const sizeB = b.size || 0;
            return ascending ? sizeA - sizeB : sizeB - sizeA;
        });
    },

    // Filter media by type
    filterByType: (media: Media[], type: string): Media[] => {
        return media.filter(item => item.type === type);
    },

    // Filter media by date range
    filterByDateRange: (media: Media[], startDate: string, endDate: string): Media[] => {
        return media.filter(item => {
            const itemDate = new Date(item.created_at);
            return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
        });
    },

    // Group media by type
    groupByType: (media: Media[]): Record<string, Media[]> => {
        return media.reduce((acc, item) => {
            const type = item.type || 'unknown';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(item);
            return acc;
        }, {} as Record<string, Media[]>);
    },

    // Group media by date
    groupByDate: (media: Media[]): Record<string, Media[]> => {
        return media.reduce((acc, item) => {
            const date = new Date(item.created_at).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {} as Record<string, Media[]>);
    },

    // Get media statistics
    getStatistics: (media: Media[]) => {
        const typeGroups = mediaUtils.groupByType(media);
        const totalSize = media.reduce((sum, item) => sum + (item.size || 0), 0);
        const averageSize = media.length > 0 ? totalSize / media.length : 0;

        return {
            total_count: media.length,
            total_size: totalSize,
            average_size: averageSize,
            type_distribution: Object.keys(typeGroups).map(type => ({
                type,
                count: typeGroups[type].length,
                percentage: (typeGroups[type].length / media.length) * 100,
                size: typeGroups[type].reduce((sum, item) => sum + (item.size || 0), 0),
            })),
            largest_file: media.reduce((largest, item) =>
                (item.size || 0) > (largest.size || 0) ? item : largest, media[0]),
            smallest_file: media.reduce((smallest, item) =>
                (item.size || 0) < (smallest.size || 0) ? item : smallest, media[0]),
        };
    },

    // Validate media data
    validateMedia: (data: CreateMediaData): string[] => {
        const errors: string[] = [];

        if (!data.url?.trim()) {
            errors.push('URL is required');
        }

        if (data.url && !mediaUtils.isValidUrl(data.url)) {
            errors.push('Invalid URL format');
        }

        if (data.size && data.size < 0) {
            errors.push('Size must be non-negative');
        }

        return errors;
    },

    // Check if URL is valid
    isValidUrl: (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Create media template
    createTemplate: (): CreateMediaData => ({
        url: '',
        name: '',
        description: '',
        type: 'files',
        size: 0,
    }),

    // Generate thumbnail URL (if supported)
    getThumbnailUrl: (media: Media): string => {
        if (mediaUtils.isImage(media)) {
            // For images, return the original URL as thumbnail
            return media.url;
        }

        // For other types, return a placeholder or default thumbnail
        return '/images/file-placeholder.png';
    },

    // Check if media can be previewed
    canPreview: (media: Media): boolean => {
        return mediaUtils.isImage(media) || mediaUtils.isVideo(media) || mediaUtils.isAudio(media);
    },

    // Get preview URL
    getPreviewUrl: (media: Media): string => {
        if (mediaUtils.canPreview(media)) {
            return media.url;
        }
        return '';
    },

    // Format upload date
    formatUploadDate: (dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    },

    // Get relative time since upload
    getRelativeTime: (dateString: string): string => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return mediaUtils.formatUploadDate(dateString);
    },

    // Search media in array
    searchInArray: (media: Media[], query: string): Media[] => {
        if (!query.trim()) return media;

        const searchTerm = query.toLowerCase();
        return media.filter(item =>
            item.name?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.type?.toLowerCase().includes(searchTerm)
        );
    },
};
