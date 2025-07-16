import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { CrewMember } from '@/types/crew-members';

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
 * GET /api/crew-members?businessId=xxx&id=xxx
 * Get all crew members for a business or a specific crew member by ID
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');
        const crewMemberId = searchParams.get('id');

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

        if (crewMemberId) {
            // Get specific crew member
            const { data: crewMember, error } = await supabase
                .from('crew_members')
                .select('*')
                .eq('business_id', businessId)
                .eq('id', crewMemberId)
                .single();

            if (error) {
                console.error('Error fetching crew member:', error);
                return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, data: crewMember });
        } else {
            // Get all crew members
            const { data: crewMembers, error } = await supabase
                .from('crew_members')
                .select('*')
                .eq('business_id', businessId)
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching crew members:', error);
                return NextResponse.json({ error: 'Failed to fetch crew members' }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: crewMembers || [] });
        }

    } catch (error) {
        console.error('Error in crew members API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
