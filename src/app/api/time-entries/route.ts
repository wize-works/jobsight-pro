import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const TimeEntryQuerySchema = z.object({
    include: z.string().optional(),
    project_id: z.string().optional(),
    crew_member_id: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const TimeEntryCreateSchema = z.object({
    project_id: z.string().uuid().optional(),
    crew_member_id: z.string().uuid().optional(),
    description: z.string().min(1, "Description is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().optional(),
    duration_minutes: z.coerce.number().min(1, "Duration must be positive"),
    is_billable: z.boolean().optional().default(true),
    hourly_rate: z.coerce.number().optional(),
    notes: z.string().optional(),
});

const TimeEntryUpdateSchema = TimeEntryCreateSchema.partial();

// GET /api/time-entries
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
        const params = TimeEntryQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("time_entries")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.project_id) {
            query = query.eq("project_id", params.project_id);
        }

        if (params.crew_member_id) {
            query = query.eq("crew_member_id", params.crew_member_id);
        }

        if (params.start_date) {
            query = query.gte("start_time", params.start_date);
        }

        if (params.end_date) {
            query = query.lte("start_time", params.end_date);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("start_time", { ascending: false });

        const { data: timeEntries, error } = await query;

        if (error) {
            console.error("Time entries fetch error:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch time entries" }, { status: 500 });
        }

        // Handle includes
        if (params.include && timeEntries) {
            const includes = params.include.split(",");

            for (const entry of timeEntries) {
                // Add project details
                if (includes.includes("project") && entry.project_id) {
                    const { data: project } = await supabase
                        .from("projects")
                        .select("*")
                        .eq("id", entry.project_id)
                        .single();

                    (entry as any).project = project;
                }

                // Add crew member details
                if (includes.includes("crew_member") && entry.crew_member_id) {
                    const { data: crewMember } = await supabase
                        .from("crew_members")
                        .select("*")
                        .eq("id", entry.crew_member_id)
                        .single();

                    (entry as any).crew_member = crewMember;
                }

                // Add billing calculation
                if (includes.includes("billing")) {
                    const duration_hours = entry.duration_minutes / 60;
                    const rate = entry.hourly_rate || 0;
                    const total_cost = duration_hours * rate;

                    (entry as any).billing = {
                        duration_hours,
                        hourly_rate: rate,
                        total_cost,
                        is_billable: entry.is_billable
                    };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: timeEntries,
            count: timeEntries?.length || 0
        }, { status: 200 });

    } catch (error) {
        console.error("Time entries API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch time entries" },
            { status: 500 }
        );
    }
}

// POST /api/time-entries
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
        const entryData = TimeEntryCreateSchema.parse(body);

        // Validate project exists if provided
        if (entryData.project_id) {
            const { data: project } = await supabase
                .from("projects")
                .select("id")
                .eq("id", entryData.project_id)
                .eq("business_id", businessId)
                .single();

            if (!project) {
                return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
            }
        }

        // Validate crew member exists if provided
        if (entryData.crew_member_id) {
            const { data: crewMember } = await supabase
                .from("crew_members")
                .select("id")
                .eq("id", entryData.crew_member_id)
                .eq("business_id", businessId)
                .single();

            if (!crewMember) {
                return NextResponse.json({ success: false, error: "Crew member not found" }, { status: 404 });
            }
        }

        // Create time entry
        const { data, error } = await supabase
            .from("time_entries")
            .insert({
                business_id: businessId,
                user_id: user.id,
                ...entryData,
                created_by: user.id,
                updated_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating time entry:", error);
            return NextResponse.json({ success: false, error: "Failed to create time entry" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data
        }, { status: 201 });

    } catch (error) {
        console.error("Time entries API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create time entry" },
            { status: 500 }
        );
    }
}

// PUT /api/time-entries
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
            return NextResponse.json({ success: false, error: "Time entry ID is required" }, { status: 400 });
        }

        const entryData = TimeEntryUpdateSchema.parse(updateData);

        // Verify time entry exists and belongs to business
        const { data: existingEntry } = await supabase
            .from("time_entries")
            .select("id")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingEntry) {
            return NextResponse.json({ success: false, error: "Time entry not found" }, { status: 404 });
        }

        // Update time entry
        const { data, error } = await supabase
            .from("time_entries")
            .update({
                ...entryData,
                updated_by: user.id,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select()
            .single();

        if (error) {
            console.error("Error updating time entry:", error);
            return NextResponse.json({ success: false, error: "Failed to update time entry" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data
        }, { status: 200 });

    } catch (error) {
        console.error("Time entries API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update time entry" },
            { status: 500 }
        );
    }
}

// DELETE /api/time-entries
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
            return NextResponse.json({ success: false, error: "Time entry ID is required" }, { status: 400 });
        }

        // Verify time entry exists and belongs to business
        const { data: existingEntry } = await supabase
            .from("time_entries")
            .select("id")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingEntry) {
            return NextResponse.json({ success: false, error: "Time entry not found" }, { status: 404 });
        }

        // Delete time entry
        const { error } = await supabase
            .from("time_entries")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Error deleting time entry:", error);
            return NextResponse.json({ success: false, error: "Failed to delete time entry" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Time entry deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Time entries API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete time entry" },
            { status: 500 }
        );
    }
}
