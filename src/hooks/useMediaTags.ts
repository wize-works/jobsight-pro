import { useState, useEffect } from 'react';
import { mediaTagsApi, MediaTag, MediaTagQuery, CreateMediaTagData, UpdateMediaTagData } from '@/lib/api/media-tags';

// Hook for fetching media tags
export const useMediaTags = (query?: MediaTagQuery) => {
    const [tags, setTags] = useState<MediaTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchTags = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.getMediaTags(query);
            setTags(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch media tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, [JSON.stringify(query)]);

    return {
        tags,
        loading,
        error,
        count,
        refetch: fetchTags,
    };
};

// Hook for creating media tags
export const useCreateMediaTag = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createTag = async (data: CreateMediaTagData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.createMediaTag(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create media tag');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createTag,
        loading,
        error,
    };
};

// Hook for updating media tags
export const useUpdateMediaTag = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateTag = async (id: string, data: UpdateMediaTagData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.updateMediaTag(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update media tag');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateTag,
        loading,
        error,
    };
};

// Hook for deleting media tags
export const useDeleteMediaTag = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteTag = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await mediaTagsApi.deleteMediaTag(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete media tag');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        deleteTag,
        loading,
        error,
    };
};

// Hook for media tag mutations
export const useMediaTagMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createTag = async (data: CreateMediaTagData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.createMediaTag(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create media tag');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateTag = async (id: string, data: UpdateMediaTagData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.updateMediaTag(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update media tag');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteTag = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await mediaTagsApi.deleteMediaTag(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete media tag');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createTag,
        updateTag,
        deleteTag,
        loading,
        error,
    };
};

// Hook for tag search
export const useTagSearch = () => {
    const [tags, setTags] = useState<MediaTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchTags = async (query: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.searchTags(query);
            setTags(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search tags');
        } finally {
            setLoading(false);
        }
    };

    return {
        tags,
        loading,
        error,
        searchTags,
    };
};

// Hook for tags by name
export const useTagsByName = (name: string) => {
    const [tags, setTags] = useState<MediaTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTagsByName = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.getTagByName(name);
            setTags(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tags by name');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (name) {
            fetchTagsByName();
        }
    }, [name]);

    return {
        tags,
        loading,
        error,
        refetch: fetchTagsByName,
    };
};

// Hook for tags by color
export const useTagsByColor = (color: string) => {
    const [tags, setTags] = useState<MediaTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTagsByColor = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaTagsApi.getTagsByColor(color);
            setTags(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tags by color');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (color) {
            fetchTagsByColor();
        }
    }, [color]);

    return {
        tags,
        loading,
        error,
        refetch: fetchTagsByColor,
    };
};

// Hook for tag filters
export const useTagFilters = () => {
    const [filters, setFilters] = useState<MediaTagQuery>({});
    const [tags, setTags] = useState<MediaTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyFilters = async (newFilters: MediaTagQuery) => {
        try {
            setLoading(true);
            setError(null);
            setFilters(newFilters);
            const response = await mediaTagsApi.getMediaTags(newFilters);
            setTags(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to apply filters');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({});
    };

    return {
        filters,
        tags,
        loading,
        error,
        applyFilters,
        clearFilters,
    };
};

// Hook for tag statistics
export const useTagStatistics = () => {
    const [stats, setStats] = useState<{
        totalTags: number;
        tagsByColor: Record<string, number>;
        mostUsedTags: MediaTag[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            // Get all tags to calculate statistics
            const response = await mediaTagsApi.getMediaTags();
            const allTags = response.data;

            // Calculate statistics
            const tagsByColor: Record<string, number> = {};
            allTags.forEach(tag => {
                if (tag.color) {
                    tagsByColor[tag.color] = (tagsByColor[tag.color] || 0) + 1;
                }
            });

            const stats = {
                totalTags: allTags.length,
                tagsByColor,
                mostUsedTags: allTags.slice(0, 10), // Top 10 most used tags
            };

            setStats(stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tag statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    return {
        stats,
        loading,
        error,
        refetch: fetchStatistics,
    };
};

// Hook for popular tags
export const usePopularTags = (limit: number = 10) => {
    const [tags, setTags] = useState<MediaTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPopularTags = async () => {
        try {
            setLoading(true);
            setError(null);
            // Get all tags and sort by usage/creation date
            const response = await mediaTagsApi.getMediaTags();
            const allTags = response.data;

            // Sort by created_at descending to get "popular" tags
            const popularTags = allTags
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, limit);

            setTags(popularTags);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch popular tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPopularTags();
    }, [limit]);

    return {
        tags,
        loading,
        error,
        refetch: fetchPopularTags,
    };
};
