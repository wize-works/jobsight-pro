"use server";

import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";
import { fetchByBusiness } from "@/lib/db";
import { createServerClient } from "@/lib/supabase";

export async function getDashboardData() {
    try {
        const { business, userId } = await ensureBusinessOrRedirect();
        const supabase = createServerClient();

        if (!supabase) {
            throw new Error("Supabase client not available");
        }

        // Get comprehensive project data with relationships
        const { data: projects, error: projectsError } = await fetchByBusiness(
            "projects",
            business.id,
            "*"
        );

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
        }

        // Get tasks with detailed information
        const { data: tasks, error: tasksError } = await fetchByBusiness(
            "tasks",
            business.id,
            "*"
        );

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        // Get equipment data
        const { data: equipment, error: equipmentError } = await fetchByBusiness(
            "equipment",
            business.id,
            "*"
        );

        if (equipmentError) {
            console.error("Error fetching equipment:", equipmentError);
        }

        // Get crews data
        const { data: crews, error: crewsError } = await fetchByBusiness(
            "crews",
            business.id,
            "*"
        );

        if (crewsError) {
            console.error("Error fetching crews:", crewsError);
        }

        // Get clients data
        const { data: clients, error: clientsError } = await fetchByBusiness(
            "clients",
            business.id,
            "*"
        );

        if (clientsError) {
            console.error("Error fetching clients:", clientsError);
        }

        // Get daily logs for recent activity
        const { data: dailyLogs, error: logsError } = await fetchByBusiness(
            "daily_logs",
            business.id,
            "*",
            {
                orderBy: { column: "created_at", ascending: false },
                limit: 10
            }
        );

        if (logsError) {
            console.error("Error fetching daily logs:", logsError);
        }

        // Get invoices for financial data
        const { data: invoices, error: invoicesError } = await fetchByBusiness(
            "invoices",
            business.id,
            "*"
        );

        if (invoicesError) {
            console.error("Error fetching invoices:", invoicesError);
        }

        // Calculate comprehensive statistics
        const activeProjects = projects?.filter(p => p.status === 'active') || [];
        const completedProjects = projects?.filter(p => p.status === 'completed') || [];
        const onHoldProjects = projects?.filter(p => p.status === 'on_hold') || [];
        const planningProjects = projects?.filter(p => p.status === 'planning') || [];

        const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];
        const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
        const completedTasks = tasks?.filter(t => t.status === 'completed') || [];

        const activeEquipment = equipment?.filter(e => e.status === 'available' || e.status === 'in_use') || [];
        const maintenanceEquipment = equipment?.filter(e => e.status === 'maintenance') || [];

        const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
        const pendingRevenue = invoices?.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

        // Project progress calculation
        // Fetch project crews data
        const { data: projectCrews, error: projectCrewsError } = await fetchByBusiness(
            "project_crews",
            business.id,
            "*"
        );

        if (projectCrewsError) {
            console.error("Error fetching project crews:", projectCrewsError);
        }

        // Map crews to projects using project_crews table
        const projectsWithProgress = projects?.map(project => {
            const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];
            const completedProjectTasks = projectTasks.filter(t => t.status === 'completed');
            const progress = projectTasks.length > 0 ? (completedProjectTasks.length / projectTasks.length) * 100 : 0;

            const client = clients?.find(c => c.id === project.client_id);
            const assignedCrews = projectCrews
                ?.filter(pc => pc.project_id === project.id)
                .map(pc => crews?.find(c => c.id === pc.crew_id)?.name)
                .filter(Boolean) || [];

            return {
                ...project,
                progress: Math.round(progress),
                taskCount: projectTasks.length,
                completedTasks: completedProjectTasks.length,
                clientName: client?.name || 'No Client',
                crewNames: assignedCrews.length > 0 ? assignedCrews.join(', ') : 'No Crews Assigned'
            };
        }) || [];

        // Recent activity with rich context
        const recentActivity = (dailyLogs || []).slice(0, 8).map(log => {
            const project = projects?.find(p => p.id === log.project_id);
            const client = clients?.find(c => c.id === project?.client_id);

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
        const criticalTasks = (tasks || [])
            .filter(task => {
                if (!task.end_date) return false;
                const dueDate = new Date(task.end_date);
                return dueDate <= tomorrow && task.status !== 'completed';
            })
            .slice(0, 6)
            .map(task => {
                const project = projects?.find(p => p.id === task.project_id);
                const crew = crews?.find(c => c.id === task.assigned_to);
                const client = clients?.find(c => c.id === project?.client_id);

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
        const equipmentUtilization = (equipment?.length ?? 0) > 0 ?
            Math.round(((equipment ?? []).filter(e => e.status === 'in_use').length / (equipment ?? []).length) * 100) : 0;

        // Team productivity metrics
        const teamMetrics = crews?.map(crew => {
            const crewTasks = tasks?.filter(t => t.assigned_to === crew.id) || [];
            const completedCrewTasks = crewTasks.filter(t => t.status === 'completed');
            const productivity = crewTasks.length > 0 ? (completedCrewTasks.length / crewTasks.length) * 100 : 0;

            return {
                id: crew.id,
                name: crew.name,
                activeTasks: crewTasks.filter(t => t.status === 'in_progress').length,
                completedTasks: completedCrewTasks.length,
                productivity: Math.round(productivity)
            };
        }) || [];

        // Financial overview
        const financialOverview = {
            totalRevenue,
            pendingRevenue,
            totalInvoices: invoices?.length || 0,
            paidInvoices: invoices?.filter(i => i.status === 'paid').length || 0,
            overdueInvoices: invoices?.filter(i => {
                if (!i.due_date || i.status === 'paid') return false;
                return new Date(i.due_date) < now;
            }).length || 0
        };

        return {
            stats: {
                activeProjects: activeProjects.length,
                totalProjects: projects?.length || 0,
                pendingTasks: pendingTasks.length,
                totalTasks: tasks?.length || 0,
                equipmentUtilization,
                totalEquipment: equipment?.length || 0,
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
            projectsWithProgress: projectsWithProgress.slice(0, 6),
            recentActivity,
            criticalTasks,
            teamMetrics: teamMetrics.slice(0, 4),
            financialOverview,
            equipmentStatus: {
                available: equipment?.filter(e => e.status === 'available').length || 0,
                inUse: equipment?.filter(e => e.status === 'in_use').length || 0,
                maintenance: maintenanceEquipment.length
            }
        };

    } catch (error) {
        console.error("Error fetching dashboard data:", error);

        // Return empty data structure on error
        return {
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
    }
}
