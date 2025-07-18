import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { openai, AI_MODELS } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

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

        return NextResponse.json({
            success: true,
            data: { text: response.text }
        }, { status: 200 });

    } catch (error) {
        console.error('Error in transcription API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
