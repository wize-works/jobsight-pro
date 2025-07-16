import {
    InvoiceAutomationRule,
    BillableItem,
    BillableSummary,
    BillingRate,
    LaborCost,
    EquipmentCost,
    MaterialCost,
    RateValidationResult,
    InvoicePreview,
    DateRange
} from '@/types/invoice-automation';
import { Invoice } from '@/types/invoices';
import { DailyLog } from '@/types/daily-logs';

export interface InvoiceAutomationService {
    // Rule management
    createRule(rule: Omit<InvoiceAutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvoiceAutomationRule | { error: string }>;
    updateRule(id: string, updates: Partial<InvoiceAutomationRule>): Promise<InvoiceAutomationRule | { error: string }>;
    deleteRule(id: string): Promise<{ success: true } | { error: string }>;
    getRulesByClient(clientId: string): Promise<InvoiceAutomationRule[] | { error: string }>;
    getRulesByProject(projectId: string): Promise<InvoiceAutomationRule[] | { error: string }>;
    getRuleById(id: string): Promise<InvoiceAutomationRule | { error: string }>;

    // Invoice generation
    generateInvoiceFromLogs(ruleId: string, dateRange: DateRange): Promise<Invoice | { error: string }>;
    processScheduledInvoices(): Promise<void>;
    previewInvoice(ruleId: string, dateRange: DateRange): Promise<InvoicePreview | { error: string }>;

    // Approval workflow
    submitForApproval(invoiceId: string): Promise<Invoice | { error: string }>;
    approveInvoice(invoiceId: string, approvedBy: string): Promise<Invoice | { error: string }>;
    rejectInvoice(invoiceId: string, reason: string): Promise<Invoice | { error: string }>;

    // Rule validation
    validateRule(rule: InvoiceAutomationRule): Promise<{ success: true } | { error: string }>;
    testRuleExecution(ruleId: string, dateRange: DateRange): Promise<InvoicePreview | { error: string }>;
}

export interface DailyLogBillingProcessor {
    // Extract billable items from daily logs
    extractBillableItems(dailyLogId: string): Promise<BillableItem[]>;
    extractBillableItemsFromLogs(dailyLogIds: string[]): Promise<BillableItem[]>;

    // Calculate costs based on rates
    calculateLaborCosts(dailyLog: DailyLog): Promise<LaborCost[]>;
    calculateEquipmentCosts(dailyLog: DailyLog): Promise<EquipmentCost[]>;
    calculateMaterialCosts(dailyLog: DailyLog): Promise<MaterialCost[]>;

    // Aggregate for invoicing
    aggregateByProject(projectId: string, dateRange: DateRange): Promise<BillableSummary>;
    aggregateByClient(clientId: string, dateRange: DateRange): Promise<BillableSummary>;
    aggregateByRule(ruleId: string, dateRange: DateRange): Promise<BillableSummary>;

    // Check for already billed items
    getAlreadyBilledItems(dailyLogIds: string[]): Promise<string[]>;
    markItemsAsBilled(invoiceId: string, items: BillableItem[]): Promise<{ success: true } | { error: string }>;
}

export interface RateManagementService {
    // Crew member rates
    setCrewMemberRate(crewMemberId: string, rate: BillingRate): Promise<{ success: true } | { error: string }>;
    getCrewMemberRate(crewMemberId: string, date?: string): Promise<BillingRate | { error: string }>;
    getCrewMemberRates(crewMemberIds: string[], date?: string): Promise<Record<string, BillingRate> | { error: string }>;

    // Equipment rates
    setEquipmentRate(equipmentId: string, rate: BillingRate): Promise<{ success: true } | { error: string }>;
    getEquipmentRate(equipmentId: string, date?: string): Promise<BillingRate | { error: string }>;
    getEquipmentRates(equipmentIds: string[], date?: string): Promise<Record<string, BillingRate> | { error: string }>;

    // Client-specific rates (overrides)
    setClientSpecificRate(clientId: string, resourceId: string, rate: BillingRate): Promise<{ success: true } | { error: string }>;
    getClientSpecificRate(clientId: string, resourceId: string): Promise<BillingRate | { error: string }>;
    removeClientSpecificRate(clientId: string, resourceId: string): Promise<{ success: true } | { error: string }>;

