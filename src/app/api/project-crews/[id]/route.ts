import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjectCrewById,
    updateProjectCrew,
    deleteProjectCrew,
    removeCrewFromProject
} from '@/app/actions/project-crews';

/**
 * GET /api/project-crews/[id]
 * Get project crew by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const crew = await getProjectCrewById(profile.business_id, id);

        if (!crew) {
            return NextResponse.json({ success: false, error: 'Crew assignment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: crew }, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/project-crews/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/project-crews/[id]
 * Update project crew by ID
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const updateData = await request.json();

        const crew = await updateProjectCrew(profile.business_id, id, {
            ...updateData,
            updated_by: user.id
        });

        if (!crew) {
            return NextResponse.json({ success: false, error: 'Failed to update crew assignment' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: crew }, { status: 200 });

    } catch (error) {
        console.error('Error in PUT /api/project-crews/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/project-crews/[id]
 * Delete project crew by ID
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const crewId = searchParams.get('crewId');

        // Check if this is a simple crew removal (remove crew from project)
        if (projectId && crewId) {
            const success = await removeCrewFromProject(
                profile.business_id,
                projectId,
                crewId
            );

            if (!success) {
                return NextResponse.json({ success: false, error: 'Failed to remove crew from project' }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        // Delete crew assignment by ID
        const success = await deleteProjectCrew(profile.business_id, id);

        if (!success) {
            return NextResponse.json({ success: false, error: 'Failed to delete crew assignment' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Error in DELETE /api/project-crews/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
