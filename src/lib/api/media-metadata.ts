// Media Metadata API client types and functions
export interface MediaMetadata {
    id: string;
    business_id: string;
    media_id: string;
    key: string;
    value: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}

// Query parameters
export interface MediaMetadataQuery {
    search?: string;
    key?: string;
    value?: string;
    media_id?: string;
    limit?: number;
    offset?: number;
}

// Create/Update types
export interface CreateMediaMetadataData {
    media_id: string;
    key: string;
    value: string;
}

export interface UpdateMediaMetadataData extends Partial<CreateMediaMetadataData> { }

// API response types
export interface MediaMetadataResponse {
    data: MediaMetadata[];
    count: number;
}

export interface MediaMetadataSingleResponse {
    data: MediaMetadata;
    message: string;
}

// Media Metadata API functions
export const mediaMetadataApi = {
    // Get media metadata
    async getMediaMetadata(params?: MediaMetadataQuery): Promise<MediaMetadataResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/media-metadata?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch media metadata');
        }
        return response.json();
    },

    // Create media metadata
    async createMediaMetadata(data: CreateMediaMetadataData): Promise<MediaMetadataSingleResponse> {
        const response = await fetch('/api/media-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create media metadata');
        }
        return response.json();
    },

    // Update media metadata
    async updateMediaMetadata(id: string, data: UpdateMediaMetadataData): Promise<MediaMetadataSingleResponse> {
        const response = await fetch('/api/media-metadata', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update media metadata');
        }
        return response.json();
    },

    // Delete media metadata
    async deleteMediaMetadata(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/media-metadata?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete media metadata');
        }
        return response.json();
    },

    // Get metadata by media ID
    async getMetadataByMediaId(mediaId: string): Promise<MediaMetadataResponse> {
        return mediaMetadataApi.getMediaMetadata({ media_id: mediaId });
    },

    // Search metadata
    async searchMetadata(query: string): Promise<MediaMetadataResponse> {
        return mediaMetadataApi.getMediaMetadata({ search: query });
    },

    // Get metadata by key
    async getMetadataByKey(key: string): Promise<MediaMetadataResponse> {
        return mediaMetadataApi.getMediaMetadata({ key });
    },

    // Get metadata by value
    async getMetadataByValue(value: string): Promise<MediaMetadataResponse> {
        return mediaMetadataApi.getMediaMetadata({ value });
    },

    // Get metadata by key-value pair
    async getMetadataByKeyValue(key: string, value: string): Promise<MediaMetadataResponse> {
        return mediaMetadataApi.getMediaMetadata({ key, value });
    },
};

