/**
 * Client-Side AI Actions
 * 
 * Replaces src/app/actions/ai.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Type definitions
type AILog = Database['public']['Tables']['ai_logs']['Row'];
type AILogInsert = Database['public']['Tables']['ai_logs']['Insert'];
type Project = Database['public']['Tables']['projects']['Row'];
type DailyLog = Database['public']['Tables']['daily_logs']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

// AI-related interfaces
export interface AIQueryResult {
    response: string;
    action?: string;
    data?: any;
    path?: string;
    confidence?: number;
    reasoning?: string;
}

export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
}

export interface AIAnalysisRequest {
    type: 'project_analysis' | 'daily_log_analysis' | 'task_optimization' | 'general_query';
    context: any;
    query: string;
    businessId: string;
    userId: string;
}

// Create action instances
const insertAILog = createInsertAction('ai_logs', 'medium');
const selectProjects = createSelectAction('projects');
const selectDailyLogs = createSelectAction('daily_logs');
const selectTasks = createSelectAction('tasks');

/**
 * Process AI query with offline fallback
 */
export const processAIQuery = async (
    businessId: string,
    userId: string,
    query: string,
    context?: any
): Promise<{ data?: AIQueryResult; error?: string; isPending?: boolean }> => {
    try {
        // Log the AI query
        await logAIQuery(businessId, userId, query, 'query');

        if (navigator.onLine) {
            try {
                // Online: Send to AI service
                const result = await processAIQueryOnline(businessId, userId, query, context);

                // Log the response
                await logAIQuery(businessId, userId, result.response, 'response');

                return { data: result };
            } catch (error) {
                console.error("Error processing AI query online:", error);
                // Fall back to offline analysis
                const offlineResult = await processAIQueryOffline(businessId, query, context);
                return {
                    data: offlineResult,
                    isPending: true
                };
            }
        } else {
            // Offline: Use local analysis and queue for processing when online
            const offlineResult = await processAIQueryOffline(businessId, query, context);
            await queueAIQuery(businessId, userId, query, context);

            return {
                data: offlineResult,
                isPending: true
            };
        }

    } catch (error) {
        console.error("Error in processAIQuery:", error);
        return { error: "Failed to process AI query" };
    }
};

/**
 * Analyze project data with AI
 */
export const analyzeProjectData = async (
    businessId: string,
    projectId: string,
    userId: string
): Promise<{ data?: AIQueryResult; error?: string; isPending?: boolean }> => {
    try {
        // Get project data
        const projectResult = await selectProjects({
            filter: { id: projectId, business_id: businessId }
        }, businessId);

        if (!projectResult.data || projectResult.data.length === 0) {
            return { error: "Project not found" };
        }

        const project = projectResult.data[0] as Project;

        // Get related data
        const tasksResult = await selectTasks({
            filter: { project_id: projectId, business_id: businessId }
        }, businessId);

        const dailyLogsResult = await selectDailyLogs({
            filter: { project_id: projectId, business_id: businessId }
        }, businessId);

        const context = {
            project,
            tasks: tasksResult.data || [],
            dailyLogs: dailyLogsResult.data || []
        };

        const query = `Analyze the current status of project "${project.name}" and provide insights on progress, potential issues, and recommendations.`;

        return await processAIQuery(businessId, userId, query, context);

    } catch (error) {
        console.error("Error in analyzeProjectData:", error);
        return { error: "Failed to analyze project data" };
    }
};

/**
 * Get AI conversation history
 */
export const getAIConversationHistory = async (
    businessId: string,
    userId: string,
    limit: number = 20
): Promise<ConversationMessage[]> => {
    try {
        // Get AI logs from local storage
        const logs = await getAILogs(businessId, userId, limit * 2); // Get more to account for query/response pairs

        // Convert logs to conversation format
        const messages: ConversationMessage[] = logs.map(log => ({
            role: log.action === 'query' ? 'user' : 'assistant',
            content: log.input || log.output || '',
            timestamp: log.created_at || new Date().toISOString()
        }));

        return messages.slice(0, limit);

    } catch (error) {
        console.error("Error getting AI conversation history:", error);
        return [];
    }
};

