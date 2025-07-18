import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserBusiness } from "@/app/actions/business"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')

    try {
        // Get user ID from Clerk auth if not provided in params
        let userId = userIdParam;
        if (!userId) {
            const { userId: authUserId } = await auth();
            if (!authUserId) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
            userId = authUserId;
        }

        const businessResponse = await getUserBusiness(userId)

        // If there's an authentication error
        if ('success' in businessResponse && !businessResponse.success) {
            return NextResponse.json({
                success: false,
                error: businessResponse.error
            }, { status: 403 });
        }

        // If user has no business
        if (!businessResponse || !('id' in businessResponse)) {
            return NextResponse.json({
                success: true,
                hasBusiness: false
            }, { status: 200 });
        }

        return NextResponse.json({
            success: true,
            hasBusiness: true,
            business: businessResponse
        }, { status: 200 });
    } catch (error) {
        console.error('Error in business check:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to verify business access'
        }, { status: 500 });
    }
}