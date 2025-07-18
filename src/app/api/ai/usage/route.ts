import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

// Helper function for business validation
async function validateBusinessAccess(userId: string, businessId: string): Promise<boolean> {
    const supabase = createServerClient();

    if (!supabase) {
        return false;
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('business_id')
        .eq('auth_id', userId)
        .single();

    if (userError || !userData) {
        return false;
    }

    return userData.business_id === businessId;
}

export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');

        if (!businessId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameter: businessId'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to business' }, { status: 403 });
        }

        // Validate businessId
        if (!businessId || businessId.trim() === '') {
            return NextResponse.json({
                success: false,
                error: 'Invalid business ID',
                data: {
                    currentUsage: 0,
                    limit: 0,
                    percentageUsed: 0,
                    canUseAI: false,
                    remainingTokens: 0
                }
            });
        }

        // Dynamic import to avoid circular dependencies
        const { checkAIUsageLimit } = await import('@/lib/ai/usage-limits');
        const usage = await checkAIUsageLimit(businessId);

        return NextResponse.json({ success: true, data: usage }, { status: 200 });

    } catch (error) {
        console.error('Error in AI usage API:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get AI usage data',
            data: {
                currentUsage: 0,
                limit: 0,
                percentageUsed: 0,
                canUseAI: false,
                remainingTokens: 0
            }
        }, { status: 500 });
    }
}
