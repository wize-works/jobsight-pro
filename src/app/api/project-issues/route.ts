import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjectIssues,
    createProjectIssue,
    searchProjectIssues,
    getProjectIssuesWithDetailsByProjectId
} from '@/app/actions/projects-issues';

/**
 * GET /api/project-issues
 * Get all project issues for the authenticated user's business
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
        const includeDetails = searchParams.get('includeDetails') === 'true';

        let issues;

        if (searchQuery) {
            issues = await searchProjectIssues(profile.business_id, searchQuery);
        } else if (projectId && includeDetails) {
            issues = await getProjectIssuesWithDetailsByProjectId(profile.business_id, projectId);
        } else {
            issues = await getProjectIssues(profile.business_id);

            // Filter by project if specified
            if (projectId) {
                issues = issues.filter(issue => issue.project_id === projectId);
            }
        }

        return NextResponse.json(issues);

    } catch (error) {
        console.error('Error in GET /api/project-issues:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/project-issues
 * Create a new project issue
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

        const issueData = await request.json();

        // Validate required fields
        if (!issueData.title || !issueData.project_id) {
            return NextResponse.json({
                error: 'Issue title and project ID are required'
            }, { status: 400 });
        }

        const issue = await createProjectIssue(profile.business_id, {
            ...issueData,
            business_id: profile.business_id,
            created_by: user.id,
            updated_by: user.id,
            reported_date: new Date().toISOString()
        });

        if (!issue) {
            return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
        }

        return NextResponse.json(issue, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/project-issues:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
