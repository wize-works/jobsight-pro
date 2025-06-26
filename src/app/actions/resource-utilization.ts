"use server";

import { fetchByBusiness } from "@/lib/db";

interface CrewUtilizationData {
    id: string;
    name: string;
    type: string;
    totalHours: number;
    activeHours: number;
    utilizationRate: number;
    activeProjects: number;
    efficiency: number;
    averageHoursPerDay: number;
}

interface EquipmentUtilizationData {
    id: string;
    name: string;
    type: string;
    totalHours: number;
    activeHours: number;
    utilizationRate: number;
    maintenanceHours: number;
    downTime: number;
    costPerHour: number;
    revenue: number;
}

interface ResourceUtilizationSummary {
    totalCrews: number;
    averageCrewUtilization: number;
    totalEquipment: number;
    averageEquipmentUtilization: number;
    highUtilizationCrews: number;
    highUtilizationEquipment: number;
    idleCrews: number;
    idleEquipment: number;
}

interface ResourceUtilizationFilters {
    dateRange?: { start: string; end: string };
    crewType?: string;
    equipmentType?: string;
}

export async function getResourceUtilizationData(
    businessId: string,
    filters?: ResourceUtilizationFilters
): Promise<{
    crews: CrewUtilizationData[];
    equipment: EquipmentUtilizationData[];
    summary: ResourceUtilizationSummary;
}> {
    try {
        // Set default date range (last 30 days)
        const endDate = filters?.dateRange?.end || new Date().toISOString().split('T')[0];
        const startDate = filters?.dateRange?.start ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Get crew utilization data
        const crewData = await getCrewUtilizationData(businessId, startDate, endDate, filters?.crewType);

        // Get equipment utilization data
        const equipmentData = await getEquipmentUtilizationData(businessId, startDate, endDate, filters?.equipmentType);

        // Calculate summary statistics
        const avgCrewUtilization = crewData.length > 0
            ? crewData.reduce((sum, crew) => sum + crew.utilizationRate, 0) / crewData.length
            : 0;

        const avgEquipmentUtilization = equipmentData.length > 0
            ? equipmentData.reduce((sum, equipment) => sum + equipment.utilizationRate, 0) / equipmentData.length
            : 0;

        const summary: ResourceUtilizationSummary = {
            totalCrews: crewData.length,
            averageCrewUtilization: avgCrewUtilization,
            totalEquipment: equipmentData.length,
            averageEquipmentUtilization: avgEquipmentUtilization,
            highUtilizationCrews: crewData.filter(crew => crew.utilizationRate > 80).length,
            highUtilizationEquipment: equipmentData.filter(equipment => equipment.utilizationRate > 80).length,
            idleCrews: crewData.filter(crew => crew.utilizationRate < 50).length,
            idleEquipment: equipmentData.filter(equipment => equipment.utilizationRate < 50).length,
        };

        return {
            crews: crewData,
            equipment: equipmentData,
            summary
        };
    } catch (error) {
        console.error("Error fetching resource utilization data:", error);
        throw new Error("Failed to fetch resource utilization data");
    }
}

async function getCrewUtilizationData(
    businessId: string,
    startDate: string,
    endDate: string,
    crewTypeFilter?: string
): Promise<CrewUtilizationData[]> {
    try {
        // Get all crews with their specialty (type)
        const { data: crews, error: crewError } = await fetchByBusiness("crews", businessId, "*", {
            orderBy: { column: "name", ascending: true }
        });

        if (crewError) {
            console.error("Error fetching crews:", crewError);
            return [];
        }

        if (!crews || crews.length === 0) {
            return [];
        }        // Filter crews by type if specified
        const filteredCrews = crewTypeFilter && crewTypeFilter !== 'all'
            ? crews.filter((crew: any) => crew.specialty?.toLowerCase().includes(crewTypeFilter.toLowerCase()))
            : crews;

        // Get daily logs for the date range to calculate worked hours
        const { data: dailyLogs } = await fetchByBusiness("daily_logs", businessId, "*", {
            filter: {
                date: { gte: startDate, lte: endDate },
                crew_id: { in: filteredCrews.map((crew: any) => crew.id) }
            }
        });

        // Get project assignments for crews to count active projects
        const { data: projectCrews } = await fetchByBusiness("project_crews", businessId, "*", {
            filter: {
                crew_id: { in: filteredCrews.map((crew: any) => crew.id) },
                start_date: { lte: endDate },
                end_date: { gte: startDate, neq: null }
            }
        });

        // Calculate utilization data for each crew
        const crewUtilizationData: CrewUtilizationData[] = filteredCrews.map((crew: any) => {
            // Calculate hours worked from daily logs
            const crewLogs = dailyLogs?.filter((log: any) => log.crew_id === crew.id) || [];
            const totalWorkedHours = crewLogs.reduce((sum: number, log: any) => sum + (log.hours_worked || 0), 0);
            const totalOvertimeHours = crewLogs.reduce((sum: number, log: any) => sum + (log.overtime || 0), 0);
            const activeHours = totalWorkedHours + totalOvertimeHours;

            // Calculate total available hours (working days in period * 8 hours)
            const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
            const workingDays = Math.floor(daysDiff * (5 / 7)); // Assume 5 working days per week
            const totalHours = workingDays * 8; // 8 hours per day standard

            // Calculate utilization rate
            const utilizationRate = totalHours > 0 ? (activeHours / totalHours) * 100 : 0;

            // Count active projects
            const activeProjects = projectCrews?.filter((pc: any) => pc.crew_id === crew.id).length || 0;

            // Calculate efficiency (mock calculation based on completed vs planned work)
            const efficiency = Math.min(95, Math.max(70, utilizationRate * 1.1)); // Mock efficiency

            // Calculate average hours per day
            const averageHoursPerDay = workingDays > 0 ? activeHours / workingDays : 0;

            return {
                id: crew.id,
                name: crew.name,
                type: crew.specialty || 'General',
                totalHours,
                activeHours,
                utilizationRate: Math.min(100, utilizationRate),
                activeProjects,
                efficiency,
                averageHoursPerDay
            };
        });

        return crewUtilizationData;
    } catch (error) {
        console.error("Error calculating crew utilization:", error);
        return [];
    }
}

