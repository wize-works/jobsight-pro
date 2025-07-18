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
 * POST /api/rates/equipment
 * Create or update equipment rate
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { equipmentId, hourlyRate, overtimeRate, businessId } = body;

        // Validate required fields
        if (!equipmentId || !businessId || hourlyRate === undefined) {
            return NextResponse.json({
                error: 'Missing required fields: equipmentId, businessId, hourlyRate'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Access denied to business' }, { status: 403 });
        }

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Verify equipment exists and belongs to business
        const { data: equipment, error: equipmentError } = await supabase
            .from('equipment')
            .select('id, business_id, name')
            .eq('id', equipmentId)
            .eq('business_id', businessId)
            .single();

        if (equipmentError || !equipment) {
            return NextResponse.json({ success: false, error: 'Equipment not found or access denied' }, { status: 404 });
        }

        // Update equipment rate
        const { data, error } = await supabase
            .from('equipment')
            .update({
                hourly_rate: hourlyRate,
                overtime_rate: overtimeRate || null,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq('id', equipmentId)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating equipment rate:', error);
            return NextResponse.json({ success: false, error: 'Failed to update equipment rate' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                name: data.name,
                hourlyRate: data.hourly_rate,
                overtimeRate: data.overtime_rate
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error in equipment rate API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/rates/equipment?equipmentId=xxx&businessId=xxx
 * Get equipment rate
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const equipmentId = searchParams.get('equipmentId');
        const businessId = searchParams.get('businessId');

        if (!equipmentId || !businessId) {
            return NextResponse.json({
                error: 'Missing required parameters: equipmentId, businessId'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Access denied to business' }, { status: 403 });
        }

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get equipment rate
        const { data: equipment, error } = await supabase
            .from('equipment')
            .select('id, name, hourly_rate, overtime_rate')
            .eq('id', equipmentId)
            .eq('business_id', businessId)
            .single();

        if (error || !equipment) {
            return NextResponse.json({ success: false, error: 'Equipment not found or access denied' }, { status: 404 });
        }

        const billingRate: BillingRate = {
            hourlyRate: equipment.hourly_rate || 0,
            overtimeRate: equipment.overtime_rate || undefined,
            effectiveDate: new Date().toISOString()
        };

        return NextResponse.json({ success: true, data: billingRate }, { status: 200 });

    } catch (error) {
        console.error('Error getting equipment rate:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
