import { useState, useEffect } from 'react';
import { mediaApi, Media, MediaQuery, CreateMediaData, UpdateMediaData } from '@/lib/api/media';

// Hook for fetching media
export const useMedia = (query?: MediaQuery) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.getMedia(query);
            setMedia(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, [JSON.stringify(query)]);

    return {
        media,
        loading,
        error,
        count,
        refetch: fetchMedia,
    };
};

// Hook for creating media
export const useCreateMedia = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createMedia = async (data: CreateMediaData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.createMedia(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create media');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createMedia,
        loading,
        error,
    };
};

// Hook for updating media
export const useUpdateMedia = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateMedia = async (id: string, data: UpdateMediaData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.updateMedia(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update media');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateMedia,
        loading,
        error,
    };
};

// Hook for deleting media
export const useDeleteMedia = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteMedia = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await mediaApi.deleteMedia(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete media');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        deleteMedia,
        loading,
        error,
    };
};

// Hook for media mutations (create, update, delete)
export const useMediaMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createMedia = async (data: CreateMediaData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.createMedia(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create media');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateMedia = async (id: string, data: UpdateMediaData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.updateMedia(id, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update media');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteMedia = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await mediaApi.deleteMedia(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete media');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createMedia,
        updateMedia,
        deleteMedia,
        loading,
        error,
    };
};

// Hook for media by ID
export const useMediaById = (id: string) => {
    const [media, setMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await mediaApi.getMediaById(id);
            setMedia(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchMedia();
        }
    }, [id]);

    return {
        media,
        loading,
        error,
        refetch: fetchMedia,
    };
};

// Hook for media by type
export const useMediaByType = (type: string) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMediaByType = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.getMediaByType(type);
            setMedia(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch media by type');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (type) {
            fetchMediaByType();
        }
    }, [type]);

    return {
        media,
        loading,
        error,
        refetch: fetchMediaByType,
    };
};

// Hook for media by equipment
export const useMediaByEquipment = (equipmentId: string) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMediaByEquipment = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.getMediaByEquipment(equipmentId);
            setMedia(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch equipment media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (equipmentId) {
            fetchMediaByEquipment();
        }
    }, [equipmentId]);

    return {
        media,
        loading,
        error,
        refetch: fetchMediaByEquipment,
    };
};

// Hook for media by project
export const useMediaByProject = (projectId: string) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMediaByProject = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.getMediaByProject(projectId);
            setMedia(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch project media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchMediaByProject();
        }
    }, [projectId]);

    return {
        media,
        loading,
        error,
        refetch: fetchMediaByProject,
    };
};

// Hook for media by client
export const useMediaByClient = (clientId: string) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMediaByClient = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.getMediaByClient(clientId);
            setMedia(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch client media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchMediaByClient();
        }
    }, [clientId]);

    return {
        media,
        loading,
        error,
        refetch: fetchMediaByClient,
    };
};

// Hook for media by daily log
export const useMediaByDailyLog = (dailyLogId: string) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMediaByDailyLog = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.getMediaByDailyLog(dailyLogId);
            setMedia(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch daily log media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dailyLogId) {
            fetchMediaByDailyLog();
        }
    }, [dailyLogId]);

    return {
        media,
        loading,
        error,
        refetch: fetchMediaByDailyLog,
    };
};

// Hook for searching media
export const useMediaSearch = () => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchMedia = async (query: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await mediaApi.searchMedia(query);
            setMedia(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search media');
        } finally {
            setLoading(false);
        }
    };

    return {
        media,
        loading,
        error,
        searchMedia,
    };
};

// Hook for media filters
export const useMediaFilters = () => {
    const [filters, setFilters] = useState<MediaQuery>({});
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyFilters = async (newFilters: MediaQuery) => {
        try {
            setLoading(true);
            setError(null);
            setFilters(newFilters);
            const response = await mediaApi.getMedia(newFilters);
            setMedia(response.data);
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
        media,
        loading,
        error,
        applyFilters,
        clearFilters,
    };
};
