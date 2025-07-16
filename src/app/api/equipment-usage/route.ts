import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const UsageQuerySchema = z.object({
    include: z.string().optional(),
    equipment_id: z.string().optional(),
    employee_id: z.string().optional(),
    project_id: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    min_hours: z.coerce.number().optional(),
    max_hours: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const UsageCreateSchema = z.object({
    equipment_id: z.string().min(1, "Equipment ID is required"),
    employee_id: z.string().min(1, "Employee ID is required"),
    project_id: z.string().optional(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional(),
    hours_used: z.coerce.number().min(0, "Hours used must be non-negative"),
    start_hours: z.coerce.number().optional(),
    end_hours: z.coerce.number().optional(),
    fuel_used: z.coerce.number().optional(),
    notes: z.string().optional(),
    location: z.string().optional(),
});

const UsageUpdateSchema = UsageCreateSchema.partial();

// GET /api/equipment-usage
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const { searchParams } = new URL(request.url);
        const params = UsageQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("equipment_usage")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.equipment_id) {
            query = query.eq("equipment_id", params.equipment_id);
        }

        if (params.employee_id) {
            query = query.eq("employee_id", params.employee_id);
        }

        if (params.project_id) {
            query = query.eq("project_id", params.project_id);
        }

        if (params.start_date) {
            query = query.gte("start_date", params.start_date);
        }

        if (params.end_date) {
            query = query.lte("end_date", params.end_date);
        }

        if (params.min_hours !== undefined) {
            query = query.gte("hours_used", params.min_hours);
        }

        if (params.max_hours !== undefined) {
            query = query.lte("hours_used", params.max_hours);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("start_date", { ascending: false });

        const { data: usage, error } = await query;

        if (error) {
            console.error("Equipment usage fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
        }

        // Handle includes
        if (params.include && usage) {
            const includes = params.include.split(",");

            for (const usageRecord of usage) {
                // Add equipment details
                if (includes.includes("equipment")) {
                    const { data: equipment } = await supabase
                        .from("equipment")
                        .select("*")
                        .eq("id", usageRecord.equipment_id)
                        .single();

                    (usageRecord as any).equipment = equipment;
                }

                // Add employee details
                if (includes.includes("employee")) {
                    const { data: employee } = await supabase
                        .from("employees")
                        .select("*")
                        .eq("id", usageRecord.employee_id)
                        .single();

                    (usageRecord as any).employee = employee;
                }

                // Add project details
                if (includes.includes("project") && usageRecord.project_id) {
                    const { data: project } = await supabase
                        .from("projects")
                        .select("*")
                        .eq("id", usageRecord.project_id)
                        .single();

                    (usageRecord as any).project = project;
                }

                // Add assignment details
                if (includes.includes("assignment")) {
                    const { data: assignment } = await supabase
                        .from("equipment_assignments")
                        .select("*")
                        .eq("equipment_id", usageRecord.equipment_id)
                        .eq("employee_id", usageRecord.employee_id)
                        .lte("start_date", usageRecord.start_date)
                        .or(`end_date.gte.${usageRecord.start_date},end_date.is.null`)
                        .single();

                    (usageRecord as any).assignment = assignment;
                }

                // Add cost calculation
                if (includes.includes("cost")) {
                    const { data: equipment } = await supabase
                        .from("equipment")
                        .select("hourly_rate")
                        .eq("id", usageRecord.equipment_id)
                        .single();

                    const hourlyRate = equipment?.hourly_rate || 0;
                    const totalCost = (usageRecord.hours_used || 0) * hourlyRate;

                    (usageRecord as any).cost = {
                        hourly_rate: hourlyRate,
                        total_cost: totalCost,
                        fuel_cost: usageRecord.fuel_used ? usageRecord.fuel_used * 4.50 : 0 // Assuming $4.50/gallon
                    };
                }
            }
        }

        return NextResponse.json({
            data: usage,
            count: usage?.length || 0
        });

    } catch (error) {
        console.error("Equipment usage API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch usage" },
            { status: 500 }
        );
    }
}

// POST /api/equipment-usage
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const usageData = UsageCreateSchema.parse(body);

        // Validate equipment exists and belongs to business
        const { data: equipment } = await supabase
            .from("equipment")
            .select("id")
            .eq("id", usageData.equipment_id)
            .eq("business_id", businessId)
            .single();

        if (!equipment) {
            return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
        }

        // Validate employee exists and belongs to business
        const { data: employee } = await supabase
            .from("employees")
            .select("id")
            .eq("id", usageData.employee_id)
            .eq("business_id", businessId)
            .single();

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Validate project if provided
        if (usageData.project_id) {
            const { data: project } = await supabase
                .from("projects")
                .select("id")
                .eq("id", usageData.project_id)
                .eq("business_id", businessId)
                .single();

            if (!project) {
                return NextResponse.json({ error: "Project not found" }, { status: 404 });
            }
        }

        const { data: usage, error } = await supabase
            .from("equipment_usage")
            .insert({
                ...usageData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Equipment usage creation error:", error);
            return NextResponse.json({ error: "Failed to create usage record" }, { status: 500 });
        }

        return NextResponse.json({
            data: usage,
            message: "Usage record created successfully"
        });

    } catch (error) {
        console.error("Equipment usage creation error:", error);
        return NextResponse.json(
            { error: "Failed to create usage record" },
            { status: 500 }
        );
    }
}

// PUT /api/equipment-usage
export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "Usage ID is required" }, { status: 400 });
        }

        const usageData = UsageUpdateSchema.parse(updateData);

        // Validate usage record exists and belongs to business
        const { data: existingUsage } = await supabase
            .from("equipment_usage")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingUsage) {
            return NextResponse.json({ error: "Usage record not found" }, { status: 404 });
        }

        const { data: usage, error } = await supabase
            .from("equipment_usage")
            .update({
                ...usageData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select()
            .single();

        if (error) {
            console.error("Equipment usage update error:", error);
            return NextResponse.json({ error: "Failed to update usage record" }, { status: 500 });
        }

        return NextResponse.json({
            data: usage,
            message: "Usage record updated successfully"
        });

    } catch (error) {
        console.error("Equipment usage update error:", error);
        return NextResponse.json(
            { error: "Failed to update usage record" },
            { status: 500 }
        );
    }
}

// DELETE /api/equipment-usage
export async function DELETE(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Usage ID is required" }, { status: 400 });
        }

        // Validate usage record exists and belongs to business
        const { data: existingUsage } = await supabase
            .from("equipment_usage")
            .select("id")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingUsage) {
            return NextResponse.json({ error: "Usage record not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("equipment_usage")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Equipment usage deletion error:", error);
            return NextResponse.json({ error: "Failed to delete usage record" }, { status: 500 });
        }

        return NextResponse.json({
            message: "Usage record deleted successfully"
        });

    } catch (error) {
        console.error("Equipment usage deletion error:", error);
        return NextResponse.json(
            { error: "Failed to delete usage record" },
            { status: 500 }
        );
    }
}
