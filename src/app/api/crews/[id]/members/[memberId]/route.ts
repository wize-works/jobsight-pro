import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';
import type { CrewMember, CrewMemberUpdate } from '@/types/crew-members';

const UpdateCrewMemberSchema = z.object({
    role: z.enum(['foreman', 'operator', 'laborer', 'mechanic', 'admin']).optional(),
    status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).optional(),
    hourly_rate: z.number().min(0).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    notes: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> }
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

        const { id, memberId } = await params;

        // Get crew member assignment with details
        const { data: assignment, error } = await supabase
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
        ),
        crew:crews!crew_member_assignments_crew_id_fkey (
          id,
          name,
          specialty
        )
      `)
            .eq('id', memberId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew member assignment not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(assignment);
    } catch (error) {
        console.error('Error fetching crew member:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = UpdateCrewMemberSchema.parse(body);

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { id, memberId } = await params;

        // Check if crew member assignment exists and belongs to user's business
        const { data: existingAssignment, error: checkError } = await supabase
            .from('crew_member_assignments')
            .select('id, crew_member_id')
            .eq('id', memberId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew member assignment not found' }, { status: 404 });
            }
            throw checkError;
        }

        // Update assignment
        const updateData = {
            ...validatedData,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        };

        const { data, error } = await supabase
            .from('crew_member_assignments')
            .update(updateData)
            .eq('id', memberId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
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

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating crew member assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> }
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

        const { id, memberId } = await params;

        // Check if crew member assignment exists and belongs to user's business
        const { data: existingAssignment, error: checkError } = await supabase
            .from('crew_member_assignments')
            .select('id')
            .eq('id', memberId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Crew member assignment not found' }, { status: 404 });
            }
            throw checkError;
        }

        // Check if assignment has logged hours
        const { data: timesheets, error: timesheetError } = await supabase
            .from('timesheets')
            .select('id', { count: 'exact' })
            .eq('assignment_id', memberId)
            .eq('business_id', user.publicMetadata.businessId);

        if (timesheetError) throw timesheetError;

        if (timesheets && timesheets.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete crew member assignment with logged hours' },
                { status: 400 }
            );
        }

        // Delete assignment
        const { error } = await supabase
            .from('crew_member_assignments')
            .delete()
            .eq('id', memberId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId);

        if (error) throw error;

        return NextResponse.json({ message: 'Crew member assignment deleted successfully' });
    } catch (error) {
        console.error('Error deleting crew member assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
