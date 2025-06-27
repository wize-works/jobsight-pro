/**
 * Client-Side Project Profitability Actions
 * 
 * Replaces src/app/actions/project-profitability.ts with offline-first implementation.
 * Works entirely offline by calculating from cached project, invoice, and cost data.
 */

import { getProjects } from './projects-client';
import { getInvoices } from './invoices-client';
import { getInvoiceItems } from './invoice-items-client';
import { getEquipmentUsage } from './equipment-usage-client';
import { getDailyLogMaterials } from './daily-log-materials-client';
import { getDailyLogs } from './daily-logs-client';
import { getTasks } from './tasks-client';

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
    projectedFinalCost: number;
    estimatedCompletion: string | null;
}

/**
 * Calculate project profitability data - works offline
 */
export const calculateProjectProfitability = async (businessId: string, projectId: string): Promise<ProjectProfitabilityData | null> => {
    try {
        // Get base project data
        const projects = await getProjects(businessId);
        const project = projects.find(p => p.id === projectId);

        if (!project) {
            console.error('Project not found:', projectId);
            return null;
        }

        // Get related cost data
        const [invoices, invoiceItems, equipmentUsage, materials, dailyLogs, tasks] = await Promise.all([
            getInvoices(businessId),
            getInvoiceItems(businessId),
            getEquipmentUsage(businessId, undefined, projectId),
            getDailyLogMaterials(businessId),
            getDailyLogs(businessId),
            getTasks(businessId),
        ]);

        // Filter data for this project
        const projectInvoices = invoices.filter(inv => inv.project_id === projectId);
        const projectDailyLogs = dailyLogs.filter(log => log.project_id === projectId);
        const projectTasks = tasks.filter(task => task.project_id === projectId);

        // Get materials for project daily logs
        const projectLogIds = projectDailyLogs.map(log => log.id);
        const projectMaterials = materials.filter(mat =>
            projectLogIds.includes(mat.daily_log_id || '')
        );

        // Calculate costs
        const materialCosts = projectMaterials.reduce((sum, material) => {
            const quantity = material.quantity || 0;
            const cost = material.cost || 0;
            return sum + (quantity * cost);
        }, 0);

        const equipmentCosts = equipmentUsage.reduce((sum, usage) => {
            // Estimate equipment cost based on hours and a rate
            const hours = usage.hours_used || 0;
            const estimatedHourlyRate = 50; // TODO: Get actual equipment rates
            return sum + (hours * estimatedHourlyRate);
        }, 0);

        // Calculate labor costs (estimate from daily logs)
        const laborCosts = projectDailyLogs.reduce((sum, log) => {
            const hours = log.hours_worked || 0;
            const estimatedHourlyRate = 25; // TODO: Get actual labor rates
            return sum + (hours * estimatedHourlyRate);
        }, 0);

        // Calculate overhead (10% of direct costs)
        const directCosts = materialCosts + equipmentCosts + laborCosts;
        const overheadCosts = directCosts * 0.10;

        const currentSpend = directCosts + overheadCosts;
        const budget = project.budget || 0;
        const profit = budget - currentSpend;
        const profitMargin = budget > 0 ? (profit / budget) * 100 : 0;

        // Calculate progress based on completed tasks
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate timeline data
        const now = new Date();
        const startDate = project.start_date;
        const endDate = project.end_date;
        const daysRemaining = endDate ? Math.ceil((new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        // Calculate risk level
        const budgetUtilization = budget > 0 ? (currentSpend / budget) * 100 : 0;
        const costOverrun = currentSpend - budget;

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (budgetUtilization > 90 || costOverrun > 0) {
            riskLevel = 'high';
        } else if (budgetUtilization > 75 || daysRemaining < 7) {
            riskLevel = 'medium';
        }

        // Project final cost based on current progress
        const projectedFinalCost = progress > 0 ? (currentSpend / progress) * 100 : currentSpend;

        // Estimate completion date based on current progress
        let estimatedCompletion: string | null = null;
        if (progress > 0 && startDate) {
            const projectStart = new Date(startDate);
            const daysElapsed = Math.ceil((now.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
            const estimatedTotalDays = (daysElapsed / progress) * 100;
            const estimatedEnd = new Date(projectStart);
            estimatedEnd.setDate(estimatedEnd.getDate() + estimatedTotalDays);
            estimatedCompletion = estimatedEnd.toISOString();
        }

        return {
            id: project.id,
            name: project.name,
            clientName: 'Loading...', // TODO: Get from client data
            status: project.status || 'unknown',
            budget,
            currentSpend,
            profit,
            profitMargin,
            progress,
            riskLevel,
            laborCosts,
            materialCosts,
            equipmentCosts,
            overheadCosts,
            startDate,
            endDate,
            daysRemaining,
            budgetUtilization,
            costOverrun,
            projectedFinalCost,
            estimatedCompletion,
        };

    } catch (err) {
        console.error("Error calculating project profitability:", err);
        return null;
    }
};

/**
 * Get profitability data for all projects - works offline
 */
export const getAllProjectsProfitability = async (businessId: string): Promise<ProjectProfitabilityData[]> => {
    try {
        const projects = await getProjects(businessId);
        const profitabilityData: ProjectProfitabilityData[] = [];

        for (const project of projects) {
            const profitability = await calculateProjectProfitability(businessId, project.id);
            if (profitability) {
                profitabilityData.push(profitability);
            }
        }

        return profitabilityData;
    } catch (err) {
        console.error("Error getting all projects profitability:", err);
        return [];
    }
};

/**
 * Get projects at risk - works offline
 */
export const getProjectsAtRisk = async (businessId: string): Promise<ProjectProfitabilityData[]> => {
    try {
        const allProjects = await getAllProjectsProfitability(businessId);
        return allProjects.filter(project => project.riskLevel === 'high');
    } catch (err) {
        console.error("Error getting projects at risk:", err);
        return [];
    }
};

/**
 * Get most profitable projects - works offline
 */
export const getMostProfitableProjects = async (businessId: string, limit: number = 10): Promise<ProjectProfitabilityData[]> => {
    try {
        const allProjects = await getAllProjectsProfitability(businessId);
        return allProjects
            .sort((a, b) => b.profit - a.profit)
            .slice(0, limit);
    } catch (err) {
        console.error("Error getting most profitable projects:", err);
        return [];
    }
};

/**
 * Get projects over budget - works offline
 */
export const getProjectsOverBudget = async (businessId: string): Promise<ProjectProfitabilityData[]> => {
    try {
        const allProjects = await getAllProjectsProfitability(businessId);
        return allProjects.filter(project => project.costOverrun > 0);
    } catch (err) {
        console.error("Error getting projects over budget:", err);
        return [];
    }
};

/**
 * Get business profitability summary - works offline
 */
export const getBusinessProfitabilitySummary = async (businessId: string): Promise<{
    totalProjects: number;
    totalBudget: number;
    totalSpend: number;
    totalProfit: number;
    averageProfitMargin: number;
    projectsAtRisk: number;
    projectsOverBudget: number;
    mostProfitableProject: ProjectProfitabilityData | null;
    leastProfitableProject: ProjectProfitabilityData | null;
}> => {
    try {
        const allProjects = await getAllProjectsProfitability(businessId);

        if (allProjects.length === 0) {
            return {
                totalProjects: 0,
                totalBudget: 0,
                totalSpend: 0,
                totalProfit: 0,
                averageProfitMargin: 0,
                projectsAtRisk: 0,
                projectsOverBudget: 0,
                mostProfitableProject: null,
                leastProfitableProject: null,
            };
        }

        const summary = {
            totalProjects: allProjects.length,
            totalBudget: allProjects.reduce((sum, p) => sum + p.budget, 0),
            totalSpend: allProjects.reduce((sum, p) => sum + p.currentSpend, 0),
            totalProfit: allProjects.reduce((sum, p) => sum + p.profit, 0),
            averageProfitMargin: allProjects.reduce((sum, p) => sum + p.profitMargin, 0) / allProjects.length,
            projectsAtRisk: allProjects.filter(p => p.riskLevel === 'high').length,
            projectsOverBudget: allProjects.filter(p => p.costOverrun > 0).length,
            mostProfitableProject: allProjects.reduce((max, p) => p.profit > max.profit ? p : max, allProjects[0]),
            leastProfitableProject: allProjects.reduce((min, p) => p.profit < min.profit ? p : min, allProjects[0]),
        };

        return summary;
    } catch (err) {
        console.error("Error getting business profitability summary:", err);
        return {
            totalProjects: 0,
            totalBudget: 0,
            totalSpend: 0,
            totalProfit: 0,
            averageProfitMargin: 0,
            projectsAtRisk: 0,
            projectsOverBudget: 0,
            mostProfitableProject: null,
            leastProfitableProject: null,
        };
    }
};

/**
 * Get profitability trends over time - works offline
 */
export const getProfitabilityTrends = async (businessId: string, months: number = 12): Promise<{
    month: string;
    totalBudget: number;
    totalSpend: number;
    totalProfit: number;
    projectCount: number;
}[]> => {
    try {
        const allProjects = await getAllProjectsProfitability(businessId);
        const trends: Record<string, {
            totalBudget: number;
            totalSpend: number;
            totalProfit: number;
            projectCount: number;
        }> = {};

        const now = new Date();

        allProjects.forEach(project => {
            if (!project.startDate) return;

            const projectStart = new Date(project.startDate);
            const monthKey = `${projectStart.getFullYear()}-${String(projectStart.getMonth() + 1).padStart(2, '0')}`;

            // Only include projects from the last X months
            const monthsAgo = new Date();
            monthsAgo.setMonth(monthsAgo.getMonth() - months);

            if (projectStart >= monthsAgo) {
                if (!trends[monthKey]) {
                    trends[monthKey] = {
                        totalBudget: 0,
                        totalSpend: 0,
                        totalProfit: 0,
                        projectCount: 0,
                    };
                }

                trends[monthKey].totalBudget += project.budget;
                trends[monthKey].totalSpend += project.currentSpend;
                trends[monthKey].totalProfit += project.profit;
                trends[monthKey].projectCount++;
            }
        });

        return Object.entries(trends)
            .map(([month, data]) => ({
                month,
                ...data,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    } catch (err) {
        console.error("Error getting profitability trends:", err);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    calculateProjectProfitability as getProjectProfitability,
    getAllProjectsProfitability as getProjectsProfitabilityData,
    getBusinessProfitabilitySummary as getProfitabilitySummary,
};
