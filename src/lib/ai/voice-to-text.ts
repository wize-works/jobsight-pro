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

export async function convertToStructuredLog(transcription: string): Promise<any> {
    console.log('Converting transcription to structured log:', transcription);

    const prompt = `
    Parse the following daily log transcription and extract structured information:

    "${transcription}"

    Please extract and return a JSON object with the following structure:
    {
        "date": "YYYY-MM-DD format if mentioned, otherwise today's date",
        "project_name": "name of the project if mentioned",
        "project_id": "project ID if specifically mentioned",
        "crew_name": "crew name if mentioned", 
        "work_completed": ["list of completed tasks/work"],
        "materials_used": [{"name": "material name", "quantity": "amount", "unit": "unit if specified"}],
        "equipment_used": [{"name": "equipment name", "hours": "hours used if mentioned"}],
        "weather": "weather conditions if mentioned",
        "safety_notes": "any safety concerns or incidents",
        "issues": ["any delays, problems, or setbacks"],
        "notes": "any additional notes or observations",
        "summary": "brief summary of the day's work",
        "hours_worked": "number of hours worked if mentioned",
        "start_time": "start time if mentioned (HH:MM format)",
        "end_time": "end time if mentioned (HH:MM format)",
        "work_planned": "work planned for next day if mentioned",
        "quality": "quality assessment if mentioned",
        "delays": "any delays mentioned"
    }

    IMPORTANT VALIDATION RULES:
    - If this appears to be continuing a previous conversation about a daily log, merge the information intelligently
    - For required fields (project_name/project_id and work_completed/summary), make sure they are populated if the information is available
    - If critical information is missing, indicate this in a "missing_fields" array
    - Use today's date if no date is specified
    - Only include fields that have actual information from the transcription. Use null for missing information.

    Return only the JSON object, no additional text.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });

        const result = response.choices[0]?.message?.content?.trim();
        if (!result) {
            throw new Error('No response from AI');
        }

        // Parse the JSON response
        const structuredLog = JSON.parse(result);

        // Ensure we have today's date if none specified
        if (!structuredLog.date) {
            structuredLog.date = new Date().toISOString().split('T')[0];
        }

        console.log('Structured log result:', structuredLog);

        return structuredLog;
    } catch (error) {
        console.error('Error converting to structured log:', error);
        throw new Error('Failed to process transcription');
    }
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