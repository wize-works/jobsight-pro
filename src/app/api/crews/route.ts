import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { Crew, CrewInsert, CrewUpdate, CrewWithDetails } from '@/types/crews';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/crews
 * Get all crews for the authenticated user's business
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const withStats = searchParams.get('withStats') === 'true' || searchParams.get('include_stats') === 'true';
        const withMembers = searchParams.get('withMembers') === 'true' || searchParams.get('include_members') === 'true';
        const withProjects = searchParams.get('withProjects') === 'true' || searchParams.get('include_projects') === 'true';
        const query = searchParams.get('q'); // Search query
        const status = searchParams.get('status');
        const specialty = searchParams.get('specialty');
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Build query
        let dbQuery = supabase
            .from('crews')
            .select('*')
            .eq('business_id', businessId);

        // Apply filters
        if (status) {
            dbQuery = dbQuery.eq('status', status);
        }
        if (specialty) {
            dbQuery = dbQuery.eq('specialty', specialty);
        }

        // Apply search filter
        if (query) {
            dbQuery = dbQuery.or(`name.ilike.%${query}%,specialty.ilike.%${query}%,notes.ilike.%${query}%`);
        }

        // Apply pagination
        if (limit) {
            dbQuery = dbQuery.limit(parseInt(limit));
        }
        if (offset) {
            dbQuery = dbQuery.range(parseInt(offset), parseInt(offset) + parseInt(limit || '50') - 1);
        }

        // Order by name
        dbQuery = dbQuery.order('name', { ascending: true });

        const { data: crews, error } = await dbQuery;

        if (error) {
            console.error('Error fetching crews:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch crews' }, { status: 500 });
        }

        let result: any[] = crews || [];

        // If withStats is requested, get crew statistics
        if (withStats && crews && crews.length > 0) {
            const crewIds = crews.map(crew => crew.id);

            // Get member counts
            const { data: memberCounts } = await supabase
                .from('crew_member_assignments')
                .select('crew_id, id')
                .in('crew_id', crewIds)
                .eq('business_id', businessId)
                .eq('status', 'active');

            // Get project counts
            const { data: projectCounts } = await supabase
                .from('project_crews')
                .select('crew_id, id')
                .in('crew_id', crewIds)
                .eq('business_id', businessId);

            // Get active project counts
            const today = new Date().toISOString().split('T')[0];
            const { data: activeProjectCounts } = await supabase
                .from('project_crews')
                .select('crew_id, id')
                .in('crew_id', crewIds)
                .eq('business_id', businessId)
                .lte('start_date', today)
                .gte('end_date', today);

            // Create stats map
            const statsMap = new Map();
            crewIds.forEach(crewId => {
                statsMap.set(crewId, {
                    total_members: memberCounts?.filter(m => m.crew_id === crewId).length || 0,
                    total_projects: projectCounts?.filter(p => p.crew_id === crewId).length || 0,
                    active_projects: activeProjectCounts?.filter(p => p.crew_id === crewId).length || 0,
                });
            });

            result = crews.map(crew => ({
                ...crew,
                total_members: statsMap.get(crew.id)?.total_members || 0,
                total_projects: statsMap.get(crew.id)?.total_projects || 0,
                active_projects: statsMap.get(crew.id)?.active_projects || 0,
            }));
        }

        // Add member info if requested
        if (withMembers && crews && crews.length > 0) {
            const crewIds = crews.map(crew => crew.id);

            const { data: assignments } = await supabase
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
                .in('crew_id', crewIds)
                .eq('business_id', businessId)
                .eq('status', 'active');

            const assignmentsByCrewId = new Map<string, any[]>();
            assignments?.forEach(assignment => {
                const crewAssignments = assignmentsByCrewId.get(assignment.crew_id) || [];
                crewAssignments.push({
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
                });
                assignmentsByCrewId.set(assignment.crew_id, crewAssignments);
            });

            result = result.map(crew => ({
                ...crew,
                members: assignmentsByCrewId.get(crew.id) || []
            }));
        }

        // Add current projects if requested
        if (withProjects && crews && crews.length > 0) {
            const crewIds = crews.map(crew => crew.id);
            const today = new Date().toISOString().split('T')[0];

            const { data: projectCrews } = await supabase
                .from('project_crews')
                .select(`
                    *,
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
                .in('crew_id', crewIds)
                .eq('business_id', businessId)
                .lte('start_date', today)
                .gte('end_date', today);

            const projectsByCrewId = new Map<string, any[]>();
            projectCrews?.forEach(pc => {
                const crewProjects = projectsByCrewId.get(pc.crew_id) || [];
                crewProjects.push(pc.project);
                projectsByCrewId.set(pc.crew_id, crewProjects);
            });

            result = result.map(crew => ({
                ...crew,
                projects: projectsByCrewId.get(crew.id) || []
            }));
        }

        return NextResponse.json({ success: true, data: result }, { status: 200 });

    } catch (error) {
        console.error('Error in crews GET API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/crews
 * Create a new crew
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.name.trim()) {
            return NextResponse.json({ success: false, error: 'Crew name is required' }, { status: 400 });
        }

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Create crew
        const crewId = uuidv4();
        const now = new Date().toISOString();

        const crewData: CrewInsert = {
            id: crewId,
            business_id: businessId,
            name: body.name.trim(),
            specialty: body.specialty || null,
            leader_id: body.leader_id || null,
            status: body.status || 'active',
            notes: body.notes || null,
            created_at: now,
            created_by: user.id,
            updated_at: now,
            updated_by: user.id,
        };

        const { data: crew, error } = await supabase
            .from('crews')
            .insert(crewData)
            .select()
            .single();

        if (error) {
            console.error('Error creating crew:', error);
            return NextResponse.json({ success: false, error: 'Failed to create crew' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: crew }, { status: 201 });

    } catch (error) {
        console.error('Error in crews POST API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
