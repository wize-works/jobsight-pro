import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const EquipmentQuerySchema = z.object({
    include: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const EquipmentCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().optional(),
    model: z.string().optional(),
    serial_number: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    location: z.string().optional(),
    purchase_date: z.string().optional(),
    purchase_price: z.coerce.number().optional(),
    current_value: z.coerce.number().optional(),
    condition: z.string().optional(),
    manufacturer: z.string().optional(),
    year: z.coerce.number().optional(),
});

const EquipmentUpdateSchema = EquipmentCreateSchema.partial();

// GET /api/equipment - Get all equipment
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
        const { searchParams } = new URL(request.url);
        const params = EquipmentQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("equipment")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.status) {
            query = query.eq("status", params.status);
        }

        if (params.type) {
            query = query.eq("type", params.type);
        }

        if (params.location) {
            query = query.ilike("location", `%${params.location}%`);
        }

        if (params.search) {
            query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%,model.ilike.%${params.search}%`);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("name", { ascending: true });

        const { data: equipment, error } = await query;

        if (error) {
            console.error("Equipment fetch error:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch equipment" }, { status: 500 });
        }

        // Handle includes
        if (params.include && equipment) {
            const includes = params.include.split(",");

            for (const eq of equipment) {
                // Add assignments
                if (includes.includes("assignments")) {
                    const { data: assignments } = await supabase
                        .from("equipment_assignments")
                        .select("*")
                        .eq("equipment_id", eq.id)
                        .order("start_date", { ascending: false });

                    (eq as any).assignments = assignments || [];
                }

                // Add maintenance records
                if (includes.includes("maintenance")) {
                    const { data: maintenance } = await supabase
                        .from("equipment_maintenance")
                        .select("*")
                        .eq("equipment_id", eq.id)
                        .order("maintenance_date", { ascending: false });

                    (eq as any).maintenance = maintenance || [];
                }

                // Add usage records
                if (includes.includes("usage")) {
                    const { data: usage } = await supabase
                        .from("equipment_usage")
                        .select("*")
                        .eq("equipment_id", eq.id)
                        .order("start_date", { ascending: false });

                    (eq as any).usage = usage || [];
                }

                // Add specifications
                if (includes.includes("specifications")) {
                    const { data: specifications } = await supabase
                        .from("equipment_specifications")
                        .select("*")
                        .eq("equipment_id", eq.id)
                        .order("specification", { ascending: true });

                    (eq as any).specifications = specifications || [];
                }

                // Add stats
                if (includes.includes("stats")) {
                    const stats = await Promise.all([
                        supabase
                            .from("equipment_usage")
                            .select("hours_used")
                            .eq("equipment_id", eq.id),
                        supabase
                            .from("equipment_maintenance")
                            .select("cost")
                            .eq("equipment_id", eq.id),
                        supabase
                            .from("equipment_assignments")
                            .select("id")
                            .eq("equipment_id", eq.id)
                            .eq("status", "active")
                    ]);

                    const totalHours = stats[0].data?.reduce((sum, usage) => sum + (usage.hours_used || 0), 0) || 0;
                    const maintenanceCost = stats[1].data?.reduce((sum, maintenance) => sum + (maintenance.cost || 0), 0) || 0;
                    const activeAssignments = stats[2].data?.length || 0;

                    (eq as any).stats = {
                        total_hours: totalHours,
                        maintenance_cost: maintenanceCost,
                        active_assignments: activeAssignments,
                        utilization_rate: eq.purchase_date ?
                            (totalHours / (Math.max(1, Math.floor((Date.now() - new Date(eq.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365)) * 2000))) * 100 : 0
                    };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: equipment,
            count: equipment?.length || 0
        }, { status: 200 });

    } catch (error) {
        console.error("Equipment API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch equipment" },
            { status: 500 }
        );
    }
}

// POST /api/equipment - Create new equipment
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
        const equipmentData = EquipmentCreateSchema.parse(body);

        const { data: equipment, error } = await supabase
            .from("equipment")
            .insert({
                ...equipmentData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Equipment creation error:", error);
            return NextResponse.json({ success: false, error: "Failed to create equipment" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: equipment,
            message: "Equipment created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Equipment creation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create equipment" },
            { status: 500 }
        );
    }
}
