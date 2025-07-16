import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { SweepstakeDashboardResponse } from '@/types/referral';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const businessId = url.searchParams.get('business_id');

        if (!businessId) {
            return NextResponse.json(
                { success: false, error: 'Business ID required' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Database connection failed' },
                { status: 500 }
            );
        }

        // Verify user has access to this business
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('business_id, role')
            .eq('auth_id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.business_id !== businessId) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        // Get business details
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('name, referral_code')
            .eq('id', businessId)
            .single();

        if (businessError || !business) {
            return NextResponse.json(
                { success: false, error: 'Business not found' },
                { status: 404 }
            );
        }

        // Get sweepstake entries for this business
        const { data: entries, error: entriesError } = await supabase
            .from('sweepstake_entries')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (entriesError) {
            console.error('Error fetching sweepstake entries:', entriesError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch entries' },
                { status: 500 }
            );
        }

        // Get referral statistics
        const { data: referrals, error: referralsError } = await supabase
            .from('referrals')
            .select('status')
            .eq('referrer_business_id', businessId);

        if (referralsError) {
            console.error('Error fetching referrals:', referralsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch referrals' },
                { status: 500 }
            );
        }

        // Calculate statistics
        const totalEntries = entries?.length || 0;
        const businessSignups = entries?.filter(entry => entry.entry_type === 'business_signup').length || 0;
        const referralEntries = entries?.filter(entry => entry.entry_type === 'referral').length || 0;
        const confirmedReferrals = referrals?.filter(ref => ref.status === 'confirmed').length || 0;
        const pendingReferrals = referrals?.filter(ref => ref.status === 'pending').length || 0;

        const stats = {
            totalEntries,
            businessSignups,
            confirmedReferrals,
            pendingReferrals,
            referralCode: business.referral_code || '',
            businessName: business.name || 'Unknown Business',
        };

        const response: SweepstakeDashboardResponse = {
            stats,
            entries: entries || [],
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in sweepstake dashboard:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
