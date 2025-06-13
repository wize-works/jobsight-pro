
import { NextRequest, NextResponse } from 'next/server';
import { transcribeVoiceNote } from '@/lib/ai/voice-to-text';
import { withBusinessServer } from '@/lib/auth/with-business-server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and business context
    await withBusinessServer();
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }
    
    const result = await transcribeVoiceNote(audioFile);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
