
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

        const contentType = request.headers.get("content-type");

        // Handle voice transcription
        if (contentType?.includes("multipart/form-data")) {
            const formData = await request.formData();
            const audioFile = formData.get("audio") as File;

            if (!audioFile) {
                return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
            }

            const transcription = await openai.audio.transcriptions.create({
                file: audioFile,
                model: "whisper-1",
                language: "en",
            });

            return NextResponse.json({
                transcription: transcription.text,
            });
        }

        // Handle text processing for daily log structure extraction
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const structuringPrompt = `Analyze this construction daily log message and extract structured information. Only extract information that is explicitly mentioned - do not make assumptions or add details not provided.

Message: "${message}"

Extract any of the following that are mentioned:
- project_name or project_id
- work_completed (what was done)
- date (if mentioned, otherwise use today)
- weather conditions
- safety notes or incidents
- materials used
- equipment used
- crew members present
- issues or delays
- start_time and end_time
- hours_worked
- notes

Return as JSON with only the fields that have information. Use null for missing information.

Example format:
{
  "project_name": "extracted project name",
  "work_completed": "description of work done",
  "date": "YYYY-MM-DD",
  "weather": "weather description if mentioned",
  "safety": "safety notes if mentioned",
  "materials_used": ["material1", "material2"] or null,
  "equipment_used": ["equipment1"] or null,
  "start_time": "HH:MM" or null,
  "end_time": "HH:MM" or null,
  "hours_worked": number or null,
  "notes": "additional notes" or null,
  "missing_fields": ["list", "of", "required", "fields", "not", "provided"]
}

Only include fields with actual information from the message.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: structuringPrompt }],
            temperature: 0.2,
        });

        const result = completion.choices[0]?.message?.content?.trim();
        
        if (!result) {
            throw new Error('No response from AI');
        }

        try {
            const structuredLog = JSON.parse(result);
            
            // Ensure we have today's date if none specified
            if (!structuredLog.date) {
                structuredLog.date = new Date().toISOString().split('T')[0];
            }

            return NextResponse.json(structuredLog);
        } catch (parseError) {
            console.error("Error parsing structured log:", parseError);
            return NextResponse.json({
                error: "Failed to parse AI response",
                raw_response: result
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Transcription/processing error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
