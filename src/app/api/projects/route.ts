import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjects,
    createProject,
    searchProjects,
    getProjectsWithDetails
} from '@/app/actions/projects';

/**
 * GET /api/projects
 * Get all projects for the authenticated user's business
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
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const includeDetails = searchParams.get('includeDetails') === 'true';
        const searchQuery = searchParams.get('search');

        let projects;

        if (searchQuery) {
            projects = await searchProjects(profile.business_id, searchQuery);
        } else if (includeDetails) {
            projects = await getProjectsWithDetails(profile.business_id);
        } else {
            projects = await getProjects(profile.business_id);
        }

        return NextResponse.json(projects);

    } catch (error) {
        console.error('Error in GET /api/projects:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/projects
 * Create a new project
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
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const projectData = await request.json();

        // Validate required fields
        if (!projectData.name) {
            return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
        }

        const project = await createProject(profile.business_id, {
            ...projectData,
            created_by: user.id,
            updated_by: user.id
        });

        if (!project) {
            return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
        }

        return NextResponse.json(project, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/projects:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
