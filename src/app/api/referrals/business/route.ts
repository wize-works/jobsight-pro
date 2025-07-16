import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { ReferralCreationRequest, ReferralCreationResponse } from '@/types/referral';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body: ReferralCreationRequest = await request.json();
        const { referrer_code, business_id, plan_type } = body;

        // Validate required fields
        if (!referrer_code || !business_id || !plan_type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate plan type
        if (!['starter', 'pro', 'business'].includes(plan_type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid plan type' },
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

        // Find referrer business by code
        const { data: referrerBusiness, error: referrerError } = await supabase
            .from('businesses')
            .select('id, name')
            .eq('referral_code', referrer_code)
            .single();

        if (referrerError || !referrerBusiness) {
            return NextResponse.json(
                { success: false, error: 'Invalid referral code' },
                { status: 400 }
            );
        }

        // Validate referee business exists and user has access
        const { data: refereeBusiness, error: refereeError } = await supabase
            .from('businesses')
            .select('id, name')
            .eq('id', business_id)
            .single();

        if (refereeError || !refereeBusiness) {
            return NextResponse.json(
                { success: false, error: 'Invalid business ID' },
                { status: 400 }
            );
        }

        // Check if user has access to referee business
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.business_id !== business_id) {
            return NextResponse.json(
                { success: false, error: 'Access denied to business' },
                { status: 403 }
            );
        }

        // Prevent self-referral
        if (referrerBusiness.id === business_id) {
            return NextResponse.json(
                { success: false, error: 'Cannot refer your own business' },
                { status: 400 }
            );
        }

        // Check for existing referral
        const { data: existingReferral, error: existingError } = await supabase
            .from('referrals')
            .select('id')
            .eq('referrer_business_id', referrerBusiness.id)
            .eq('referee_business_id', business_id)
            .single();

        if (existingReferral) {
            return NextResponse.json(
                { success: false, error: 'Referral already exists' },
                { status: 400 }
            );
        }

        // Create referral record
        const referralData = {
            id: uuidv4(),
            referrer_business_id: referrerBusiness.id,
            referee_business_id: business_id,
            referee_user_id: userId,
            plan_type,
            status: 'pending' as const,
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data: referral, error: referralError } = await supabase
            .from('referrals')
            .insert(referralData)
            .select()
            .single();

        if (referralError) {
            console.error('Error creating referral:', referralError);
            return NextResponse.json(
                { success: false, error: 'Failed to create referral' },
                { status: 500 }
            );
        }

        // Create business signup sweepstake entry for the referee
        const sweepstakeEntry = {
            id: uuidv4(),
            business_id: business_id,
            user_id: userId,
            entry_type: 'business_signup' as const,
            plan_type,
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error: entryError } = await supabase
            .from('sweepstake_entries')
            .insert(sweepstakeEntry);

        if (entryError) {
            console.error('Error creating sweepstake entry:', entryError);
            // Don't fail the referral creation for this
        }

        const response: ReferralCreationResponse = {
            success: true,
            referral,
            referrer_business: referrerBusiness.name,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in referral creation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
