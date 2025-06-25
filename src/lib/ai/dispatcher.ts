"use server";
import { ChatCompletionMessageParam } from "openai/resources";
import { getRelevantContext } from "./context";
import { AI_MODELS, openai } from "./client";
import { logAIInteraction } from "./handlers/ai-logs";
import { checkAIUsageLimit, estimateTokensFromText } from "./usage-limits";

export async function handleAIQuery({
    businessId,
    userId,
    message,
    conversationHistory,
    sessionState
}: {
    businessId: string;
    userId: string;
    message: string;
    conversationHistory: { role: "user" | "assistant"; content: string }[];
    sessionState: { lastProjectId?: string; lastProjectName?: string };
}): Promise<{
    response: string;
    action?: string;
    path?: string;
    updatedSessionState?: typeof sessionState;
}> {
    // Check AI usage limits before processing
    const usageStatus = await checkAIUsageLimit(businessId);

    if (!usageStatus.canUseAI) {
        const limitMessage = usageStatus.limit === 0
            ? "AI Assistant is not available on your current plan. Please upgrade to access AI features."
            : `You've reached your monthly AI usage limit of ${usageStatus.limit.toLocaleString()} tokens. Your limit will reset next month, or you can upgrade your plan for higher limits.`;

        return {
            response: limitMessage,
            action: "upgrade_required",
            updatedSessionState: sessionState
        };
    }

    // Estimate tokens for the request to ensure we don't exceed limits
    const estimatedTokens = estimateTokensFromText(message + JSON.stringify(conversationHistory));
    if (estimatedTokens > usageStatus.remainingTokens) {
        return {
            response: `This request would exceed your remaining AI token allowance (${usageStatus.remainingTokens.toLocaleString()} tokens remaining). Please try a shorter message or upgrade your plan.`,
            action: "usage_warning",
            updatedSessionState: sessionState
        };
    }

    // Get context using the most recent project
    const context = await getRelevantContext(businessId, message, sessionState);

    const messages = [
        ...context,
        ...conversationHistory.slice(-5),
        { role: "user" as const, content: message }
    ]; const completion = await openai.chat.completions.create({
        model: AI_MODELS.CHAT_GPT_3_5,
        messages,
        temperature: 0.3,
        max_tokens: Math.min(1000, usageStatus.remainingTokens) // Respect remaining tokens
    });

    const aiText = completion.choices[0]?.message?.content ?? "I couldn’t understand that.";

    // Try to extract a matched project from the latest context (if available)
    const matchedProject = extractLastMatchedProject(context); // See below

    await logAIInteraction({
        businessId,
        userId,
        input: message,
        output: aiText,
        action: "none",
        objectType: "project",
        objectId: matchedProject ? matchedProject.id : null,
        model: AI_MODELS.CHAT_GPT_3_5,
        tokensPrompt: completion.usage?.prompt_tokens || 0,
        tokensCompletion: completion.usage?.completion_tokens || 0
    });

    return {
        response: aiText,
        action: "none",
        updatedSessionState: matchedProject
            ? { lastProjectId: matchedProject.id, lastProjectName: matchedProject.name }
            : sessionState
    };
}

function extractLastMatchedProject(
    contextMessages: ChatCompletionMessageParam[]
): { id: string; name: string } | null {
    const last = contextMessages.find(c =>
        typeof c.content === "string" && c.content.toLowerCase().includes("context project:")
    );

    const match = /Context project: (.*?) \[.*?\]/i.exec(typeof last?.content === "string" ? last.content : "");
    if (match) {
        return { id: "", name: match[1] }; // add ID if retrievable from earlier logic
    }
    return null;
}

