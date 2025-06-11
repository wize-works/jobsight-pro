import { NextResponse } from 'next/server'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getUserBusiness } from "@/app/actions/business"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' })
    }

    try {
        const businessResponse = await getUserBusiness(userId)

        // If there's an authentication error
        if ('success' in businessResponse && !businessResponse.success) {
            return NextResponse.json({
                success: false,
                error: businessResponse.error
            })
        }

        // If user has no business
        if (!businessResponse || !('id' in businessResponse)) {
            return NextResponse.json({
                success: true,
                hasBusiness: false
            })
        }

        return NextResponse.json({
            success: true,
            hasBusiness: true,
            business: businessResponse
        })
    } catch (error) {
        console.error('Error in business check:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to verify business access'
        })
    }
}