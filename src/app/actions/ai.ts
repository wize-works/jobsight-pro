"use server";

import { openai, AI_MODELS } from "@/lib/ai/client";
import { createDailyLog } from "./daily-logs";
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

// AI context data function - always fetches fresh data for accuracy
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
                    alias: "clients"
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
        let { data: clients, error: clientsError } = await fetchByBusinessWithQuery(businessId, {
            from: "clients",
            select: ["id", "name", "type", "industry", "contact_email", "address"],
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

        // Debug logging for client query
        if (clientsError) {
            console.error("AI Context - Client query error:", clientsError);
            // Try a simpler query as fallback
            console.log("AI Context - Attempting fallback client query...");
            const { data: fallbackClients, error: fallbackError } = await fetchByBusiness("clients", businessId, "*", {
                orderBy: { column: "name", ascending: true }
            });
            if (fallbackError) {
                console.error("AI Context - Fallback client query also failed:", fallbackError);
            } else {
                console.log(`AI Context - Fallback found ${fallbackClients?.length || 0} clients`);
                // Use the fallback data
                clients = fallbackClients;
            }
        } else {
            console.log(`AI Context - Found ${clients?.length || 0} clients for business ${businessId}`);
        }

        // Get crews with assignment and productivity data
        let { data: crews, error: crewsError } = await fetchByBusinessWithQuery(businessId, {
            from: "crews",
            select: ["id", "name", "status", "specialty"],
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

        // Debug logging for crew query
        if (crewsError) {
            console.error("AI Context - Crew query error:", crewsError);
            // Try a simpler query as fallback
            console.log("AI Context - Attempting fallback crew query...");
            const { data: fallbackCrews, error: fallbackError } = await fetchByBusiness("crews", businessId, "*", {
                orderBy: { column: "name", ascending: true }
            });
            if (fallbackError) {
                console.error("AI Context - Fallback crew query also failed:", fallbackError);
            } else {
                console.log(`AI Context - Fallback found ${fallbackCrews?.length || 0} crews`);
                // Use the fallback data
                crews = fallbackCrews;
            }
        } else {
            console.log(`AI Context - Found ${crews?.length || 0} crews for business ${businessId}`);
        }

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

        const contextData = {
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
            }
        };

        return contextData;
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
                dataRange: "Error occurred - no data available",
                totalRecords: {
                    projects: 0,
                    clients: 0,
                    crews: 0,
                    dailyLogs: 0,
                    tasks: 0,
                    equipment: 0
                }
            }
        };
    }
};

