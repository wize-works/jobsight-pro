import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { BillingRate } from '@/types/invoice-automation';

// Helper function to validate business access
async function validateBusinessAccess(userId: string, businessId: string): Promise<boolean> {
    const supabase = createServerClient();

    if (!supabase) {
        return false;
    }

    // Check if user has access to this business
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

/**
 * POST /api/rates/business
 * Update business default rates
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessId, defaultHourlyRate, defaultOvertimeRate } = body;

        // Validate required fields
        if (!businessId || defaultHourlyRate === undefined) {
            return NextResponse.json({
                error: 'Missing required fields: businessId, defaultHourlyRate'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to business' }, { status: 403 });
        }

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Update business default rates
        const { data, error } = await supabase
            .from('businesses')
            .update({
                default_hourly_rate: defaultHourlyRate,
                default_overtime_rate: defaultOvertimeRate || null,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq('id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating business default rates:', error);
            return NextResponse.json({ error: 'Failed to update business default rates' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                name: data.name,
                defaultHourlyRate: data.default_hourly_rate,
                defaultOvertimeRate: data.default_overtime_rate
            }
        });

    } catch (error) {
        console.error('Error in business rate API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/rates/business?businessId=xxx
 * Get business default rates
 */
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
                error: 'Missing required parameter: businessId'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to business' }, { status: 403 });
        }

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Get business default rates
        const { data: business, error } = await supabase
            .from('businesses')
            .select('id, name, default_hourly_rate, default_overtime_rate')
            .eq('id', businessId)
            .single();

        if (error || !business) {
            return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 });
        }

        const billingRate: BillingRate = {
            hourlyRate: business.default_hourly_rate || 0,
            overtimeRate: business.default_overtime_rate || undefined,
            effectiveDate: new Date().toISOString()
        };

        return NextResponse.json({ success: true, data: billingRate });

    } catch (error) {
        console.error('Error getting business default rates:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
