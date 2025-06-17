import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODELS = {
    CHAT_GPT_4: "gpt-4",
    CHAT_GPT_4O: "gpt-4o",
    CHAT_GPT_4O_MINI: "gpt-4o-mini", // use for cost-efficient ops
    CHAT_GPT_3_5: "gpt-3.5-turbo",
    TRANSCRIPTION: "whisper-1",
    VISION: "gpt-4o" // vision-capable
} as const;
