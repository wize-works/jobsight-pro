/**
 * Client-side function to get AI usage data
 * Uses API route for proper Next.js 15 patterns
 */
export async function getAIUsageDataClient(): Promise<{
    success: boolean;
    data?: {
        currentUsage: number;
        limit: number;
        percentageUsed: number;
        canUseAI: boolean;
        remainingTokens: number;
    };
    error?: string;
}> {
    try {
        const response = await fetch('/api/ai/usage');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching AI usage data:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Client-side function to process AI queries
 * Uses API route for proper Next.js 15 patterns
 */
export async function processAIQueryClient(
    query: string,
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{
    response: string;
    action?: string;
    data?: any;
    path?: string;
}> {
    try {
        const response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                conversationHistory
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error processing AI query:', error);
        return {
            response: "I'm experiencing technical difficulties. Please try again later.",
            action: undefined,
            data: undefined,
            path: undefined
        };
    }
}

/**
 * Client-side function to transcribe audio
 * Uses API route for proper Next.js 15 patterns
 */
export async function transcribeAudioClient(audioBlob: Blob): Promise<{ text: string; error?: string }> {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        const response = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return {
            text: '',
            error: error instanceof Error ? error.message : 'Transcription failed'
        };
    }
}
