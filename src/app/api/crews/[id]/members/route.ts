import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';
import type { CrewMember, CrewMemberInsert } from '@/types/crew-members';

const CreateCrewMemberSchema = z.object({
    user_id: z.string().uuid('Invalid user ID'),
    role: z.enum(['foreman', 'operator', 'laborer', 'mechanic', 'admin']).default('laborer'),
    status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
    hourly_rate: z.number().min(0).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    notes: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
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
                return NextResponse.json({ success: false, error: 'Crew not found' }, { status: 404 });
            }
            throw crewError;
        }

        // Build query for crew members through assignments
        let query = supabase
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
            .eq('business_id', user.publicMetadata.businessId);

        // Filter by status if provided
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Order by role hierarchy and name
        query = query.order('role', { ascending: false });

        const { data: assignments, error } = await query;

        if (error) throw error;

        // Extract crew members from assignments
        const members = assignments?.map(assignment => ({
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

        let result = {
            members,
            stats: undefined as any
        };

        // Include stats if requested
        if (includeStats) {
            const [totalCount, activeCount, rolesCount] = await Promise.all([
                // Total members (assignments)
                supabase
                    .from('crew_member_assignments')
                    .select('id', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId),

                // Active members (assignments)
                supabase
                    .from('crew_member_assignments')
                    .select('id', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId)
                    .eq('status', 'active'),

                // Members by role (assignments)
                supabase
                    .from('crew_member_assignments')
                    .select('role', { count: 'exact' })
                    .eq('crew_id', id)
                    .eq('business_id', user.publicMetadata.businessId)
                    .eq('status', 'active')
            ]);

            result.stats = {
                total_members: totalCount.count || 0,
                active_members: activeCount.count || 0,
                roles_distribution: rolesCount.data || []
            };
        }

        return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error) {
        console.error('Error fetching crew members:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
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
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = CreateCrewMemberSchema.parse(body);

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
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
                return NextResponse.json({ success: false, error: 'Crew not found' }, { status: 404 });
            }
            throw crewError;
        }

        // Check if user is already a member of this crew (through assignments)
        const { data: existingAssignment, error: checkError } = await supabase
            .from('crew_member_assignments')
            .select('id')
            .eq('crew_id', id)
            .eq('crew_member_id', validatedData.user_id)
            .eq('business_id', user.publicMetadata.businessId)
            .eq('status', 'active')
            .single();

        if (existingAssignment) {
            return NextResponse.json(
                { success: false, error: 'User is already assigned to this crew' },
                { status: 400 }
            );
        }

        // Check if crew member exists, if not create one
        let crewMember;
        const { data: existingMember, error: memberError } = await supabase
            .from('crew_members')
            .select('id')
            .eq('user_id', validatedData.user_id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (memberError && memberError.code === 'PGRST116') {
            // Create new crew member
            const memberData = {
                user_id: validatedData.user_id,
                business_id: user.publicMetadata.businessId as string,
                name: '', // Will be populated from user relationship
                role: validatedData.role,
                status: validatedData.status,
                hourly_rate: validatedData.hourly_rate,
                created_by: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { data: newMember, error: createError } = await supabase
                .from('crew_members')
                .insert(memberData)
                .select()
                .single();

            if (createError) throw createError;
            crewMember = newMember;
        } else if (memberError) {
            throw memberError;
        } else {
            crewMember = existingMember;
        }

        // Create assignment
        const assignmentData = {
            crew_id: id,
            crew_member_id: crewMember.id,
            role: validatedData.role,
            status: validatedData.status,
            start_date: validatedData.start_date,
            end_date: validatedData.end_date,
            hourly_rate: validatedData.hourly_rate,
            notes: validatedData.notes,
            business_id: user.publicMetadata.businessId as string,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data: assignment, error: assignmentError } = await supabase
            .from('crew_member_assignments')
            .insert(assignmentData)
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
            .single();

        if (assignmentError) throw assignmentError;

        return NextResponse.json({ success: true, data: assignment }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating crew member:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
