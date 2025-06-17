import { createServerClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function createTaskFromAI({
    businessId,
    userId,
    args,
    originalMessage
}: {
    businessId: string;
    userId: string;
    args: {
        project_id: string;
        name: string;
        description?: string;
        due_date?: string;
        priority?: string;
    };
    originalMessage: string;
}) {
    const supabase = createServerClient();
    if (!supabase) {
        throw new Error("Supabase client not initialized");
    }
    const taskId = uuidv4();
    const now = new Date().toISOString();

    const result = await supabase.from("tasks").insert([
        {
            id: taskId,
            business_id: businessId,
            project_id: args.project_id,
            name: args.name,
            description: args.description || `Created via AI: "${originalMessage}"`,
            due_date: args.due_date || null,
            priority: args.priority || "medium",
            status: "not_started",
            progress: 0,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId
        }
    ]);

    if (result.error) {
        console.error("AI task insert error:", result.error.message);
        return { success: false, error: result.error.message };
    }

    return {
        success: true,
        taskId,
        message: `Task '${args.name}' created for project ${args.project_id}`
    };
}

