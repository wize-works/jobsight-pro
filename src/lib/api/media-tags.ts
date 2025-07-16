// Media Tags API client types and functions
export interface MediaTag {
    id: string;
    business_id: string;
    tag: string;
    color?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}

// Query parameters
export interface MediaTagQuery {
    search?: string;
    tag?: string;
    color?: string;
    limit?: number;
    offset?: number;
}

// Create/Update types
export interface CreateMediaTagData {
    tag: string;
    color?: string;
    description?: string;
}

export interface UpdateMediaTagData extends Partial<CreateMediaTagData> { }

// API response types
export interface MediaTagResponse {
    data: MediaTag[];
    count: number;
}

export interface MediaTagSingleResponse {
    data: MediaTag;
    message: string;
}

// Media Tags API functions
export const mediaTagsApi = {
    // Get media tags
    async getMediaTags(params?: MediaTagQuery): Promise<MediaTagResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/media-tags?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch media tags');
        }
        return response.json();
    },

    // Create media tag
    async createMediaTag(data: CreateMediaTagData): Promise<MediaTagSingleResponse> {
        const response = await fetch('/api/media-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create media tag');
        }
        return response.json();
    },

    // Update media tag
    async updateMediaTag(id: string, data: UpdateMediaTagData): Promise<MediaTagSingleResponse> {
        const response = await fetch('/api/media-tags', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update media tag');
        }
        return response.json();
    },

    // Delete media tag
    async deleteMediaTag(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/media-tags?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete media tag');
        }
        return response.json();
    },

    // Search tags
    async searchTags(query: string): Promise<MediaTagResponse> {
        return mediaTagsApi.getMediaTags({ search: query });
    },

    // Get tag by name
    async getTagByName(tag: string): Promise<MediaTagResponse> {
        return mediaTagsApi.getMediaTags({ tag });
    },

    // Get tags by color
    async getTagsByColor(color: string): Promise<MediaTagResponse> {
        return mediaTagsApi.getMediaTags({ color });
    },
};

