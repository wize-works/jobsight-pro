"use server";

import { fetchByBusinessWithQuery, fetchByBusiness } from "@/lib/db";

export interface ProjectProfitabilityData {
    id: string;
    name: string;
    clientName: string;
    status: string;
    budget: number;
    currentSpend: number;
    profit: number;
    profitMargin: number;
    progress: number;
    riskLevel: 'low' | 'medium' | 'high';

    // Cost breakdown
    laborCosts: number;
    materialCosts: number;
    equipmentCosts: number;
    overheadCosts: number;

    // Timeline data
    startDate: string | null;
    endDate: string | null;
    daysRemaining: number;

    // Performance metrics
    budgetUtilization: number;
    costOverrun: number;
    revenueToDate: number;
}

export interface ProjectProfitabilitySummary {
    totalProjects: number;
    totalBudget: number;
    totalSpend: number;
    totalProfit: number;
    averageMargin: number;
    profitableProjects: number;
    unprofitableProjects: number;
    atRiskProjects: number;
}

export async function getProjectProfitabilityData(
    businessId: string,
    filters?: {
        status?: string;
        clientId?: string;
        riskLevel?: string;
        dateRange?: { start: string; end: string };
    }
): Promise<{
    projects: ProjectProfitabilityData[];
    summary: ProjectProfitabilitySummary;
}> {
    try {        // Get projects with client data and aggregated costs
        const { data: projectsData, error: projectsError } = await fetchByBusinessWithQuery(businessId, {
            from: "projects",
            select: ["*"],
            joins: [
                {
                    table: "clients",
                    select: ["id", "name"]
                }
            ],
            orderBy: { column: "created_at", ascending: false }
        });

        if (projectsError) {
            console.error("Error fetching project profitability data:", projectsError);
            throw new Error("Failed to fetch project data");
        }        // Get material costs from daily logs
        const { data: materialCosts } = await fetchByBusiness("daily_log_materials", businessId, "*");

        // Get additional data for calculations
        const { data: dailyLogs } = await fetchByBusiness("daily_logs", businessId, ["project_id", "hours_worked"]);
        const { data: equipmentUsage } = await fetchByBusiness("equipment_usage", businessId, ["project_id"]);
        const { data: tasks } = await fetchByBusiness("tasks", businessId, ["project_id", "status"]);
        const { data: invoices } = await fetchByBusiness("invoices", businessId, ["project_id", "amount", "status"]);

        // Calculate costs and profitability for each project
        const now = new Date();
        const projects: ProjectProfitabilityData[] = (projectsData || []).map((project: any) => {
            // Calculate labor costs (assuming $50/hour average)
            const projectLogs = (dailyLogs || []).filter((log: any) => log.project_id === project.id);
            const laborHours = projectLogs.reduce((sum: number, log: any) => sum + (log.hours_worked || 0), 0);
            const laborCosts = laborHours * 50;

            // Calculate material costs for this project
            const projectMaterialCosts = (materialCosts || [])
                .filter((material: any) => material.project_id === project.id)
                .reduce((sum: number, material: any) => sum + ((material.quantity || 0) * (material.cost || 0)), 0);            // Estimate equipment costs ($100 per usage day)
            const projectEquipmentUsage = (equipmentUsage || []).filter((usage: any) => usage.project_id === project.id);
            const equipmentCosts = projectEquipmentUsage.length * 100;

            // Calculate overhead (15% of direct costs)
            const directCosts = laborCosts + projectMaterialCosts + equipmentCosts;
            const overheadCosts = directCosts * 0.15;

            const currentSpend = directCosts + overheadCosts;
            const budget = project.budget || 0;
            const revenueToDate = (project.total_invoiced || 0) + (project.pending_invoiced || 0);

            // Calculate profit and margins
            const profit = budget - currentSpend;
            const profitMargin = budget > 0 ? (profit / budget) * 100 : 0;
            const budgetUtilization = budget > 0 ? (currentSpend / budget) * 100 : 0;
            const costOverrun = Math.max(0, currentSpend - budget);            // Calculate progress
            const projectTasks = (tasks || []).filter((task: any) => task.project_id === project.id);
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter((task: any) => task.status === 'completed').length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Calculate timeline
            const startDate = project.start_date;
            const endDate = project.end_date;
            const daysRemaining = endDate ? Math.max(0, Math.ceil((new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

            // Determine risk level
            let riskLevel: 'low' | 'medium' | 'high' = 'low';
            if (budgetUtilization > 90 || profitMargin < 5) {
                riskLevel = 'high';
            } else if (budgetUtilization > 75 || profitMargin < 10) {
                riskLevel = 'medium';
            } return {
                id: project.id,
                name: project.name,
                clientName: project.clients?.name || 'No Client',
                status: project.status,
                budget,
                currentSpend,
                profit,
                profitMargin,
                progress: Math.round(progress),
                riskLevel,
                laborCosts,
                materialCosts: projectMaterialCosts,
                equipmentCosts,
                overheadCosts,
                startDate,
                endDate,
                daysRemaining,
                budgetUtilization,
                costOverrun,
                revenueToDate
            };
        });

        // Apply filters
        let filteredProjects = projects;
        if (filters) {
            if (filters.status && filters.status !== 'all') {
                filteredProjects = filteredProjects.filter(p => p.status === filters.status);
            }
            if (filters.clientId) {
                // Would need to join with client data to filter by client
                // For now, skip this filter
            }
            if (filters.riskLevel && filters.riskLevel !== 'all') {
                filteredProjects = filteredProjects.filter(p => p.riskLevel === filters.riskLevel);
            }
            if (filters.dateRange) {
                filteredProjects = filteredProjects.filter(p => {
                    if (!p.startDate) return false;
                    const projectStart = new Date(p.startDate);
                    const rangeStart = new Date(filters.dateRange!.start);
                    const rangeEnd = new Date(filters.dateRange!.end);
                    return projectStart >= rangeStart && projectStart <= rangeEnd;
                });
            }
        }

        // Calculate summary statistics
        const summary: ProjectProfitabilitySummary = {
            totalProjects: filteredProjects.length,
            totalBudget: filteredProjects.reduce((sum, p) => sum + p.budget, 0),
            totalSpend: filteredProjects.reduce((sum, p) => sum + p.currentSpend, 0),
            totalProfit: filteredProjects.reduce((sum, p) => sum + p.profit, 0),
            averageMargin: filteredProjects.length > 0
                ? filteredProjects.reduce((sum, p) => sum + p.profitMargin, 0) / filteredProjects.length
                : 0,
            profitableProjects: filteredProjects.filter(p => p.profit > 0).length,
            unprofitableProjects: filteredProjects.filter(p => p.profit <= 0).length,
            atRiskProjects: filteredProjects.filter(p => p.riskLevel === 'high').length
        };

        return {
            projects: filteredProjects,
            summary
        };

    } catch (error) {
        console.error("Error calculating project profitability:", error);

        // Return empty data on error
        return {
            projects: [],
            summary: {
                totalProjects: 0,
                totalBudget: 0,
                totalSpend: 0,
                totalProfit: 0,
                averageMargin: 0,
                profitableProjects: 0,
                unprofitableProjects: 0,
                atRiskProjects: 0
            }
        };
    }
}

export async function getProjectProfitabilityTrends(
    businessId: string,
    projectId?: string,
    days: number = 30
): Promise<{
    dates: string[];
    profits: number[];
    costs: number[];
    revenues: number[];
}> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // For now, return mock trend data
        // In a real implementation, this would query historical cost/revenue data
        const dates = [];
        const profits = [];
        const costs = [];
        const revenues = [];

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);

            // Mock data - replace with actual historical queries
            profits.push(Math.random() * 10000 + 5000);
            costs.push(Math.random() * 8000 + 3000);
            revenues.push(Math.random() * 12000 + 8000);
        }

        return { dates, profits, costs, revenues };

    } catch (error) {
        console.error("Error fetching profitability trends:", error);
        return {
            dates: [],
            profits: [],
            costs: [],
            revenues: []
        };
    }
}
