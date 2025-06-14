
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: NextRequest) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, context, conversationHistory } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Build intelligent system prompt
        const systemPrompt = `You are an AI assistant for a construction management platform called JobSight. You have access to the user's project data and can help with:

1. Answering questions about projects, tasks, equipment, crews, and daily logs
2. Creating structured daily logs from natural language descriptions
3. Providing insights about project progress, delays, and issues
4. Helping with safety compliance and reporting
5. Analyzing patterns in construction data

AVAILABLE DATA CONTEXT:
${JSON.stringify(context, null, 2)}

RESPONSE GUIDELINES:
- Be conversational and helpful, not robotic
- Use the actual data from the context to provide specific answers
- If asked to create a daily log, extract structured information and respond with action: 'create_daily_log'
- If navigating to a specific page would help, respond with action: 'navigate' and include the path
- Always provide actionable, specific responses based on the real project data
- If you don't have enough information, ask clarifying questions
- Reference specific project names, dates, and details from the context when relevant

RESPONSE FORMAT:
For regular questions: { "response": "your helpful answer", "action": "none" }
For daily log creation: { "response": "confirmation message", "action": "create_daily_log", "data": {...daily_log_fields} }
For navigation: { "response": "explanation", "action": "navigate", "path": "/dashboard/..." }

Remember: You're not just answering questions, you're helping manage construction projects intelligently.`;

        // Add conversation history for context
        const messages = [
            { role: "system", content: systemPrompt },
        ];

        // Add recent conversation for context
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach((msg: any) => {
                messages.push({
                    role: msg.type === "user" ? "user" : "assistant",
                    content: msg.content,
                });
            });
        }

        // Add current message
        messages.push({ role: "user", content: message });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages as any,
            temperature: 0.3,
            max_tokens: 1000,
        });

        const aiResponse = completion.choices[0]?.message?.content;

        if (!aiResponse) {
            return NextResponse.json(
                { error: "No response from AI" },
                { status: 500 }
            );
        }

        // Try to parse as JSON for structured responses
        try {
            const parsedResponse = JSON.parse(aiResponse);
            return NextResponse.json(parsedResponse);
        } catch {
            // If not JSON, return as plain response
            return NextResponse.json({
                response: aiResponse,
                action: "none",
            });
        }

    } catch (error) {
        console.error("AI query error:", error);
        return NextResponse.json(
            { error: "Failed to process AI query" },
            { status: 500 }
        );
    }
}
