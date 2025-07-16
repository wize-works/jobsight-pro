import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjectMilestones,
    createProjectMilestone,
    getProjectMilestoneById,
    getProjectMilestonesByProjectId,
    searchProjectMilestones
} from '@/app/actions/project-milestones';

/**
 * GET /api/project-milestones
 * Get all project milestones for the authenticated user's business
 */
export async function GET(request: NextRequest) {
    try {
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

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const searchQuery = searchParams.get('search');

        let milestones;

        if (searchQuery) {
            milestones = await searchProjectMilestones(profile.business_id, searchQuery);
        } else if (projectId) {
            milestones = await getProjectMilestonesByProjectId(profile.business_id, projectId);
        } else {
            milestones = await getProjectMilestones(profile.business_id);
        }

        return NextResponse.json(milestones);

    } catch (error) {
        console.error('Error in GET /api/project-milestones:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/project-milestones
 * Create a new project milestone
 */
export async function POST(request: NextRequest) {
    try {
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

        const milestoneData = await request.json();

        // Validate required fields
        if (!milestoneData.name || !milestoneData.project_id) {
            return NextResponse.json({
                error: 'Milestone name and project ID are required'
            }, { status: 400 });
        }

        const milestone = await createProjectMilestone(profile.business_id, {
            ...milestoneData,
            business_id: profile.business_id,
            created_by: user.id,
            updated_by: user.id
        });

        if (!milestone) {
            return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
        }

        return NextResponse.json(milestone, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/project-milestones:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