async function getEquipmentUtilizationData(
    businessId: string,
    startDate: string,
    endDate: string,
    equipmentTypeFilter?: string
): Promise<EquipmentUtilizationData[]> {
    try {
        // Get all equipment
        const { data: equipment, error: equipmentError } = await fetchByBusiness("equipment", businessId, "*", {
            filter: { status: { neq: "retired" } },
            orderBy: { column: "name", ascending: true }
        });

        if (equipmentError) {
            console.error("Error fetching equipment:", equipmentError);
            return [];
        }

        if (!equipment || equipment.length === 0) {
            return [];
        }        // Filter equipment by type if specified
        const filteredEquipment = equipmentTypeFilter && equipmentTypeFilter !== 'all'
            ? equipment.filter((eq: any) => eq.type?.toLowerCase().includes(equipmentTypeFilter.toLowerCase()))
            : equipment;

        // Get equipment usage for the date range
        const { data: equipmentUsage } = await fetchByBusiness("equipment_usage", businessId, "*", {
            filter: {
                equipment_id: { in: filteredEquipment.map((eq: any) => eq.id) },
                start_date: { gte: startDate, lte: endDate }
            }
        });

        // Get maintenance records for the date range
        const { data: maintenanceRecords } = await fetchByBusiness("equipment_maintenance", businessId, "*", {
            filter: {
                equipment_id: { in: filteredEquipment.map((eq: any) => eq.id) },
                maintenance_date: { gte: startDate, lte: endDate }
            }
        });

        // Get equipment assignments to calculate revenue potential
        const { data: equipmentAssignments } = await fetchByBusiness("equipment_assignments", businessId, "*", {
            filter: {
                equipment_id: { in: filteredEquipment.map((eq: any) => eq.id) },
                start_date: { lte: endDate },
                end_date: { gte: startDate, neq: null }
            }
        });

        // Calculate utilization data for each equipment
        const equipmentUtilizationData: EquipmentUtilizationData[] = filteredEquipment.map((eq: any) => {
            // Calculate hours used from equipment usage
            const usage = equipmentUsage?.filter((usage: any) => usage.equipment_id === eq.id) || [];
            const activeHours = usage.reduce((sum: number, usage: any) => sum + (usage.hours_used || 0), 0);

            // Calculate maintenance hours
            const maintenance = maintenanceRecords?.filter((record: any) => record.equipment_id === eq.id) || [];
            const maintenanceHours = maintenance.length * 4; // Assume 4 hours average per maintenance

            // Calculate total available hours (working days in period * 8 hours)
            const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
            const workingDays = Math.floor(daysDiff * (5 / 7)); // Assume 5 working days per week
            const totalHours = workingDays * 8; // 8 hours per day standard

            // Calculate downtime (maintenance + idle time)
            const downTime = maintenanceHours + Math.max(0, totalHours - activeHours - maintenanceHours);

            // Calculate utilization rate
            const utilizationRate = totalHours > 0 ? (activeHours / totalHours) * 100 : 0;

            // Calculate cost per hour (based on purchase price or estimate)
            const costPerHour = calculateEquipmentCostPerHour(eq);

            // Calculate revenue (cost per hour * active hours * markup)
            const revenue = activeHours * costPerHour * 2; // 2x markup for revenue

            return {
                id: eq.id,
                name: eq.name,
                type: eq.type || 'Unknown',
                totalHours,
                activeHours,
                utilizationRate: Math.min(100, utilizationRate),
                maintenanceHours,
                downTime,
                costPerHour,
                revenue
            };
        });

        return equipmentUtilizationData;
    } catch (error) {
        console.error("Error calculating equipment utilization:", error);
        return [];
    }
}

function calculateEquipmentCostPerHour(equipment: any): number {
    // Simple cost calculation based on equipment type and purchase price
    const baseCost = {
        'Heavy Machinery': 150,
        'Concrete': 75,
        'Lifting': 200,
        'Material Handling': 50,
        'Vehicle': 80,
        'Tool': 25
    };

    // Use equipment type for base cost, or fall back to purchase price calculation
    let costPerHour = baseCost[equipment.type as keyof typeof baseCost] || 100;

    // If we have purchase price, calculate based on depreciation
    if (equipment.purchase_price && equipment.purchase_price > 0) {
        // Assume 5-year depreciation, 2000 hours per year usage
        const hourlyDepreciation = equipment.purchase_price / (5 * 2000);
        costPerHour = hourlyDepreciation * 1.5; // Add maintenance and operational costs
    }

    return Math.round(costPerHour);
}
