"use server";

import { openai, AI_MODELS } from "@/lib/ai/client";
import { createDailyLog } from "./daily-logs";
import { getProjects } from "./projects";
import { getClients } from "./clients";
import { getCrews } from "./crews";
import { DailyLogInsert } from "@/types/daily-logs";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";

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

// Enhanced AI context data function
export const getAIContextData = async (businessId: string) => {
    try {
        // Get projects with enhanced relational data and analytics
        const { data: projects, error: projectsError } = await fetchByBusinessWithQuery(businessId, {
            from: "projects",
            select: ["id", "name", "status", "client_id", "manager_id", "location", "description", "budget", "start_date", "end_date", "progress"],
            joins: [
                {
                    table: "clients",
                    select: ["id", "name", "type", "industry"],
                    alias: "client"
                }
            ],
            aggregates: [
                { function: "count", table: "tasks", alias: "total_tasks" },
                { function: "count", table: "tasks", alias: "active_tasks", where: { status: { neq: "completed" } } },
                { function: "count", table: "tasks", alias: "completed_tasks", where: { status: "completed" } },
                { function: "count", table: "project_issues", alias: "open_issues", where: { status: { neq: "closed" } } },
                { function: "count", table: "daily_logs", alias: "log_count" },
                { function: "sum", table: "daily_logs", alias: "total_hours_logged", column: "hours_worked" },
                { function: "avg", table: "daily_logs", alias: "avg_daily_hours", column: "hours_worked" }
            ],
            orderBy: { column: "updated_at", ascending: false }
        });

        // Get clients with project and financial analytics
        const { data: clients, error: clientsError } = await fetchByBusinessWithQuery(businessId, {
            from: "clients",
            select: ["id", "name", "type", "industry", "contact_email", "phone", "address"],
            aggregates: [
                { function: "count", table: "projects", alias: "total_projects" },
                { function: "count", table: "projects", alias: "active_projects", where: { status: { in: ["active", "planning"] } } },
                { function: "sum", table: "projects", alias: "total_budget", column: "budget" },
                { function: "avg", table: "projects", alias: "avg_project_budget", column: "budget" },
                { function: "sum", table: "invoices", alias: "total_invoiced", column: "amount" },
                { function: "count", table: "invoices", alias: "invoice_count" }
            ],
            orderBy: { column: "name", ascending: true }
        });

        // Get crews with assignment and productivity data
        const { data: crews, error: crewsError } = await fetchByBusinessWithQuery(businessId, {
            from: "crews",
            select: ["id", "name", "type", "size", "status", "location"],
            aggregates: [
                { function: "count", table: "crew_members", alias: "member_count" },
                { function: "count", table: "project_crews", alias: "total_assignments" },
                {
                    function: "count", table: "project_crews", alias: "active_assignments",
                    where: { end_date: { gte: new Date().toISOString() } }
                },
                { function: "sum", table: "daily_logs", alias: "total_hours_worked", column: "hours_worked" },
                { function: "avg", table: "daily_logs", alias: "avg_productivity", column: "hours_worked" },
                { function: "count", table: "daily_logs", alias: "log_entries" }
            ],
            orderBy: { column: "name", ascending: true }
        });

        // Get recent daily logs with rich context (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: dailyLogs, error: dailyLogsError } = await fetchByBusinessWithQuery(businessId, {
            from: "daily_logs",
            select: ["id", "date", "project_id", "crew_id", "work_completed", "work_planned", "hours_worked", "overtime", "weather", "safety", "delays"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status"],
                    alias: "project"
                },
                {
                    table: "crews",
                    select: ["id", "name"],
                    alias: "crew"
                }
            ],
            aggregates: [
                { function: "sum", table: "daily_log_materials", alias: "material_cost", column: "cost" },
                { function: "sum", table: "daily_log_equipment", alias: "equipment_hours", column: "hours_used" }
            ],
            where: { date: { gte: thirtyDaysAgo.toISOString().split('T')[0] } },
            orderBy: { column: "date", ascending: false }
        });

        // Get active/critical tasks with context
        const { data: tasks, error: tasksError } = await fetchByBusinessWithQuery(businessId, {
            from: "tasks",
            select: ["id", "title", "status", "priority", "project_id", "assigned_to", "due_date", "estimated_hours", "actual_hours"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status"],
                    alias: "project"
                },
                {
                    table: "crew_members",
                    select: ["id", "name", "role"],
                    alias: "assignee"
                }
            ],
            aggregates: [
                { function: "count", table: "task_comments", alias: "comment_count" },
                { function: "sum", table: "task_time_logs", alias: "logged_hours", column: "hours" }
            ],
            where: {
                status: { in: ["pending", "in_progress", "blocked"] },
                due_date: { gte: new Date().toISOString().split('T')[0] }
            },
            orderBy: { column: "due_date", ascending: true }
        });

        // Get equipment with utilization and maintenance data
        const { data: equipment, error: equipmentError } = await fetchByBusinessWithQuery(businessId, {
            from: "equipment",
            select: ["id", "name", "type", "model", "status", "location"],
            aggregates: [
                {
                    function: "count", table: "equipment_assignments", alias: "active_assignments",
                    where: { status: "active" }
                },
                { function: "sum", table: "equipment_usage", alias: "total_hours", column: "hours_used" },
                { function: "sum", table: "equipment_maintenance", alias: "maintenance_cost", column: "cost" },
                { function: "max", table: "equipment_usage", alias: "last_used", column: "date" },
                { function: "avg", table: "equipment_usage", alias: "utilization_rate", column: "hours_used" }
            ],
            where: { status: { neq: "retired" } },
            orderBy: { column: "name", ascending: true }
        });

        return {
            projects: projects || [],
            clients: clients || [],
            crews: crews || [],
            dailyLogs: dailyLogs || [],
            tasks: tasks || [],
            equipment: equipment || [],
            metadata: {
                contextDate: new Date().toISOString(),
                dataRange: "30 days for daily logs, all active data for other entities",
                totalRecords: {
                    projects: projects?.length || 0,
                    clients: clients?.length || 0,
                    crews: crews?.length || 0,
                    dailyLogs: dailyLogs?.length || 0,
                    tasks: tasks?.length || 0,
                    equipment: equipment?.length || 0
                }
            },
            errors: {
                projects: projectsError,
                clients: clientsError,
                crews: crewsError,
                dailyLogs: dailyLogsError,
                tasks: tasksError,
                equipment: equipmentError
            }
        };
    } catch (error) {
        console.error("Error fetching AI context data:", error);
        return {
            projects: [],
            clients: [],
            crews: [],
            dailyLogs: [],
            tasks: [],
            equipment: [],
            metadata: {
                contextDate: new Date().toISOString(),
                error: "Failed to fetch comprehensive context"
            },
            errors: { general: error }
        };
    }
};

