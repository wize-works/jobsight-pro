import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';
import type { CrewMemberAssignment, CrewMemberAssignmentInsert } from '@/types/crew-member-assignments';

const CreateAssignmentSchema = z.object({
    crew_member_id: z.string().uuid('Invalid crew member ID'),
    project_id: z.string().uuid('Invalid project ID'),
    role: z.string().min(1, 'Role is required'),
    start_date: z.string(),
    end_date: z.string().optional(),
    hourly_rate: z.number().min(0).optional(),
    status: z.enum(['active', 'inactive', 'completed', 'cancelled']).default('active'),
    notes: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const projectId = searchParams.get('project_id');
        const includeStats = searchParams.get('include_stats') === 'true';

        // Verify crew exists and belongs to user's business
        const { data: crew, error: crewError } = await supabase
            .from('crews')
            .select('id')
            .eq('id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (crewError) {
            if (crewError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
            }
            throw crewError;
        }

        // Build query for assignments
        let query = supabase
            .from('crew_member_assignments')
            .select(`
        *,
        crew_member:crew_members!crew_member_assignments_crew_member_id_fkey (
          id,
          role,
          user:users!crew_members_user_id_fkey (
            id,
            name,
            email
          )
        ),
        project:projects!crew_member_assignments_project_id_fkey (
          id,
          name,
          status,
          start_date,
          end_date,
          client:clients!projects_client_id_fkey (
            id,
            name
          )
        )
      `)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId);

        // Filter by status if provided
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Filter by project if provided
        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        // Order by start date
        query = query.order('start_date', { ascending: false });

        const { data: assignments, error } = await query;

        if (error) throw error;

        let result = {
            assignments,
            stats: undefined as any
        };

        // Include stats if requested
        if (includeStats) {
            const [totalCount, activeCount, projectsCount] = await Promise.all([
                // Total assignments
                supabase
                    .from('crew_member_assignments')
                    .select('id', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId),

                // Active assignments
                supabase
                    .from('crew_member_assignments')
                    .select('id', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId)
                    .eq('status', 'active'),

                // Unique projects
                supabase
                    .from('crew_member_assignments')
                    .select('project_id', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId)
                    .eq('status', 'active')
            ]);

            result.stats = {
                total_assignments: totalCount.count || 0,
                active_assignments: activeCount.count || 0,
                active_projects: projectsCount.count || 0
            };
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching crew assignments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = CreateAssignmentSchema.parse(body);

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { id } = await params;

        // Verify crew exists and belongs to user's business
        const { data: crew, error: crewError } = await supabase
            .from('crews')
            .select('id')
            .eq('id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (crewError) {
            if (crewError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
            }
            throw crewError;
        }

        // Verify crew member exists and belongs to this crew
        const { data: member, error: memberError } = await supabase
            .from('crew_members')
            .select('id')
            .eq('id', validatedData.crew_member_id)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (memberError) {
            if (memberError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
            }
            throw memberError;
        }

        // Verify project exists and belongs to user's business
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', validatedData.project_id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (projectError) {
            if (projectError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }
            throw projectError;
        }

        // Check for overlapping assignments
        const { data: overlapping, error: overlapError } = await supabase
            .from('crew_member_assignments')
            .select('id')
            .eq('crew_member_id', validatedData.crew_member_id)
            .eq('project_id', validatedData.project_id)
            .eq('business_id', user.publicMetadata.businessId)
            .eq('status', 'active')
            .single();

        if (overlapping) {
            return NextResponse.json(
                { error: 'Crew member is already assigned to this project' },
                { status: 400 }
            );
        }

        // Create assignment
        const assignmentData = {
            ...validatedData,
            crew_id: id,
            business_id: user.publicMetadata.businessId as string,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('crew_member_assignments')
            .insert(assignmentData)
            .select(`
        *,
        crew_member:crew_members!crew_member_assignments_crew_member_id_fkey (
          id,
          role,
          user:users!crew_members_user_id_fkey (
            id,
            name,
            email
          )
        ),
        project:projects!crew_member_assignments_project_id_fkey (
          id,
          name,
          status,
          client:clients!projects_client_id_fkey (
            id,
            name
          )
        )
      `)
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating crew assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
