import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const DashboardParamsSchema = z.object({
    include: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    project_limit: z.string().optional(),
    activity_limit: z.string().optional(),
    task_limit: z.string().optional(),
    team_limit: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const url = new URL(request.url);
        const params = DashboardParamsSchema.parse(Object.fromEntries(url.searchParams));

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness?.business_id) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;

        // Set limits with defaults
        const projectLimit = params.project_limit ? parseInt(params.project_limit) : 6;
        const activityLimit = params.activity_limit ? parseInt(params.activity_limit) : 8;
        const taskLimit = params.task_limit ? parseInt(params.task_limit) : 6;
        const teamLimit = params.team_limit ? parseInt(params.team_limit) : 4;

        // Fetch all core data in parallel
        const [
            projectsData,
            tasksData,
            equipmentData,
            crewsData,
            clientsData,
            dailyLogsData,
            invoicesData,
            projectCrewsData,
        ] = await Promise.all([
            supabase.from("projects").select("*").eq("business_id", businessId),
            supabase.from("tasks").select("*").eq("business_id", businessId),
            supabase.from("equipment").select("*").eq("business_id", businessId),
            supabase.from("crews").select("*").eq("business_id", businessId),
            supabase.from("clients").select("*").eq("business_id", businessId),
            supabase.from("daily_logs").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(activityLimit),
            supabase.from("invoices").select("*").eq("business_id", businessId),
            supabase.from("project_crews").select("*").eq("business_id", businessId),
        ]);

        // Handle errors
        if (projectsData.error) console.error("Error fetching projects:", projectsData.error);
        if (tasksData.error) console.error("Error fetching tasks:", tasksData.error);
        if (equipmentData.error) console.error("Error fetching equipment:", equipmentData.error);
        if (crewsData.error) console.error("Error fetching crews:", crewsData.error);
        if (clientsData.error) console.error("Error fetching clients:", clientsData.error);
        if (dailyLogsData.error) console.error("Error fetching daily logs:", dailyLogsData.error);
        if (invoicesData.error) console.error("Error fetching invoices:", invoicesData.error);
        if (projectCrewsData.error) console.error("Error fetching project crews:", projectCrewsData.error);

        // Use data or fallback to empty arrays
        const projects = projectsData.data || [];
        const tasks = tasksData.data || [];
        const equipment = equipmentData.data || [];
        const crews = crewsData.data || [];
        const clients = clientsData.data || [];
        const dailyLogs = dailyLogsData.data || [];
        const invoices = invoicesData.data || [];
        const projectCrews = projectCrewsData.data || [];

        // Calculate comprehensive statistics
        const activeProjects = projects.filter(p => p.status === 'active');
        const completedProjects = projects.filter(p => p.status === 'completed');
        const onHoldProjects = projects.filter(p => p.status === 'on_hold');
        const planningProjects = projects.filter(p => p.status === 'planning');

        const pendingTasks = tasks.filter(t => t.status === 'pending');
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
        const completedTasks = tasks.filter(t => t.status === 'completed');

        const activeEquipment = equipment.filter(e => e.status === 'available' || e.status === 'in_use');
        const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance');

        const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const pendingRevenue = invoices.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Project progress calculation with crews
        const projectsWithProgress = projects.map(project => {
            const projectTasks = tasks.filter(t => t.project_id === project.id);
            const completedProjectTasks = projectTasks.filter(t => t.status === 'completed');
            const progress = projectTasks.length > 0 ? (completedProjectTasks.length / projectTasks.length) * 100 : 0;

            const client = clients.find(c => c.id === project.client_id);
            const assignedCrews = projectCrews
                .filter(pc => pc.project_id === project.id)
                .map(pc => crews.find(c => c.id === pc.crew_id)?.name)
                .filter(Boolean);

            return {
                ...project,
                progress: Math.round(progress),
                taskCount: projectTasks.length,
                completedTasks: completedProjectTasks.length,
                clientName: client?.name || 'No Client',
                crewNames: assignedCrews.length > 0 ? assignedCrews.join(', ') : 'No Crews Assigned'
            };
        }).slice(0, projectLimit);

        // Recent activity with rich context
        const recentActivity = dailyLogs.map(log => {
            const project = projects.find(p => p.id === log.project_id);
            const client = clients.find(c => c.id === project?.client_id);

            return {
                id: log.id,
                type: 'daily_log' as const,
                message: log.notes || 'Daily log entry',
                projectName: project?.name || 'Unknown Project',
                clientName: client?.name || 'Unknown Client',
                weather: log.weather || 'No Weather Data',
                timestamp: log.created_at,
                projectId: log.project_id
            };
        });

        // Critical tasks (overdue or due soon)
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const criticalTasks = tasks
            .filter(task => {
                if (!task.end_date) return false;
                const dueDate = new Date(task.end_date);
                return dueDate <= tomorrow && task.status !== 'completed';
            })
            .slice(0, taskLimit)
            .map(task => {
                const project = projects.find(p => p.id === task.project_id);
                const crew = crews.find(c => c.id === task.assigned_to);
                const client = clients.find(c => c.id === project?.client_id);

                return {
                    id: task.id,
                    name: task.name,
                    projectName: project?.name || 'Unknown Project',
                    clientName: client?.name || 'Unknown Client',
                    crewName: crew?.name || 'Unassigned',
                    dueDate: task.end_date,
                    status: task.status,
                    priority: task.priority,
                    isOverdue: task.end_date ? new Date(task.end_date) < now : false
                };
            });

        // Equipment utilization data
        const equipmentUtilization = equipment.length > 0
            ? Math.round((equipment.filter(e => e.status === 'in_use').length / equipment.length) * 100)
            : 0;

        // Team productivity metrics
        const teamMetrics = crews.map(crew => {
            const crewTasks = tasks.filter(t => t.assigned_to === crew.id);
            const completedCrewTasks = crewTasks.filter(t => t.status === 'completed');
            const productivity = crewTasks.length > 0 ? (completedCrewTasks.length / crewTasks.length) * 100 : 0;

            return {
                id: crew.id,
                name: crew.name,
                activeTasks: crewTasks.filter(t => t.status === 'in_progress').length,
                completedTasks: completedCrewTasks.length,
                productivity: Math.round(productivity)
            };
        }).slice(0, teamLimit);

        // Financial overview
        const financialOverview = {
            totalRevenue,
            pendingRevenue,
            totalInvoices: invoices.length,
            paidInvoices: invoices.filter(i => i.status === 'paid').length,
            overdueInvoices: invoices.filter(i => {
                if (!i.due_date || i.status === 'paid') return false;
                return new Date(i.due_date) < now;
            }).length
        };

        // Prepare response data
        const dashboardData = {
            stats: {
                activeProjects: activeProjects.length,
                totalProjects: projects.length,
                pendingTasks: pendingTasks.length,
                totalTasks: tasks.length,
                equipmentUtilization,
                totalEquipment: equipment.length,
                totalRevenue,
                pendingRevenue
            },
            projectStatusData: {
                active: activeProjects.length,
                completed: completedProjects.length,
                onHold: onHoldProjects.length,
                planning: planningProjects.length
            },
            taskStatusData: {
                pending: pendingTasks.length,
                inProgress: inProgressTasks.length,
                completed: completedTasks.length
            },
            projectsWithProgress,
            recentActivity,
            criticalTasks,
            teamMetrics,
            financialOverview,
            equipmentStatus: {
                available: equipment.filter(e => e.status === 'available').length,
                inUse: equipment.filter(e => e.status === 'in_use').length,
                maintenance: maintenanceEquipment.length
            }
        };

        return NextResponse.json({ success: true, data: dashboardData }, { status: 200 });

    } catch (error) {
        console.error("Error in dashboard GET:", error);

        // Return empty data structure on error
        const emptyData = {
            stats: {
                activeProjects: 0,
                totalProjects: 0,
                pendingTasks: 0,
                totalTasks: 0,
                equipmentUtilization: 0,
                totalEquipment: 0,
                totalRevenue: 0,
                pendingRevenue: 0
            },
            projectStatusData: {
                active: 0,
                completed: 0,
                onHold: 0,
                planning: 0
            },
            taskStatusData: {
                pending: 0,
                inProgress: 0,
                completed: 0
            },
            projectsWithProgress: [],
            recentActivity: [],
            criticalTasks: [],
            teamMetrics: [],
            financialOverview: {
                totalRevenue: 0,
                pendingRevenue: 0,
                totalInvoices: 0,
                paidInvoices: 0,
                overdueInvoices: 0
            },
            equipmentStatus: {
                available: 0,
                inUse: 0,
                maintenance: 0
            }
        };

        return NextResponse.json({ success: true, data: emptyData }, { status: 200 });
    }
}
