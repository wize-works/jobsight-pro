
"use server";

import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";
import { openai, AI_MODELS } from "@/lib/ai/client";
import { createDailyLog } from "./daily-logs";
import { getProjects } from "./projects";
import { DailyLogInsert } from "@/types/daily-logs";

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

export async function processAIQuery(
    message: string,
    conversationHistory: ConversationMessage[] = []
): Promise<AIQueryResult> {
    try {
        const { business, userId } = await ensureBusinessOrRedirect();

        // Get context data
        const projects = await getProjects();

        // Build system prompt with context
        const systemPrompt = `You are a helpful construction project management assistant for ${business.name}. 

Your capabilities:
1. Answer questions about projects, daily logs, tasks, and schedules
2. Create daily logs when users provide work summaries
3. Help with project management tasks

Available projects: ${projects.map(p => p.name).join(', ')}

When a user wants to create a daily log, respond with action: "create_daily_log" and include the structured data.
When answering questions, provide helpful responses based on the context.

Current conversation context: The user has been talking about construction work and project management.`;

        // Build messages array
        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-5), // Last 5 messages for context
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT,
            messages: messages as any,
            temperature: 0.3,
            max_tokens: 1000,
        });

        const aiResponse = completion.choices[0]?.message?.content;

        if (!aiResponse) {
            return {
                response: "I'm sorry, I couldn't process your request at the moment.",
                action: "none"
            };
        }

        // Check if this is a daily log creation request
        if (message.toLowerCase().includes('daily log') ||
            message.toLowerCase().includes('work today') ||
            message.toLowerCase().includes('completed today')) {

            // Try to extract project and work details
            const projectMatch = projects.find(p =>
                message.toLowerCase().includes(p.name.toLowerCase()) ||
                message.toLowerCase().includes(p.name.toLowerCase().replace(/\s+/g, ''))
            );

            if (projectMatch) {
                return {
                    response: "I'm creating a daily log for this work. Let me structure your information...",
                    action: "create_daily_log",
                    data: {
                        projectId: projectMatch.id,
                        projectName: projectMatch.name,
                        workSummary: message,
                        userId
                    }
                };
            } else {
                return {
                    response: `I'd like to help you create a daily log, but I couldn't identify which project you're referring to. Available projects: ${projects.map(p => p.name).join(', ')}. Could you specify the project name?`,
                    action: "clarify_project"
                };
            }
        }

        // Try to parse as JSON for structured responses
        try {
            const parsedResponse = JSON.parse(aiResponse);
            return parsedResponse;
        } catch {
            // If not JSON, return as plain response
            return {
                response: aiResponse,
                action: "none"
            };
        }

    } catch (error) {
        console.error("AI query error:", error);
        return {
            response: "I encountered an error processing your request. Please try again.",
            action: "error"
        };
    }
}

export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; error?: string }> {
    try {
        const { business } = await ensureBusinessOrRedirect();

        // Convert blob to file
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('model', AI_MODELS.TRANSCRIPTION);

        const response = await openai.audio.transcriptions.create({
            file: audioBlob as any,
            model: AI_MODELS.TRANSCRIPTION,
        });

        return { text: response.text };
    } catch (error) {
        console.error("Transcription error:", error);
        return {
            text: "",
            error: "Failed to transcribe audio. Please try again."
        };
    }
}

export async function createDailyLogFromAI(data: {
    projectId: string;
    projectName: string;
    workSummary: string;
    userId: string;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
        const { business } = await ensureBusinessOrRedirect();

        // Enhance the work summary using AI
        const enhancementPrompt = `Take this brief work summary and structure it into proper daily log format:

"${data.workSummary}"

Extract and organize into:
- Work completed (bullet points)
- Materials used (if mentioned)
- Safety notes (if mentioned)
- Issues or delays (if mentioned)
- Weather conditions (if mentioned)

Keep the tone professional but preserve the original meaning. If information is missing, don't make it up.`;

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT,
            messages: [
                { role: "system", content: "You are a construction daily log assistant. Structure work summaries into organized daily logs." },
                { role: "user", content: enhancementPrompt }
            ],
            temperature: 0.2,
            max_tokens: 500,
        });

        const enhancedSummary = completion.choices[0]?.message?.content || data.workSummary;

        // Create the daily log using existing action
        const result = await createDailyLog({
            project_id: data.projectId,
            crew_id: "", // enhance with AI if mentioned
            date: new Date().toISOString().split('T')[0],
            work_completed: enhancedSummary,
            work_planned: "", // enhance with ai
            start_time: "", // if provided, enhance with AI
            end_time: "", // if provided, enhance with AI
            hours_worked: 0, // calculate based on start and end time if provided or get value if available 
            overtime: 0, // calculate based on hours worked if provided or get value if available
            weather: "", // enhance with AI if mentioned
            safety: "", // enhance with AI if mentioned
            quality: "", // enhance with AI if mentioned
            delays: "", // enhance with AI if mentioned
            notes: `Created via AI Assistant from: "${data.workSummary}"`,
            author_id: data.userId,
            created_by: data.userId,
            updated_by: data.userId,
            business_id: business.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as DailyLogInsert);

        if (result && result.id) {
            return {
                success: true,
                logId: result.id
            };
        } else {
            return {
                success: false,
                error: "Failed to create daily log"
            };
        }

    } catch (error) {
        console.error("Error creating AI daily log:", error);
        return {
            success: false,
            error: "Failed to create daily log"
        };
    }
}
