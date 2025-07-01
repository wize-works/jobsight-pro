
import { NextRequest, NextResponse } from 'next/server';
import { analyzeConstructionPhoto } from '@/lib/ai/photo-analysis';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            );
        }

        const analysis = await analyzeConstructionPhoto(imageUrl);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Photo analysis API error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze photo' },
            { status: 500 }
        );
    }
}
