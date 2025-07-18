import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const CreateDailyLogSchema = z.object({
    date: z.string(),
    project_id: z.string().uuid(),
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
    search: z.string().optional(),
    project_id: z.string().uuid().optional(),
    crew_id: z.string().uuid().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
});

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

        const url = new URL(request.url);
        const params = DailyLogParamsSchema.parse(Object.fromEntries(url.searchParams));

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

        // Build base query
        let query = supabase
            .from("daily_logs")
            .select("*")
            .eq("business_id", businessId)
            .order("date", { ascending: false });

        // Apply filters
        if (params.search) {
            query = query.or(`notes.ilike.%${params.search}%,work_completed.ilike.%${params.search}%,weather.ilike.%${params.search}%`);
        }

        if (params.project_id) {
            query = query.eq("project_id", params.project_id);
        }

        if (params.crew_id) {
            query = query.eq("crew_id", params.crew_id);
        }

        if (params.date_from) {
            query = query.gte("date", params.date_from);
        }

        if (params.date_to) {
            query = query.lte("date", params.date_to);
        }

        // Apply pagination
        const limit = params.limit ? parseInt(params.limit) : 50;
        const offset = params.offset ? parseInt(params.offset) : 0;

        query = query.range(offset, offset + limit - 1);

        const { data: dailyLogs, error } = await query;

        if (error) {
            console.error("Error fetching daily logs:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch daily logs" }, { status: 500 });
        }

        // Enhanced data fetching based on includes
        let transformedData = dailyLogs || [];

        if (params.include && dailyLogs?.length > 0) {
            const logIds = dailyLogs.map(log => log.id);
            const projectIds = [...new Set(dailyLogs.map(log => log.project_id).filter(Boolean))];
            const crewIds = [...new Set(dailyLogs.map(log => log.crew_id).filter(Boolean))];

            // Fetch related data based on includes
            const [projectsData, crewsData, materialsData, equipmentData, mediaData] = await Promise.all([
                params.include.includes('project') && projectIds.length > 0
                    ? supabase.from("projects").select("id, name, description, status, client_id").in("id", projectIds)
                    : Promise.resolve({ data: [] }),
                params.include.includes('crew') && crewIds.length > 0
                    ? supabase.from("crews").select("id, name, type, size").in("id", crewIds)
                    : Promise.resolve({ data: [] }),
                params.include.includes('materials')
                    ? supabase.from("daily_log_materials").select("*").in("daily_log_id", logIds)
                    : Promise.resolve({ data: [] }),
                params.include.includes('equipment')
                    ? supabase.from("daily_log_equipment").select("*").in("daily_log_id", logIds)
                    : Promise.resolve({ data: [] }),
                params.include.includes('media')
                    ? supabase.from("media_links").select("linked_id, media:media(*)").eq("linked_type", "daily_log").in("linked_id", logIds)
                    : Promise.resolve({ data: [] }),
            ]);

            // Create lookup maps for efficient data joining
            const projectsMap = new Map(projectsData.data?.map(p => [p.id, p]) || []);
            const crewsMap = new Map(crewsData.data?.map(c => [c.id, c]) || []);
            const materialsMap = new Map();
            const equipmentMap = new Map();
            const mediaMap = new Map();

            // Group materials by daily_log_id
            materialsData.data?.forEach(material => {
                if (!materialsMap.has(material.daily_log_id)) {
                    materialsMap.set(material.daily_log_id, []);
                }
                materialsMap.get(material.daily_log_id).push(material);
            });

            // Group equipment by daily_log_id
            equipmentData.data?.forEach(equipment => {
                if (!equipmentMap.has(equipment.daily_log_id)) {
                    equipmentMap.set(equipment.daily_log_id, []);
                }
                equipmentMap.get(equipment.daily_log_id).push(equipment);
            });

            // Group media by daily_log_id
            mediaData.data?.forEach((mediaLink: any) => {
                if (!mediaMap.has(mediaLink.linked_id)) {
                    mediaMap.set(mediaLink.linked_id, []);
                }
                mediaMap.get(mediaLink.linked_id).push(mediaLink.media);
            });

            // Transform data with includes
            transformedData = dailyLogs.map(log => ({
                ...log,
                ...(params.include?.includes('project') && { project: projectsMap.get(log.project_id) || null }),
                ...(params.include?.includes('crew') && { crew: crewsMap.get(log.crew_id) || null }),
                ...(params.include?.includes('materials') && { materials: materialsMap.get(log.id) || [] }),
                ...(params.include?.includes('equipment') && { equipment: equipmentMap.get(log.id) || [] }),
                ...(params.include?.includes('media') && { media: mediaMap.get(log.id) || [] }),
            }));
        }

        return NextResponse.json({
            success: true,
            data: transformedData,
            pagination: {
                limit,
                offset,
                hasMore: transformedData?.length === limit,
            },
        }, { status: 200 });

    } catch (error) {
        console.error("Error in daily logs GET:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

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

        const body = await request.json();
        const validatedData = CreateDailyLogSchema.parse(body);

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

        // Create daily log
        const { data, error } = await supabase
            .from("daily_logs")
            .insert({
                ...validatedData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select("*")
            .single();

        if (error) {
            console.error("Error creating daily log:", error);
            return NextResponse.json({ success: false, error: "Failed to create daily log" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: "Validation error", details: error.errors }, { status: 400 });
        }
        console.error("Error in daily logs POST:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