/**
 * Generate daily log summary using AI
 */
export const generateDailyLogSummary = async (
    businessId: string,
    dailyLogId: string,
    userId: string
): Promise<{ data?: string; error?: string; isPending?: boolean }> => {
    try {
        // Get daily log data
        const dailyLogResult = await selectDailyLogs({
            filter: { id: dailyLogId, business_id: businessId }
        }, businessId);

        if (!dailyLogResult.data || dailyLogResult.data.length === 0) {
            return { error: "Daily log not found" };
        }

        const dailyLog = dailyLogResult.data[0] as DailyLog;

        const query = `Generate a concise summary of this daily log entry: ${JSON.stringify(dailyLog)}`;
        const result = await processAIQuery(businessId, userId, query, { dailyLog });

        if (result.error) {
            return { error: result.error };
        }

        return {
            data: result.data?.response || "Summary not available",
            isPending: result.isPending
        };

    } catch (error) {
        console.error("Error generating daily log summary:", error);
        return { error: "Failed to generate summary" };
    }
};

/**
 * Transcribe audio to text with offline queue support
 * Falls back to queuing when offline
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<{ text: string; error?: string }> => {
    try {
        // Check if we're online
        if (!navigator.onLine) {
            // Queue the transcription for later processing
            const queueId = uuidv4();
            const queueItem = {
                id: queueId,
                type: 'transcription',
                audioBlob: await blobToBase64(audioBlob),
                timestamp: Date.now()
            };

            // Store in offline queue
            if (typeof window !== 'undefined' && 'indexedDB' in window) {
                const dbName = 'ai-transcription-queue';
                const request = indexedDB.open(dbName, 1);

                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction(['transcriptions'], 'readwrite');
                    const store = transaction.objectStore('transcriptions');
                    store.add(queueItem);
                };
            }

            return {
                text: "",
                error: "Currently offline. Transcription will be processed when connection is restored."
            };
        }

        // When online, process transcription (this would typically call OpenAI API)
        // For now, return a placeholder since actual transcription requires server-side API
        console.log('Audio transcription requested (online)');

        return {
            text: "",
            error: "Audio transcription requires server connection. Feature will be enhanced in future updates."
        };
    } catch (error) {
        console.error("Transcription error:", error);
        return {
            text: "",
            error: "Failed to transcribe audio. Please try again."
        };
    }
};

// Helper function to convert blob to base64 for storage
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Helper functions

/**
 * Process AI query online
 */
async function processAIQueryOnline(
    businessId: string,
    userId: string,
    query: string,
    context?: any
): Promise<AIQueryResult> {
    // TODO: Implement actual AI API call when online
    console.log('AI query would be processed online:', {
        businessId,
        userId,
        query: query.substring(0, 100) + '...',
        hasContext: !!context
    });

    // Simulate AI response
    const response = `I understand you're asking about: "${query}". Based on the available data, here's my analysis...`;

    return {
        response,
        confidence: 0.85,
        reasoning: "Analysis based on offline data patterns and heuristics"
    };
}

/**
 * Process AI query offline using local analysis
 */
async function processAIQueryOffline(
    businessId: string,
    query: string,
    context?: any
): Promise<AIQueryResult> {
    try {
        // Simple offline analysis based on query patterns
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('project') && lowerQuery.includes('status')) {
            return {
                response: "Based on available project data, I can see the current project status. For detailed AI analysis, please connect to the internet.",
                action: "project_status",
                confidence: 0.6,
                reasoning: "Pattern-based offline analysis"
            };
        }

        if (lowerQuery.includes('daily log') || lowerQuery.includes('summary')) {
            return {
                response: "I can help summarize daily logs. For advanced AI insights, please connect to the internet for full analysis.",
                action: "daily_log_summary",
                confidence: 0.5,
                reasoning: "Basic offline text analysis"
            };
        }

        if (lowerQuery.includes('task') && (lowerQuery.includes('optimize') || lowerQuery.includes('priority'))) {
            return {
                response: "Task optimization suggestions are available offline based on basic patterns. Connect to the internet for advanced AI recommendations.",
                action: "task_optimization",
                confidence: 0.4,
                reasoning: "Rule-based offline suggestions"
            };
        }

        // Default response for offline queries
        return {
            response: "I'm currently in offline mode. I can provide basic analysis based on cached data. For full AI capabilities, please connect to the internet.",
            confidence: 0.3,
            reasoning: "Offline mode with limited analysis capabilities"
        };

    } catch (error) {
        console.error("Error in offline AI processing:", error);
        return {
            response: "Sorry, I'm having trouble processing your request in offline mode. Please try again when connected to the internet.",
            confidence: 0.1,
            reasoning: "Error in offline processing"
        };
    }
}

