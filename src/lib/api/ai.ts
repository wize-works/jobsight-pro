interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

interface AIQueryResult {
    response: string;
    action?: string;
    data?: any;
    path?: string;
}

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
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

export const aiApi = {
    /**
     * Get AI context data for a business
     */
    async getContext(businessId: string): Promise<AIContextData> {
        const response = await fetch(`/api/ai/context?businessId=${businessId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch AI context');
        }

        const result: ApiResponse<AIContextData> = await response.json();
        return result.data;
    },

    /**
     * Process an AI query
     */
    async query(
        businessId: string,
        message: string,
        conversationHistory: ConversationMessage[] = []
    ): Promise<AIQueryResult> {
        const response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                message,
                conversationHistory,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to process AI query');
        }

        const result: ApiResponse<AIQueryResult> = await response.json();
        return result.data;
    },

    /**
     * Transcribe audio (basic)
     */
    async transcribe(audioFile: File): Promise<TranscriptionResult> {
        const formData = new FormData();
        formData.append('audio', audioFile);

        const response = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to transcribe audio');
        }

        const result: ApiResponse<TranscriptionResult> = await response.json();
        return result.data;
    },

    /**
     * Transcribe audio with enhancement
     */
    async transcribeEnhanced(
        audioFile: File,
        options: {
            type?: 'general' | 'task' | 'project' | 'query' | 'note';
            enhance?: boolean;
        } = {}
    ): Promise<TranscriptionResult> {
        const formData = new FormData();
        formData.append('audio', audioFile);

        if (options.type) {
            formData.append('type', options.type);
        }

        if (options.enhance) {
            formData.append('enhance', 'true');
        }

        const response = await fetch('/api/ai/transcribe/enhanced', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to transcribe audio');
        }

        const result: ApiResponse<TranscriptionResult> = await response.json();
        return result.data;
    },

    /**
     * Create daily log from AI analysis
     */
    async createDailyLog(
        businessId: string,
        data: {
            projectId: string;
            projectName: string;
            workSummary: string;
        }
    ): Promise<DailyLogCreationResult> {
        const response = await fetch('/api/ai/daily-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                ...data,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create daily log');
        }

        const result: ApiResponse<DailyLogCreationResult> = await response.json();
        return result.data;
    },

    /**
     * Get AI usage data
     */
    async getUsage(businessId: string): Promise<AIUsageData> {
        const response = await fetch(`/api/ai/usage?businessId=${businessId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch AI usage data');
        }

        const result: ApiResponse<AIUsageData> = await response.json();
        return result.data;
    },
};
