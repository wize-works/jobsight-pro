
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODELS = {
  CHAT: 'gpt-4o-mini',
  TRANSCRIPTION: 'whisper-1',
  VISION: 'gpt-4o',
} as const;
