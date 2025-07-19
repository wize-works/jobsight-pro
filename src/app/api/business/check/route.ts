import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'

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

        // Get user's business using direct database query
        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
                id,
                business_id,
                business:businesses(
                    id,
                    name,
                    created_at,
                    updated_at
                )
            `)
            .eq('auth_id', userId)
            .single();

        if (userError) {
            console.error('Database error:', userError);
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // If user has no business
        if (!userData.business_id || !userData.business) {
            return NextResponse.json({
                success: true,
                hasBusiness: false
            }, { status: 200 });
        }

        return NextResponse.json({
            success: true,
            hasBusiness: true,
            business: userData.business
        }, { status: 200 });
    } catch (error) {
        console.error('Error in business check:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to verify business access'
        }, { status: 500 });
    }
}