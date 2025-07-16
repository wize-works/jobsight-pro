/**
 * Invoice Automation Service
 * Handles automated invoice generation from daily logs based on configurable rules
 */

import { InvoiceAutomationRule, RuleConfig, InvoiceGenerationResult } from '@/types/invoice-automation';
import { DailyLogBillingSummary, BillableItem, batchProcessDailyLogs } from './daily-log-billing';
import { Invoice, InvoiceInsert } from '@/types/invoices';
import { InvoiceItem, InvoiceItemInsert } from '@/types/invoice-items';
import { DailyLog } from '@/types/daily-logs';
import { Project } from '@/types/projects';
import { Client } from '@/types/clients';
import { db } from '@/lib/offline/dexie-db';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string | null> {
    if (typeof window !== 'undefined') {
        const cachedAuthId = window.localStorage.getItem('cached_auth_id');
        if (cachedAuthId) {
            return cachedAuthId;
        }
    }
    return null;
}

// Helper function to add to sync queue
async function addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    businessId: string,
    userId?: string
): Promise<void> {
    const syncItem = {
        id: uuidv4(),
        table,
        operation,
        data,
        businessId,
        userId,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    };

    await db.syncQueue.add(syncItem);
}

/**
 * Create a new invoice automation rule
 */
export async function createInvoiceAutomationRule(
    businessId: string,
    ruleData: Omit<InvoiceAutomationRule, 'id' | 'businessId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<{ success: boolean; data?: InvoiceAutomationRule; error?: string }> {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        const now = new Date().toISOString();
        const ruleId = uuidv4();

        const newRule: InvoiceAutomationRule = {
            id: ruleId,
            businessId,
            ...ruleData,
            createdAt: now,
            createdBy: currentUserId,
            updatedAt: now,
            updatedBy: currentUserId
        };

        // Store locally
        await db.invoiceAutomationRules.put(newRule);

        // Queue for sync
        await addToSyncQueue('invoice_automation_rules', 'insert', newRule, businessId, currentUserId);

        return {
            success: true,
            data: newRule
        };

    } catch (error) {
        console.error('Error creating invoice automation rule:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create rule'
        };
    }
}

/**
 * Get invoice automation rules for a business
 */
export async function getInvoiceAutomationRules(
    businessId: string,
    filters?: {
        clientId?: string;
        projectId?: string;
        isActive?: boolean;
        ruleType?: string;
    }
): Promise<InvoiceAutomationRule[]> {
    try {
        let query = db.invoiceAutomationRules.where('businessId').equals(businessId);

        if (filters?.clientId) {
            query = query.and(rule => rule.clientId === filters.clientId);
        }

        if (filters?.projectId) {
            query = query.and(rule => rule.projectId === filters.projectId);
        }

        if (filters?.isActive !== undefined) {
            query = query.and(rule => rule.isActive === filters.isActive);
        }

        if (filters?.ruleType) {
            query = query.and(rule => rule.ruleType === filters.ruleType);
        }

        const rules = await query.toArray();
        return rules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    } catch (error) {
        console.error('Error getting invoice automation rules:', error);
        return [];
    }
}

/**
 * Update an invoice automation rule
 */
export async function updateInvoiceAutomationRule(
    businessId: string,
    ruleId: string,
    updates: Partial<InvoiceAutomationRule>
): Promise<{ success: boolean; data?: InvoiceAutomationRule; error?: string }> {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        const existingRule = await db.invoiceAutomationRules.get(ruleId);
        if (!existingRule || existingRule.businessId !== businessId) {
            return {
                success: false,
                error: 'Rule not found'
            };
        }

        const now = new Date().toISOString();
        const updatedRule: InvoiceAutomationRule = {
            ...existingRule,
            ...updates,
            updatedAt: now,
            updatedBy: currentUserId
        };

        // Store locally
        await db.invoiceAutomationRules.put(updatedRule);

        // Queue for sync
        await addToSyncQueue('invoice_automation_rules', 'update', updatedRule, businessId, currentUserId);

        return {
            success: true,
            data: updatedRule
        };

    } catch (error) {
        console.error('Error updating invoice automation rule:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update rule'
        };
    }
}

/**
 * Delete an invoice automation rule
 */
export async function deleteInvoiceAutomationRule(
    businessId: string,
    ruleId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        const existingRule = await db.invoiceAutomationRules.get(ruleId);
        if (!existingRule || existingRule.businessId !== businessId) {
            return {
                success: false,
                error: 'Rule not found'
            };
        }

        // Remove locally
        await db.invoiceAutomationRules.delete(ruleId);

        // Queue for sync
        await addToSyncQueue('invoice_automation_rules', 'delete', { id: ruleId }, businessId, currentUserId);

        return {
            success: true
        };

    } catch (error) {
        console.error('Error deleting invoice automation rule:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete rule'
        };
    }
}

/**
 * Generate invoice from daily logs based on automation rule
 */
