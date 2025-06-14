
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

        // Get project statistics
        const { data: projects, error: projectsError } = await fetchByBusiness(
            "projects",
            business.id,
            "id, name, status, created_at"
        );

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
        }

        // Get task statistics
        const { data: tasks, error: tasksError } = await fetchByBusiness(
            "tasks",
            business.id,
            "id, name, status, due_date, project_id"
        );

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        // Get equipment statistics
        const { data: equipment, error: equipmentError } = await fetchByBusiness(
            "equipment",
            business.id,
            "id, name, status"
        );

        if (equipmentError) {
            console.error("Error fetching equipment:", equipmentError);
        }

        // Get invoice statistics
        const { data: invoices, error: invoicesError } = await fetchByBusiness(
            "invoices",
            business.id,
            "id, total_amount, status"
        );

        if (invoicesError) {
            console.error("Error fetching invoices:", invoicesError);
        }

        // Get recent activity from daily logs and tasks
        const { data: recentLogs, error: logsError } = await supabase
            .from("daily_logs")
            .select(`
                id,
                notes,
                created_at,
                created_by,
                project_id,
                projects!inner(name),
                users!inner(first_name, last_name)
            `)
            .eq("business_id", business.id)
            .order("created_at", { ascending: false })
            .limit(5);

        if (logsError) {
            console.error("Error fetching recent logs:", logsError);
        }

        // Calculate statistics
        const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
        const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
        const equipmentInUse = equipment?.filter(e => e.status === 'in_use').length || 0;
        const totalEquipment = equipment?.length || 1;
        const equipmentUtilization = Math.round((equipmentInUse / totalEquipment) * 100);
        
        const unpaidInvoices = invoices?.filter(i => i.status === 'pending' || i.status === 'sent') || [];
        const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

        // Project status distribution
        const projectStatusData = {
            inProgress: projects?.filter(p => p.status === 'active').length || 0,
            completed: projects?.filter(p => p.status === 'completed').length || 0,
            onHold: projects?.filter(p => p.status === 'on_hold').length || 0,
            planning: projects?.filter(p => p.status === 'planning').length || 0,
        };

        // Format recent activity
        const recentActivity = (recentLogs || []).map(log => ({
            id: log.id,
            type: 'log_created' as const,
            message: `${log.users.first_name} ${log.users.last_name} added a daily log to ${log.projects.name}`,
            user: `${log.users.first_name} ${log.users.last_name}`,
            timestamp: log.created_at,
            projectId: log.project_id
        }));

        // Get upcoming tasks (next 7 days)
        const upcomingDate = new Date();
        upcomingDate.setDate(upcomingDate.getDate() + 7);
        
        const upcomingTasks = (tasks || [])
            .filter(task => {
                if (!task.due_date) return false;
                const dueDate = new Date(task.due_date);
                return dueDate >= new Date() && dueDate <= upcomingDate;
            })
            .slice(0, 10)
            .map(task => {
                const project = projects?.find(p => p.id === task.project_id);
                return {
                    id: task.id,
                    name: task.name,
                    projectName: project?.name || 'Unknown Project',
                    dueDate: task.due_date,
                    status: task.status
                };
            });

        return {
            stats: {
                activeProjects,
                pendingTasks,
                equipmentUtilization,
                unpaidInvoices: unpaidInvoices.length,
                unpaidAmount
            },
            projectStatusData,
            recentActivity,
            upcomingTasks
        };

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        
        // Return empty data structure on error
        return {
            stats: {
                activeProjects: 0,
                pendingTasks: 0,
                equipmentUtilization: 0,
                unpaidInvoices: 0,
                unpaidAmount: 0
            },
            projectStatusData: {
                inProgress: 0,
                completed: 0,
                onHold: 0,
                planning: 0
            },
            recentActivity: [],
            upcomingTasks: []
        };
    }
}
