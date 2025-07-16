import { useState, useEffect } from "react";
import { DailyLogAPI, handleApiError } from "@/lib/api/daily-logs";
import { DailyLog, DailyLogInsert, DailyLogUpdate } from "@/types/daily-logs";
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { DailyLogEquipment, DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";

// Daily Logs Hook
export function useDailyLogs(params?: {
    include?: string;
    search?: string;
    project_id?: string;
    crew_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}) {
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        limit: params?.limit || 50,
        offset: params?.offset || 0,
        hasMore: false,
    });

    const fetchDailyLogs = async (refresh = false) => {
        setLoading(true);
        setError(null);

        try {
            const response = await DailyLogAPI.getDailyLogs({
                ...params,
                offset: refresh ? 0 : pagination.offset,
            });

            if (refresh) {
                setDailyLogs(response.data);
            } else {
                setDailyLogs(prev => [...prev, ...response.data]);
            }

            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const createDailyLog = async (data: DailyLogInsert): Promise<DailyLog | null> => {
        try {
            const response = await DailyLogAPI.createDailyLog(data);
            setDailyLogs(prev => [response.data, ...prev]);
            return response.data;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    };

    const updateDailyLog = async (id: string, data: DailyLogUpdate): Promise<DailyLog | null> => {
        try {
            const response = await DailyLogAPI.updateDailyLog(id, data);
            setDailyLogs(prev => prev.map(log => log.id === id ? response.data : log));
            return response.data;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    };

    const deleteDailyLog = async (id: string): Promise<boolean> => {
        try {
            await DailyLogAPI.deleteDailyLog(id);
            setDailyLogs(prev => prev.filter(log => log.id !== id));
            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        }
    };

    const loadMore = () => {
        if (!loading && pagination.hasMore) {
            setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
            fetchDailyLogs(false);
        }
    };

    const refresh = () => {
        setPagination(prev => ({ ...prev, offset: 0 }));
        fetchDailyLogs(true);
    };

    useEffect(() => {
        fetchDailyLogs(true);
    }, [params?.search, params?.project_id, params?.crew_id, params?.date_from, params?.date_to]);

    return {
        dailyLogs,
        loading,
        error,
        pagination,
        createDailyLog,
        updateDailyLog,
        deleteDailyLog,
        loadMore,
        refresh,
    };
}

// Daily Log Materials Hook
export function useDailyLogMaterials(dailyLogId: string, params?: {
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const [materials, setMaterials] = useState<DailyLogMaterial[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMaterials = async () => {
        if (!dailyLogId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await DailyLogAPI.getMaterials(dailyLogId, params);
            setMaterials(response.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const createMaterial = async (data: DailyLogMaterialInsert): Promise<DailyLogMaterial | null> => {
        try {
            const response = await DailyLogAPI.createMaterial(dailyLogId, data);
            setMaterials(prev => [response.data, ...prev]);
            return response.data;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    };

    const updateMaterial = async (materialId: string, data: DailyLogMaterialUpdate): Promise<DailyLogMaterial | null> => {
        try {
            const response = await DailyLogAPI.updateMaterial(dailyLogId, materialId, data);
            setMaterials(prev => prev.map(material => material.id === materialId ? response.data : material));
            return response.data;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    };

    const deleteMaterial = async (materialId: string): Promise<boolean> => {
        try {
            await DailyLogAPI.deleteMaterial(dailyLogId, materialId);
            setMaterials(prev => prev.filter(material => material.id !== materialId));
            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [dailyLogId, params?.search]);

    return {
        materials,
        loading,
        error,
        createMaterial,
        updateMaterial,
        deleteMaterial,
        refresh: fetchMaterials,
    };
}

// Daily Log Equipment Hook
export function useDailyLogEquipment(dailyLogId: string, params?: {
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const [equipment, setEquipment] = useState<DailyLogEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEquipment = async () => {
        if (!dailyLogId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await DailyLogAPI.getEquipment(dailyLogId, params);
            setEquipment(response.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const createEquipment = async (data: DailyLogEquipmentInsert): Promise<DailyLogEquipment | null> => {
        try {
            const response = await DailyLogAPI.createEquipment(dailyLogId, data);
            setEquipment(prev => [response.data, ...prev]);
            return response.data;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    };

    const updateEquipment = async (equipmentId: string, data: DailyLogEquipmentUpdate): Promise<DailyLogEquipment | null> => {
        try {
            const response = await DailyLogAPI.updateEquipment(dailyLogId, equipmentId, data);
            setEquipment(prev => prev.map(eq => eq.id === equipmentId ? response.data : eq));
            return response.data;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    };

    const deleteEquipment = async (equipmentId: string): Promise<boolean> => {
        try {
            await DailyLogAPI.deleteEquipment(dailyLogId, equipmentId);
            setEquipment(prev => prev.filter(eq => eq.id !== equipmentId));
            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, [dailyLogId, params?.search]);

    return {
        equipment,
        loading,
        error,
        createEquipment,
        updateEquipment,
        deleteEquipment,
        refresh: fetchEquipment,
    };
}

// Individual Daily Log Hook
export function useDailyLog(id: string | null, include?: string) {
    const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDailyLog = async () => {
        if (!id) return;

        setLoading(true);
        setError(null);

        try {
            const response = await DailyLogAPI.getDailyLog(id, include);
            setDailyLog(response.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const updateDailyLog = async (data: DailyLogUpdate): Promise<DailyLog | null> => {
        if (!id) return null;

        try {
            const response = await DailyLogAPI.updateDailyLog(id, data);
            setDailyLog(response.data);
            return response.data;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    };

    const deleteDailyLog = async (): Promise<boolean> => {
        if (!id) return false;

        try {
            await DailyLogAPI.deleteDailyLog(id);
            setDailyLog(null);
            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        }
    };

    useEffect(() => {
        fetchDailyLog();
    }, [id, include]);

    return {
        dailyLog,
        loading,
        error,
        updateDailyLog,
        deleteDailyLog,
        refresh: fetchDailyLog,
    };
}
