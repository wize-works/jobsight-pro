import { createServerClient } from '@/lib/supabase';
import { openai, AI_MODELS } from "@/lib/ai/client";
import { fetchByBusiness, fetchByBusinessWithQuery } from "@/lib/db";

/**
 * Server-side utility to get AI usage data
 * Replaces server action for API route usage
 */
export async function getAIUsageDataServer(businessId: string): Promise<{
    success: boolean;
    data?: {
        currentUsage: number;
        limit: number;
        percentageUsed: number;
        canUseAI: boolean;
        remainingTokens: number;
    };
    error?: string;
}> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error('Failed to create Supabase client');
        }

        // Get business subscription info from business_subscriptions table
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select(`
                id,
                business_subscriptions!inner(
                    plan_id,
                    status
                )
            `)
            .eq('id', businessId)
            .single();

        if (businessError) {
            console.error('Error fetching business:', businessError);
            return { success: false, error: 'Failed to fetch business data' };
        }

        // Extract subscription data
        const subscription = business?.business_subscriptions?.[0];
        const subscriptionPlan = subscription?.plan_id || 'free';
        const subscriptionStatus = subscription?.status || 'inactive';

        // Get AI usage for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: aiUsage, error: usageError } = await supabase
            .from('ai_logs')
            .select('tokens_prompt, tokens_completion')
            .eq('business_id', businessId)
            .gte('created_at', startOfMonth.toISOString());

        if (usageError) {
            console.error('Error fetching AI usage:', usageError);
            return { success: false, error: 'Failed to fetch AI usage data' };
        }

        // Calculate totals using prompt + completion tokens
        const currentUsage = aiUsage?.reduce((sum, log) => {
            const promptTokens = log.tokens_prompt || 0;
            const completionTokens = log.tokens_completion || 0;
            return sum + promptTokens + completionTokens;
        }, 0) || 0;

        // Set limits based on subscription plan
        let limit = 0;
        switch (subscriptionPlan) {
            case 'starter':
                limit = 10000;
                break;
            case 'professional':
            case 'pro':
                limit = 50000;
                break;
            case 'enterprise':
            case 'business':
                limit = 200000;
                break;
            default:
                limit = 1000; // Free tier
        }

        const percentageUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;
        const canUseAI = subscriptionStatus === 'active' && currentUsage < limit;
        const remainingTokens = Math.max(0, limit - currentUsage);

        return {
            success: true,
            data: {
                currentUsage,
                limit,
                percentageUsed,
                canUseAI,
                remainingTokens
            }
        };

    } catch (error) {
        console.error('Error in getAIUsageDataServer:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Server-side utility to process AI queries
 * Replaces server action for API route usage
 */
export async function processAIQueryServer(
    businessId: string,
    query: string,
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{
    response: string;
    action?: string;
    data?: any;
    path?: string;
}> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error('Failed to create Supabase client');
        }

        // Check if AI is available for this business
        const usageResult = await getAIUsageDataServer(businessId);
        if (!usageResult.success || !usageResult.data?.canUseAI) {
            throw new Error('AI usage limit exceeded or subscription inactive');
        }

        // Get AI context data
        const contextData = await getAIContextDataServer(businessId);

        // Prepare conversation messages
        const messages = [
            {
                role: "system" as const,
                content: `You are JobSight AI, an intelligent assistant for construction project management. 
                
Current context:
- Business ID: ${businessId}
- Projects: ${contextData.projects?.length || 0}
- Active tasks: ${contextData.tasks?.filter((t: any) => t.status !== 'completed').length || 0}
- Recent daily logs: ${contextData.dailyLogs?.length || 0}

You can help with:
- Creating and managing projects, tasks, and daily logs
- Analyzing project progress and costs
- Providing construction industry insights
- Answering questions about the current data

Context data: ${JSON.stringify(contextData, null, 2)}`
            },
            ...(conversationHistory || []),
            { role: "user" as const, content: query }
        ];

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT_GPT_4O_MINI,
            messages,
            max_tokens: 1000,
            temperature: 0.7
        });

        const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";

        // Log usage to ai_logs table
        const promptTokens = completion.usage?.prompt_tokens || 0;
        const completionTokens = completion.usage?.completion_tokens || 0;

        await supabase
            .from('ai_logs')
            .insert({
                business_id: businessId,
                user_id: null, // Will be set by the calling API if needed
                object_type: 'ai_query',
                object_id: null,
                action: 'chat_completion',
                input: query,
                output: response,
                tokens_prompt: promptTokens,
                tokens_completion: completionTokens,
                model: AI_MODELS.CHAT_GPT_4O_MINI
            });

        return {
            response,
            action: undefined,
            data: undefined,
            path: undefined
        };

    } catch (error) {
        console.error('Error in processAIQueryServer:', error);
        return {
            response: "I'm experiencing technical difficulties. Please try again later.",
            action: undefined,
            data: undefined,
            path: undefined
        };
    }
}

/**
 * Server-side utility to transcribe audio
 * Replaces server action for API route usage
 */
export async function transcribeAudioServer(audioBuffer: Buffer): Promise<{ text: string; error?: string }> {
    try {
        // Create a temporary file from buffer
        const tempFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

        const transcription = await openai.audio.transcriptions.create({
            file: tempFile,
            model: "whisper-1",
            language: "en"
        });

        return { text: transcription.text };

    } catch (error) {
        console.error('Error transcribing audio:', error);
        return {
            text: '',
            error: error instanceof Error ? error.message : 'Transcription failed'
        };
    }
}

/**
 * Server-side utility to get AI context data
 * Replaces server action for API route usage
 */
async function getAIContextDataServer(businessId: string) {
    try {
        // Get projects with enhanced relational data
        const { data: projects } = await fetchByBusinessWithQuery(businessId, {
            from: "projects",
            select: ["id", "name", "status", "client_id", "manager_id", "location", "description", "budget", "start_date", "end_date", "progress"],
            joins: [
                {
                    table: "clients",
                    select: ["id", "name", "type", "industry"],
                    alias: "clients"
                }
            ],
            orderBy: { column: "updated_at", ascending: false }
        });

        // Get recent tasks
        const { data: tasks } = await fetchByBusiness("tasks", businessId, ["id", "name", "status", "project_id", "priority", "start_date", "end_date"], {
            limit: 50,
            orderBy: { column: "updated_at", ascending: false }
        });

        // Get recent daily logs
        const { data: dailyLogs } = await fetchByBusiness("daily_logs", businessId, ["id", "project_id", "date", "hours_worked", "notes"], {
            limit: 20,
            orderBy: { column: "date", ascending: false }
        });

        // Get crews
        const { data: crews } = await fetchByBusiness("crews", businessId, ["id", "name", "status", "notes"]);

        return {
            projects: projects || [],
            tasks: tasks || [],
            dailyLogs: dailyLogs || [],
            crews: crews || []
        };

    } catch (error) {
        console.error('Error getting AI context data:', error);
        return {
            projects: [],
            tasks: [],
            dailyLogs: [],
            crews: []
        };
    }
}
