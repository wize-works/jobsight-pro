import { useState, useEffect, useCallback } from "react";
import { DailyLogAPI, handleApiError } from "@/lib/api/daily-logs";
import { DailyLog, DailyLogInsert, DailyLogUpdate, DailyLogWithDetails } from "@/types/daily-logs";
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { DailyLogEquipment, DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";

export interface DailyLogSearchParams {
    include?: string;
    search?: string;
    project_id?: string;
    crew_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

// Main Daily Logs Hook
export function useDailyLogs() {
    const [dailyLogs, setDailyLogs] = useState<DailyLogWithDetails[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDailyLogs = useCallback(async (params?: DailyLogSearchParams) => {
        setLoading(true);
        setError(null);

        try {
            const result = await DailyLogAPI.getDailyLogs(params);

            if (result.data) {
                setDailyLogs(result.data as DailyLogWithDetails[]);
                // Handle stats if available in response
                setStats(result.pagination || null);
            } else {
                setDailyLogs([]);
            }
        } catch (err) {
            setError(handleApiError(err));
            setDailyLogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const getDailyLog = useCallback(async (id: string, include?: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await DailyLogAPI.getDailyLog(id, include);
            return result;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createDailyLog = useCallback(async (dailyLogData: DailyLogInsert) => {
        setLoading(true);
        setError(null);

        try {
            const result = await DailyLogAPI.createDailyLog(dailyLogData);

            // Add to local state
            if (result) {
                setDailyLogs(prev => [result as DailyLogWithDetails, ...prev]);
            }

            return result;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateDailyLog = useCallback(async (id: string, dailyLogData: DailyLogUpdate) => {
        setLoading(true);
        setError(null);

        try {
            const result = await DailyLogAPI.updateDailyLog(id, dailyLogData);

            // Update local state
            if (result) {
                setDailyLogs(prev => prev.map(log =>
                    log.id === id ? { ...log, ...result } : log
                ));
            }

            return result;
        } catch (err) {
            setError(handleApiError(err));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteDailyLog = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            await DailyLogAPI.deleteDailyLog(id);

            // Remove from local state
            setDailyLogs(prev => prev.filter(log => log.id !== id));

            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshDailyLogs = useCallback((params?: DailyLogSearchParams) => {
        fetchDailyLogs(params);
    }, [fetchDailyLogs]);

    const getDailyLogWithDetails = useCallback(async (id: string): Promise<DailyLogWithDetails | null> => {
        try {
            return await DailyLogAPI.getDailyLogWithDetails(id);
        } catch (err) {
            setError(handleApiError(err));
            return null;
        }
    }, []);

    return {
        dailyLogs,
        stats,
        loading,
        error,
        fetchDailyLogs,
        getDailyLog,
        getDailyLogWithDetails,
        createDailyLog,
        updateDailyLog,
        deleteDailyLog,
        refreshDailyLogs,
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
            const result = await DailyLogAPI.getDailyLog(id, include);
            setDailyLog(result);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const updateDailyLog = async (data: DailyLogUpdate): Promise<DailyLog | null> => {
        if (!id) return null;

        try {
            const result = await DailyLogAPI.updateDailyLog(id, data);
            setDailyLog(result);
            return result;
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
