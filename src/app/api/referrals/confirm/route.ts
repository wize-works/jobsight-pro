import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ReferralConfirmationRequest, ReferralConfirmationResponse } from '@/types/referral';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { referral_id, subscription_id, business_id } = body;

        // Validate required fields - need either referral_id or business_id
        if (!subscription_id || (!referral_id && !business_id)) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
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

        let referrals: any[] = [];

        if (referral_id) {
            // Original approach - confirm specific referral
            const { data: referral, error: referralError } = await supabase
                .from('referrals')
                .select('*')
                .eq('id', referral_id)
                .eq('status', 'pending')
                .single();

            if (referralError || !referral) {
                return NextResponse.json(
                    { success: false, error: 'Invalid or already confirmed referral' },
                    { status: 400 }
                );
            }
            referrals = [referral];
        } else {
            // New approach - confirm all pending referrals for business
            const { data: businessReferrals, error: referralError } = await supabase
                .from('referrals')
                .select('*')
                .eq('referee_business_id', business_id)
                .eq('status', 'pending');

            if (referralError) {
                return NextResponse.json(
                    { success: false, error: 'Failed to fetch referrals' },
                    { status: 500 }
                );
            }
            referrals = businessReferrals || [];
        }

        if (referrals.length === 0) {
            return NextResponse.json(
                { success: true, message: 'No pending referrals to confirm' },
                { status: 200 }
            );
        }

        // Verify subscription exists
        const { data: subscription, error: subscriptionError } = await supabase
            .from('business_subscriptions')
            .select('id, business_id, plan_id')
            .eq('id', subscription_id)
            .single();

        if (subscriptionError || !subscription) {
            return NextResponse.json(
                { success: false, error: 'Invalid subscription' },
                { status: 400 }
            );
        }

        let confirmedCount = 0;
        const errors: string[] = [];

        // Process each referral
        for (const referral of referrals) {
            try {
                // Verify subscription belongs to referee business
                if (subscription.business_id !== referral.referee_business_id) {
                    errors.push(`Subscription does not match referral ${referral.id}`);
                    continue;
                }

                // Update referral status to confirmed
                const { error: updateError } = await supabase
                    .from('referrals')
                    .update({
                        status: 'confirmed',
                        subscription_id: subscription_id,
                        confirmed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', referral.id);

                if (updateError) {
                    console.error('Error updating referral:', updateError);
                    errors.push(`Failed to confirm referral ${referral.id}`);
                    continue;
                }

                // Create sweepstake entry for referrer business
                const sweepstakeEntry = {
                    id: uuidv4(),
                    business_id: referral.referrer_business_id,
                    user_id: referral.referee_user_id,
                    entry_type: 'referral' as const,
                    referral_id: referral.id,
                    plan_type: referral.plan_type,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                const { error: entryError } = await supabase
                    .from('sweepstake_entries')
                    .insert(sweepstakeEntry);

                if (entryError) {
                    console.error('Error creating sweepstake entry:', entryError);
                    errors.push(`Failed to create sweepstake entry for referral ${referral.id}`);
                    continue;
                }

                confirmedCount++;
            } catch (error) {
                console.error('Error processing referral:', error);
                errors.push(`Failed to process referral ${referral.id}`);
            }
        }
        // Return success response
        return NextResponse.json({
            success: true,
            confirmed_count: confirmedCount,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error('Error in referral confirmation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
