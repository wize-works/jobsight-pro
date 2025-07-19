import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { generateAzureUploadUrl } from '@/lib/media/azure';
import { MediaType } from '@/types/media';

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { type, filename } = await request.json();

        if (!type || !filename) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: type and filename'
            }, { status: 400 });
        }

        const uploadData = await generateAzureUploadUrl(type as MediaType, filename);

        if (!uploadData) {
            return NextResponse.json({
                success: false,
                error: 'Failed to generate upload URL'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: uploadData }, { status: 200 });
    } catch (error) {
        console.error('Error generating upload URL:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
