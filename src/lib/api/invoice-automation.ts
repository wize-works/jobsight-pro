// Invoice Automation API client types and functions
export interface InvoiceAutomationRule {
    id: string;
    business_id: string;
    client_id: string;
    project_id?: string;
    rule_type: 'time_based' | 'milestone' | 'retainer';
    frequency: 'daily' | 'weekly' | 'monthly' | 'project_completion';
    auto_generate: boolean;
    require_approval: boolean;
    minimum_hours: number;
    rounding_rule: string;
    config: RuleConfig;
    is_active: boolean;
    next_run_date?: string;
    last_run_date?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;

    // Optional includes
    client?: any;
    project?: any;
}

export interface RuleConfig {
    // Time-based rule config
    include_time_entries?: boolean;
    include_materials?: boolean;
    include_equipment?: boolean;
    hourly_rate?: number;

    // Milestone rule config
    milestone_amount?: number;
    milestone_description?: string;

    // Retainer rule config
    retainer_amount?: number;
    retainer_period?: 'monthly' | 'quarterly' | 'yearly';

    // Common config
    auto_send?: boolean;
    approval_required?: boolean;
    payment_terms?: string;
    notes?: string;
}

export interface CreateInvoiceAutomationRuleData {
    client_id: string;
    project_id?: string;
    rule_type: 'time_based' | 'milestone' | 'retainer';
    frequency: 'daily' | 'weekly' | 'monthly' | 'project_completion';
    auto_generate?: boolean;
    require_approval?: boolean;
    minimum_hours?: number;
    rounding_rule?: string;
    config: RuleConfig;
    is_active?: boolean;
    next_run_date?: string;
}

export interface UpdateInvoiceAutomationRuleData extends Partial<CreateInvoiceAutomationRuleData> { }

export interface InvoiceGenerationResult {
    success: boolean;
    invoice_id?: string;
    error?: string;
    message?: string;
    amount?: number;
    items_count?: number;
}

export interface InvoiceAutomationQuery {
    client_id?: string;
    project_id?: string;
    rule_type?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
}

export interface InvoiceAutomationResponse {
    data: InvoiceAutomationRule[];
    count: number;
    pagination?: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// API client class
class InvoiceAutomationAPIClient {
    private baseUrl = '/api/invoice-automation';

    async getInvoiceAutomationRules(params?: InvoiceAutomationQuery): Promise<InvoiceAutomationResponse> {
        const searchParams = new URLSearchParams();
        if (params?.client_id) searchParams.append('client_id', params.client_id);
        if (params?.project_id) searchParams.append('project_id', params.project_id);
        if (params?.rule_type) searchParams.append('rule_type', params.rule_type);
        if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.offset) searchParams.append('offset', params.offset.toString());

        const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch invoice automation rules: ${response.statusText}`);
        }
        return response.json();
    }

    async getInvoiceAutomationRule(id: string): Promise<{ data: InvoiceAutomationRule }> {
        const response = await fetch(`${this.baseUrl}/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch invoice automation rule: ${response.statusText}`);
        }
        return response.json();
    }

    async createInvoiceAutomationRule(data: CreateInvoiceAutomationRuleData): Promise<{ data: InvoiceAutomationRule }> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Failed to create invoice automation rule: ${response.statusText}`);
        }
        return response.json();
    }

    async updateInvoiceAutomationRule(id: string, data: UpdateInvoiceAutomationRuleData): Promise<{ data: InvoiceAutomationRule }> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Failed to update invoice automation rule: ${response.statusText}`);
        }
        return response.json();
    }

    async deleteInvoiceAutomationRule(id: string): Promise<{ success: boolean }> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete invoice automation rule: ${response.statusText}`);
        }
        return response.json();
    }

    async generateInvoiceFromRule(ruleId: string, dateRange?: { start: string; end: string }): Promise<InvoiceGenerationResult> {
        const body: any = { rule_id: ruleId };
        if (dateRange) {
            body.date_range = dateRange;
        }

        const response = await fetch(`${this.baseUrl}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`Failed to generate invoice from rule: ${response.statusText}`);
        }
        return response.json();
    }

    async validateInvoiceAutomationRule(data: CreateInvoiceAutomationRuleData): Promise<{ success: boolean; errors?: string[] }> {
        const response = await fetch(`${this.baseUrl}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Failed to validate invoice automation rule: ${response.statusText}`);
        }
        return response.json();
    }
}

export const invoiceAutomationApi = new InvoiceAutomationAPIClient();
