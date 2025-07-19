import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { getProjectProfitabilityDataServer } from '@/lib/project-profitability/server';

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

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const filters: any = {};

        if (searchParams.get('status')) {
            filters.status = searchParams.get('status');
        }
        if (searchParams.get('clientId')) {
            filters.clientId = searchParams.get('clientId');
        }
        if (searchParams.get('riskLevel')) {
            filters.riskLevel = searchParams.get('riskLevel');
        }
        if (searchParams.get('startDate') && searchParams.get('endDate')) {
            filters.dateRange = {
                start: searchParams.get('startDate')!,
                end: searchParams.get('endDate')!
            };
        }

        const data = await getProjectProfitabilityDataServer(userData.business_id, filters);

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error fetching project profitability data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project profitability data' },
            { status: 500 }
        );
    }
}
