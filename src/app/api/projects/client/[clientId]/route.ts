import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { getProjectsByClientId } from '@/app/actions/projects';

/**
 * GET /api/projects/client/[clientId]
 * Get projects by client ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
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

        const projects = await getProjectsByClientId(profile.business_id, clientId);

        return NextResponse.json({ success: true, data: projects }, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/projects/client/[clientId]:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
