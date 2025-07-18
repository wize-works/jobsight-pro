import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const RuleConfigSchema = z.object({
    include_time_entries: z.boolean().optional(),
    include_materials: z.boolean().optional(),
    include_equipment: z.boolean().optional(),
    hourly_rate: z.number().optional(),
    milestone_amount: z.number().optional(),
    milestone_description: z.string().optional(),
    retainer_amount: z.number().optional(),
    retainer_period: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    auto_send: z.boolean().optional(),
    approval_required: z.boolean().optional(),
    payment_terms: z.string().optional(),
    notes: z.string().optional(),
});

const InvoiceAutomationUpdateSchema = z.object({
    client_id: z.string().optional(),
    project_id: z.string().optional(),
    rule_type: z.enum(['time_based', 'milestone', 'retainer']).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'project_completion']).optional(),
    auto_generate: z.boolean().optional(),
    require_approval: z.boolean().optional(),
    minimum_hours: z.number().optional(),
    rounding_rule: z.string().optional(),
    config: RuleConfigSchema.optional(),
    is_active: z.boolean().optional(),
});

const TestRuleSchema = z.object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
});

// GET /api/invoice-automation/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Get the rule
        const { data: rule, error } = await supabase
            .from('invoice_automation_rules')
            .select(`
                *,
                client:clients!invoice_automation_rules_client_id_fkey(id, name, contact_email),
                project:projects!invoice_automation_rules_project_id_fkey(id, name, description)
            `)
            .eq('id', id)
            .eq('business_id', userData.business_id)
            .single();

        if (error) {
            console.error('Error fetching invoice automation rule:', error);
            return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
        }

        return NextResponse.json(rule);
    } catch (error) {
        console.error('Error in GET /api/invoice-automation/[id]:', error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/invoice-automation/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = InvoiceAutomationUpdateSchema.parse(body);

        // Get user's business
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;
        // Update the rule
        const { data: rule, error } = await supabase
            .from('invoice_automation_rules')
            .update({
                ...validatedData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('business_id', userData.business_id)
            .select(`
                *,
                client:clients!invoice_automation_rules_client_id_fkey(id, name, contact_email),
                project:projects!invoice_automation_rules_project_id_fkey(id, name, description)
            `)
            .single();

        if (error) {
            console.error('Error updating invoice automation rule:', error);
            return NextResponse.json({ success: false, error: "Failed to update rule" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: rule }, { status: 200 });
    } catch (error) {
        console.error('Error in PUT /api/invoice-automation/[id]:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/invoice-automation/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const { id } = await params;

        // Get user's business

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Delete the rule
        const { error } = await supabase
            .from('invoice_automation_rules')
            .delete()
            .eq('id', id)
            .eq('business_id', userData.business_id);

        if (error) {
            console.error('Error deleting invoice automation rule:', error);
            return NextResponse.json({ success: false, error: "Failed to delete rule" }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 204 });
    } catch (error) {
        console.error('Error in DELETE /api/invoice-automation/[id]:', error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/invoice-automation/[id]/test - Test rule and generate invoice
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = TestRuleSchema.parse(body);

        // Get user's business
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Get the rule
        const { data: rule, error: ruleError } = await supabase
            .from('invoice_automation_rules')
            .select('*')
            .eq('id', id)
            .eq('business_id', userData.business_id)
            .single();

        if (ruleError || !rule) {
            return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
        }

        // For now, return a placeholder response
        // In a real implementation, you would:
        // 1. Gather daily logs in the date range
        // 2. Apply the rule configuration
        // 3. Generate invoice items
        // 4. Create a preview invoice

        return NextResponse.json({
            success: true,
            message: "Test invoice generation is not yet implemented",
            rule_id: id,
            date_range: validatedData,
            invoice_id: null
        }, { status: 200 });
    } catch (error) {
        console.error('Error in POST /api/invoice-automation/[id]/test:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
