import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const UpdateEquipmentSchema = z.object({
    name: z.string().min(1, "Equipment name is required").optional(),
    hours: z.number().min(0, "Hours must be non-negative").optional(),
    operator: z.string().optional(),
    condition: z.string().optional(),
    equipment_id: z.string().uuid().optional(),
    crew_member_id: z.string().uuid().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; equipmentId: string }> }
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

        const { id: dailyLogId, equipmentId } = await params;

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

        // Get equipment with daily log verification
        const { data: equipment, error } = await supabase
            .from("daily_log_equipment")
            .select("*")
            .eq("id", equipmentId)
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId)
            .single();

        if (error || !equipment) {
            return NextResponse.json({ success: false, error: "Equipment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: equipment }, { status: 200 });

    } catch (error) {
        console.error("Error in equipment GET:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; equipmentId: string }> }
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

        const { id: dailyLogId, equipmentId } = await params;
        const body = await request.json();
        const validatedData = UpdateEquipmentSchema.parse(body);

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

        // Update equipment
        const { data, error } = await supabase
            .from("daily_log_equipment")
            .update({
                ...validatedData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", equipmentId)
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId)
            .select("*")
            .single();

        if (error) {
            console.error("Error updating equipment:", error);
            return NextResponse.json({ success: false, error: "Failed to update equipment" }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ success: false, error: "Equipment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation error", details: error.errors }, { status: 400 });
        }
        console.error("Error in equipment PUT:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; equipmentId: string }> }
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

        const { id: dailyLogId, equipmentId } = await params;

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

        // Delete equipment
        const { error } = await supabase
            .from("daily_log_equipment")
            .delete()
            .eq("id", equipmentId)
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId);

        if (error) {
            console.error("Error deleting equipment:", error);
            return NextResponse.json({ success: false, error: "Failed to delete equipment" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Equipment deleted successfully" }, { status: 204 });

    } catch (error) {
        console.error("Error in equipment DELETE:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
