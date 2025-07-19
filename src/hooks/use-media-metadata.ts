import { useState, useEffect } from 'react';
import { mediaMetadataApi, MediaMetadata, MediaMetadataQuery, CreateMediaMetadataData, UpdateMediaMetadataData } from '@/lib/api/media-metadata';

// Hook for fetching media metadata
export const useMediaMetadata = (query?: MediaMetadataQuery) => {
    const [metadata, setMetadata] = useState<MediaMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchMetadata = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.getMediaMetadata(query);
            setMetadata(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch media metadata');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetadata();
    }, [JSON.stringify(query)]);

    return {
        metadata,
        loading,
        error,
        count,
        refetch: fetchMetadata,
    };
};

// Hook for creating media metadata
export const useCreateMediaMetadata = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createMetadata = async (data: CreateMediaMetadataData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.createMediaMetadata(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create media metadata');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createMetadata,
        loading,
        error,
    };
};

// Hook for updating media metadata
export const useUpdateMediaMetadata = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateMetadata = async (id: string, data: UpdateMediaMetadataData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.updateMediaMetadata(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update media metadata');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateMetadata,
        loading,
        error,
    };
};

// Hook for deleting media metadata
export const useDeleteMediaMetadata = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteMetadata = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await mediaMetadataApi.deleteMediaMetadata(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete media metadata');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        deleteMetadata,
        loading,
        error,
    };
};

// Hook for media metadata mutations
export const useMediaMetadataMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createMetadata = async (data: CreateMediaMetadataData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.createMediaMetadata(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create media metadata');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateMetadata = async (id: string, data: UpdateMediaMetadataData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.updateMediaMetadata(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update media metadata');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteMetadata = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await mediaMetadataApi.deleteMediaMetadata(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete media metadata');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createMetadata,
        updateMetadata,
        deleteMetadata,
        loading,
        error,
    };
};

// Hook for metadata by media ID
export const useMetadataByMediaId = (mediaId: string) => {
    const [metadata, setMetadata] = useState<MediaMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetadataByMediaId = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.getMetadataByMediaId(mediaId);
            setMetadata(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch metadata by media ID');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mediaId) {
            fetchMetadataByMediaId();
        }
    }, [mediaId]);

    return {
        metadata,
        loading,
        error,
        refetch: fetchMetadataByMediaId,
    };
};

// Hook for searching metadata
export const useMetadataSearch = () => {
    const [metadata, setMetadata] = useState<MediaMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchMetadata = async (query: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.searchMetadata(query);
            setMetadata(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search metadata');
        } finally {
            setLoading(false);
        }
    };

    return {
        metadata,
        loading,
        error,
        searchMetadata,
    };
};

// Hook for metadata by key
export const useMetadataByKey = (key: string) => {
    const [metadata, setMetadata] = useState<MediaMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetadataByKey = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaMetadataApi.getMetadataByKey(key);
            setMetadata(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch metadata by key');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (key) {
            fetchMetadataByKey();
        }
    }, [key]);

    return {
        metadata,
        loading,
        error,
        refetch: fetchMetadataByKey,
    };
};

// Hook for metadata filters
export const useMetadataFilters = () => {
    const [filters, setFilters] = useState<MediaMetadataQuery>({});
    const [metadata, setMetadata] = useState<MediaMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyFilters = async (newFilters: MediaMetadataQuery) => {
        try {
            setLoading(true);
            setError(null);
            setFilters(newFilters);
            const response = await mediaMetadataApi.getMediaMetadata(newFilters);
            setMetadata(response.data);
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
        metadata,
        loading,
        error,
        applyFilters,
        clearFilters,
    };
};
