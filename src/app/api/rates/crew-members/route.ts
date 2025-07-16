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
 * POST /api/rates/crew-members
 * Create or update crew member rate
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { crewMemberId, hourlyRate, overtimeRate, businessId } = body;

        // Validate required fields
        if (!crewMemberId || !businessId || hourlyRate === undefined) {
            return NextResponse.json({
                error: 'Missing required fields: crewMemberId, businessId, hourlyRate'
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

        // Verify crew member exists and belongs to business
        const { data: crewMember, error: crewError } = await supabase
            .from('crew_members')
            .select('id, business_id, name')
            .eq('id', crewMemberId)
            .eq('business_id', businessId)
            .single();

        if (crewError || !crewMember) {
            return NextResponse.json({ error: 'Crew member not found or access denied' }, { status: 404 });
        }

        // Update crew member rate
        const { data, error } = await supabase
            .from('crew_members')
            .update({
                hourly_rate: hourlyRate,
                overtime_rate: overtimeRate || null,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq('id', crewMemberId)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating crew member rate:', error);
            return NextResponse.json({ error: 'Failed to update crew member rate' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                name: data.name,
                hourlyRate: data.hourly_rate,
                overtimeRate: data.overtime_rate
            }
        });

    } catch (error) {
        console.error('Error in crew member rate API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/rates/crew-members?crewMemberId=xxx&businessId=xxx
 * Get crew member rate
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const crewMemberId = searchParams.get('crewMemberId');
        const businessId = searchParams.get('businessId');

        if (!crewMemberId || !businessId) {
            return NextResponse.json({
                error: 'Missing required parameters: crewMemberId, businessId'
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

        // Get crew member rate
        const { data: crewMember, error } = await supabase
            .from('crew_members')
            .select('id, name, hourly_rate, overtime_rate')
            .eq('id', crewMemberId)
            .eq('business_id', businessId)
            .single();

        if (error || !crewMember) {
            return NextResponse.json({ error: 'Crew member not found or access denied' }, { status: 404 });
        }

        const billingRate: BillingRate = {
            hourlyRate: crewMember.hourly_rate || 0,
            overtimeRate: crewMember.overtime_rate || undefined,
            effectiveDate: new Date().toISOString()
        };

        return NextResponse.json({ success: true, data: billingRate });

    } catch (error) {
        console.error('Error getting crew member rate:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
