import { createServerClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function createDailyLogFromAI({
    businessId,
    userId,
    args,
    originalMessage
}: {
    businessId: string;
    userId: string;
    args: {
        project_id: string;
        work_completed: string;
        hours_worked?: number;
        start_time?: string;
        end_time?: string;
    };
    originalMessage: string;
}) {
    const supabase = createServerClient();
    if (!supabase) {
        throw new Error("Supabase client not initialized");
    }
    const logId = uuidv4();
    const date = new Date().toISOString().split("T")[0]; // today's date
    const now = new Date().toISOString();

    let hours_worked = args.hours_worked ?? 0;
    if (args.start_time && args.end_time && !args.hours_worked) {
        try {
            const start = new Date(`1970-01-01T${args.start_time}:00Z`);
            const end = new Date(`1970-01-01T${args.end_time}:00Z`);
            hours_worked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        } catch {
            hours_worked = 0;
        }
    }

    const overtime = hours_worked > 8 ? hours_worked - 8 : 0;

    const result = await supabase.from("daily_logs").insert([
        {
            id: logId,
            business_id: businessId,
            project_id: args.project_id,
            author_id: userId,
            work_completed: args.work_completed,
            date,
            hours_worked,
            start_time: args.start_time || null,
            end_time: args.end_time || null,
            overtime,
            notes: `Created via AI: "${originalMessage}"`,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId
        }
    ]);

    if (result.error) {
        console.error("AI log insert error:", result.error.message);
        return { success: false, error: result.error.message };
    }

    return {
        success: true,
        logId,
        message: `Daily log created for project ${args.project_id}`
    };
}