    // Project-specific rates (overrides)
    setProjectSpecificRate(projectId: string, resourceId: string, rate: BillingRate): Promise<{ success: true } | { error: string }>;
    getProjectSpecificRate(projectId: string, resourceId: string): Promise<BillingRate | { error: string }>;
    removeProjectSpecificRate(projectId: string, resourceId: string): Promise<{ success: true } | { error: string }>;

    // Rate validation
    validateRates(businessId: string): Promise<RateValidationResult>;
    validateRatesForProject(projectId: string): Promise<RateValidationResult>;
    validateRatesForClient(clientId: string): Promise<RateValidationResult>;

    // Bulk operations
    bulkUpdateCrewMemberRates(updates: { crewMemberId: string; rate: BillingRate }[]): Promise<{ success: true } | { error: string }>;
    bulkUpdateEquipmentRates(updates: { equipmentId: string; rate: BillingRate }[]): Promise<{ success: true } | { error: string }>;

    // Rate history
    getCrewMemberRateHistory(crewMemberId: string): Promise<BillingRate[] | { error: string }>;
    getEquipmentRateHistory(equipmentId: string): Promise<BillingRate[] | { error: string }>;
}

export interface InvoiceApprovalService {
    // Approval workflow
    submitForApproval(invoiceId: string, submittedBy: string): Promise<Invoice | { error: string }>;
    approveInvoice(invoiceId: string, approvedBy: string, notes?: string): Promise<Invoice | { error: string }>;
    rejectInvoice(invoiceId: string, rejectedBy: string, reason: string): Promise<Invoice | { error: string }>;

    // Approval queue management
    getPendingApprovals(businessId: string): Promise<Invoice[] | { error: string }>;
    getApprovalHistory(invoiceId: string): Promise<ApprovalHistoryItem[] | { error: string }>;

    // Bulk approval operations
    bulkApprove(invoiceIds: string[], approvedBy: string): Promise<Invoice[] | { error: string }>;
    bulkReject(invoiceIds: string[], rejectedBy: string, reason: string): Promise<Invoice[] | { error: string }>;

    // Approval permissions
    canApproveInvoice(userId: string, invoiceId: string): Promise<boolean>;
    getApprovalPermissions(userId: string): Promise<ApprovalPermissions>;
}

export interface ApprovalHistoryItem {
    id: string;
    invoiceId: string;
    action: 'submitted' | 'approved' | 'rejected' | 'cancelled';
    userId: string;
    userName: string;
    timestamp: string;
    notes?: string;
    reason?: string;
}

export interface ApprovalPermissions {
    canApprove: boolean;
    canReject: boolean;
    canBulkApprove: boolean;
    maxApprovalAmount?: number;
    requiresTwoApprovals?: boolean;
}

export interface InvoiceSchedulingService {
    // Scheduled invoice processing
    processScheduledInvoices(): Promise<void>;
    scheduleInvoiceGeneration(ruleId: string, nextRunDate: string): Promise<{ success: true } | { error: string }>;

    // Schedule management
    getScheduledInvoices(businessId: string): Promise<ScheduledInvoice[] | { error: string }>;
    pauseScheduledInvoice(ruleId: string): Promise<{ success: true } | { error: string }>;
    resumeScheduledInvoice(ruleId: string): Promise<{ success: true } | { error: string }>;

    // Manual triggers
    triggerInvoiceGeneration(ruleId: string, dateRange?: DateRange): Promise<Invoice | { error: string }>;

    // Schedule validation
    validateSchedule(rule: InvoiceAutomationRule): Promise<{ success: true } | { error: string }>;
}

export interface ScheduledInvoice {
    ruleId: string;
    clientId: string;
    projectId?: string;
    nextRunDate: string;
    frequency: string;
    isActive: boolean;
    lastRunDate?: string;
    lastRunStatus?: 'success' | 'failed' | 'skipped';
    lastRunError?: string;
}
