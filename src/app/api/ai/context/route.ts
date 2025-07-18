import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { getAIContextData } from '@/lib/ai-context';

// Helper function for business validation
async function validateBusinessAccess(userId: string, businessId: string): Promise<boolean> {
    const supabase = createServerClient();

    if (!supabase) {
        return false;
    }

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
                success: false,
                error: 'Missing required parameter: businessId'
            }, { status: 400 });
        }

        // Validate business access
        const hasAccess = await validateBusinessAccess(user.id, businessId);
        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Access denied to business' }, { status: 403 });
        }

        const contextData = await getAIContextData(businessId);

        return NextResponse.json({ success: true, data: contextData }, { status: 200 });

    } catch (error) {
        console.error('Error in AI context API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