export async function processAIQuery(
    businessId: string,
    message: string,
    conversationHistory: ConversationMessage[] = [],
    userId?: string
): Promise<AIQueryResult> {
    try {
        // Get fresh context data for the most accurate AI responses
        const contextData = await getAIContextData(businessId);

        // EMERGENCY DEBUG: Simple test to check what data is being fetched
        if (message.toLowerCase().includes('debug data')) {
            // Add extra debug info for active projects
            const activeProjectsList = contextData.projects?.filter((p: any) => p.status?.toLowerCase() === 'active') || [];
            const activeProjectNames = activeProjectsList.map((p: any) => p.name);

            return {
                response: `DEBUG DATA DUMP:
Projects: ${contextData.projects?.length || 0}
Project Names: ${contextData.projects?.map((p: any) => `${p.name} (${p.status})`).join(', ') || 'None'}
Active Projects Count: ${activeProjectsList.length}
Active Project Names: ${activeProjectNames.join(', ') || 'None'}
Active Projects Details: ${JSON.stringify(activeProjectsList.map((p: any) => ({ name: p.name, status: p.status })), null, 2)}
Clients: ${contextData.clients?.length || 0}
Client Names: ${contextData.clients?.map((c: any) => c.name).join(', ') || 'None'}
Crews: ${contextData.crews?.length || 0}
Daily Logs: ${contextData.dailyLogs?.length || 0}
Tasks: ${contextData.tasks?.length || 0}
Equipment: ${contextData.equipment?.length || 0}`,
                action: "debug"
            };
        }

        // Analyze the query to understand what the user is asking for
        const queryContext = analyzeQuery(message, contextData);

        // Filter context data based on the query
        const filteredData = filterContextData(contextData, queryContext);

        // Build rich context summary for AI with comprehensive analytics
        const projectSummary = filteredData.projects.map((p: any) => {
            const client = p.clients?.name || 'Unknown Client';
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

        const clientSummary = filteredData.clients.map((c: any) => {
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

        const crewSummary = filteredData.crews.map((c: any) => {
            const members = c.member_count || 0;
            const assignments = c.active_assignments || 0;
            const totalHours = c.total_hours_worked || 0;
            const productivity = c.avg_productivity || 0;
            const logEntries = c.log_entries || 0;

            // For fallback data (basic crew info), provide a simpler summary
            if (members === 0 && assignments === 0 && totalHours === 0) {
                return `${c.name}:
  - ID: ${c.id}
  - Status: ${c.status || 'Active'}
  - Location: ${c.location || 'Various'}`;
            }

            return `${c.name} (${members} members):
  - Active Assignments: ${assignments}, Total Hours: ${totalHours}
  - Productivity: ${Math.round(productivity)} avg hours/day, ${logEntries} log entries
  - Status: ${c.status || 'Active'}, Location: ${c.location || 'Various'}`;
        }).join('\n\n');

        const recentActivity = filteredData.dailyLogs.slice(0, 8).map((log: any) => {
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

        const taskSummary = filteredData.tasks.slice(0, 10).map((t: any) => {
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

        const equipmentStatus = filteredData.equipment.map((e: any) => {
            const assignments = e.active_assignments || 0;
            const totalHours = e.total_hours || 0;
            const maintenanceCost = e.maintenance_cost || 0;
            const utilization = e.utilization_rate || 0;
            const lastUsed = e.last_used || 'Never';

            return `${e.name} (${e.model || 'N/A'}):
  - Status: ${e.status}, Location: ${e.location || 'Unknown'}
  - Usage: ${totalHours}h total, ${Math.round(utilization)}h avg/use, ${assignments} active assignments
  - Maintenance: $${maintenanceCost.toLocaleString()}, Last used: ${lastUsed}`;
        }).join('\n\n');        // Calculate business-wide analytics
        const totalProjects = filteredData.projects.length;
        const activeProjects = filteredData.projects.filter((p: any) => p.status?.toLowerCase() === 'active').length;

        const totalTasks = filteredData.tasks.length;
        const urgentTasks = filteredData.tasks.filter((t: any) => t.priority === 'high' || t.priority === 'urgent').length;
        const recentLogs = filteredData.dailyLogs.length;
        const totalEquipment = filteredData.equipment.length;
        const activeEquipment = filteredData.equipment.filter((e: any) => e.status?.toLowerCase() === 'active').length;
        const totalCrews = filteredData.crews.length;
        const activeCrews = filteredData.crews.filter((c: any) => c.status?.toLowerCase() === 'active' || !c.status).length;        // Build comprehensive system prompt with rich context
        const querySpecificContext = queryContext.projectNames.length > 0
            ? `\n\nQUERY CONTEXT: User is asking specifically about: ${queryContext.projectNames.join(', ')}${queryContext.requestedData.length > 0 ? ` (focusing on: ${queryContext.requestedData.join(', ')})` : ''}${queryContext.limit ? ` (limited to ${queryContext.limit} items)` : ''}`
            : '';

        // Add debugging info to the system prompt when no logs are found
        const debugInfo = filteredData.dailyLogs.length === 0
            ? `\n\nDEBUG INFO: No daily logs found in the current dataset. The user may be asking about data that doesn't exist or is outside the current 30-day window.`
            : `\n\nDATA AVAILABILITY: ${filteredData.dailyLogs.length} daily logs available for analysis.`; const systemPrompt = `You are an advanced construction project management AI assistant with DIRECT ACCESS to real-time business data and analytics.

IMPORTANT: You DO have access to all the project data listed below. This is real, current data from the user's business database. You should analyze and reference this data directly in your responses.${debugInfo}

BUSINESS OVERVIEW (${contextData.metadata?.contextDate?.split('T')[0]}):
- Projects: ${activeProjects}/${totalProjects} active${queryContext.projectNames.length > 0 ? ` (filtered for: ${queryContext.projectNames.join(', ')})` : ''}
- Tasks: ${totalTasks} total (${urgentTasks} urgent/high priority)
- Crews: ${activeCrews}/${totalCrews} available
- Recent Activity: ${recentLogs} daily logs${queryContext.timeframe ? ` (${queryContext.timeframe})` : ' (last 30 days)'}
- Equipment: ${activeEquipment}/${totalEquipment} active units
- Data Coverage: ${contextData.metadata?.dataRange}${querySpecificContext}

🔥 CRITICAL STATUS INFORMATION - READ CAREFULLY:
${activeProjects > 0 ? `✅ ACTIVE PROJECTS CONFIRMED: ${activeProjects} project(s) with status "active" - YOU MUST ACKNOWLEDGE THESE ACTIVE PROJECTS IN YOUR RESPONSE` : '❌ NO ACTIVE PROJECTS: All projects are either completed, planning, or other statuses'}

🚨 MANDATORY ACTIVE PROJECT COUNT: When asked about active projects, you MUST report that there are ${activeProjects} active projects based on the data provided above.

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
1. **Project Intelligence**: Analyze progress, budget performance, resource allocation, and timeline risks from REAL project data
2. **Productivity Analytics**: Track crew performance, equipment utilization, and efficiency trends from ACTUAL data
3. **Financial Insights**: Monitor budget vs. actual costs, invoice status, and profitability from CURRENT records
4. **Operational Planning**: Suggest resource reallocation, identify bottlenecks, predict delays using LIVE data
5. **Quality & Safety Monitoring**: Track safety incidents, quality issues, and compliance from REAL entries
6. **Predictive Analysis**: Forecast project completion, resource needs, and potential risks using HISTORICAL patterns
7. **Daily Log Creation**: Convert work descriptions into structured, comprehensive daily logs
8. **Equipment Management**: Monitor utilization, maintenance schedules, and assignment optimization from CURRENT status

CONTEXT INTELLIGENCE:
- Real-time access to project progress, task completion rates, and issue tracking
- Cross-referenced client information with project performance and financial data
- Crew productivity metrics, workload distribution, and assignment optimization
- Equipment utilization rates, maintenance costs, and operational efficiency
- Historical work patterns, productivity trends, and seasonal variations
- Financial performance, budget adherence, and profitability analysis

CRITICAL INSTRUCTIONS - FOLLOW THESE EXACTLY:
1. 🔥 ACTIVE PROJECT VERIFICATION: The data shows ${activeProjects} active projects. You MUST acknowledge this count in your response.
2. 🔥 DATA ACKNOWLEDGMENT: You HAVE DIRECT ACCESS to all the project data shown above - this is REAL, CURRENT business data
3. 🔥 STATUS FIELD READING: When asked about active projects, look at the "Status:" field in each project listing above
4. 🔥 ACTIVE PROJECT IDENTIFICATION: Projects with "Status: active" are currently active - count and report these accurately
5. When asked about specific projects, analyze the provided project data and respond with actual details
6. For daily log summaries, use the ACTUAL daily log entries provided in the RECENT WORK ACTIVITY section
7. Always reference specific data points, dates, hours, and metrics from the provided context
8. If asked about projects not in the filtered data, state that you don't see that project in the current data set
9. Provide concrete, data-driven insights using the actual numbers and details provided
10. NEVER create fictional or sample data - use only what is explicitly provided
11. If no data is available for a request, clearly state that no data was found
12. Always mention actual dates, project names, and figures from the provided data
13. PAY CLOSE ATTENTION to the "Status:" field in each project - this tells you if a project is active, planning, completed, etc.

🚨 FINAL VERIFICATION: Before responding, confirm that you see ${activeProjects} active projects in the data above. If you don't acknowledge this, your response is incorrect.

When creating daily logs, leverage project and crew context for enhanced accuracy and completeness.
When answering questions, provide data-driven insights with specific metrics and actionable recommendations.
Always consider the interconnections between projects, resources, schedules, and business objectives.

REMEMBER: The data above is REAL and CURRENT. Reference it directly and specifically in your responses. Look at the "Status:" field for each project to determine if it's active.`;

        // Build messages array
        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-5), // Last 5 messages for context
            { role: "user", content: message }
        ];

        // Debug a portion of the system prompt to verify active projects are mentioned
        const activeProjectsSection = systemPrompt.match(/ACTIVE PROJECTS CONFIRMED:.*|NO ACTIVE PROJECTS:.*/g);

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT_GPT_3_5,
            messages: messages as any,
            temperature: 0.3,
            max_tokens: 1200, // Increased for more detailed responses
        });

        const aiResponse = completion.choices[0]?.message?.content;

        if (!aiResponse) {
            return {
                response: "I'm sorry, I couldn't process your request at the moment.",
                action: "none"
            };
        }

        // Post-process the response to correct any misstatements about active projects
        let processedResponse = aiResponse;

        // Check for common patterns that incorrectly state no active projects
        if (activeProjects > 0) {
            const incorrectPatterns = [
                /no active projects/i,
                /currently.*no.*projects.*active/i,
                /there are no.*active.*projects/i,
                /0 active projects/i,
                /don't.*see.*active.*projects/i
            ];

            for (const pattern of incorrectPatterns) {
                if (pattern.test(processedResponse)) {
                    console.log('AI Response Error Detected - Correcting misstatement about active projects');
                    processedResponse = processedResponse.replace(pattern,
                        `${activeProjects} active project${activeProjects > 1 ? 's' : ''}`);
                    processedResponse = `⚠️ CORRECTED RESPONSE: Based on the current data, there ${activeProjects > 1 ? 'are' : 'is'} ${activeProjects} active project${activeProjects > 1 ? 's' : ''} in the system.\n\n${processedResponse}`;
                    break;
                }
            }
        }        // Handle specific summary requests FIRST before daily log creation
        if (queryContext.intent === 'summary' && queryContext.requestedData.includes('dailyLogs')) {
            const limit = queryContext.limit || 3;

            // For all projects or no specific projects mentioned
            if (queryContext.projectNames.length === 0) {
                console.log('Cross-project summary requested');
                // Cross-project summary
                const recentLogs = filteredData.dailyLogs.slice(0, limit);
                console.log(`Found ${recentLogs.length} recent logs for summary`);

                if (recentLogs.length === 0) {
                    return {
                        response: `I don't see any daily logs in the available data for the requested timeframe. Debug info: Total logs in system: ${contextData.dailyLogs.length}, Filtered logs: ${filteredData.dailyLogs.length}`,
                        action: "no_data"
                    };
                }

                // Create explicit data output for AI
                const logSummary = recentLogs.map((log: any, index: number) => {
                    const project = log.project?.name || 'Unknown Project';
                    const crew = log.crew?.name || 'Unknown Crew';
                    const hours = log.hours_worked || 0;
                    const overtime = log.overtime || 0;
                    const materialCost = log.material_cost || 0;
                    const equipmentHours = log.equipment_hours || 0;

                    return `ACTUAL LOG #${index + 1} - DATE: ${log.date}:
  PROJECT: ${project}
  CREW: ${crew}
  WORK COMPLETED: ${log.work_completed || 'No details provided'}
  HOURS: ${hours}${overtime > 0 ? ` (+ ${overtime} OT)` : ''} | EQUIPMENT: ${equipmentHours}h
  WEATHER: ${log.weather || 'Not recorded'} | MATERIALS: $${materialCost.toLocaleString()}
  ${log.work_planned ? `PLANNED NEXT: ${log.work_planned}` : ''}
  ${log.delays ? `DELAYS: ${log.delays}` : ''}
  ${log.safety ? `SAFETY NOTES: ${log.safety}` : ''}`;
                }).join('\n\n');

                // Enhanced prompt to ensure AI uses actual data
                const summaryPrompt = `You are provided with REAL daily log data from a construction business database. 

CRITICAL INSTRUCTIONS:
- Use ONLY the actual data provided below
- Do NOT create any sample or fictional data
- Reference the exact dates, projects, and details provided
- If logs are empty or missing details, state that explicitly

Here are the ${limit} most recent daily logs across all projects:

${logSummary}

ACTUAL DATA SUMMARY REQUESTED:
Provide a professional summary of these actual daily logs, including:
- The real dates and projects from the data above
- Actual work completed as described in the logs
- Real hours and productivity numbers
- Any actual issues, delays, or safety notes mentioned
- Total hours worked across all logs

Format as a professional cross-project summary using ONLY the real data provided above.`;

                const summaryCompletion = await openai.chat.completions.create({
                    model: AI_MODELS.CHAT_GPT_3_5,
                    messages: [
                        { role: "system", content: "You are a construction project analyst. Use ONLY the actual data provided. Never create fictional examples. Always reference the real dates, projects, and details from the provided data." },
                        { role: "user", content: summaryPrompt }
                    ],
                    temperature: 0.1, // Lower temperature for more factual responses
                    max_tokens: 800,
                });

                const summaryResponse = summaryCompletion.choices[0]?.message?.content;

                return {
                    response: summaryResponse || `Here's a summary of the ${limit} most recent daily logs across all projects:\n\n${logSummary}`,
                    action: "summary_provided",
                    data: {
                        logCount: recentLogs.length,
                        dateRange: recentLogs.length > 0 ? `${recentLogs[recentLogs.length - 1].date} to ${recentLogs[0].date}` : null,
                        scope: "all_projects"
                    }
                };
            }
            // For specific project
            else {
                const targetProject = filteredData.projects[0]; // First matching project
                if (targetProject) {
                    const projectLogs = filteredData.dailyLogs;
                    const recentLogs = projectLogs.slice(0, limit);

                    if (recentLogs.length === 0) {
                        return {
                            response: `I don't see any daily logs for the ${targetProject.name} project in the available data.`,
                            action: "no_data"
                        };
                    }

                    // Create a focused summary for the AI
                    const logSummary = recentLogs.map((log: any, index: number) => {
                        const crew = log.crew?.name || 'Unknown Crew';
                        const hours = log.hours_worked || 0;
                        const overtime = log.overtime || 0;
                        const materialCost = log.material_cost || 0;
                        const equipmentHours = log.equipment_hours || 0;

                        return `Log #${index + 1} - ${log.date}:
  Crew: ${crew}
  Work Completed: ${log.work_completed || 'No details provided'}
  Hours: ${hours}${overtime > 0 ? ` (+ ${overtime} OT)` : ''} | Equipment: ${equipmentHours}h
  Weather: ${log.weather || 'Not recorded'} | Materials: $${materialCost.toLocaleString()}
  ${log.work_planned ? `Planned Next: ${log.work_planned}` : ''}
  ${log.delays ? `Delays: ${log.delays}` : ''}
  ${log.safety ? `Safety Notes: ${log.safety}` : ''}`;
                    }).join('\n\n');

                    // Send targeted prompt to AI for summary
                    const summaryPrompt = `Summarize the following ${limit} most recent daily logs for the ${targetProject.name} project:

${logSummary}

Provide a clear, concise summary highlighting:
- Key work accomplished
- Total hours and productivity
- Any issues or delays
- Progress trends
- Notable safety or quality observations

Format as a professional project summary.`;

                    const summaryCompletion = await openai.chat.completions.create({
                        model: AI_MODELS.CHAT_GPT_3_5,
                        messages: [
                            { role: "system", content: "You are a construction project analyst. Provide clear, professional summaries of daily log data." },
                            { role: "user", content: summaryPrompt }
                        ],
                        temperature: 0.2,
                        max_tokens: 800,
                    });

                    const summaryResponse = summaryCompletion.choices[0]?.message?.content;

                    return {
                        response: summaryResponse || `Here's a summary of the ${limit} most recent daily logs for ${targetProject.name}:\n\n${logSummary}`,
                        action: "summary_provided",
                        data: {
                            projectName: targetProject.name,
                            logCount: recentLogs.length,
                            dateRange: recentLogs.length > 0 ? `${recentLogs[recentLogs.length - 1].date} to ${recentLogs[0].date}` : null
                        }
                    };
                }
            }
        }

        // Emergency debugging: Direct response for crew-related requests
        if (message.toLowerCase().includes('crew') || message.toLowerCase().includes('crews')) {
            console.log('AI Query: Crew-related request detected, fetching fresh data');

            // Get fresh context data
            const freshContextData = await getAIContextData(businessId);

            if (freshContextData.crews?.length === 0) {
                return {
                    response: `No crews found in database. Total entities found: ${freshContextData.projects?.length || 0} projects, ${freshContextData.clients?.length || 0} clients, ${freshContextData.crews?.length || 0} crews.`,
                    action: "no_crews"
                };
            }
        }

        // Check if this is a daily log creation request (moved after summary handling)
        if ((message.toLowerCase().includes('daily log') ||
            message.toLowerCase().includes('work today') ||
            message.toLowerCase().includes('completed today')) &&
            !queryContext.requestedData.includes('dailyLogs')) { // Only if not already a summary request

            // Try to extract project and work details
            const projectMatch = filteredData.projects.find((p: any) =>
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
                    response: `I'd like to help you create a daily log, but I couldn't identify which project you're referring to. Available projects: ${filteredData.projects.map((p: any) => p.name).join(', ')}. Could you specify the project name?`,
                    action: "clarify_project"
                };
            }
        }        // Try to parse as JSON for structured responses
        try {
            const parsedResponse = JSON.parse(processedResponse);
            return parsedResponse;
        } catch {
            // If not JSON, return as plain response
            return {
                response: processedResponse,
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
            const crewMatch = contextData.crews.find((crew: { name: string; }) =>
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

// AI Usage Limit Server Action
export async function getAIUsageData(businessId: string): Promise<{
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
        // Validate businessId
        if (!businessId || businessId.trim() === '') {
            return {
                success: false,
                error: 'Invalid business ID',
                data: {
                    currentUsage: 0,
                    limit: 0,
                    percentageUsed: 0,
                    canUseAI: false,
                    remainingTokens: 0
                }
            };
        }

        const { checkAIUsageLimit } = await import('@/lib/ai/usage-limits');
        const usage = await checkAIUsageLimit(businessId);
        return { success: true, data: usage };
    } catch (error) {
        console.error('Error getting AI usage data:', error);
        return {
            success: false,
            error: 'Failed to get AI usage data',
            data: {
                currentUsage: 0,
                limit: 0,
                percentageUsed: 0,
                canUseAI: false,
                remainingTokens: 0
            }
        };
    }
}

// Enhanced query preprocessing and data filtering
interface QueryContext {
    projectNames: string[];
    requestedData: string[];
    timeframe: string | null;
    limit: number | null;
    intent: 'summary' | 'analysis' | 'create' | 'general';
}

function analyzeQuery(query: string, contextData: any): QueryContext {
    const lowercaseQuery = query.toLowerCase();

    // Extract project names mentioned in the query
    const projectNames: string[] = [];

    // Check for "across all projects" or similar phrases
    const allProjectsPatterns = [
        'across all projects',
        'all projects',
        'from all projects',
        'company-wide',
        'business-wide',
        'overall',
        'entire business'
    ];

    const isAllProjects = allProjectsPatterns.some(pattern => lowercaseQuery.includes(pattern));

    if (!isAllProjects) {
        // Look for specific project names
        contextData.projects.forEach((project: any) => {
            const projectNameLower = project.name.toLowerCase();
            const projectNameNoSpaces = projectNameLower.replace(/\s+/g, '');

            if (lowercaseQuery.includes(projectNameLower) ||
                lowercaseQuery.includes(projectNameNoSpaces) ||
                lowercaseQuery.includes(project.name.toLowerCase().split(' ')[0])) {
                projectNames.push(project.name);
            }
        });
    }    // Identify requested data types
    const requestedData: string[] = [];
    if (lowercaseQuery.includes('daily log') || lowercaseQuery.includes('daily logs') || lowercaseQuery.includes('work log') || lowercaseQuery.includes('work logs')) {
        requestedData.push('dailyLogs');
    }
    if (lowercaseQuery.includes('task') || lowercaseQuery.includes('tasks') || lowercaseQuery.includes('todo')) {
        requestedData.push('tasks');
    }
    if (lowercaseQuery.includes('progress') || lowercaseQuery.includes('status')) {
        requestedData.push('progress');
    }
    if (lowercaseQuery.includes('crew') || lowercaseQuery.includes('crews') || lowercaseQuery.includes('team')) {
        requestedData.push('crews');
    }
    if (lowercaseQuery.includes('equipment') || lowercaseQuery.includes('machinery')) {
        requestedData.push('equipment');
    }
    if (lowercaseQuery.includes('budget') || lowercaseQuery.includes('cost') || lowercaseQuery.includes('financial')) {
        requestedData.push('financial');
    }

    // Extract timeframe
    let timeframe: string | null = null;
    if (lowercaseQuery.includes('recent') || lowercaseQuery.includes('latest')) {
        timeframe = 'recent';
    } else if (lowercaseQuery.includes('today')) {
        timeframe = 'today';
    } else if (lowercaseQuery.includes('this week')) {
        timeframe = 'week';
    } else if (lowercaseQuery.includes('this month')) {
        timeframe = 'month';
    }

    // Extract limits (numbers)
    const numberMatch = lowercaseQuery.match(/(\d+)\s*(most|recent|latest|first|last)/);
    const limit = numberMatch ? parseInt(numberMatch[1]) : null;

    // Determine intent
    let intent: QueryContext['intent'] = 'general';
    if (lowercaseQuery.includes('summarize') || lowercaseQuery.includes('summary')) {
        intent = 'summary';
    } else if (lowercaseQuery.includes('analyze') || lowercaseQuery.includes('analysis') || lowercaseQuery.includes('trends')) {
        intent = 'analysis';
    } else if (lowercaseQuery.includes('create') || lowercaseQuery.includes('daily log')) {
        intent = 'create';
    }

    return {
        projectNames,
        requestedData,
        timeframe,
        limit,
        intent
    };
}

function filterContextData(contextData: any, queryContext: QueryContext) {
    const filtered = { ...contextData };

    // Filter by project if specific projects mentioned
    if (queryContext.projectNames.length > 0) {
        // Filter projects
        filtered.projects = contextData.projects.filter((p: any) =>
            queryContext.projectNames.some(name =>
                p.name.toLowerCase().includes(name.toLowerCase())
            )
        );

        const projectIds = filtered.projects.map((p: any) => p.id);

        // Filter daily logs for these projects
        filtered.dailyLogs = contextData.dailyLogs.filter((log: any) =>
            projectIds.includes(log.project_id)
        );

        // Filter tasks for these projects
        filtered.tasks = contextData.tasks.filter((task: any) =>
            projectIds.includes(task.project_id)
        );
    }

    // Apply limits if specified
    if (queryContext.limit) {
        if (queryContext.requestedData.includes('dailyLogs')) {
            filtered.dailyLogs = filtered.dailyLogs.slice(0, queryContext.limit);
        }
        if (queryContext.requestedData.includes('tasks')) {
            filtered.tasks = filtered.tasks.slice(0, queryContext.limit);
        }
    }

    // Apply timeframe filtering
    if (queryContext.timeframe === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered.dailyLogs = filtered.dailyLogs.filter((log: any) => log.date === today);
    } else if (queryContext.timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        filtered.dailyLogs = filtered.dailyLogs.filter((log: any) => log.date >= weekAgoStr);
    }

    return filtered;
}