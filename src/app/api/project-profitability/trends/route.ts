import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { getProjectProfitabilityTrendsServer } from '@/lib/project-profitability/server';

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
        const projectId = searchParams.get('projectId') || undefined;
        const days = parseInt(searchParams.get('days') || '30');

        const data = await getProjectProfitabilityTrendsServer(userData.business_id, projectId, days);

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error fetching profitability trends:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profitability trends' },
            { status: 500 }
        );
    }
}
