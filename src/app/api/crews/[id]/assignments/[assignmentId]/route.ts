import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';
import type { CrewMemberAssignment } from '@/types/crew-member-assignments';

const UpdateAssignmentSchema = z.object({
    role: z.string().min(1, 'Role is required').optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    hourly_rate: z.number().min(0).optional(),
    status: z.enum(['active', 'inactive', 'completed', 'cancelled']).optional(),
    notes: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

        // Await the params
        const { id, assignmentId } = await params;

        // Get assignment with full details
        const { data: assignment, error } = await supabase
            .from('crew_member_assignments')
            .select(`
        *,
        crew_member:crew_members!crew_member_assignments_crew_member_id_fkey (
          id,
          role,
          status,
          user:users!crew_members_user_id_fkey (
            id,
            name,
            email,
            phone
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
        ),
        crew:crews!crew_member_assignments_crew_id_fkey (
          id,
          name,
          specialty
        )
      `)
            .eq('id', assignmentId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, data: assignment }, { status: 200 });
    } catch (error) {
        console.error('Error fetching assignment:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = UpdateAssignmentSchema.parse(body);

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Await the params
        const { id, assignmentId } = await params;

        // Check if assignment exists and belongs to user's business
        const { data: existingAssignment, error: checkError } = await supabase
            .from('crew_member_assignments')
            .select('id')
            .eq('id', assignmentId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
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
            .eq('id', assignmentId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
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

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating assignment:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

        const { id, assignmentId } = await params;

        // Check if assignment exists and belongs to user's business
        const { data: existingAssignment, error: checkError } = await supabase
            .from('crew_member_assignments')
            .select('id, status')
            .eq('id', assignmentId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId)
            .single();

        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
            }
            throw checkError;
        }

        // Check if assignment has logged hours
        const { data: timesheets, error: timesheetError } = await supabase
            .from('timesheets')
            .select('id', { count: 'exact' })
            .eq('assignment_id', assignmentId)
            .eq('business_id', user.publicMetadata.businessId);

        if (timesheetError) throw timesheetError;

        if (timesheets && timesheets.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete assignment with logged hours' },
                { status: 400 }
            );
        }

        // Delete assignment
        const { error } = await supabase
            .from('crew_member_assignments')
            .delete()
            .eq('id', assignmentId)
            .eq('crew_id', id)
            .eq('business_id', user.publicMetadata.businessId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Assignment deleted successfully' }, { status: 204 });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
