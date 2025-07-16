/**
 * Daily Log Processing Service
 * Extracts billable items from daily logs and calculates costs using rate management
 */

import { DailyLog } from '@/types/daily-logs';
import { BillingRate } from '@/types/invoice-automation';
import { CrewMember } from '@/types/crew-members';
import { Equipment } from '@/types/equipment';
import { db } from '@/lib/offline/dexie-db';
import { getCrewMemberRates, getEquipmentRates } from './rate-management';

// Types for billable items extracted from daily logs
export interface BillableItem {
    id: string;
    dailyLogId: string;
    type: 'labor' | 'equipment' | 'material';
    sourceId: string;
    sourceName: string;
    quantity: number;
    unit: string;
    rate: number;
    subtotal: number;
    date: string;
    description?: string;
    metadata?: {
        // Labor specific
        isOvertime?: boolean;
        crewMemberId?: string;
        regularHours?: number;
        overtimeHours?: number;

        // Equipment specific
        equipmentId?: string;
        operatorId?: string;
        condition?: string;

        // Material specific
        supplier?: string;
        costPerUnit?: number;
    };
}

export interface DailyLogBillingSummary {
    dailyLogId: string;
    date: string;
    projectId: string;
    crewId?: string;
    totalHours: number;
    totalCost: number;
    billableItems: BillableItem[];
    breakdown: {
        labor: { count: number; total: number };
        equipment: { count: number; total: number };
        materials: { count: number; total: number };
    };
}

export interface ProcessingResult {
    success: boolean;
    data?: DailyLogBillingSummary;
    error?: string;
    warnings?: string[];
}

export interface BatchProcessingResult {
    success: boolean;
    data?: DailyLogBillingSummary[];
    error?: string;
    warnings?: string[];
    skipped?: { dailyLogId: string; reason: string }[];
}

/**
 * Process a single daily log to extract billable items and calculate costs
 */
