import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { ReferralCodeResponse } from '@/types/referral';

// Generate a unique referral code
function generateReferralCode(businessName: string): string {
    // Create a prefix from business name (first 3 characters, uppercase)
    const prefix = businessName
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, 'X');

    // Generate random suffix (5 characters)
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();

    return `${prefix}${suffix}`;
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get business ID from URL
        const url = new URL(request.url);
        const businessId = url.pathname.split('/')[3]; // /api/businesses/[id]/referral-code

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
            console.log('Debug - User not found:', { userId, userError });
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        console.log('Debug - Checking business access:', {
            userBusinessId: user.business_id,
            requestedBusinessId: businessId,
            userRole: user.role
        });

        if (user.business_id !== businessId) {
            console.log('Debug - Business ID mismatch:', {
                userBusinessId: user.business_id,
                requestedBusinessId: businessId
            });
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        // Only admins and manager can generate referral codes
        if (!['admin', 'manager'].includes(user.role || '')) {
            console.log('Debug - Insufficient permissions:', {
                userRole: user.role,
                requiredRoles: ['admin', 'mupervisor']
            });
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Get business details
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('id, name, referral_code')
            .eq('id', businessId)
            .single();

        if (businessError || !business) {
            return NextResponse.json(
                { success: false, error: 'Business not found' },
                { status: 404 }
            );
        }

        // If referral code already exists, return it
        if (business.referral_code) {
            const response: ReferralCodeResponse = {
                referral_code: business.referral_code,
            };
            return NextResponse.json({ success: true, data: response }, { status: 200 });
        }

        // Generate new referral code
        let referralCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            referralCode = generateReferralCode(business.name || 'BIZ');

            // Check if code already exists
            const { data: existingCode } = await supabase
                .from('businesses')
                .select('id')
                .eq('referral_code', referralCode)
                .single();

            if (!existingCode) {
                break; // Code is unique
            }

            attempts++;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            return NextResponse.json(
                { success: false, error: 'Failed to generate unique referral code' },
                { status: 500 }
            );
        }

        // Update business with referral code
        const { error: updateError } = await supabase
            .from('businesses')
            .update({
                referral_code: referralCode,
                updated_at: new Date().toISOString(),
                updated_by: userId,
            })
            .eq('id', businessId);

        if (updateError) {
            console.error('Error updating business with referral code:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to save referral code' },
                { status: 500 }
            );
        }

        const response: ReferralCodeResponse = {
            referral_code: referralCode,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in referral code generation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get business ID from URL
        const url = new URL(request.url);
        const businessId = url.pathname.split('/')[3]; // /api/businesses/[id]/referral-code

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

        console.log('Debug GET - User lookup:', { userId, user, userError });

        if (userError || !user) {
            console.log('Debug GET - User not found:', { userId, userError });
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        console.log('Debug GET - Checking business access:', {
            userBusinessId: user.business_id,
            requestedBusinessId: businessId
        });

        if (user.business_id !== businessId) {
            console.log('Debug GET - Business ID mismatch:', {
                userBusinessId: user.business_id,
                requestedBusinessId: businessId
            });
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        // Get business referral code
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('referral_code')
            .eq('id', businessId)
            .single();

        if (businessError || !business) {
            return NextResponse.json(
                { success: false, error: 'Business not found' },
                { status: 404 }
            );
        }

        const response: ReferralCodeResponse = {
            referral_code: business.referral_code || '',
        };

        return NextResponse.json({ success: true, data: response }, { status: 200 });

    } catch (error) {
        console.error('Error getting referral code:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