// Utility functions
export const mediaTagUtils = {
    // Get unique tag names
    getUniqueTagNames: (tags: MediaTag[]): string[] => {
        return [...new Set(tags.map(tag => tag.tag))];
    },

    // Get unique colors
    getUniqueColors: (tags: MediaTag[]): string[] => {
        return [...new Set(tags.map(tag => tag.color).filter(Boolean) as string[])];
    },

    // Group tags by color
    groupByColor: (tags: MediaTag[]): Record<string, MediaTag[]> => {
        return tags.reduce((acc, tag) => {
            const color = tag.color || 'default';
            if (!acc[color]) {
                acc[color] = [];
            }
            acc[color].push(tag);
            return acc;
        }, {} as Record<string, MediaTag[]>);
    },

    // Sort tags by name
    sortByName: (tags: MediaTag[], ascending: boolean = true): MediaTag[] => {
        return [...tags].sort((a, b) => {
            return ascending ? a.tag.localeCompare(b.tag) : b.tag.localeCompare(a.tag);
        });
    },

    // Sort tags by creation date
    sortByCreatedAt: (tags: MediaTag[], ascending: boolean = true): MediaTag[] => {
        return [...tags].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });
    },

    // Filter tags by name pattern
    filterByNamePattern: (tags: MediaTag[], pattern: RegExp): MediaTag[] => {
        return tags.filter(tag => pattern.test(tag.tag));
    },

    // Filter tags by color
    filterByColor: (tags: MediaTag[], color: string): MediaTag[] => {
        return tags.filter(tag => tag.color === color);
    },

    // Get default tag colors
    getDefaultColors: (): string[] => {
        return [
            '#ef4444', // red
            '#f97316', // orange
            '#eab308', // yellow
            '#22c55e', // green
            '#06b6d4', // cyan
            '#3b82f6', // blue
            '#8b5cf6', // violet
            '#ec4899', // pink
            '#6b7280', // gray
            '#000000', // black
        ];
    },

    // Get color name from hex
    getColorName: (hex: string): string => {
        const colorNames: Record<string, string> = {
            '#ef4444': 'Red',
            '#f97316': 'Orange',
            '#eab308': 'Yellow',
            '#22c55e': 'Green',
            '#06b6d4': 'Cyan',
            '#3b82f6': 'Blue',
            '#8b5cf6': 'Violet',
            '#ec4899': 'Pink',
            '#6b7280': 'Gray',
            '#000000': 'Black',
        };
        return colorNames[hex] || 'Custom';
    },

    // Generate CSS class for tag color
    getColorClass: (color?: string): string => {
        if (!color) return 'bg-gray-100 text-gray-800';

        const colorClasses: Record<string, string> = {
            '#ef4444': 'bg-red-100 text-red-800',
            '#f97316': 'bg-orange-100 text-orange-800',
            '#eab308': 'bg-yellow-100 text-yellow-800',
            '#22c55e': 'bg-green-100 text-green-800',
            '#06b6d4': 'bg-cyan-100 text-cyan-800',
            '#3b82f6': 'bg-blue-100 text-blue-800',
            '#8b5cf6': 'bg-violet-100 text-violet-800',
            '#ec4899': 'bg-pink-100 text-pink-800',
            '#6b7280': 'bg-gray-100 text-gray-800',
            '#000000': 'bg-black text-white',
        };

        return colorClasses[color] || 'bg-gray-100 text-gray-800';
    },

    // Validate tag data
    validateTag: (data: CreateMediaTagData): string[] => {
        const errors: string[] = [];

        if (!data.tag?.trim()) {
            errors.push('Tag name is required');
        }

        if (data.tag && data.tag.length > 50) {
            errors.push('Tag name must be 50 characters or less');
        }

        if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
            errors.push('Color must be a valid hex color code');
        }

        if (data.description && data.description.length > 200) {
            errors.push('Description must be 200 characters or less');
        }

        return errors;
    },

    // Create tag template
    createTemplate: (): CreateMediaTagData => ({
        tag: '',
        color: mediaTagUtils.getDefaultColors()[0],
        description: '',
    }),

    // Find tag by name
    findByName: (tags: MediaTag[], name: string): MediaTag | undefined => {
        return tags.find(tag => tag.tag.toLowerCase() === name.toLowerCase());
    },

    // Check if tag exists
    hasTag: (tags: MediaTag[], name: string): boolean => {
        return tags.some(tag => tag.tag.toLowerCase() === name.toLowerCase());
    },

    // Get tag suggestions based on input
    getSuggestions: (tags: MediaTag[], input: string): MediaTag[] => {
        if (!input.trim()) return [];

        const searchTerm = input.toLowerCase();
        return tags.filter(tag =>
            tag.tag.toLowerCase().includes(searchTerm) ||
            tag.description?.toLowerCase().includes(searchTerm)
        );
    },

    // Format tag name for display
    formatTagName: (tag: string): string => {
        return tag.trim().toLowerCase().replace(/\s+/g, '-');
    },

    // Parse tag string to array
    parseTagString: (tagString: string): string[] => {
        return tagString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    },

    // Convert tag array to string
    tagsToString: (tags: string[]): string => {
        return tags.join(', ');
    },

    // Get tag statistics
    getStatistics: (tags: MediaTag[]) => {
        const uniqueColors = mediaTagUtils.getUniqueColors(tags);
        const colorGroups = mediaTagUtils.groupByColor(tags);

        return {
            total_tags: tags.length,
            unique_colors: uniqueColors.length,
            color_distribution: Object.keys(colorGroups).map(color => ({
                color,
                count: colorGroups[color].length,
                percentage: (colorGroups[color].length / tags.length) * 100,
            })),
            most_common_color: uniqueColors.length > 0 ?
                Object.keys(colorGroups).reduce((a, b) =>
                    colorGroups[a].length > colorGroups[b].length ? a : b
                ) : null,
        };
    },

    // Merge duplicate tags
    mergeDuplicates: (tags: MediaTag[]): MediaTag[] => {
        const seen = new Set<string>();
        return tags.filter(tag => {
            const key = tag.tag.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    },

    // Get popular tags (most recent)
    getPopularTags: (tags: MediaTag[], limit: number = 10): MediaTag[] => {
        return mediaTagUtils.sortByCreatedAt(tags, false).slice(0, limit);
    },
};
