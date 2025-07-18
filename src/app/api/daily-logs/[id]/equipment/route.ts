import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const CreateEquipmentSchema = z.object({
    name: z.string().min(1, "Equipment name is required"),
    hours: z.number().min(0, "Hours must be non-negative"),
    operator: z.string().optional(),
    condition: z.string().optional(),
    equipment_id: z.string().uuid().optional(),
    crew_member_id: z.string().uuid().optional(),
});

const EquipmentParamsSchema = z.object({
    search: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const { id: dailyLogId } = await params;
        const url = new URL(request.url);
        const queryParams = EquipmentParamsSchema.parse(Object.fromEntries(url.searchParams));

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness?.business_id) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;

        // Verify daily log exists and belongs to user's business
        const { data: dailyLog } = await supabase
            .from("daily_logs")
            .select("id")
            .eq("id", dailyLogId)
            .eq("business_id", businessId)
            .single();

        if (!dailyLog) {
            return NextResponse.json({ success: false, error: "Daily log not found" }, { status: 404 });
        }

        // Build query for equipment
        let query = supabase
            .from("daily_log_equipment")
            .select("*")
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId)
            .order("created_at", { ascending: false });

        // Apply search filter
        if (queryParams.search) {
            query = query.or(`name.ilike.%${queryParams.search}%,operator.ilike.%${queryParams.search}%,condition.ilike.%${queryParams.search}%`);
        }

        // Apply pagination
        const limit = queryParams.limit ? parseInt(queryParams.limit) : 100;
        const offset = queryParams.offset ? parseInt(queryParams.offset) : 0;

        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching equipment:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch equipment" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: data || [],
            pagination: {
                limit,
                offset,
                hasMore: data?.length === limit,
            },
        }, { status: 200 });

    } catch (error) {
        console.error("Error in equipment GET:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        const { id: dailyLogId } = await params;
        const body = await request.json();
        const validatedData = CreateEquipmentSchema.parse(body);

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness?.business_id) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;

        // Verify daily log exists and belongs to user's business
        const { data: dailyLog } = await supabase
            .from("daily_logs")
            .select("id")
            .eq("id", dailyLogId)
            .eq("business_id", businessId)
            .single();

        if (!dailyLog) {
            return NextResponse.json({ success: false, error: "Daily log not found" }, { status: 404 });
        }

        // Create equipment
        const { data, error } = await supabase
            .from("daily_log_equipment")
            .insert({
                ...validatedData,
                daily_log_id: dailyLogId,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select("*")
            .single();

        if (error) {
            console.error("Error creating equipment:", error);
            return NextResponse.json({ success: false, error: "Failed to create equipment" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation error", details: error.errors }, { status: 400 });
        }
        console.error("Error in equipment POST:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