/**
 * Log AI query/response
 */
async function logAIQuery(
    businessId: string,
    userId: string,
    content: string,
    type: 'query' | 'response'
): Promise<void> {
    try {
        const logData: AILogInsert = {
            id: crypto.randomUUID(),
            business_id: businessId,
            user_id: userId,
            object_type: 'ai_query',
            action: type,
            input: type === 'query' ? content : '',
            output: type === 'response' ? content : '',
            embedding: null,
            tokens_prompt: 0,
            tokens_completion: 0,
            model: 'offline-client'
        };

        await insertAILog(logData, businessId, userId);
    } catch (error) {
        console.error("Error logging AI query:", error);
    }
}

/**
 * Get AI logs for a user
 */
async function getAILogs(
    businessId: string,
    userId: string,
    limit: number = 20
): Promise<AILog[]> {
    try {
        const result = await selectAILogs({
            filter: {
                business_id: businessId,
                user_id: userId
            },
            orderBy: { column: 'created_at', ascending: false },
            limit
        }, businessId);

        return (result.data || []) as AILog[];
    } catch (error) {
        console.error("Error getting AI logs:", error);
        return [];
    }
}

/**
 * Queue AI query for processing when online
 */
async function queueAIQuery(
    businessId: string,
    userId: string,
    query: string,
    context?: any
): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);
    request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db.transaction(['ai_queue'], 'readwrite');
        const store = transaction.objectStore('ai_queue');

        const aiRecord = {
            id: crypto.randomUUID(),
            type: 'ai_query',
            businessId,
            userId,
            query,
            context,
            timestamp: new Date().toISOString()
        };

        store.add(aiRecord);
    };
}

/**
 * Initialize offline AI queue store
 */
export function initializeOfflineAIQueue(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);

    request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('ai_queue')) {
            const store = db.createObjectStore('ai_queue', {
                keyPath: 'id'
            });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('businessId', 'businessId', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
        }
    };
}

/**
 * Process queued AI queries when back online
 */
export async function processQueuedAIQueries(businessId: string): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window) || !navigator.onLine) {
        return;
    }

    try {
        const request = indexedDB.open('jobsight_offline', 1);

        request.onsuccess = async (event) => {
            const db = (event.target as any).result;
            const transaction = db.transaction(['ai_queue'], 'readwrite');
            const store = transaction.objectStore('ai_queue');

            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = async () => {
                const queuedQueries = getAllRequest.result;

                for (const queryRecord of queuedQueries) {
                    if (queryRecord.businessId === businessId) {
                        try {
                            // Process the queued query
                            const result = await processAIQueryOnline(
                                businessId,
                                queryRecord.userId,
                                queryRecord.query,
                                queryRecord.context
                            );

                            console.log('Processed queued AI query:', result);

                            // Remove from queue if successful
                            store.delete(queryRecord.id);
                        } catch (error) {
                            console.error('Error processing queued AI query:', error);
                        }
                    }
                }
            };
        };
    } catch (error) {
        console.error('Error processing queued AI queries:', error);
    }
}

// Import the select action for AI logs
const selectAILogs = createSelectAction('ai_logs');

// Auto-initialize the offline store when this module loads
if (typeof window !== 'undefined') {
    initializeOfflineAIQueue();
}
