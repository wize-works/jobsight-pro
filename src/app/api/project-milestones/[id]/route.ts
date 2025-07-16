import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjectMilestoneById,
    updateProjectMilestone,
    deleteProjectMilestone
} from '@/app/actions/project-milestones';

/**
 * GET /api/project-milestones/[id]
 * Get project milestone by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const milestone = await getProjectMilestoneById(profile.business_id, id);

        if (!milestone) {
            return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        return NextResponse.json(milestone);

    } catch (error) {
        console.error('Error in GET /api/project-milestones/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/project-milestones/[id]
 * Update project milestone by ID
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const updateData = await request.json();

        const milestone = await updateProjectMilestone(profile.business_id, id, {
            ...updateData,
            updated_by: user.id
        });

        if (!milestone) {
            return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
        }

        return NextResponse.json(milestone);

    } catch (error) {
        console.error('Error in PUT /api/project-milestones/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/project-milestones/[id]
 * Delete project milestone by ID
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const success = await deleteProjectMilestone(profile.business_id, id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE /api/project-milestones/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