// Utility functions
export const mediaMetadataUtils = {
    // Group metadata by media ID
    groupByMediaId: (metadata: MediaMetadata[]): Record<string, MediaMetadata[]> => {
        return metadata.reduce((acc, item) => {
            if (!acc[item.media_id]) {
                acc[item.media_id] = [];
            }
            acc[item.media_id].push(item);
            return acc;
        }, {} as Record<string, MediaMetadata[]>);
    },

    // Group metadata by key
    groupByKey: (metadata: MediaMetadata[]): Record<string, MediaMetadata[]> => {
        return metadata.reduce((acc, item) => {
            if (!acc[item.key]) {
                acc[item.key] = [];
            }
            acc[item.key].push(item);
            return acc;
        }, {} as Record<string, MediaMetadata[]>);
    },

    // Get unique keys
    getUniqueKeys: (metadata: MediaMetadata[]): string[] => {
        return [...new Set(metadata.map(item => item.key))];
    },

    // Get unique values
    getUniqueValues: (metadata: MediaMetadata[]): string[] => {
        return [...new Set(metadata.map(item => item.value))];
    },

    // Get values for a specific key
    getValuesByKey: (metadata: MediaMetadata[], key: string): string[] => {
        return metadata
            .filter(item => item.key === key)
            .map(item => item.value);
    },

    // Convert metadata array to key-value object
    toKeyValueObject: (metadata: MediaMetadata[]): Record<string, string> => {
        return metadata.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {} as Record<string, string>);
    },

    // Convert key-value object to metadata array
    fromKeyValueObject: (keyValueObj: Record<string, string>, mediaId: string): CreateMediaMetadataData[] => {
        return Object.entries(keyValueObj).map(([key, value]) => ({
            media_id: mediaId,
            key,
            value,
        }));
    },

    // Filter metadata by key pattern
    filterByKeyPattern: (metadata: MediaMetadata[], pattern: RegExp): MediaMetadata[] => {
        return metadata.filter(item => pattern.test(item.key));
    },

    // Filter metadata by value pattern
    filterByValuePattern: (metadata: MediaMetadata[], pattern: RegExp): MediaMetadata[] => {
        return metadata.filter(item => pattern.test(item.value));
    },

    // Sort metadata by key
    sortByKey: (metadata: MediaMetadata[], ascending: boolean = true): MediaMetadata[] => {
        return [...metadata].sort((a, b) => {
            return ascending ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key);
        });
    },

    // Sort metadata by value
    sortByValue: (metadata: MediaMetadata[], ascending: boolean = true): MediaMetadata[] => {
        return [...metadata].sort((a, b) => {
            return ascending ? a.value.localeCompare(b.value) : b.value.localeCompare(a.value);
        });
    },

    // Sort metadata by creation date
    sortByCreatedAt: (metadata: MediaMetadata[], ascending: boolean = true): MediaMetadata[] => {
        return [...metadata].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });
    },

    // Validate metadata data
    validateMetadata: (data: CreateMediaMetadataData): string[] => {
        const errors: string[] = [];

        if (!data.media_id?.trim()) {
            errors.push('Media ID is required');
        }

        if (!data.key?.trim()) {
            errors.push('Key is required');
        }

        if (!data.value?.trim()) {
            errors.push('Value is required');
        }

        return errors;
    },

    // Create metadata template
    createTemplate: (mediaId: string): CreateMediaMetadataData => ({
        media_id: mediaId,
        key: '',
        value: '',
    }),

    // Find metadata by key
    findByKey: (metadata: MediaMetadata[], key: string): MediaMetadata | undefined => {
        return metadata.find(item => item.key === key);
    },

    // Check if key exists
    hasKey: (metadata: MediaMetadata[], key: string): boolean => {
        return metadata.some(item => item.key === key);
    },

    // Get metadata value by key
    getValueByKey: (metadata: MediaMetadata[], key: string): string | undefined => {
        const item = mediaMetadataUtils.findByKey(metadata, key);
        return item?.value;
    },

    // Update or create metadata
    upsertMetadata: (metadata: MediaMetadata[], key: string, value: string, mediaId: string): MediaMetadata[] => {
        const existingIndex = metadata.findIndex(item => item.key === key && item.media_id === mediaId);

        if (existingIndex !== -1) {
            // Update existing
            const updated = [...metadata];
            updated[existingIndex] = { ...updated[existingIndex], value };
            return updated;
        } else {
            // Create new
            const newItem: MediaMetadata = {
                id: `temp-${Date.now()}`,
                business_id: '',
                media_id: mediaId,
                key,
                value,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: '',
                updated_by: '',
            };
            return [...metadata, newItem];
        }
    },

    // Remove metadata by key
    removeByKey: (metadata: MediaMetadata[], key: string): MediaMetadata[] => {
        return metadata.filter(item => item.key !== key);
    },

    // Get metadata summary
    getSummary: (metadata: MediaMetadata[]) => {
        const uniqueKeys = mediaMetadataUtils.getUniqueKeys(metadata);
        const uniqueValues = mediaMetadataUtils.getUniqueValues(metadata);
        const mediaIds = [...new Set(metadata.map(item => item.media_id))];

        return {
            total_count: metadata.length,
            unique_keys: uniqueKeys.length,
            unique_values: uniqueValues.length,
            media_count: mediaIds.length,
            keys: uniqueKeys,
            values: uniqueValues,
            media_ids: mediaIds,
        };
    },
};