export async function generateInvoiceFromRule(
    businessId: string,
    ruleId: string,
    dateRange: {
        startDate: string;
        endDate: string;
    }
): Promise<InvoiceGenerationResult> {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Get the automation rule
        const rule = await db.invoiceAutomationRules.get(ruleId);
        if (!rule || rule.businessId !== businessId) {
            return {
                success: false,
                error: 'Automation rule not found'
            };
        }

        if (!rule.isActive) {
            return {
                success: false,
                error: 'Automation rule is not active'
            };
        }

        // Get daily logs for the date range
        const dailyLogs = await db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => {
                const logDate = log.date;
                return logDate >= dateRange.startDate && logDate <= dateRange.endDate;
            })
            .toArray();

        // Filter by project if specified in rule
        const filteredLogs = rule.projectId
            ? dailyLogs.filter(log => log.project_id === rule.projectId)
            : dailyLogs;

        if (filteredLogs.length === 0) {
            return {
                success: false,
                error: 'No daily logs found for the specified criteria'
            };
        }

        // Process daily logs to get billing data
        const dailyLogIds = filteredLogs.map(log => log.id);
        const billingResult = await batchProcessDailyLogs(dailyLogIds, businessId);

        if (!billingResult.success || !billingResult.data) {
            return {
                success: false,
                error: billingResult.error || 'Failed to process daily logs'
            };
        }

        // Generate invoice based on rule type
        const invoiceResult = await generateInvoiceFromBillingData(
            businessId,
            rule,
            billingResult.data,
            dateRange
        );

        return invoiceResult;

    } catch (error) {
        console.error('Error generating invoice from rule:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate invoice'
        };
    }
}

/**
 * Generate invoice from processed billing data
 */
async function generateInvoiceFromBillingData(
    businessId: string,
    rule: InvoiceAutomationRule,
    billingData: DailyLogBillingSummary[],
    dateRange: { startDate: string; endDate: string }
): Promise<InvoiceGenerationResult> {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Get client and project information
        const client = await db.clients.get(rule.clientId);
        if (!client) {
            return {
                success: false,
                error: 'Client not found'
            };
        }

        const project = rule.projectId ? await db.projects.get(rule.projectId) : null;

        if (rule.projectId && !project) {
            return {
                success: false,
                error: 'Project not found'
            };
        }

        // Calculate totals
        const totalAmount = billingData.reduce((sum, summary) => sum + summary.totalCost, 0);
        const totalHours = billingData.reduce((sum, summary) => sum + summary.totalHours, 0);

        // Check minimum hours requirement
        if (totalHours < rule.minimumHours) {
            return {
                success: false,
                error: `Minimum hours requirement not met (${totalHours} < ${rule.minimumHours})`
            };
        }

        // Generate invoice
        const invoiceId = uuidv4();
        const now = new Date().toISOString();
        const invoiceNumber = await generateInvoiceNumber(businessId);

        const invoice: Invoice = {
            id: invoiceId,
            business_id: businessId,
            client_id: rule.clientId,
            project_id: rule.projectId || '',
            invoice_number: invoiceNumber,
            amount: totalAmount,
            tax_rate: 0, // Could be calculated based on business settings
            status: rule.requireApproval ? 'pending_approval' : 'draft',
            due_date: calculateDueDate(rule),
            issue_date: now.split('T')[0],
            paid_date: null,
            payment_method: null,
            notes: `Generated automatically from daily logs (${dateRange.startDate} to ${dateRange.endDate})`,
            approved_by: null,
            approved_at: null,
            auto_generated: true,
            source_rule_id: rule.id,
            created_at: now,
            created_by: currentUserId,
            updated_at: now,
            updated_by: currentUserId
        };

        // Store invoice locally
        await db.invoices.put(invoice);

        // Generate invoice items
        const invoiceItems = await generateInvoiceItems(
            businessId,
            invoiceId,
            billingData,
            rule,
            currentUserId
        );

        // Store invoice items locally
        await db.invoiceItems.bulkPut(invoiceItems);

        // Queue for sync
        await addToSyncQueue('invoices', 'insert', invoice, businessId, currentUserId);
        for (const item of invoiceItems) {
            await addToSyncQueue('invoice_items', 'insert', item, businessId, currentUserId);
        }

        return {
            success: true,
            data: {
                invoice,
                invoiceItems,
                billingData,
                rule
            }
        };

    } catch (error) {
        console.error('Error generating invoice from billing data:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate invoice'
        };
    }
}

/**
 * Generate invoice items from billing data
 */
