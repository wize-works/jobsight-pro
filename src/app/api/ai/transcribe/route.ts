import { NextRequest, NextResponse } from 'next/server';
import { transcribeVoiceNote, convertToStructuredLog } from '@/lib/ai/voice-to-text';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const contentType = request.headers.get('content-type');
        let transcriptionText = undefined;

        if (contentType?.includes('multipart/form-data')) {
            // Handle audio file upload
            const formData = await request.formData();
            const audioFile = formData.get('audio') as File;

            if (!audioFile) {
                return NextResponse.json(
                    { error: 'Audio file is required' },
                    { status: 400 }
                );
            }

            transcriptionText = await transcribeVoiceNote(audioFile);
        } else if (contentType?.includes('application/json')) {
            // Handle text input
            const body = await request.json();
            const message = body.message || body.text; // Support both field names

            if (!message) {
                return NextResponse.json(
                    { error: 'Message is required' },
                    { status: 400 }
                );
            }

            transcriptionText = message;
        } else {
            return NextResponse.json(
                { error: 'Invalid content type. Expected multipart/form-data or application/json' },
                { status: 400 }
            );
        }

        const structuredLog = await convertToStructuredLog(transcriptionText);

        return NextResponse.json(structuredLog);
    } catch (error) {
        console.error('Transcription API error:', error);
        return NextResponse.json(
            { error: 'Failed to process input' },
            { status: 500 }
        );
    }
}