import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const UpdateDailyLogSchema = z.object({
    date: z.string().optional(),
    project_id: z.string().uuid().optional(),
    crew_id: z.string().uuid().optional(),
    weather: z.string().optional(),
    work_completed: z.string().optional(),
    work_planned: z.string().optional(),
    hours_worked: z.number().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    overtime: z.number().optional(),
    safety: z.string().optional(),
    quality: z.string().optional(),
    delays: z.string().optional(),
    notes: z.string().optional(),
});

const DailyLogParamsSchema = z.object({
    include: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        const { id } = await params;
        const url = new URL(request.url);
        const queryParams = DailyLogParamsSchema.parse(Object.fromEntries(url.searchParams));

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness?.business_id) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;

        // Get daily log
        const { data: dailyLog, error } = await supabase
            .from("daily_logs")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (error || !dailyLog) {
            return NextResponse.json({ error: "Daily log not found" }, { status: 404 });
        }

        // Enhanced data fetching based on includes
        let transformedData = dailyLog;

        if (queryParams.include) {
            const includes = queryParams.include.split(',');

            // Fetch related data based on includes
            const [projectData, crewData, materialsData, equipmentData, mediaData] = await Promise.all([
                includes.includes('project') && dailyLog.project_id
                    ? supabase.from("projects").select("id, name, description, status, client_id").eq("id", dailyLog.project_id).single()
                    : Promise.resolve({ data: null }),
                includes.includes('crew') && dailyLog.crew_id
                    ? supabase.from("crews").select("id, name, type, size").eq("id", dailyLog.crew_id).single()
                    : Promise.resolve({ data: null }),
                includes.includes('materials')
                    ? supabase.from("daily_log_materials").select("*").eq("daily_log_id", id)
                    : Promise.resolve({ data: [] }),
                includes.includes('equipment')
                    ? supabase.from("daily_log_equipment").select("*").eq("daily_log_id", id)
                    : Promise.resolve({ data: [] }),
                includes.includes('media')
                    ? supabase.from("media_links").select("linked_id, media:media(*)").eq("linked_type", "daily_log").eq("linked_id", id)
                    : Promise.resolve({ data: [] }),
            ]);

            // Get client data if project is included
            let clientData = null;
            if (includes.includes('project') && projectData.data?.client_id) {
                const { data: client } = await supabase
                    .from("clients")
                    .select("id, name, contact_name, contact_email, contact_phone")
                    .eq("id", projectData.data.client_id)
                    .single();
                clientData = client;
            }

            // Get equipment info if equipment is included
            let equipmentInfoData: any[] = [];
            if (includes.includes('equipment') && equipmentData.data && equipmentData.data.length > 0) {
                const equipmentIds = equipmentData.data.map((eq: any) => eq.equipment_id).filter(Boolean);
                if (equipmentIds.length > 0) {
                    const { data: equipmentInfo } = await supabase
                        .from("equipment")
                        .select("id, name")
                        .in("id", equipmentIds);
                    equipmentInfoData = equipmentInfo || [];
                }
            }

            // Format response to match DailyLogWithDetails interface
            transformedData = {
                ...dailyLog,
                ...(includes.includes('project') && {
                    project: projectData.data ? {
                        id: projectData.data.id,
                        name: projectData.data.name,
                        description: projectData.data.description
                    } : null
                }),
                ...(includes.includes('crew') && {
                    crew: crewData.data ? {
                        id: crewData.data.id,
                        name: crewData.data.name
                    } : null
                }),
                ...(includes.includes('materials') && {
                    materials: materialsData.data?.map((material: any) => ({
                        id: material.id,
                        name: material.name,
                        quantity: material.quantity,
                        cost: material.cost,
                        supplier: material.supplier
                    })) || []
                }),
                ...(includes.includes('equipment') && {
                    equipment: equipmentData.data?.map((eq: any) => ({
                        id: eq.id,
                        name: equipmentInfoData.find((info: any) => info.id === eq.equipment_id)?.name || eq.name,
                        hours: eq.hours
                    })) || []
                }),
                ...(includes.includes('media') && { media: mediaData.data?.map((link: any) => link.media) || [] }),
                ...(includes.includes('project') && {
                    client: clientData ? {
                        id: clientData.id,
                        name: clientData.name,
                        contact_name: clientData.contact_name,
                        contact_email: clientData.contact_email,
                        contact_phone: clientData.contact_phone
                    } : {
                        id: "",
                        name: null,
                        contact_name: null,
                        contact_email: null,
                        contact_phone: null
                    }
                }),
            };
        }

        return NextResponse.json({ success: true, data: transformedData });

    } catch (error) {
        console.error("Error in daily log GET:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = UpdateDailyLogSchema.parse(body);

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness?.business_id) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;

        // Update daily log
        const { data, error } = await supabase
            .from("daily_logs")
            .update({
                ...validatedData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select("*")
            .single();

        if (error) {
            console.error("Error updating daily log:", error);
            return NextResponse.json({ error: "Failed to update daily log" }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Daily log not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        console.error("Error in daily log PUT:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        const { id } = await params;

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness?.business_id) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;

        // Delete daily log (cascading deletes will handle materials, equipment, etc.)
        const { error } = await supabase
            .from("daily_logs")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Error deleting daily log:", error);
            return NextResponse.json({ error: "Failed to delete daily log" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Daily log deleted successfully" });

    } catch (error) {
        console.error("Error in daily log DELETE:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
