import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { getProjectProfitabilityData } from '@/app/actions/project-profitability';

/**
 * GET /api/projects/profitability
 * Get project profitability data for analytics
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const clientId = searchParams.get('clientId');
        const riskLevel = searchParams.get('riskLevel');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const filters: any = {};
        if (status) filters.status = status;
        if (clientId) filters.clientId = clientId;
        if (riskLevel) filters.riskLevel = riskLevel;
        if (startDate && endDate) {
            filters.dateRange = { start: startDate, end: endDate };
        }

        const data = await getProjectProfitabilityData(profile.business_id, filters);

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/projects/profitability:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
