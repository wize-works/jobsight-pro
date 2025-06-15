
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

        // Enhanced AI prompt to extract all available information
        const enhancementPrompt = `Analyze this construction work summary and extract ALL available information into a structured format:

"${data.workSummary}"

Return a JSON object with the following fields (use null for missing information, don't make up data):

{
  "work_completed": "Brief summary of work done",
  "work_planned": "Work planned for tomorrow/next day if mentioned",
  "start_time": "Start time in HH:MM format if mentioned",
  "end_time": "End time in HH:MM format if mentioned", 
  "hours_worked": number (calculate from start/end time or extract if mentioned),
  "overtime": number (overtime hours if mentioned),
  "weather": "Weather conditions if mentioned",
  "safety": "Safety notes, incidents, or observations",
  "quality": "Quality notes or inspections mentioned",
  "delays": "Any delays, issues, or problems mentioned",
  "crew_info": "Crew name, size, or members if mentioned",
  "materials": ["array", "of", "materials", "mentioned"],
  "equipment": ["array", "of", "equipment", "used"]
}

Only include information that is actually present in the input. Be precise and factual.`;

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT,
            messages: [
                { role: "system", content: "You are a construction daily log assistant. Extract structured data from work summaries. Return only valid JSON." },
                { role: "user", content: enhancementPrompt }
            ],
            temperature: 0.1,
            max_tokens: 800,
        });

        let extractedData;
        try {
            const aiResponse = completion.choices[0]?.message?.content?.trim();
            extractedData = JSON.parse(aiResponse || "{}");
        } catch (error) {
            console.error("Failed to parse AI response as JSON:", error);
            extractedData = { work_completed: data.workSummary };
        }

        // Calculate hours worked if start and end times are provided
        let hoursWorked = extractedData.hours_worked || 0;
        if (extractedData.start_time && extractedData.end_time && !hoursWorked) {
            try {
                const start = new Date(`2024-01-01 ${extractedData.start_time}`);
                const end = new Date(`2024-01-01 ${extractedData.end_time}`);
                hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            } catch (error) {
                console.error("Error calculating hours worked:", error);
            }
        }

        // Calculate overtime (anything over 8 hours)
        let overtime = extractedData.overtime || 0;
        if (hoursWorked > 8 && !overtime) {
            overtime = hoursWorked - 8;
        }

        // Create the daily log using existing action with enhanced data
        const result = await createDailyLog({
            project_id: data.projectId,
            crew_id: "", // TODO: Match crew_info to actual crew IDs from database
            date: new Date().toISOString().split('T')[0],
            work_completed: extractedData.work_completed || data.workSummary,
            work_planned: extractedData.work_planned || "",
            start_time: extractedData.start_time || "",
            end_time: extractedData.end_time || "",
            hours_worked: hoursWorked,
            overtime: overtime,
            weather: extractedData.weather || "",
            safety: extractedData.safety || "",
            quality: extractedData.quality || "",
            delays: extractedData.delays || "",
            notes: `Created via AI Assistant from: "${data.workSummary}"${extractedData.materials?.length ? `\n\nMaterials mentioned: ${extractedData.materials.join(', ')}` : ''}${extractedData.equipment?.length ? `\n\nEquipment mentioned: ${extractedData.equipment.join(', ')}` : ''}${extractedData.crew_info ? `\n\nCrew info: ${extractedData.crew_info}` : ''}`,
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
