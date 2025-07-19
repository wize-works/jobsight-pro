import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";
import { sendEquipmentAlertServer } from "@/lib/email/server";

const EquipmentAlertSchema = z.object({
    equipmentId: z.string(),
    alertType: z.enum(["maintenance_due", "inspection_required", "malfunction", "assignment_change"]),
    description: z.string(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
});

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

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const { equipmentId, alertType, description, priority } = EquipmentAlertSchema.parse(body);

        const result = await sendEquipmentAlertServer(
            businessId,
            equipmentId,
            alertType,
            description,
            priority
        );

        if (result.success) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: error.errors[0]?.message || "Invalid request data"
            }, { status: 400 });
        }

        console.error("Equipment alert API error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to send equipment alert"
        }, { status: 500 });
    }
}
