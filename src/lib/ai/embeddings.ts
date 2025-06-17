import { openai } from "./client";

export async function embedText(text: string): Promise<number[] | null> {
    try {
        const result = await openai.embeddings.create({
            input: text,
            model: "text-embedding-3-small"
        });
        return result.data[0]?.embedding ?? null;
    } catch (error) {
        console.error("Embedding error:", error);
        return null;
    }
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
    try {
        const result = await openai.embeddings.create({
            input: texts,
            model: "text-embedding-3-small"
        });
        return result.data.map(item => item.embedding);
    } catch (error) {
        console.error("Embedding error:", error);
        return [];
    }
}