import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/business/subscription
 * Assign a subscription to a business
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessId, subscriptionId } = body;

        if (!businessId || !subscriptionId) {
            return NextResponse.json({
                error: 'Business ID and subscription ID are required'
            }, { status: 400 });
        }

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Verify user has access to this business
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || userData?.business_id !== businessId) {
            return NextResponse.json({ error: 'Access denied to business' }, { status: 403 });
        }

        const now = new Date().toISOString();

        // Insert or update the business subscription
        const { error } = await supabase.from('business_subscriptions').upsert({
            business_id: businessId,
            plan_id: subscriptionId,
            status: 'incomplete',
            created_at: now,
            updated_at: now,
            created_by: user.id,
            updated_by: user.id,
        });

        if (error) {
            console.error('Error assigning subscription to business:', error);
            return NextResponse.json({
                error: `Failed to assign subscription: ${error.message}`
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in business subscription API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
