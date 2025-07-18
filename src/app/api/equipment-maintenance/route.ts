import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const MaintenanceQuerySchema = z.object({
    include: z.string().optional(),
    equipment_id: z.string().optional(),
    maintenance_type: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    min_cost: z.coerce.number().optional(),
    max_cost: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const MaintenanceCreateSchema = z.object({
    equipment_id: z.string().min(1, "Equipment ID is required"),
    maintenance_type: z.string().min(1, "Maintenance type is required"),
    maintenance_date: z.string().min(1, "Maintenance date is required"),
    description: z.string().optional(),
    cost: z.coerce.number().optional(),
    performed_by: z.string().optional(),
    status: z.string().optional().default("completed"),
    priority: z.string().optional().default("medium"),
    scheduled_date: z.string().optional(),
    completed_date: z.string().optional(),
    notes: z.string().optional(),
    parts_used: z.string().optional(),
    labor_hours: z.coerce.number().optional(),
    next_maintenance_date: z.string().optional(),
});

const MaintenanceUpdateSchema = MaintenanceCreateSchema.partial();

// GET /api/equipment-maintenance
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
        const params = MaintenanceQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("equipment_maintenance")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.equipment_id) {
            query = query.eq("equipment_id", params.equipment_id);
        }

        if (params.maintenance_type) {
            query = query.eq("maintenance_type", params.maintenance_type);
        }

        if (params.status) {
            query = query.eq("status", params.status);
        }

        if (params.priority) {
            query = query.eq("priority", params.priority);
        }

        if (params.start_date) {
            query = query.gte("maintenance_date", params.start_date);
        }

        if (params.end_date) {
            query = query.lte("maintenance_date", params.end_date);
        }

        if (params.min_cost !== undefined) {
            query = query.gte("cost", params.min_cost);
        }

        if (params.max_cost !== undefined) {
            query = query.lte("cost", params.max_cost);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("maintenance_date", { ascending: false });

        const { data: maintenance, error } = await query;

        if (error) {
            console.error("Equipment maintenance fetch error:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch maintenance records" }, { status: 500 });
        }

        // Handle includes
        if (params.include && maintenance) {
            const includes = params.include.split(",");

            for (const maintenanceRecord of maintenance) {
                // Add equipment details
                if (includes.includes("equipment")) {
                    const { data: equipment } = await supabase
                        .from("equipment")
                        .select("*")
                        .eq("id", maintenanceRecord.equipment_id)
                        .single();

                    (maintenanceRecord as any).equipment = equipment;
                }

                // Add performer details
                if (includes.includes("performer") && maintenanceRecord.performed_by) {
                    const { data: performer } = await supabase
                        .from("employees")
                        .select("*")
                        .eq("id", maintenanceRecord.performed_by)
                        .single();

                    (maintenanceRecord as any).performer = performer;
                }

                // Add history
                if (includes.includes("history")) {
                    const { data: history } = await supabase
                        .from("equipment_maintenance")
                        .select("*")
                        .eq("equipment_id", maintenanceRecord.equipment_id)
                        .neq("id", maintenanceRecord.id)
                        .order("maintenance_date", { ascending: false })
                        .limit(5);

                    (maintenanceRecord as any).history = history || [];
                }

                // Add cost analysis
                if (includes.includes("cost_analysis")) {
                    const { data: allMaintenance } = await supabase
                        .from("equipment_maintenance")
                        .select("cost, maintenance_date")
                        .eq("equipment_id", maintenanceRecord.equipment_id)
                        .not("cost", "is", null);

                    const totalCost = allMaintenance?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
                    const avgCost = allMaintenance?.length ? totalCost / allMaintenance.length : 0;

                    // Calculate cost per month
                    const firstMaintenance = allMaintenance?.sort((a, b) =>
                        new Date(a.maintenance_date).getTime() - new Date(b.maintenance_date).getTime()
                    )[0];

                    let costPerMonth = 0;
                    if (firstMaintenance) {
                        const monthsDiff = (new Date().getTime() - new Date(firstMaintenance.maintenance_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
                        costPerMonth = monthsDiff > 0 ? totalCost / monthsDiff : 0;
                    }

                    (maintenanceRecord as any).cost_analysis = {
                        total_cost: totalCost,
                        average_cost: avgCost,
                        cost_per_month: costPerMonth,
                        maintenance_frequency: allMaintenance?.length || 0
                    };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: maintenance,
            count: maintenance?.length || 0
        }, { status: 200 });

    } catch (error) {
        console.error("Equipment maintenance API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch maintenance records" },
            { status: 500 }
        );
    }
}

// POST /api/equipment-maintenance
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
        const maintenanceData = MaintenanceCreateSchema.parse(body);

        // Validate equipment exists and belongs to business
        const { data: equipment } = await supabase
            .from("equipment")
            .select("id")
            .eq("id", maintenanceData.equipment_id)
            .eq("business_id", businessId)
            .single();

        if (!equipment) {
            return NextResponse.json({ success: false, error: "Equipment not found" }, { status: 404 });
        }

        // Validate performer if provided
        if (maintenanceData.performed_by) {
            const { data: performer } = await supabase
                .from("employees")
                .select("id")
                .eq("id", maintenanceData.performed_by)
                .eq("business_id", businessId)
                .single();

            if (!performer) {
                return NextResponse.json({ success: false, error: "Performer not found" }, { status: 404 });
            }
        }

        const { data: maintenance, error } = await supabase
            .from("equipment_maintenance")
            .insert({
                ...maintenanceData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Equipment maintenance creation error:", error);
            return NextResponse.json({ success: false, error: "Failed to create maintenance record" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: maintenance,
            message: "Maintenance record created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Equipment maintenance creation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create maintenance record" },
            { status: 500 }
        );
    }
}

// PUT /api/equipment-maintenance
export async function PUT(request: NextRequest) {
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
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "Maintenance ID is required" }, { status: 400 });
        }

        const maintenanceData = MaintenanceUpdateSchema.parse(updateData);

        // Validate maintenance record exists and belongs to business
        const { data: existingMaintenance } = await supabase
            .from("equipment_maintenance")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingMaintenance) {
            return NextResponse.json({ success: false, error: "Maintenance record not found" }, { status: 404 });
        }

        const { data: maintenance, error } = await supabase
            .from("equipment_maintenance")
            .update({
                ...maintenanceData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select()
            .single();

        if (error) {
            console.error("Equipment maintenance update error:", error);
            return NextResponse.json({ success: false, error: "Failed to update maintenance record" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: maintenance,
            message: "Maintenance record updated successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Equipment maintenance update error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update maintenance record" },
            { status: 500 }
        );
    }
}

// DELETE /api/equipment-maintenance
export async function DELETE(request: NextRequest) {
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
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Maintenance ID is required" }, { status: 400 });
        }

        // Validate maintenance record exists and belongs to business
        const { data: existingMaintenance } = await supabase
            .from("equipment_maintenance")
            .select("id")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingMaintenance) {
            return NextResponse.json({ success: false, error: "Maintenance record not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("equipment_maintenance")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Equipment maintenance deletion error:", error);
            return NextResponse.json({ success: false, error: "Failed to delete maintenance record" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Maintenance record deleted successfully"
        }, { status: 204 });

    } catch (error) {
        console.error("Equipment maintenance deletion error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete maintenance record" },
            { status: 500 }
        );
    }
}
