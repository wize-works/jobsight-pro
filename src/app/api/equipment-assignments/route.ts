import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const AssignmentQuerySchema = z.object({
    include: z.string().optional(),
    equipment_id: z.string().optional(),
    employee_id: z.string().optional(),
    project_id: z.string().optional(),
    status: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const AssignmentCreateSchema = z.object({
    equipment_id: z.string().min(1, "Equipment ID is required"),
    employee_id: z.string().min(1, "Employee ID is required"),
    project_id: z.string().optional(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional().default("active"),
});

const AssignmentUpdateSchema = AssignmentCreateSchema.partial();

// GET /api/equipment-assignments
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
        const params = AssignmentQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("equipment_assignments")
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

        if (params.status) {
            query = query.eq("status", params.status);
        }

        if (params.start_date) {
            query = query.gte("start_date", params.start_date);
        }

        if (params.end_date) {
            query = query.lte("end_date", params.end_date);
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

        const { data: assignments, error } = await query;

        if (error) {
            console.error("Equipment assignments fetch error:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch assignments" }, { status: 500 });
        }

        // Handle includes
        if (params.include && assignments) {
            const includes = params.include.split(",");

            for (const assignment of assignments) {
                // Add equipment details
                if (includes.includes("equipment")) {
                    const { data: equipment } = await supabase
                        .from("equipment")
                        .select("*")
                        .eq("id", assignment.equipment_id)
                        .single();

                    (assignment as any).equipment = equipment;
                }

                // Add employee details
                if (includes.includes("employee")) {
                    const { data: employee } = await supabase
                        .from("employees")
                        .select("*")
                        .eq("id", assignment.employee_id)
                        .single();

                    (assignment as any).employee = employee;
                }

                // Add project details
                if (includes.includes("project") && assignment.project_id) {
                    const { data: project } = await supabase
                        .from("projects")
                        .select("*")
                        .eq("id", assignment.project_id)
                        .single();

                    (assignment as any).project = project;
                }

                // Add usage stats
                if (includes.includes("usage")) {
                    const { data: usage } = await supabase
                        .from("equipment_usage")
                        .select("hours_used")
                        .eq("equipment_id", assignment.equipment_id)
                        .gte("start_date", assignment.start_date)
                        .lte("end_date", assignment.end_date || new Date().toISOString());

                    const totalHours = usage?.reduce((sum, u) => sum + (u.hours_used || 0), 0) || 0;
                    (assignment as any).usage_stats = { total_hours: totalHours };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: assignments,
            count: assignments?.length || 0
        }, { status: 200 });

    } catch (error) {
        console.error("Equipment assignments API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch assignments" },
            { status: 500 }
        );
    }
}

// POST /api/equipment-assignments
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
        const assignmentData = AssignmentCreateSchema.parse(body);

        // Validate equipment exists and belongs to business
        const { data: equipment } = await supabase
            .from("equipment")
            .select("id")
            .eq("id", assignmentData.equipment_id)
            .eq("business_id", businessId)
            .single();

        if (!equipment) {
            return NextResponse.json({ success: false, error: "Equipment not found" }, { status: 404 });
        }

        // Validate employee exists and belongs to business
        const { data: employee } = await supabase
            .from("employees")
            .select("id")
            .eq("id", assignmentData.employee_id)
            .eq("business_id", businessId)
            .single();

        if (!employee) {
            return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        // Check for conflicting assignments
        const { data: existingAssignments } = await supabase
            .from("equipment_assignments")
            .select("id")
            .eq("equipment_id", assignmentData.equipment_id)
            .eq("status", "active")
            .gte("end_date", assignmentData.start_date)
            .lte("start_date", assignmentData.end_date || "9999-12-31");

        if (existingAssignments && existingAssignments.length > 0) {
            return NextResponse.json(
                { success: false, error: "Equipment has conflicting assignments during this period" },
                { status: 409 }
            );
        }

        const { data: assignment, error } = await supabase
            .from("equipment_assignments")
            .insert({
                ...assignmentData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Equipment assignment creation error:", error);
            return NextResponse.json({ success: false, error: "Failed to create assignment" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: assignment,
            message: "Assignment created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Equipment assignment creation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create assignment" },
            { status: 500 }
        );
    }
}

// PUT /api/equipment-assignments
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
            return NextResponse.json({ success: false, error: "Assignment ID is required" }, { status: 400 });
        }

        const assignmentData = AssignmentUpdateSchema.parse(updateData);

        // Validate assignment exists and belongs to business
        const { data: existingAssignment } = await supabase
            .from("equipment_assignments")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingAssignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        const { data: assignment, error } = await supabase
            .from("equipment_assignments")
            .update({
                ...assignmentData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select()
            .single();

        if (error) {
            console.error("Equipment assignment update error:", error);
            return NextResponse.json({ success: false, error: "Failed to update assignment" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: assignment,
            message: "Assignment updated successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Equipment assignment update error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update assignment" },
            { status: 500 }
        );
    }
}

// DELETE /api/equipment-assignments
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
            return NextResponse.json({ success: false, error: "Assignment ID is required" }, { status: 400 });
        }

        // Validate assignment exists and belongs to business
        const { data: existingAssignment } = await supabase
            .from("equipment_assignments")
            .select("id")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingAssignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("equipment_assignments")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Equipment assignment deletion error:", error);
            return NextResponse.json({ success: false, error: "Failed to delete assignment" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Assignment deleted successfully"
        }, { status: 204 });

    } catch (error) {
        console.error("Equipment assignment deletion error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete assignment" },
            { status: 500 }
        );
    }
}
