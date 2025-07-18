import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { openai, AI_MODELS } from "@/lib/ai/client";
import { getAIContextData } from '@/lib/ai-context';

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

// Helper function for business validation
async function validateBusinessAccess(userId: string, businessId: string): Promise<boolean> {
    const supabase = createServerClient();

    if (!supabase) {
        return false;
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('business_id')
        .eq('auth_id', userId)
        .single();

    if (userError || !userData) {
        return false;
    }

    return userData.business_id === businessId;
}

// Helper functions for query analysis
function analyzeQuery(message: string, contextData: any) {
    const lowerMessage = message.toLowerCase();

    // Extract project names mentioned
    const projectNames = contextData.projects?.filter((p: any) =>
        lowerMessage.includes(p.name.toLowerCase()) ||
        lowerMessage.includes(p.name.toLowerCase().replace(/\s+/g, ''))
    ).map((p: any) => p.name) || [];

    // Determine request type
    const requestedData = [];
    if (lowerMessage.includes('daily log') || lowerMessage.includes('log')) requestedData.push('dailyLogs');
    if (lowerMessage.includes('project')) requestedData.push('projects');
    if (lowerMessage.includes('client')) requestedData.push('clients');
    if (lowerMessage.includes('crew')) requestedData.push('crews');
    if (lowerMessage.includes('task')) requestedData.push('tasks');
    if (lowerMessage.includes('equipment')) requestedData.push('equipment');

    // Determine intent
    let intent = 'general';
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) intent = 'summary';
    if (lowerMessage.includes('create') || lowerMessage.includes('add')) intent = 'create';
    if (lowerMessage.includes('update') || lowerMessage.includes('edit')) intent = 'update';

    // Extract timeframe
    let timeframe = null;
    if (lowerMessage.includes('today')) timeframe = 'today';
    if (lowerMessage.includes('yesterday')) timeframe = 'yesterday';
    if (lowerMessage.includes('week')) timeframe = 'week';
    if (lowerMessage.includes('month')) timeframe = 'month';

    // Extract limit
    const limitMatch = lowerMessage.match(/(\d+)\s*(recent|last|latest)/);
    const limit = limitMatch ? parseInt(limitMatch[1]) : null;

    return {
        projectNames,
        requestedData,
        intent,
        timeframe,
        limit
    };
}

function filterContextData(contextData: any, queryContext: any) {
    const filtered = { ...contextData };

    // Filter projects if specific ones mentioned
    if (queryContext.projectNames.length > 0) {
        filtered.projects = contextData.projects?.filter((p: any) =>
            queryContext.projectNames.some((name: string) =>
                p.name.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(p.name.toLowerCase())
            )
        ) || [];

        // Filter daily logs for those projects
        const projectIds = filtered.projects.map((p: any) => p.id);
        filtered.dailyLogs = contextData.dailyLogs?.filter((log: any) =>
            projectIds.includes(log.project_id)
        ) || [];
    }

    return filtered;
}

async function processAIQuery(
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
        }).join('\n\n');

        // Calculate business-wide analytics
        const totalProjects = filteredData.projects.length;
        const activeProjects = filteredData.projects.filter((p: any) => p.status?.toLowerCase() === 'active').length;
        const totalTasks = filteredData.tasks.length;
        const urgentTasks = filteredData.tasks.filter((t: any) => t.priority === 'high' || t.priority === 'urgent').length;
        const recentLogs = filteredData.dailyLogs.length;
        const totalEquipment = filteredData.equipment.length;
        const activeEquipment = filteredData.equipment.filter((e: any) => e.status?.toLowerCase() === 'active').length;
        const totalCrews = filteredData.crews.length;
        const activeCrews = filteredData.crews.filter((c: any) => c.status?.toLowerCase() === 'active' || !c.status).length;

        // Build comprehensive system prompt with rich context
        const querySpecificContext = queryContext.projectNames.length > 0
            ? `\n\nQUERY CONTEXT: User is asking specifically about: ${queryContext.projectNames.join(', ')}${queryContext.requestedData.length > 0 ? ` (focusing on: ${queryContext.requestedData.join(', ')})` : ''}${queryContext.limit ? ` (limited to ${queryContext.limit} items)` : ''}`
            : '';

        // Add debugging info to the system prompt when no logs are found
        const debugInfo = filteredData.dailyLogs.length === 0
            ? `\n\nDEBUG INFO: No daily logs found in the current dataset. The user may be asking about data that doesn't exist or is outside the current 30-day window.`
            : `\n\nDATA AVAILABILITY: ${filteredData.dailyLogs.length} daily logs available for analysis.`;

        const systemPrompt = `You are an advanced construction project management AI assistant with DIRECT ACCESS to real-time business data and analytics.

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

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT_GPT_3_5,
            messages: messages as any,
            temperature: 0.3,
            max_tokens: 1200,
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
        }

        // Handle daily log creation requests
        if ((message.toLowerCase().includes('daily log') ||
            message.toLowerCase().includes('work today') ||
            message.toLowerCase().includes('completed today')) &&
            !queryContext.requestedData.includes('dailyLogs')) {

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
                        userId: userId || ""
                    }
                };
            } else {
                return {
                    response: `I'd like to help you create a daily log, but I couldn't identify which project you're referring to. Available projects: ${filteredData.projects.map((p: any) => p.name).join(', ')}. Could you specify the project name?`,
                    action: "clarify_project"
                };
            }
        }

        // Try to parse as JSON for structured responses
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

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ succcess: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessId, message, conversationHistory } = body;

        if (!businessId || !message) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters: businessId, message'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Access denied to business' }, { status: 403 });
        }

        const result = await processAIQuery(businessId, message, conversationHistory || [], user.id);

        return NextResponse.json({ success: true, data: result }, { status: 200 });

    } catch (error) {
        console.error('Error in AI query API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