async function generateInvoiceItems(
    businessId: string,
    invoiceId: string,
    billingData: DailyLogBillingSummary[],
    rule: InvoiceAutomationRule,
    currentUserId: string
): Promise<InvoiceItem[]> {
    const items: InvoiceItem[] = [];
    const now = new Date().toISOString();

    // Group billable items by type and source
    const groupedItems = new Map<string, {
        type: string;
        sourceName: string;
        totalQuantity: number;
        totalAmount: number;
        rate: number;
        unit: string;
        billableItems: BillableItem[];
    }>();

    for (const summary of billingData) {
        for (const billableItem of summary.billableItems) {
            const key = `${billableItem.type}-${billableItem.sourceId}`;

            if (groupedItems.has(key)) {
                const existing = groupedItems.get(key)!;
                existing.totalQuantity += billableItem.quantity;
                existing.totalAmount += billableItem.subtotal;
                existing.billableItems.push(billableItem);
            } else {
                groupedItems.set(key, {
                    type: billableItem.type,
                    sourceName: billableItem.sourceName,
                    totalQuantity: billableItem.quantity,
                    totalAmount: billableItem.subtotal,
                    rate: billableItem.rate,
                    unit: billableItem.unit,
                    billableItems: [billableItem]
                });
            }
        }
    }

    // Apply markups if configured
    const config = rule.config;
    let itemIndex = 1;

    for (const [key, group] of groupedItems) {
        let finalAmount = group.totalAmount;
        let markup = 0;

        // Apply markup based on type
        if (config.timeBasedConfig) {
            switch (group.type) {
                case 'labor':
                    markup = config.timeBasedConfig.laborMarkup || 0;
                    break;
                case 'equipment':
                    markup = config.timeBasedConfig.equipmentMarkup || 0;
                    break;
                case 'material':
                    markup = config.timeBasedConfig.materialMarkup || 0;
                    break;
            }
        }

        if (markup > 0) {
            finalAmount = finalAmount * (1 + markup / 100);
        }

        const item: InvoiceItem = {
            id: uuidv4(),
            invoice_id: invoiceId,
            business_id: businessId,
            description: group.sourceName,
            quantity: group.totalQuantity,
            unit_price: finalAmount / group.totalQuantity,
            amount: finalAmount,
            tax_rate: 0,
            tax_amount: 0,
            total_price: finalAmount,
            created_at: now,
            created_by: currentUserId,
            updated_at: now,
            updated_by: currentUserId
        };

        items.push(item);
    }

    return items;
}

/**
 * Generate invoice number
 */
async function generateInvoiceNumber(businessId: string): Promise<string> {
    const prefix = 'INV';
    const year = new Date().getFullYear();

    // Get the latest invoice number for this year
    const existingInvoices = await db.invoices
        .where('business_id')
        .equals(businessId)
        .and(invoice => invoice.invoice_number.startsWith(`${prefix}-${year}`))
        .toArray();

    const nextNumber = existingInvoices.length + 1;
    return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Generate item description
 */
function generateItemDescription(group: {
    type: string;
    sourceName: string;
    totalQuantity: number;
    totalAmount: number;
    rate: number;
    unit: string;
    billableItems: BillableItem[];
}): string {
    const dates = [...new Set(group.billableItems.map(item => item.date))].sort();
    const dateRange = dates.length > 1 ? `${dates[0]} to ${dates[dates.length - 1]}` : dates[0];

    return `${group.type.charAt(0).toUpperCase() + group.type.slice(1)} - ${dateRange}`;
}

/**
 * Calculate due date based on rule
 */
function calculateDueDate(rule: InvoiceAutomationRule): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
    return dueDate.toISOString().split('T')[0];
}

/**
 * Validate invoice automation rule
 */
export async function validateInvoiceAutomationRule(
    businessId: string,
    rule: Partial<InvoiceAutomationRule>
): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!rule.clientId) {
        errors.push('Client is required');
    }

    if (!rule.ruleType) {
        errors.push('Rule type is required');
    }

    if (!rule.config) {
        errors.push('Rule configuration is required');
    }

    // Validate client exists
    if (rule.clientId) {
        const client = await db.clients.get(rule.clientId);
        if (!client || client.business_id !== businessId) {
            errors.push('Invalid client selected');
        }
    }

    // Validate project exists (if specified)
    if (rule.projectId) {
        const project = await db.projects.get(rule.projectId);
        if (!project || project.business_id !== businessId) {
            errors.push('Invalid project selected');
        }
    }

    // Validate rule configuration
    if (rule.config && rule.ruleType === 'time_based') {
        const config = rule.config.timeBasedConfig;
        if (!config) {
            errors.push('Time-based configuration is required');
        } else {
            if (!config.includeLabor && !config.includeEquipment && !config.includeMaterials) {
                errors.push('At least one billing type must be included');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get pending invoices that require approval
 */
export async function getPendingApprovalInvoices(
    businessId: string
): Promise<Invoice[]> {
    try {
        const invoices = await db.invoices
            .where('business_id')
            .equals(businessId)
            .and(invoice => invoice.status === 'pending_approval')
            .toArray();

        return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    } catch (error) {
        console.error('Error getting pending approval invoices:', error);
        return [];
    }
}
