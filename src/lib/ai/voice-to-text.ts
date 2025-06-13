
import { openai, AI_MODELS } from './client';
import { PROMPTS } from './prompts';

export interface VoiceTranscriptionResult {
  transcription: string;
  structuredLog: {
    summary: string;
    work_completed: string[];
    materials_used: Array<{
      name: string;
      quantity: string;
      unit: string;
    }>;
    equipment_used: string[];
    crew_present: string[];
    safety_notes: string;
    weather: string;
    issues: string[];
  };
}

export async function transcribeVoiceNote(
  audioFile: File
): Promise<VoiceTranscriptionResult> {
  try {
    // Step 1: Transcribe audio to text
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: AI_MODELS.TRANSCRIPTION,
      language: 'en',
    });

    // Step 2: Convert transcription to structured log
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.CHAT,
      messages: [
        {
          role: 'system',
          content: PROMPTS.VOICE_TO_LOG,
        },
        {
          role: 'user',
          content: `Voice transcription: "${transcription.text}"`,
        },
      ],
      temperature: 0.3,
    });

    const structuredData = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    );

    return {
      transcription: transcription.text,
      structuredLog: structuredData,
    };
  } catch (error) {
    console.error('Voice transcription error:', error);
    throw new Error('Failed to transcribe voice note');
  }
}
