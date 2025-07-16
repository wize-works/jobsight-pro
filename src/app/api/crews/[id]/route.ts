import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';
import type { Crew, CrewUpdate } from '@/types/crews';
import type { CrewMember } from '@/types/crew-members';
import type { Project } from '@/types/projects';

const UpdateCrewSchema = z.object({
    name: z.string().min(1, 'Crew name is required').optional(),
    specialty: z.string().optional(),
    leader_id: z.string().optional(),
    status: z.enum(['active', 'inactive', 'on_hold', 'archived']).optional(),
    notes: z.string().optional(),
});

interface CrewWithDetails extends Crew {
    leader?: {
        id: string;
        name: string;
        email: string;
    };
    members?: CrewMember[];
    projects?: Project[];
    stats?: {
        total_members: number;
        active_projects: number;
        total_hours: number;
    };
}

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
        const includeMembers = searchParams.get('include_members') === 'true';
        const includeProjects = searchParams.get('include_projects') === 'true';
        const includeStats = searchParams.get('include_stats') === 'true';

        // Get crew with optional leader info
        let crewQuery = supabase
            .from('crews')
            .select(`
        *,
        leader:users!crews_leader_id_fkey (
          id,
          name,
          email
        )
      `)
            .eq('id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        const { data: crew, error: crewError } = await crewQuery;

        if (crewError) {
            if (crewError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
            }
            throw crewError;
        }

        const result: CrewWithDetails = crew;

        // Include members if requested
        if (includeMembers) {
            const { data: assignments, error: membersError } = await supabase
                .from('crew_member_assignments')
                .select(`
          *,
          crew_member:crew_members!crew_member_assignments_crew_member_id_fkey (
            *,
            user:users!crew_members_user_id_fkey (
              id,
              name,
              email,
              phone
            )
          )
        `)
                .eq('crew_id', id)
                .eq('business_id', user.publicMetadata.businessId)
                .eq('status', 'active')
                .order('role', { ascending: false });

            if (membersError) throw membersError;

            // Transform assignments to member format
            result.members = assignments?.map(assignment => ({
                ...assignment.crew_member,
                assignment: {
                    id: assignment.id,
                    role: assignment.role,
                    status: assignment.status,
                    start_date: assignment.start_date,
                    end_date: assignment.end_date,
                    hourly_rate: assignment.hourly_rate,
                    notes: assignment.notes
                }
            })) || [];
        }

        // Include projects if requested
        if (includeProjects) {
            const { data: projects, error: projectsError } = await supabase
                .from('project_crews')
                .select(`
          project:projects!project_crews_project_id_fkey (
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

            if (projectsError) throw projectsError;
            result.projects = projects.map((pc: any) => pc.project);
        }

        // Include stats if requested
        if (includeStats) {
            const [membersCount, projectsCount, hoursCount] = await Promise.all([
                // Total members (active assignments)
                supabase
                    .from('crew_member_assignments')
                    .select('id', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId)
                    .eq('status', 'active'),

                // Active projects
                supabase
                    .from('project_crews')
                    .select('id', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId)
                    .in('status', ['active', 'in_progress']),

                // Total hours (from timesheets via assignments)
                supabase
                    .from('timesheets')
                    .select('hours_worked.sum()')
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId)
                    .single()
            ]);

            result.stats = {
                total_members: membersCount.count || 0,
                active_projects: projectsCount.count || 0,
                total_hours: hoursCount.data?.sum || 0
            };
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching crew:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = UpdateCrewSchema.parse(body);

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { id } = await params;

        // Check if crew exists and belongs to user's business
        const { data: existingCrew, error: checkError } = await supabase
            .from('crews')
            .select('id')
            .eq('id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
            }
            throw checkError;
        }

        // Update crew
        const updateData = {
            ...validatedData,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('crews')
            .update(updateData)
            .eq('id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating crew:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        // Check if crew exists and belongs to user's business
        const { data: existingCrew, error: checkError } = await supabase
            .from('crews')
            .select('id')
            .eq('id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
            }
            throw checkError;
        }

        // Check if crew has active members or projects
        const [membersCheck, projectsCheck] = await Promise.all([
            supabase
                .from('crew_members')
                .select('id', { count: 'exact' })
                .eq('crew_id', id)
                .eq('business_id', user.publicMetadata.businessId)
                .eq('status', 'active'),

            supabase
                .from('project_crews')
                .select('id', { count: 'exact' })
                .eq('crew_id', id)
                .eq('business_id', user.publicMetadata.businessId)
                .in('status', ['active', 'in_progress'])
        ]);

        if (membersCheck.count && membersCheck.count > 0) {
            return NextResponse.json(
                { error: 'Cannot delete crew with active members' },
                { status: 400 }
            );
        }

        if (projectsCheck.count && projectsCheck.count > 0) {
            return NextResponse.json(
                { error: 'Cannot delete crew with active projects' },
                { status: 400 }
            );
        }

        // Delete crew
        const { error } = await supabase
            .from('crews')
            .delete()
            .eq('id', id)
            .eq('business_id', user.publicMetadata.businessId);

        if (error) throw error;

        return NextResponse.json({ message: 'Crew deleted successfully' });
    } catch (error) {
        console.error('Error deleting crew:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
