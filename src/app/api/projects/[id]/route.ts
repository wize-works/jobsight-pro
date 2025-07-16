import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjectById,
    updateProject,
    deleteProject,
    getProjectDetailsByID,
    updateProjectProgress
} from '@/app/actions/projects';

/**
 * GET /api/projects/[id]
 * Get project by ID
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

        const { searchParams } = new URL(request.url);
        const includeDetails = searchParams.get('includeDetails') === 'true';

        try {
            let project;

            if (includeDetails) {
                project = await getProjectDetailsByID(profile.business_id, id);
            } else {
                project = await getProjectById(profile.business_id, id);
            }

            if (!project) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }

            return NextResponse.json(project);

        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }
            throw error;
        }

    } catch (error) {
        console.error('Error in GET /api/projects/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/projects/[id]
 * Update project by ID
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

        // Check if this is a progress-only update
        const { searchParams } = new URL(request.url);
        const progressOnly = searchParams.get('progressOnly') === 'true';

        let project;

        if (progressOnly && updateData.progress !== undefined) {
            project = await updateProjectProgress(profile.business_id, id, updateData.progress);
        } else {
            project = await updateProject(profile.business_id, id, {
                ...updateData,
                updated_by: user.id
            });
        }

        if (!project) {
            return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
        }

        return NextResponse.json(project);

    } catch (error) {
        console.error('Error in PUT /api/projects/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/projects/[id]
 * Delete project by ID
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

        const success = await deleteProject(profile.business_id, id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE /api/projects/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
