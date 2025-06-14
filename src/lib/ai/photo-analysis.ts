
import { openai, AI_MODELS } from './client';
import { PROMPTS } from './prompts';

export interface PhotoAnalysisResult {
  safety_observations: string[];
  progress_assessment: string;
  quality_notes: string[];
  equipment_identified: string[];
  issues_identified: string[];
  recommendations: string[];
}

export async function analyzeConstructionPhoto(
  imageUrl: string
): Promise<PhotoAnalysisResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.VISION,
      messages: [
        {
          role: 'system',
          content: PROMPTS.PHOTO_ANALYSIS,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this construction site photo:',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.3,
    });

    const analysis = completion.choices[0]?.message?.content || '';
    
    // Parse the analysis into structured format
    // This is a simplified parser - you might want to make this more robust
    return {
      safety_observations: extractSection(analysis, 'safety'),
      progress_assessment: extractSection(analysis, 'progress')[0] || '',
      quality_notes: extractSection(analysis, 'quality'),
      equipment_identified: extractSection(analysis, 'equipment'),
      issues_identified: extractSection(analysis, 'issues'),
      recommendations: extractSection(analysis, 'recommendations'),
    };
  } catch (error) {
    console.error('Photo analysis error:', error);
    throw new Error('Failed to analyze photo');
  }
}

function extractSection(text: string, section: string): string[] {
  // Simple extraction logic - you might want to improve this
  const lines = text.split('\n');
  const sectionLines: string[] = [];
  let inSection = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes(section)) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith('-')) {
      sectionLines.push(line.substring(1).trim());
    } else if (inSection && line.trim() === '') {
      break;
    }
  }
  
  return sectionLines;
}
