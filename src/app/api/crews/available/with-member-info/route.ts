import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { getAvailableCrewsWithMemberInfoServer } from '@/lib/crews/server';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business using direct database query
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', userId)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const crews = await getAvailableCrewsWithMemberInfoServer(userData.business_id);

        return NextResponse.json(crews);
    } catch (error) {
        console.error('API Error fetching crews with member info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch crews with member info' },
            { status: 500 }
        );
    }
}
