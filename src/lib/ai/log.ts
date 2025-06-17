import { createServerClient } from "@/lib/supabase";

type LogAIParams = {
    business_id: string;
    user_id?: string;
    object_type: string;         // e.g. "task", "daily_log", "ai"
    object_id?: string;          // nullable — for non-object interactions
    action: string;              // e.g. "create", "query", "summarize"
    input: string;
    output: string;
    tokens_prompt: number;
    tokens_completion: number;
    model: string;
    embedding?: number[];        // optional: if embedding was calculated
};

export async function logAIInteraction(data: LogAIParams) {
    const supabase = createServerClient();
    if (!supabase) {
        console.error("❌ Supabase client not initialized");
        return { success: false, error: "Supabase client not initialized" };
    }
    const result = await supabase.from("ai_logs").insert([data]);

    if (result.error) {
        console.error("❌ Failed to log AI interaction:", result.error.message);
        return { success: false, error: result.error.message };
    }

    return { success: true };
}
