import { fetchByBusiness, fetchByBusinessWithQuery } from '@/lib/db';

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

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
        }

        // Get clients with enhanced data
        const { data: clients, error: clientsError } = await fetchByBusinessWithQuery(businessId, {
            from: "clients",
            select: ["id", "name", "type", "industry", "status", "location", "description", "notes"],
            aggregates: [
                { function: "count", table: "projects", alias: "project_count" },
                { function: "count", table: "projects", alias: "active_projects", where: { status: { neq: "completed" } } },
                { function: "count", table: "client_contacts", alias: "contact_count" },
                { function: "count", table: "client_interactions", alias: "interaction_count" },
                { function: "count", table: "invoices", alias: "invoice_count" },
                { function: "sum", table: "invoices", alias: "total_invoiced", column: "amount" },
                { function: "sum", table: "invoices", alias: "total_paid", column: "amount", where: { status: "paid" } }
            ],
            orderBy: { column: "updated_at", ascending: false }
        });

        if (clientsError) {
            console.error("Error fetching clients:", clientsError);
        }

        // Get crews with operational data
        const { data: crews, error: crewsError } = await fetchByBusinessWithQuery(businessId, {
            from: "crews",
            select: ["id", "name", "type", "status", "location", "description", "capacity", "hourly_rate"],
            aggregates: [
                { function: "count", table: "crew_members", alias: "member_count" },
                { function: "count", table: "crew_members", alias: "active_members", where: { status: "active" } },
                { function: "count", table: "project_crews", alias: "assignment_count" },
                { function: "count", table: "daily_logs", alias: "log_count" },
                { function: "sum", table: "daily_logs", alias: "total_hours", column: "hours_worked" },
                { function: "avg", table: "daily_logs", alias: "avg_daily_hours", column: "hours_worked" }
            ],
            orderBy: { column: "updated_at", ascending: false }
        });

        if (crewsError) {
            console.error("Error fetching crews:", crewsError);
        }

        // Get recent daily logs with enhanced context
        const { data: dailyLogs, error: dailyLogsError } = await fetchByBusinessWithQuery(businessId, {
            from: "daily_logs",
            select: ["id", "date", "description", "hours_worked", "weather", "issues", "achievements", "project_id", "crew_id"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status", "client_id"],
                    alias: "projects"
                },
                {
                    table: "crews",
                    select: ["id", "name", "type"],
                    alias: "crews"
                }
            ],
            where: {
                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } // Last 30 days
            },
            orderBy: { column: "date", ascending: false },
            limit: 100
        });

        if (dailyLogsError) {
            console.error("Error fetching daily logs:", dailyLogsError);
        }

        // Get active tasks with priority and progress information
        const { data: tasks, error: tasksError } = await fetchByBusinessWithQuery(businessId, {
            from: "tasks",
            select: ["id", "title", "description", "status", "priority", "progress", "due_date", "project_id", "assigned_to"],
            joins: [
                {
                    table: "projects",
                    select: ["id", "name", "status", "client_id"],
                    alias: "projects"
                }
            ],
            where: {
                status: { neq: "completed" }
            },
            orderBy: { column: "priority", ascending: false },
            limit: 50
        });

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        // Get equipment with operational status
        const { data: equipment, error: equipmentError } = await fetchByBusinessWithQuery(businessId, {
            from: "equipment",
            select: ["id", "name", "type", "status", "location", "description", "hourly_rate", "purchase_date", "last_maintenance"],
            aggregates: [
                { function: "count", table: "equipment_assignments", alias: "assignment_count" },
                { function: "count", table: "equipment_maintenance", alias: "maintenance_count" },
                { function: "sum", table: "equipment_assignments", alias: "total_hours", column: "hours_used" }
            ],
            where: {
                status: { neq: "retired" }
            },
            orderBy: { column: "updated_at", ascending: false }
        });

        if (equipmentError) {
            console.error("Error fetching equipment:", equipmentError);
        }

        // Calculate totals and metadata
        const totalRecords = {
            projects: projects?.length || 0,
            clients: clients?.length || 0,
            crews: crews?.length || 0,
            dailyLogs: dailyLogs?.length || 0,
            tasks: tasks?.length || 0,
            equipment: equipment?.length || 0
        };

        return {
            projects: projects || [],
            clients: clients || [],
            crews: crews || [],
            dailyLogs: dailyLogs || [],
            tasks: tasks || [],
            equipment: equipment || [],
            metadata: {
                contextDate: new Date().toISOString(),
                dataRange: "Last 30 days for logs, current active data for all other entities",
                totalRecords
            }
        };
    } catch (error) {
        console.error("Error in getAIContextData:", error);
        throw error;
    }
};
