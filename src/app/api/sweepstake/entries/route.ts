import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { business_id, user_id, entry_type, plan_type } = await request.json();

        if (!business_id || !user_id || !entry_type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Database connection failed' },
                { status: 500 }
            );
        }

        // Verify user has access to this business
        const { data: user_data, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', userId)
            .single();

        if (userError || !user_data || user_data.business_id !== business_id) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        // Create sweepstake entry
        const sweepstakeEntry = {
            id: uuidv4(),
            business_id,
            user_id,
            entry_type,
            plan_type,
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error: entryError } = await supabase
            .from('sweepstake_entries')
            .insert(sweepstakeEntry);

        if (entryError) {
            console.error('Error creating sweepstake entry:', entryError);
            return NextResponse.json(
                { success: false, error: 'Failed to create entry' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in sweepstake entry creation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
