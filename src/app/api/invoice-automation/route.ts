import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const InvoiceAutomationQuerySchema = z.object({
    include: z.string().optional(),
    client_id: z.string().optional(),
    project_id: z.string().optional(),
    rule_type: z.string().optional(),
    is_active: z.coerce.boolean().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

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

const InvoiceAutomationCreateSchema = z.object({
    client_id: z.string().min(1, "Client ID is required"),
    project_id: z.string().optional(),
    rule_type: z.enum(['time_based', 'milestone', 'retainer']),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'project_completion']),
    auto_generate: z.boolean().optional().default(false),
    require_approval: z.boolean().optional().default(true),
    minimum_hours: z.number().optional().default(0),
    rounding_rule: z.string().optional().default('nearest_quarter'),
    config: RuleConfigSchema,
    is_active: z.boolean().optional().default(true),
});

const InvoiceAutomationUpdateSchema = InvoiceAutomationCreateSchema.partial();

// GET /api/invoice-automation
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams);

        const validatedQuery = InvoiceAutomationQuerySchema.parse(queryParams);

        // Get user's business

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        // Build query
        let query = supabase
            .from('invoice_automation_rules')
            .select(`
                *,
                client:clients!invoice_automation_rules_client_id_fkey(id, name, contact_email),
                project:projects!invoice_automation_rules_project_id_fkey(id, name, description)
            `)
            .eq('business_id', userData.business_id)
            .order('created_at', { ascending: false });

        // Apply filters
        if (validatedQuery.client_id) {
            query = query.eq('client_id', validatedQuery.client_id);
        }

        if (validatedQuery.project_id) {
            query = query.eq('project_id', validatedQuery.project_id);
        }

        if (validatedQuery.rule_type) {
            query = query.eq('rule_type', validatedQuery.rule_type);
        }

        if (typeof validatedQuery.is_active === 'boolean') {
            query = query.eq('is_active', validatedQuery.is_active);
        }

        // Apply pagination
        if (validatedQuery.limit) {
            query = query.limit(validatedQuery.limit);
        }

        if (validatedQuery.offset) {
            query = query.range(validatedQuery.offset, validatedQuery.offset + (validatedQuery.limit || 50) - 1);
        }

        const { data: rules, error } = await query;

        if (error) {
            console.error('Error fetching invoice automation rules:', error);
            return NextResponse.json({ success: false, error: "Failed to fetch rules" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: rules || [] });
    } catch (error) {
        console.error('Error in GET /api/invoice-automation:', error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/invoice-automation
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const body = await request.json();
        const validatedData = InvoiceAutomationCreateSchema.parse(body);


        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Create the rule
        const { data: rule, error } = await supabase
            .from('invoice_automation_rules')
            .insert({
                ...validatedData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select(`
                *,
                client:clients!invoice_automation_rules_client_id_fkey(id, name, contact_email),
                project:projects!invoice_automation_rules_project_id_fkey(id, name, description)
            `)
            .single();

        if (error) {
            console.error('Error creating invoice automation rule:', error);
            return NextResponse.json({ success: false, error: "Failed to create rule" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: rule }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/invoice-automation:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