export async function processDailyLogBilling(
    dailyLogId: string,
    businessId: string
): Promise<ProcessingResult> {
    try {
        // Get the daily log
        const dailyLog = await db.dailyLogs.get(dailyLogId);
        if (!dailyLog || dailyLog.business_id !== businessId) {
            return {
                success: false,
                error: 'Daily log not found or access denied'
            };
        }

        const warnings: string[] = [];
        const billableItems: BillableItem[] = [];

        // Process labor costs
        const laborResult = await processLaborCosts(dailyLog, warnings);
        billableItems.push(...laborResult);

        // Process equipment costs
        const equipmentResult = await processEquipmentCosts(dailyLog, warnings);
        billableItems.push(...equipmentResult);

        // Process material costs
        const materialResult = await processMaterialCosts(dailyLog, warnings);
        billableItems.push(...materialResult);

        // Calculate totals
        const totalCost = billableItems.reduce((sum, item) => sum + item.subtotal, 0);
        const totalHours = dailyLog.hours_worked || 0;

        // Create breakdown
        const breakdown = {
            labor: {
                count: billableItems.filter(item => item.type === 'labor').length,
                total: billableItems.filter(item => item.type === 'labor').reduce((sum, item) => sum + item.subtotal, 0)
            },
            equipment: {
                count: billableItems.filter(item => item.type === 'equipment').length,
                total: billableItems.filter(item => item.type === 'equipment').reduce((sum, item) => sum + item.subtotal, 0)
            },
            materials: {
                count: billableItems.filter(item => item.type === 'material').length,
                total: billableItems.filter(item => item.type === 'material').reduce((sum, item) => sum + item.subtotal, 0)
            }
        };

        const summary: DailyLogBillingSummary = {
            dailyLogId: dailyLog.id,
            date: dailyLog.date,
            projectId: dailyLog.project_id!,
            crewId: dailyLog.crew_id || undefined,
            totalHours,
            totalCost,
            billableItems,
            breakdown
        };

        return {
            success: true,
            data: summary,
            warnings: warnings.length > 0 ? warnings : undefined
        };

    } catch (error) {
        console.error('Error processing daily log billing:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Process labor costs from daily log
 */
async function processLaborCosts(
    dailyLog: DailyLog,
    warnings: string[]
): Promise<BillableItem[]> {
    const items: BillableItem[] = [];

    try {
        // Get crew members if crew is assigned
        if (dailyLog.crew_id) {
            const crewMembers = await db.crewMembers
                .where('crew_id')
                .equals(dailyLog.crew_id)
                .toArray();

            if (crewMembers.length === 0) {
                warnings.push(`No crew members found for crew ${dailyLog.crew_id}`);
                return items;
            }

            // Get rates for all crew members
            const crewMemberIds = crewMembers.map(cm => cm.id);
            const ratesResult = await getCrewMemberRates(crewMemberIds);

            if ('error' in ratesResult) {
                warnings.push(`Failed to get crew member rates: ${ratesResult.error}`);
                return items;
            }

            const rates = ratesResult;
            const regularHours = dailyLog.hours_worked || 0;
            const overtimeHours = dailyLog.overtime || 0;

            // Process each crew member
            for (const crewMember of crewMembers) {
                // Skip non-billable crew members
                if (!crewMember.is_billable) {
                    continue;
                }

                const memberRate = rates[crewMember.id];
                if (!memberRate) {
                    warnings.push(`No billing rate found for crew member ${crewMember.name}`);
                    continue;
                }

                // Calculate regular hours cost
                if (regularHours > 0) {
                    const regularCost = regularHours * memberRate.hourlyRate;
                    items.push({
                        id: `${dailyLog.id}-labor-${crewMember.id}-regular`,
                        dailyLogId: dailyLog.id,
                        type: 'labor',
                        sourceId: crewMember.id,
                        sourceName: crewMember.name,
                        quantity: regularHours,
                        unit: 'hours',
                        rate: memberRate.hourlyRate,
                        subtotal: regularCost,
                        date: dailyLog.date,
                        description: `Regular hours - ${crewMember.name}`,
                        metadata: {
                            isOvertime: false,
                            crewMemberId: crewMember.id,
                            regularHours: regularHours
                        }
                    });
                }

                // Calculate overtime hours cost
                if (overtimeHours > 0 && memberRate.overtimeRate) {
                    const overtimeCost = overtimeHours * memberRate.overtimeRate;
                    items.push({
                        id: `${dailyLog.id}-labor-${crewMember.id}-overtime`,
                        dailyLogId: dailyLog.id,
                        type: 'labor',
                        sourceId: crewMember.id,
                        sourceName: crewMember.name,
                        quantity: overtimeHours,
                        unit: 'hours',
                        rate: memberRate.overtimeRate,
                        subtotal: overtimeCost,
                        date: dailyLog.date,
                        description: `Overtime hours - ${crewMember.name}`,
                        metadata: {
                            isOvertime: true,
                            crewMemberId: crewMember.id,
                            overtimeHours: overtimeHours
                        }
                    });
                } else if (overtimeHours > 0) {
                    warnings.push(`No overtime rate set for crew member ${crewMember.name}, using regular rate`);
                    const overtimeCost = overtimeHours * memberRate.hourlyRate;
                    items.push({
                        id: `${dailyLog.id}-labor-${crewMember.id}-overtime-regular`,
                        dailyLogId: dailyLog.id,
                        type: 'labor',
                        sourceId: crewMember.id,
                        sourceName: crewMember.name,
                        quantity: overtimeHours,
                        unit: 'hours',
                        rate: memberRate.hourlyRate,
                        subtotal: overtimeCost,
                        date: dailyLog.date,
                        description: `Overtime hours (regular rate) - ${crewMember.name}`,
                        metadata: {
                            isOvertime: true,
                            crewMemberId: crewMember.id,
                            overtimeHours: overtimeHours
                        }
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error processing labor costs:', error);
        warnings.push(`Error processing labor costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return items;
}

/**
 * Process equipment costs from daily log
 */
async function processEquipmentCosts(
    dailyLog: DailyLog,
    warnings: string[]
): Promise<BillableItem[]> {
    const items: BillableItem[] = [];

    try {
        // Get equipment usage for this daily log
        const equipmentUsage = await db.dailyLogEquipment
            .where('daily_log_id')
            .equals(dailyLog.id)
            .toArray();

        if (equipmentUsage.length === 0) {
            return items;
        }

        // Get equipment details and rates
        const equipmentIds = equipmentUsage
            .map(eq => eq.equipment_id)
            .filter(id => id !== null) as string[];

        if (equipmentIds.length === 0) {
            warnings.push('Equipment usage recorded but no equipment IDs found');
            return items;
        }

        const equipment = await db.equipment.bulkGet(equipmentIds);
        const ratesResult = await getEquipmentRates(equipmentIds);

        if ('error' in ratesResult) {
            warnings.push(`Failed to get equipment rates: ${ratesResult.error}`);
            return items;
        }

        const rates = ratesResult;

        // Process each equipment usage
        for (const usage of equipmentUsage) {
            if (!usage.equipment_id) {
                warnings.push(`Equipment usage without equipment ID: ${usage.name}`);
                continue;
            }

            const equipmentItem = equipment.find(eq => eq?.id === usage.equipment_id);
            if (!equipmentItem) {
                warnings.push(`Equipment not found: ${usage.equipment_id}`);
                continue;
            }

            // Skip non-billable equipment
            if (!equipmentItem.is_billable) {
                continue;
            }

            const equipmentRate = rates[usage.equipment_id];
            if (!equipmentRate) {
                warnings.push(`No billing rate found for equipment ${equipmentItem.name}`);
                continue;
            }

            const hours = usage.hours || 0;
            if (hours <= 0) {
                warnings.push(`No hours recorded for equipment ${equipmentItem.name}`);
                continue;
            }

            const cost = hours * equipmentRate.hourlyRate;
            items.push({
                id: `${dailyLog.id}-equipment-${usage.equipment_id}`,
                dailyLogId: dailyLog.id,
                type: 'equipment',
                sourceId: usage.equipment_id,
                sourceName: equipmentItem.name,
                quantity: hours,
                unit: 'hours',
                rate: equipmentRate.hourlyRate,
                subtotal: cost,
                date: dailyLog.date,
                description: `Equipment usage - ${equipmentItem.name}`,
                metadata: {
                    equipmentId: usage.equipment_id,
                    operatorId: usage.crew_member_id || undefined,
                    condition: usage.condition || undefined
                }
            });
        }

    } catch (error) {
        console.error('Error processing equipment costs:', error);
        warnings.push(`Error processing equipment costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return items;
}

/**
 * Process material costs from daily log
 */
async function processMaterialCosts(
    dailyLog: DailyLog,
    warnings: string[]
): Promise<BillableItem[]> {
    const items: BillableItem[] = [];

    try {
        // Get materials used in this daily log
        const materials = await db.dailyLogMaterials
            .where('daily_log_id')
            .equals(dailyLog.id)
            .toArray();

        if (materials.length === 0) {
            return items;
        }

        // Process each material
        for (const material of materials) {
            const cost = material.cost || 0;
            const quantity = parseFloat(material.quantity?.toString() || '0') || 0;

            if (cost <= 0) {
                warnings.push(`No cost recorded for material ${material.name}`);
                continue;
            }

            if (quantity <= 0) {
                warnings.push(`No quantity recorded for material ${material.name}`);
                continue;
            }

            const costPerUnit = cost / quantity;

            items.push({
                id: `${dailyLog.id}-material-${material.id}`,
                dailyLogId: dailyLog.id,
                type: 'material',
                sourceId: material.id,
                sourceName: material.name,
                quantity: quantity,
                unit: 'units', // Could be enhanced to track actual units
                rate: costPerUnit,
                subtotal: cost,
                date: dailyLog.date,
                description: `Material - ${material.name}`,
                metadata: {
                    supplier: material.supplier || undefined,
                    costPerUnit: costPerUnit
                }
            });
        }

    } catch (error) {
        console.error('Error processing material costs:', error);
        warnings.push(`Error processing material costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return items;
}

/**
 * Process multiple daily logs for billing
 */
export async function batchProcessDailyLogs(
    dailyLogIds: string[],
    businessId: string
): Promise<BatchProcessingResult> {
    const results: DailyLogBillingSummary[] = [];
    const warnings: string[] = [];
    const skipped: { dailyLogId: string; reason: string }[] = [];

    try {
        for (const dailyLogId of dailyLogIds) {
            const result = await processDailyLogBilling(dailyLogId, businessId);

            if (result.success && result.data) {
                results.push(result.data);
                if (result.warnings) {
                    warnings.push(...result.warnings);
                }
            } else {
                skipped.push({
                    dailyLogId,
                    reason: result.error || 'Unknown error'
                });
            }
        }

        return {
            success: true,
            data: results,
            warnings: warnings.length > 0 ? warnings : undefined,
            skipped: skipped.length > 0 ? skipped : undefined
        };

    } catch (error) {
        console.error('Error in batch processing daily logs:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Get daily logs for a date range that haven't been processed for billing
 */
export async function getUnprocessedDailyLogs(
    businessId: string,
    startDate: string,
    endDate: string
): Promise<DailyLog[]> {
    try {
        // Get all daily logs in the date range
        const dailyLogs = await db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => log.date >= startDate && log.date <= endDate)
            .toArray();

        // Filter out logs that have already been processed
        // This would check against the daily_log_invoice_items table when it exists
        // For now, return all logs as unprocessed

        return dailyLogs;

    } catch (error) {
        console.error('Error getting unprocessed daily logs:', error);
        return [];
    }
}

/**
 * Calculate aggregated costs for a project over a date range
 */
export async function calculateProjectCosts(
    businessId: string,
    projectId: string,
    startDate: string,
    endDate: string
): Promise<{
    success: boolean;
    data?: {
        projectId: string;
        totalCost: number;
        totalHours: number;
        breakdown: {
            labor: { total: number; hours: number };
            equipment: { total: number; hours: number };
            materials: { total: number; items: number };
        };
        dailyLogSummaries: DailyLogBillingSummary[];
    };
    error?: string;
}> {
    try {
        // Get daily logs for project in date range
        const dailyLogs = await db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log =>
                log.project_id === projectId &&
                log.date >= startDate &&
                log.date <= endDate
            )
            .toArray();

        if (dailyLogs.length === 0) {
            return {
                success: true,
                data: {
                    projectId,
                    totalCost: 0,
                    totalHours: 0,
                    breakdown: {
                        labor: { total: 0, hours: 0 },
                        equipment: { total: 0, hours: 0 },
                        materials: { total: 0, items: 0 }
                    },
                    dailyLogSummaries: []
                }
            };
        }

        // Process each daily log
        const dailyLogIds = dailyLogs.map(log => log.id);
        const batchResult = await batchProcessDailyLogs(dailyLogIds, businessId);

        if (!batchResult.success || !batchResult.data) {
            return {
                success: false,
                error: batchResult.error || 'Failed to process daily logs'
            };
        }

        // Aggregate totals
        const summaries = batchResult.data;
        const totalCost = summaries.reduce((sum, summary) => sum + summary.totalCost, 0);
        const totalHours = summaries.reduce((sum, summary) => sum + summary.totalHours, 0);

        // Calculate breakdown
        const laborItems = summaries.flatMap(s => s.billableItems.filter(i => i.type === 'labor'));
        const equipmentItems = summaries.flatMap(s => s.billableItems.filter(i => i.type === 'equipment'));
        const materialItems = summaries.flatMap(s => s.billableItems.filter(i => i.type === 'material'));

        const breakdown = {
            labor: {
                total: laborItems.reduce((sum, item) => sum + item.subtotal, 0),
                hours: laborItems.reduce((sum, item) => sum + item.quantity, 0)
            },
            equipment: {
                total: equipmentItems.reduce((sum, item) => sum + item.subtotal, 0),
                hours: equipmentItems.reduce((sum, item) => sum + item.quantity, 0)
            },
            materials: {
                total: materialItems.reduce((sum, item) => sum + item.subtotal, 0),
                items: materialItems.length
            }
        };

        return {
            success: true,
            data: {
                projectId,
                totalCost,
                totalHours,
                breakdown,
                dailyLogSummaries: summaries
            }
        };

    } catch (error) {
        console.error('Error calculating project costs:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
