import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const UpdateMaterialSchema = z.object({
    name: z.string().min(1, "Material name is required").optional(),
    quantity: z.string().min(1, "Quantity is required").optional(),
    cost: z.number().optional(),
    supplier: z.string().optional(),
    notes: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; materialId: string }> }
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

        const { id: dailyLogId, materialId } = await params;

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

        // Get material with daily log verification
        const { data: material, error } = await supabase
            .from("daily_log_materials")
            .select("*")
            .eq("id", materialId)
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId)
            .single();

        if (error || !material) {
            return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: material }, { status: 200 });

    } catch (error) {
        console.error("Error in material GET:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; materialId: string }> }
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

        const { id: dailyLogId, materialId } = await params;
        const body = await request.json();
        const validatedData = UpdateMaterialSchema.parse(body);

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

        // Update material
        const { data, error } = await supabase
            .from("daily_log_materials")
            .update({
                ...validatedData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", materialId)
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId)
            .select("*")
            .single();

        if (error) {
            console.error("Error updating material:", error);
            return NextResponse.json({ success: false, error: "Failed to update material" }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation error", details: error.errors }, { status: 400 });
        }
        console.error("Error in material PUT:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; materialId: string }> }
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

        const { id: dailyLogId, materialId } = await params;

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

        // Delete material
        const { error } = await supabase
            .from("daily_log_materials")
            .delete()
            .eq("id", materialId)
            .eq("daily_log_id", dailyLogId)
            .eq("business_id", businessId);

        if (error) {
            console.error("Error deleting material:", error);
            return NextResponse.json({ success: false, error: "Failed to delete material" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Material deleted successfully" }, { status: 204 });

    } catch (error) {
        console.error("Error in material DELETE:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
