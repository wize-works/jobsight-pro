import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjectCrews,
    createProjectCrew,
    searchProjectCrews,
    addCrewToProject
} from '@/app/actions/project-crews';

/**
 * GET /api/project-crews
 * Get all project crews for the authenticated user's business
 */
export async function GET(request: NextRequest) {
    try {
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
        const searchQuery = searchParams.get('search');

        let crews;

        if (searchQuery) {
            crews = await searchProjectCrews(profile.business_id, searchQuery);
        } else {
            crews = await getProjectCrews(profile.business_id);

            // Filter by project if specified
            if (projectId) {
                crews = crews.filter(crew => crew.project_id === projectId);
            }
        }

        return NextResponse.json({ success: true, data: crews }, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/project-crews:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/project-crews
 * Create a new project crew assignment
 */
export async function POST(request: NextRequest) {
    try {
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

        const crewData = await request.json();

        // Validate required fields
        if (!crewData.project_id || !crewData.crew_id) {
            return NextResponse.json({
                success: false,
                error: 'Project ID and crew ID are required'
            }, { status: 400 });
        }

        // Check if this is a simple crew assignment (add crew to project)
        if (crewData.addToProject) {
            const crew = await addCrewToProject(
                profile.business_id,
                crewData.project_id,
                crewData.crew_id
            );

            if (!crew) {
                return NextResponse.json({ success: false, error: 'Failed to add crew to project' }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: crew }, { status: 201 });
        }

        // Create full project crew assignment
        const crew = await createProjectCrew(profile.business_id, {
            ...crewData,
            business_id: profile.business_id,
            created_by: user.id,
            updated_by: user.id
        });

        if (!crew) {
            return NextResponse.json({ success: false, error: 'Failed to create crew assignment' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: crew }, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/project-crews:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
