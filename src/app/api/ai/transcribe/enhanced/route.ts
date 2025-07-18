import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { openai, AI_MODELS } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const contextType = formData.get('type') as string || 'general';
        const enhance = formData.get('enhance') === 'true';

        if (!audioFile) {
            return NextResponse.json({
                success: false,
                error: 'Missing audio file'
            }, { status: 400 });
        }

        const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: AI_MODELS.TRANSCRIPTION,
        });

        const transcribedText = response.text;

        // If enhancement is requested, clean up and format the text
        if (enhance) {
            const enhancementPrompt = `Clean up and format this transcribed text for ${contextType} use:

"${transcribedText}"

Instructions:
- Fix obvious transcription errors
- Improve grammar and punctuation
- Keep the original meaning and content
- Format appropriately for ${contextType} context
- Return only the cleaned text, no additional commentary

Cleaned text:`;

            const completion = await openai.chat.completions.create({
                model: AI_MODELS.CHAT_GPT_3_5,
                messages: [
                    { role: "system", content: "You are a text editing assistant. Clean up transcribed text while preserving the original meaning." },
                    { role: "user", content: enhancementPrompt }
                ],
                temperature: 0.1,
            });

            const enhancedText = completion.choices[0]?.message?.content?.trim() || transcribedText;

            return NextResponse.json({
                success: true,
                data: {
                    text: transcribedText,
                    enhanced: enhancedText
                }
            }, { status: 200 });
        }

        return NextResponse.json({
            success: true,
            data: { text: transcribedText }
        }, { status: 200 });

    } catch (error) {
        console.error('Error in enhanced transcription API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
