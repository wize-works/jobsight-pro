import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/business/status
 * Check business status for a user
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const checkType = searchParams.get('type') || 'basic'; // basic | detailed

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ sucess: false, error: 'Database connection failed' }, { status: 500 });
        }

        if (checkType === 'detailed') {
            // Check business status with subscription info
            const { data, error } = await supabase
                .from('businesses')
                .select(`
          *,
          business_subscriptions (
            *
          )
        `)
                .eq('owner_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking business status:', error);
                return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
            }

            const hasSubscription = data?.business_subscriptions?.subscription_id ? true : false;
            const hasBusiness = data?.id ? true : false;

            return NextResponse.json({
                success: true,
                data: {
                    hasBusiness,
                    hasSubscription,
                    businessId: data?.id || null,
                    business: data
                }
            }, { status: 200 });
        } else {
            // Basic business status check
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id')
                .eq('auth_id', user.id)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.error('Error checking user business:', userError);
                return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
            }

            const hasBusiness = userData?.business_id ? true : false;

            return NextResponse.json({
                success: true,
                data: {
                    hasBusiness,
                    businessId: userData?.business_id || null
                }
            }, { status: 200 });
        }

    } catch (error) {
        console.error('Error in business status API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
