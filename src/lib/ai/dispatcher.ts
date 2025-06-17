"use server";
import { ChatCompletionMessageParam } from "openai/resources";
import { getRelevantContext } from "./context";
import { AI_MODELS, openai } from "./client";

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
    // Get context using the most recent project
    const context = await getRelevantContext(businessId, message, sessionState);

    const messages = [
        ...context,
        ...conversationHistory.slice(-5),
        { role: "user" as const, content: message }
    ];

    const completion = await openai.chat.completions.create({
        model: AI_MODELS.CHAT_GPT_3_5,
        messages,
        temperature: 0.3,
        max_tokens: 1000
    });

    const aiText = completion.choices[0]?.message?.content ?? "I couldn’t understand that.";

    // Try to extract a matched project from the latest context (if available)
    const matchedProject = extractLastMatchedProject(context); // See below

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

