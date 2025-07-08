    import { auth } from '@clerk/nextjs/server';
    import { NextRequest, NextResponse } from 'next/server';
    import { seedFlintstonesData } from '@/lib/seed-data';
    import { checkIfUserNeedsSetup } from '@/lib/user-setup';
    import { createServerClient } from '@/lib/supabase';

    export async function POST(req: NextRequest) {
    try {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
        );
    }

    const body = await req.json();
    const { userName, userEmail, seedData = false } = body;

    // Check if user already has been set up
    const needsSetup = await checkIfUserNeedsSetup(userId);

    if (!needsSetup) {
        return NextResponse.json(
        { error: 'User already has been set up' },
        { status: 400 }
        );
    }

    const supabase = createServerClient();
    if (!supabase) {
        throw new Error('Failed to create Supabase client');
    }

    // Get the user's business (should already exist from sign-up)
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('business_id, businesses(*)')
        .eq('auth_id', userId)
        .single();

    if (userError || !user?.business_id) {
        return NextResponse.json(
        { error: 'Business not found. Please contact support.' },
        { status: 404 }
        );
    }

    const business = user.businesses as any;

    // Only business owners can complete setup
    if (business?.owner_id !== userId) {
        return NextResponse.json(
        { error: 'Only business owners can complete setup' },
        { status: 403 }
        );
    }

    let seedResult = null;

    // Only seed data if requested
    if (seedData) {
        seedResult = await seedFlintstonesData({
        businessId: user.business_id,
        userId: userId,
        userEmail: userEmail || '',
        userName: userName || 'User',
        });
    }

    // Mark setup as completed
    const { error: updateError } = await supabase
        .from('businesses')
        .update({ setup_completed: true })
        .eq('id', user.business_id);

    if (updateError) {
        console.error('Error marking setup as completed:', updateError);
        // Don't fail the entire operation, just log the error
    }

    // Create welcome notification
    await supabase
        .from('notifications')
        .insert({
        user_id: userId,
        business_id: user.business_id,
        type: 'welcome',
        title: 'Welcome to JobSight Pro!',
        message: seedData 
            ? `Welcome ${userName}! Your account has been set up with sample data to help you explore all features. You can start building right away!`
            : `Welcome ${userName}! Your account is ready. You can now start adding your projects, crews, and equipment.`,
        link: '/dashboard',
        read: false,
        });

    return NextResponse.json({
        success: true,
        message: seedData 
        ? 'Account set up successfully with sample data!'
        : 'Account set up successfully!',
        seedData: seedData,
        seedStats: seedResult?.data || null,
    });

    } catch (error) {
    console.error('Error in setup-user API:', error);
    return NextResponse.json(
        { 
        error: 'Failed to setup user',
        details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
    );
    }
    }

    export async function GET(req: NextRequest) {
    try {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
        );
    }

    const needsSetup = await checkIfUserNeedsSetup(userId);

    return NextResponse.json({
        needsSetup,
        userId,
    });

    } catch (error) {
    console.error('Error checking user setup status:', error);
    return NextResponse.json(
        { 
        error: 'Failed to check setup status',
        details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
    );
    }
    }
