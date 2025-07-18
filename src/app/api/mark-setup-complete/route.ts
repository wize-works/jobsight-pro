import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        console.log('[mark-setup-complete API] POST request for user:', userId);

        if (!userId) {
            console.log('[mark-setup-complete API] No userId found in auth');
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createServerClient();
        if (!supabase) {
            throw new Error('Failed to create Supabase client');
        }

        // Get the user's business (should already exist from sign-up)
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('business_id, businesses!users_business_id_fkey(*)')
            .eq('auth_id', userId)
            .single();

        if (userError || !user?.business_id) {
            console.error('[mark-setup-complete API] Error fetching user:', userError);
            return NextResponse.json(
                { success: false, error: 'Business not found. Please contact support.' },
                { status: 404 }
            );
        }

        const business = user.businesses as any;

        // Only business owners can complete setup
        if (business?.owner_id !== userId) {
            console.error('[mark-setup-complete API] User is not business owner');
            return NextResponse.json(
                { success: false, error: 'Only business owners can complete setup' },
                { status: 403 }
            );
        }

        // Mark setup as completed
        const { error: updateError } = await supabase
            .from('businesses')
            .update({ setup_completed: true })
            .eq('id', user.business_id);

        if (updateError) {
            console.error('[mark-setup-complete API] Error marking setup as completed:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to mark setup as completed' },
                { status: 500 }
            );
        }

        // Create welcome notification
        await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                business_id: user.business_id,
                type: 'welcome',
                title: 'Welcome to JobSight Pro!',
                message: `Welcome! Your account is ready. You can now start adding your projects, crews, and equipment.`,
                link: '/dashboard',
                read: false,
            });

        return NextResponse.json({
            success: true,
            message: 'Account set up successfully!',
        }, { status: 200 });

    } catch (error) {
        console.error('[mark-setup-complete API] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to mark setup as completed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