export async function processAIQuery(
    businessId: string,
    message: string,
    conversationHistory: ConversationMessage[] = []
): Promise<AIQueryResult> {
    try {
        // Get comprehensive context data using the new relational query
        const contextData = await getAIContextData(businessId);
        // Build rich context summary for AI with comprehensive analytics
        const projectSummary = contextData.projects.map(p => {
            const client = p.client?.name || 'Unknown Client';
            const progress = p.progress || 0;
            const activeTasks = p.active_tasks || 0;
            const completedTasks = p.completed_tasks || 0;
            const totalTasks = p.total_tasks || 0;
            const openIssues = p.open_issues || 0;
            const totalHours = p.total_hours_logged || 0;
            const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return `${p.name} (${client}):
  - Progress: ${progress}% complete, Budget: $${p.budget?.toLocaleString() || 'N/A'}
  - Tasks: ${completedTasks}/${totalTasks} completed (${taskCompletion}%), ${activeTasks} active, ${openIssues} issues
  - Work Hours: ${totalHours} total logged, ${Math.round(p.avg_daily_hours || 0)} avg/day
  - Status: ${p.status}, Location: ${p.location || 'Not specified'}`;
        }).join('\n\n');

        const clientSummary = contextData.clients.map(c => {
            const projects = c.total_projects || 0;
            const activeProjects = c.active_projects || 0;
            const totalBudget = c.total_budget || 0;
            const totalInvoiced = c.total_invoiced || 0;
            const avgBudget = c.avg_project_budget || 0;

            return `${c.name} (${c.type || 'Unknown'}, ${c.industry || 'N/A'}):
  - Projects: ${activeProjects}/${projects} active
  - Budget: $${totalBudget.toLocaleString()} total, $${avgBudget.toLocaleString()} avg per project
  - Invoiced: $${totalInvoiced.toLocaleString()} (${projects > 0 ? Math.round((totalInvoiced / totalBudget) * 100) : 0}% of budget)`;
        }).join('\n\n');

        const crewSummary = contextData.crews.map(c => {
            const members = c.member_count || 0;
            const assignments = c.active_assignments || 0;
            const totalHours = c.total_hours_worked || 0;
            const productivity = c.avg_productivity || 0;
            const logEntries = c.log_entries || 0;

            return `${c.name} (${c.type || 'General'}, ${members} members):
  - Active Assignments: ${assignments}, Total Hours: ${totalHours}
  - Productivity: ${Math.round(productivity)} avg hours/day, ${logEntries} log entries
  - Status: ${c.status || 'Active'}, Location: ${c.location || 'Various'}`;
        }).join('\n\n');

        const recentActivity = contextData.dailyLogs.slice(0, 8).map(log => {
            const project = log.project?.name || 'Unknown Project';
            const crew = log.crew?.name || 'Unknown Crew';
            const hours = log.hours_worked || 0;
            const overtime = log.overtime || 0;
            const materialCost = log.material_cost || 0;
            const equipmentHours = log.equipment_hours || 0;

            return `${log.date} - ${project} (${crew}):
  - Work: ${log.work_completed?.substring(0, 120)}${log.work_completed?.length > 120 ? '...' : ''}
  - Hours: ${hours}${overtime > 0 ? ` + ${overtime} OT` : ''}, Equipment: ${equipmentHours}h
  - Weather: ${log.weather || 'N/A'}, Materials: $${materialCost.toLocaleString()}
  ${log.delays ? `- Delays: ${log.delays}` : ''}
  ${log.safety ? `- Safety: ${log.safety}` : ''}`;
        }).join('\n\n');

        const taskSummary = contextData.tasks.slice(0, 10).map(t => {
            const project = t.project?.name || 'Unknown Project';
            const assignee = t.assignee?.name || 'Unassigned';
            const estimated = t.estimated_hours || 0;
            const actual = t.actual_hours || 0;
            const logged = t.logged_hours || 0;
            const comments = t.comment_count || 0;

            return `${t.title} (${t.priority || 'Normal'} priority):
  - Project: ${project}, Assigned: ${assignee}
  - Status: ${t.status}, Due: ${t.due_date || 'No due date'}
  - Hours: ${estimated}h estimated, ${actual}h actual, ${logged}h logged
  - Activity: ${comments} comments`;
        }).join('\n\n');

        const equipmentStatus = contextData.equipment.map(e => {
            const assignments = e.active_assignments || 0;
            const totalHours = e.total_hours || 0;
            const maintenanceCost = e.maintenance_cost || 0;
            const utilization = e.utilization_rate || 0;
            const lastUsed = e.last_used || 'Never';

            return `${e.name} (${e.type}, ${e.model || 'N/A'}):
  - Status: ${e.status}, Location: ${e.location || 'Unknown'}
  - Usage: ${totalHours}h total, ${Math.round(utilization)}h avg/use, ${assignments} active assignments
  - Maintenance: $${maintenanceCost.toLocaleString()}, Last used: ${lastUsed}`;
        }).join('\n\n');

        // Calculate business-wide analytics
        const totalProjects = contextData.projects.length;
        const activeProjects = contextData.projects.filter(p => p.status === 'active').length;
        const totalTasks = contextData.tasks.length;
        const urgentTasks = contextData.tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
        const recentLogs = contextData.dailyLogs.length;
        const totalEquipment = contextData.equipment.length;
        const activeEquipment = contextData.equipment.filter(e => e.status === 'active').length;

        // Build comprehensive system prompt with rich context
        const systemPrompt = `You are an advanced construction project management AI assistant with access to comprehensive, real-time business data and analytics.

BUSINESS OVERVIEW (${contextData.metadata?.contextDate?.split('T')[0]}):
- Projects: ${activeProjects}/${totalProjects} active
- Tasks: ${totalTasks} total (${urgentTasks} urgent/high priority)
- Recent Activity: ${recentLogs} daily logs (last 30 days)
- Equipment: ${activeEquipment}/${totalEquipment} active units
- Data Coverage: ${contextData.metadata?.dataRange}

DETAILED CONTEXT:

PROJECTS:
${projectSummary}

CLIENTS:
${clientSummary}

CREWS:
${crewSummary}

RECENT WORK ACTIVITY:
${recentActivity}

ACTIVE/URGENT TASKS:
${taskSummary}

EQUIPMENT STATUS:
${equipmentStatus}

ADVANCED CAPABILITIES:
1. **Project Intelligence**: Analyze progress, budget performance, resource allocation, and timeline risks
2. **Productivity Analytics**: Track crew performance, equipment utilization, and efficiency trends
3. **Financial Insights**: Monitor budget vs. actual costs, invoice status, and profitability
4. **Operational Planning**: Suggest resource reallocation, identify bottlenecks, predict delays
5. **Quality & Safety Monitoring**: Track safety incidents, quality issues, and compliance
6. **Predictive Analysis**: Forecast project completion, resource needs, and potential risks
7. **Daily Log Creation**: Convert work descriptions into structured, comprehensive daily logs
8. **Equipment Management**: Monitor utilization, maintenance schedules, and assignment optimization

CONTEXT INTELLIGENCE:
- Real-time access to project progress, task completion rates, and issue tracking
- Cross-referenced client information with project performance and financial data
- Crew productivity metrics, workload distribution, and assignment optimization
- Equipment utilization rates, maintenance costs, and operational efficiency
- Historical work patterns, productivity trends, and seasonal variations
- Financial performance, budget adherence, and profitability analysis

When creating daily logs, leverage project and crew context for enhanced accuracy and completeness.
When answering questions, provide data-driven insights with specific metrics and actionable recommendations.
Always consider the interconnections between projects, resources, schedules, and business objectives.`;

        // Build messages array
        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-5), // Last 5 messages for context
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT_GPT_3_5,
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
        }        // Check if this is a daily log creation request
        if (message.toLowerCase().includes('daily log') ||
            message.toLowerCase().includes('work today') ||
            message.toLowerCase().includes('completed today')) {

            // Try to extract project and work details
            const projectMatch = contextData.projects.find(p =>
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
                        userId: ""
                    }
                };
            } else {
                return {
                    response: `I'd like to help you create a daily log, but I couldn't identify which project you're referring to. Available projects: ${contextData.projects.map(p => p.name).join(', ')}. Could you specify the project name?`,
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

// General-purpose transcription for any context
export async function transcribeAudioGeneral(audioBlob: Blob, context?: {
    type?: 'general' | 'task' | 'project' | 'query' | 'note';
    enhance?: boolean;
}): Promise<{ text: string; enhanced?: string; error?: string }> {
    try {
        const response = await openai.audio.transcriptions.create({
            file: audioBlob as any,
            model: AI_MODELS.TRANSCRIPTION,
        });

        const transcribedText = response.text;

        // If enhancement is requested, clean up and format the text
        if (context?.enhance) {
            const enhancementPrompt = `Clean up and format this transcribed text for ${context.type || 'general'} use:

"${transcribedText}"

Instructions:
- Fix obvious transcription errors
- Improve grammar and punctuation
- Keep the original meaning and content
- Format appropriately for ${context.type || 'general'} context
- Return only the cleaned text, no additional commentary

Cleaned text:`;

            const completion = await openai.chat.completions.create({
                model: AI_MODELS.CHAT_GPT_3_5,
                messages: [
                    { role: "system", content: "You are a text editing assistant. Clean up transcribed text while preserving the original meaning." },
                    { role: "user", content: enhancementPrompt }
                ],
                temperature: 0.1,
            });

            const enhancedText = completion.choices[0]?.message?.content?.trim() || transcribedText;

            return {
                text: transcribedText,
                enhanced: enhancedText
            };
        }

        return { text: transcribedText };
    } catch (error) {
        console.error("General transcription error:", error);
        return {
            text: "",
            error: "Failed to transcribe audio. Please try again."
        };
    }
}

export async function createDailyLogFromAI(businessId: string, data: {
    projectId: string;
    projectName: string;
    workSummary: string;
    userId: string;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
        // Get context data for enhanced crew matching
        const contextData = await getAIContextData(businessId);

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
            model: AI_MODELS.CHAT_GPT_3_5,
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

        // Try to match crew from extracted crew_info
        let crewId = "";
        if (extractedData.crew_info && contextData.crews.length > 0) {
            const crewMatch = contextData.crews.find(crew =>
                extractedData.crew_info.toLowerCase().includes(crew.name.toLowerCase()) ||
                crew.name.toLowerCase().includes(extractedData.crew_info.toLowerCase())
            );
            if (crewMatch) {
                crewId = crewMatch.id;
            }
        }

        // Create the daily log using existing action with enhanced data
        const result = await createDailyLog(
            businessId,
            {
                project_id: data.projectId,
                crew_id: crewId, // Now using intelligent crew matching
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
                business_id: "",
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
