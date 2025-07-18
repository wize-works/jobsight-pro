import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const CreateMaterialSchema = z.object({
    name: z.string().min(1, "Material name is required"),
    quantity: z.string().min(1, "Quantity is required"),
    cost: z.number().optional(),
    supplier: z.string().optional(),
    notes: z.string().optional(),
});

const MaterialParamsSchema = z.object({
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
        const queryParams = MaterialParamsSchema.parse(Object.fromEntries(url.searchParams));

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

        // Build query for materials
        let query = supabase
            .from("daily_log_materials")
            .select("*")
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId)
            .order("created_at", { ascending: false });

        // Apply search filter
        if (queryParams.search) {
            query = query.or(`name.ilike.%${queryParams.search}%,supplier.ilike.%${queryParams.search}%,notes.ilike.%${queryParams.search}%`);
        }

        // Apply pagination
        const limit = queryParams.limit ? parseInt(queryParams.limit) : 100;
        const offset = queryParams.offset ? parseInt(queryParams.offset) : 0;

        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching materials:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch materials" }, { status: 500 });
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
        console.error("Error in materials GET:", error);
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
        const validatedData = CreateMaterialSchema.parse(body);

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

        // Create material
        const { data, error } = await supabase
            .from("daily_log_materials")
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
            console.error("Error creating material:", error);
            return NextResponse.json({ success: false, error: "Failed to create material" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation error", details: error.errors }, { status: 400 });
        }
        console.error("Error in materials POST:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
