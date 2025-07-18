import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { openai, AI_MODELS } from "@/lib/ai/client";
import { createDailyLog } from "@/app/actions/daily-logs";
import { DailyLogInsert } from "@/types/daily-logs";
import { getAIContextData } from '@/lib/ai-context';

// Helper function for business validation
async function validateBusinessAccess(userId: string, businessId: string): Promise<boolean> {
    const supabase = createServerClient();

    if (!supabase) {
        return false;
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('business_id')
        .eq('auth_id', userId)
        .single();

    if (userError || !userData) {
        return false;
    }

    return userData.business_id === businessId;
}

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessId, projectId, projectName, workSummary } = body;

        if (!businessId || !projectId || !projectName || !workSummary) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters: businessId, projectId, projectName, workSummary'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Access denied to business' }, { status: 403 });
        }

        // Get context data for enhanced crew matching
        const contextData = await getAIContextData(businessId);

        // Enhanced AI prompt to extract all available information
        const enhancementPrompt = `Analyze this construction work summary and extract ALL available information into a structured format:

"${workSummary}"

Return a JSON object with the following fields (use null for missing information, don't make up data):

{
  "work_completed": "Brief summary of work done",
  "work_planned": "Work planned for tomorrow/next day if mentioned",
  "start_time": "Start time in HH:MM format if mentioned",
  "end_time": "End time in HH:MM format if mentioned", 
  "hours_worked": number (calculate from start/end time or extract if mentioned),
  "overtime": number (overtime hours if mentioned),
  "weather": "Weather conditions if mentioned",
  "safety": "Safety notes, incidents, or observations",
  "quality": "Quality notes or inspections mentioned",
  "delays": "Any delays, issues, or problems mentioned",
  "crew_info": "Crew name, size, or members if mentioned",
  "materials": ["array", "of", "materials", "mentioned"],
  "equipment": ["array", "of", "equipment", "used"]
}

Only include information that is actually present in the input. Be precise and factual.`;

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT_GPT_3_5,
            messages: [
                { role: "system", content: "You are a construction daily log assistant. Extract structured data from work summaries. Return only valid JSON." },
                { role: "user", content: enhancementPrompt }
            ],
            temperature: 0.1,
            max_tokens: 800,
        });

        let extractedData;
        try {
            const aiResponse = completion.choices[0]?.message?.content?.trim();
            extractedData = JSON.parse(aiResponse || "{}");
        } catch (error) {
            console.error("Failed to parse AI response as JSON:", error);
            extractedData = { work_completed: workSummary };
        }

        // Calculate hours worked if start and end times are provided
        let hoursWorked = extractedData.hours_worked || 0;
        if (extractedData.start_time && extractedData.end_time && !hoursWorked) {
            try {
                const start = new Date(`2024-01-01 ${extractedData.start_time}`);
                const end = new Date(`2024-01-01 ${extractedData.end_time}`);
                hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            } catch (error) {
                console.error("Error calculating hours worked:", error);
            }
        }

        // Calculate overtime (anything over 8 hours)
        let overtime = extractedData.overtime || 0;
        if (hoursWorked > 8 && !overtime) {
            overtime = hoursWorked - 8;
        }

        // Try to match crew from extracted crew_info
        let crewId = "";
        if (extractedData.crew_info && contextData.crews.length > 0) {
            const crewMatch = contextData.crews.find((crew: { name: string; }) =>
                extractedData.crew_info.toLowerCase().includes(crew.name.toLowerCase()) ||
                crew.name.toLowerCase().includes(extractedData.crew_info.toLowerCase())
            );
            if (crewMatch) {
                crewId = crewMatch.id;
            }
        }

        // Create the daily log using existing action with enhanced data
        const result = await createDailyLog(
            businessId,
            {
                project_id: projectId,
                crew_id: crewId,
                date: new Date().toISOString().split('T')[0],
                work_completed: extractedData.work_completed || workSummary,
                work_planned: extractedData.work_planned || "",
                start_time: extractedData.start_time || "",
                end_time: extractedData.end_time || "",
                hours_worked: hoursWorked,
                overtime: overtime,
                weather: extractedData.weather || "",
                safety: extractedData.safety || "",
                quality: extractedData.quality || "",
                delays: extractedData.delays || "",
                notes: `Created via AI Assistant from: "${workSummary}"${extractedData.materials?.length ? `\n\nMaterials mentioned: ${extractedData.materials.join(', ')}` : ''}${extractedData.equipment?.length ? `\n\nEquipment mentioned: ${extractedData.equipment.join(', ')}` : ''}${extractedData.crew_info ? `\n\nCrew info: ${extractedData.crew_info}` : ''}`,
                author_id: user.id,
                created_by: user.id,
                updated_by: user.id,
                business_id: "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as DailyLogInsert
        );

        if (result && result.id) {
            return NextResponse.json({
                success: true,
                data: { logId: result.id }
            }, { status: 200 });
        } else {
            return NextResponse.json({
                success: false,
                error: "Failed to create daily log"
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in AI daily log creation API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
