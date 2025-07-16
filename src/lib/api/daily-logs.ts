import { DailyLog, DailyLogInsert, DailyLogUpdate } from "@/types/daily-logs";
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { DailyLogEquipment, DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";

// Base API URL
const API_BASE = "/api/daily-logs";

// API Response types
export interface ApiResponse<T> {
    data: T;
    pagination?: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface ApiError {
    error: string;
    details?: any;
}

// Daily Log API Client
export class DailyLogAPI {

    // Daily Logs
    static async getDailyLogs(params?: {
        include?: string;
        search?: string;
        project_id?: string;
        crew_id?: string;
        date_from?: string;
        date_to?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<DailyLog[]>> {
        const url = new URL(API_BASE, window.location.origin);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch daily logs: ${response.statusText}`);
        }

        return response.json();
    }

    static async createDailyLog(data: DailyLogInsert): Promise<ApiResponse<DailyLog>> {
        const response = await fetch(API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create daily log: ${response.statusText}`);
        }

        return response.json();
    }

    static async getDailyLog(id: string, include?: string): Promise<ApiResponse<DailyLog>> {
        const url = new URL(`${API_BASE}/${id}`, window.location.origin);

        if (include) {
            url.searchParams.append("include", include);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch daily log: ${response.statusText}`);
        }

        return response.json();
    }

    static async updateDailyLog(id: string, data: DailyLogUpdate): Promise<ApiResponse<DailyLog>> {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update daily log: ${response.statusText}`);
        }

        return response.json();
    }

    static async deleteDailyLog(id: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Failed to delete daily log: ${response.statusText}`);
        }

        return response.json();
    }

    // Materials
    static async getMaterials(dailyLogId: string, params?: {
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<DailyLogMaterial[]>> {
        const url = new URL(`${API_BASE}/${dailyLogId}/materials`, window.location.origin);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch materials: ${response.statusText}`);
        }

        return response.json();
    }

    static async createMaterial(dailyLogId: string, data: DailyLogMaterialInsert): Promise<ApiResponse<DailyLogMaterial>> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/materials`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create material: ${response.statusText}`);
        }

        return response.json();
    }

    static async getMaterial(dailyLogId: string, materialId: string): Promise<ApiResponse<DailyLogMaterial>> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/materials/${materialId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch material: ${response.statusText}`);
        }

        return response.json();
    }

    static async updateMaterial(dailyLogId: string, materialId: string, data: DailyLogMaterialUpdate): Promise<ApiResponse<DailyLogMaterial>> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/materials/${materialId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update material: ${response.statusText}`);
        }

        return response.json();
    }

    static async deleteMaterial(dailyLogId: string, materialId: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/materials/${materialId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Failed to delete material: ${response.statusText}`);
        }

        return response.json();
    }

    // Equipment
    static async getEquipment(dailyLogId: string, params?: {
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<DailyLogEquipment[]>> {
        const url = new URL(`${API_BASE}/${dailyLogId}/equipment`, window.location.origin);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch equipment: ${response.statusText}`);
        }

        return response.json();
    }

    static async createEquipment(dailyLogId: string, data: DailyLogEquipmentInsert): Promise<ApiResponse<DailyLogEquipment>> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/equipment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create equipment: ${response.statusText}`);
        }

        return response.json();
    }

    static async getEquipmentItem(dailyLogId: string, equipmentId: string): Promise<ApiResponse<DailyLogEquipment>> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/equipment/${equipmentId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch equipment: ${response.statusText}`);
        }

        return response.json();
    }

    static async updateEquipment(dailyLogId: string, equipmentId: string, data: DailyLogEquipmentUpdate): Promise<ApiResponse<DailyLogEquipment>> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/equipment/${equipmentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update equipment: ${response.statusText}`);
        }

        return response.json();
    }

    static async deleteEquipment(dailyLogId: string, equipmentId: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/${dailyLogId}/equipment/${equipmentId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Failed to delete equipment: ${response.statusText}`);
        }

        return response.json();
    }

    // Utility methods
    static async getDailyLogWithAll(id: string): Promise<ApiResponse<DailyLog>> {
        return this.getDailyLog(id, "project,crew,materials,equipment,media");
    }

    static async getDailyLogsWithProjects(params?: {
        search?: string;
        project_id?: string;
        crew_id?: string;
        date_from?: string;
        date_to?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<DailyLog[]>> {
        return this.getDailyLogs({
            ...params,
            include: "project,crew",
        });
    }

    static async getDailyLogsStats(params?: {
        project_id?: string;
        crew_id?: string;
        date_from?: string;
        date_to?: string;
    }): Promise<ApiResponse<DailyLog[]>> {
        return this.getDailyLogs({
            ...params,
            include: "project,crew,materials,equipment",
        });
    }
}

// Helper function for error handling
export function handleApiError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "An unknown error occurred";
}
