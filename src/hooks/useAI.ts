import { useState, useCallback } from 'react';
import { aiApi } from '@/lib/api/ai';

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
}

interface AIQueryResult {
    response: string;
    action?: string;
    data?: any;
    path?: string;
}

interface AIContextData {
    projects: any[];
    clients: any[];
    crews: any[];
    dailyLogs: any[];
    tasks: any[];
    equipment: any[];
    metadata: {
        contextDate: string;
        dataRange: string;
        totalRecords: {
            projects: number;
            clients: number;
            crews: number;
            dailyLogs: number;
            tasks: number;
            equipment: number;
        };
    };
}

interface AIUsageData {
    currentUsage: number;
    limit: number;
    percentageUsed: number;
    canUseAI: boolean;
    remainingTokens: number;
}

interface TranscriptionResult {
    text: string;
    enhanced?: string;
}

interface DailyLogCreationResult {
    logId: string;
}

interface UseAIResult {
    isLoading: boolean;
    error: string | null;

    // Context methods
    getContext: (businessId: string) => Promise<AIContextData>;

    // Query methods
    query: (
        businessId: string,
        message: string,
        conversationHistory?: ConversationMessage[]
    ) => Promise<AIQueryResult>;

    // Transcription methods
    transcribe: (audioFile: File) => Promise<TranscriptionResult>;
    transcribeEnhanced: (
        audioFile: File,
        options?: {
            type?: 'general' | 'task' | 'project' | 'query' | 'note';
            enhance?: boolean;
        }
    ) => Promise<TranscriptionResult>;

    // Daily log methods
    createDailyLog: (
        businessId: string,
        data: {
            projectId: string;
            projectName: string;
            workSummary: string;
        }
    ) => Promise<DailyLogCreationResult>;

    // Usage methods
    getUsage: (businessId: string) => Promise<AIUsageData>;

    // Utility methods
    clearError: () => void;
}

export const useAI = (): UseAIResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleApiCall = useCallback(async <T>(
        apiCall: () => Promise<T>
    ): Promise<T> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await apiCall();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getContext = useCallback(async (businessId: string): Promise<AIContextData> => {
        return handleApiCall(() => aiApi.getContext(businessId));
    }, [handleApiCall]);

    const query = useCallback(async (
        businessId: string,
        message: string,
        conversationHistory: ConversationMessage[] = []
    ): Promise<AIQueryResult> => {
        return handleApiCall(() => aiApi.query(businessId, message, conversationHistory));
    }, [handleApiCall]);

    const transcribe = useCallback(async (audioFile: File): Promise<TranscriptionResult> => {
        return handleApiCall(() => aiApi.transcribe(audioFile));
    }, [handleApiCall]);

    const transcribeEnhanced = useCallback(async (
        audioFile: File,
        options: {
            type?: 'general' | 'task' | 'project' | 'query' | 'note';
            enhance?: boolean;
        } = {}
    ): Promise<TranscriptionResult> => {
        return handleApiCall(() => aiApi.transcribeEnhanced(audioFile, options));
    }, [handleApiCall]);

    const createDailyLog = useCallback(async (
        businessId: string,
        data: {
            projectId: string;
            projectName: string;
            workSummary: string;
        }
    ): Promise<DailyLogCreationResult> => {
        return handleApiCall(() => aiApi.createDailyLog(businessId, data));
    }, [handleApiCall]);

    const getUsage = useCallback(async (businessId: string): Promise<AIUsageData> => {
        return handleApiCall(() => aiApi.getUsage(businessId));
    }, [handleApiCall]);

    return {
        isLoading,
        error,
        getContext,
        query,
        transcribe,
        transcribeEnhanced,
        createDailyLog,
        getUsage,
        clearError,
    };
};
