export interface InvoiceAutomationRule {
    id: string;
    businessId: string;
    clientId: string;
    projectId?: string;
    ruleType: 'time_based' | 'milestone' | 'retainer';
    frequency?: 'daily' | 'weekly' | 'monthly' | 'project_completion';
    autoGenerate: boolean;
    requireApproval: boolean;
    minimumHours: number;
    roundingRule: 'up' | 'down' | 'nearest_quarter';
    config: RuleConfig;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
}

export interface RuleConfig {
    timeBasedConfig?: {
        includeLabor: boolean;
        includeEquipment: boolean;
        includeMaterials: boolean;
        laborMarkup?: number;
        equipmentMarkup?: number;
        materialMarkup?: number;
    };
    milestoneConfig?: {
        milestones: {
            name: string;
            percentage: number;
            triggerCondition: 'manual' | 'hours_reached' | 'deliverable_completed';
        }[];
    };
    retainerConfig?: {
        monthlyAmount: number;
        hoursIncluded: number;
        overageRate: number;
    };
}

export interface DailyLogInvoiceItem {
    id: string;
    dailyLogId: string;
    invoiceItemId: string;
    itemType: 'labor' | 'equipment' | 'material';
    sourceId?: string; // references daily_log_equipment.id, daily_log_materials.id, or crew_member_id for labor
    quantity?: number;
    rate?: number;
    createdAt: string;
}

export interface BillableItem {
    type: 'labor' | 'equipment' | 'material';
    sourceId: string;
    sourceName: string;
    quantity: number;
    rate: number;
    amount: number;
    description: string;
    dailyLogId: string;
    date: string;
    projectId: string;
}

export interface BillableSummary {
    laborItems: BillableItem[];
    equipmentItems: BillableItem[];
    materialItems: BillableItem[];
    totalLabor: number;
    totalEquipment: number;
    totalMaterials: number;
    grandTotal: number;
}

export interface BillingRate {
    hourlyRate: number;
    overtimeRate?: number;
    effectiveDate?: string;
    clientId?: string; // for client-specific rates
    projectId?: string; // for project-specific rates
}

export interface LaborCost {
    crewMemberId: string;
    crewMemberName: string;
    regularHours: number;
    overtimeHours: number;
    regularRate: number;
    overtimeRate: number;
    regularAmount: number;
    overtimeAmount: number;
    totalAmount: number;
}

export interface EquipmentCost {
    equipmentId: string;
    equipmentName: string;
    hours: number;
    rate: number;
    amount: number;
    operatorId?: string;
    operatorName?: string;
}

export interface MaterialCost {
    materialId: string;
    materialName: string;
    quantity: number;
    cost: number;
    supplier?: string;
}

export interface RateValidationResult {
    isValid: boolean;
    missingRates: {
        crewMembers: string[];
        equipment: string[];
    };
    warnings: string[];
}

export interface InvoicePreview {
    invoice: {
        clientId: string;
        projectId: string;
        amount: number;
        items: {
            description: string;
            quantity: number;
            unitPrice: number;
            amount: number;
        }[];
    };
    summary: BillableSummary;
    dailyLogIds: string[];
    dateRange: {
        start: string;
        end: string;
    };
}

export interface DateRange {
    start: string;
    end: string;
}

export enum InvoiceStatus {
    DRAFT = 'draft',
    PENDING_APPROVAL = 'pending_approval',
    APPROVED = 'approved',
    SENT = 'sent',
    PAID = 'paid',
    CANCELLED = 'cancelled'
}

export interface InvoiceApprovalActions {
    submit(): Promise<void>;     // draft -> pending_approval
    approve(): Promise<void>;    // pending_approval -> approved
    reject(): Promise<void>;     // pending_approval -> draft
    send(): Promise<void>;       // approved -> sent
    cancel(): Promise<void>;     // any -> cancelled
}

export interface InvoiceGenerationResult {
    success: boolean;
    data?: {
        invoice: any; // Will be properly typed when we have the Invoice type
        invoiceItems: any[]; // Will be properly typed when we have the InvoiceItem type
        billingData: any[]; // Will be properly typed when we have the billing data type
        rule: InvoiceAutomationRule;
    };
    error?: string;
    warnings?: string[];
}
