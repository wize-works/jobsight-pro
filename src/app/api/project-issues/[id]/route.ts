import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    getProjectIssueById,
    updateProjectIssue,
    deleteProjectIssue
} from '@/app/actions/projects-issues';

/**
 * GET /api/project-issues/[id]
 * Get project issue by ID
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
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        try {
            const issue = await getProjectIssueById(profile.business_id, id);
            return NextResponse.json(issue);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
            }
            throw error;
        }

    } catch (error) {
        console.error('Error in GET /api/project-issues/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/project-issues/[id]
 * Update project issue by ID
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
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const updateData = await request.json();

        try {
            const issue = await updateProjectIssue(profile.business_id, id, {
                ...updateData,
                updated_by: user.id
            });

            return NextResponse.json(issue);

        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
            }
            throw error;
        }

    } catch (error) {
        console.error('Error in PUT /api/project-issues/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/project-issues/[id]
 * Delete project issue by ID
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
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const success = await deleteProjectIssue(profile.business_id, id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE /api/project-issues/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
