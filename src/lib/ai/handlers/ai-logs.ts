import { createServerClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { embedText } from "../embeddings";

export async function logAIInteraction({
    businessId,
    userId,
    input,
    output,
    action,
    objectType,
    objectId,
    model,
    tokensPrompt,
    tokensCompletion
}: {
    businessId: string;
    userId?: string | null;
    input: string;
    output: string;
    action: string;
    objectType: string;
    objectId?: string | null;
    model: string;
    tokensPrompt: number;
    tokensCompletion: number;
}) {
    const supabase = createServerClient();
    if (!supabase) {
        console.error("❌ Supabase client not initialized");
        return { success: false, error: "Supabase client not initialized" };
    }
    const embedding = await embedText(input); // or output if preferred

    const { error } = await supabase.from("ai_logs").insert([
        {
            id: uuidv4(),
            business_id: businessId,
            user_id: userId ?? null,
            object_type: objectType,
            object_id: objectId ?? null,
            action,
            input,
            output,
            embedding,
            tokens_prompt: tokensPrompt,
            tokens_completion: tokensCompletion,
            model,
            created_at: new Date().toISOString()
        }
    ]);

    if (error) {
        console.error("Failed to log AI interaction:", error.message);
    }
}