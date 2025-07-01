import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { businessName, businessType, companySize, businessAddress, referralSource } = body;

        // Update user metadata using clerkClient
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
            unsafeMetadata: {
                businessName,
                businessType,
                companySize,
                businessAddress,
                referralSource,
                businessInfoCompleted: true,
                businessInfoCompletedAt: new Date().toISOString(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user metadata:', error);
        return NextResponse.json(
            { error: 'Failed to update user metadata' },
            { status: 500 }
        );
    }
}
