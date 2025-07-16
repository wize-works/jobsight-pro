import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { fetchByBusiness, insertWithBusiness, fetchByBusinessWithQuery } from '@/lib/db';
import { Crew, CrewInsert, CrewWithDetails } from '@/types/crews';
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const CreateCrewSchema = z.object({
    name: z.string().min(1, 'Crew name is required'),
    specialty: z.string().optional(),
    leader_id: z.string().optional(),
    status: z.enum(['active', 'inactive', 'on_hold', 'archived']).default('active'),
    notes: z.string().optional(),
});

const GetCrewsQuerySchema = z.object({
    withStats: z.string().optional().transform(val => val === 'true'),
    withMembers: z.string().optional().transform(val => val === 'true'),
    withProjects: z.string().optional().transform(val => val === 'true'),
    status: z.string().optional(),
    specialty: z.string().optional(),
    q: z.string().optional(),
    limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    offset: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

// GET /api/crews - Get all crews with optional filters and stats
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = GetCrewsQuerySchema.parse(Object.fromEntries(searchParams));

        // Get user's business ID
        const { data: businesses } = await fetchByBusiness('businesses', '', '*', {
            filter: { auth_id: user.id }
        });

        if (!businesses || businesses.length === 0) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = businesses[0].id;

        // Build base query
        let baseQuery: any = {
            from: 'crews',
            select: ['*'],
            where: { business_id: businessId },
            orderBy: { column: 'name', ascending: true }
        };

        // Apply filters
        if (query.status) {
            baseQuery.where.status = query.status;
        }
        if (query.specialty) {
            baseQuery.where.specialty = query.specialty;
        }
        if (query.q) {
            baseQuery.where = {
                ...baseQuery.where,
                or: [
                    { name: { ilike: `%${query.q}%` } },
                    { specialty: { ilike: `%${query.q}%` } },
                    { notes: { ilike: `%${query.q}%` } }
                ]
            };
        }

        // Apply pagination
        if (query.limit) {
            baseQuery.limit = query.limit;
        }
        if (query.offset) {
            baseQuery.offset = query.offset;
        }

        // Fetch crews
        const { data: crews, error } = await fetchByBusinessWithQuery(businessId, baseQuery);

        if (error) {
            console.error('Error fetching crews:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch crews' }, { status: 500 });
        }

        if (!crews || crews.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        let result: any[] = crews;

        // Add stats if requested
        if (query.withStats) {
            const crewIds = crews.map(crew => crew.id);

            const { data: statsData } = await fetchByBusinessWithQuery(businessId, {
                from: 'crews',
                select: ['id'],
                aggregates: [
                    { function: 'count', table: 'crew_member_assignments', alias: 'total_members', where: { crew_id: { in: crewIds } } },
                    { function: 'count', table: 'project_crews', alias: 'total_projects', where: { crew_id: { in: crewIds } } },
                    { function: 'count', table: 'project_crews', alias: 'active_projects', where: { crew_id: { in: crewIds }, start_date: { lte: new Date().toISOString() }, end_date: { gte: new Date().toISOString() } } },
                    { function: 'count', table: 'equipment_assignments', alias: 'total_equipment', where: { crew_id: { in: crewIds } } }
                ],
                where: { id: { in: crewIds } }
            });

            const statsMap = new Map(statsData?.map(stat => [stat.id, stat]) || []);

            result = crews.map(crew => ({
                ...crew,
                stats: statsMap.get(crew.id) || {
                    total_members: 0,
                    total_projects: 0,
                    active_projects: 0,
                    total_equipment: 0
                }
            }));
        }

        // Add member info if requested
        if (query.withMembers) {
            const crewIds = crews.map(crew => crew.id);

            const { data: assignments } = await fetchByBusiness('crew_member_assignments', businessId, '*', {
                filter: { crew_id: { in: crewIds } }
            });

            const memberIds = assignments?.map(a => a.crew_member_id) || [];
            const { data: members } = await fetchByBusiness('crew_members', businessId, '*', {
                filter: { id: { in: memberIds } }
            });

            const memberMap = new Map(members?.map(member => [member.id, member]) || []);
            const assignmentsByCrewId = new Map<string, any[]>();

            assignments?.forEach(assignment => {
                const crewAssignments = assignmentsByCrewId.get(assignment.crew_id) || [];
                crewAssignments.push({
                    ...assignment,
                    member: memberMap.get(assignment.crew_member_id)
                });
                assignmentsByCrewId.set(assignment.crew_id, crewAssignments);
            });

            result = result.map(crew => ({
                ...crew,
                members: assignmentsByCrewId.get(crew.id) || []
            }));
        }

        // Add current projects if requested
        if (query.withProjects) {
            const crewIds = crews.map(crew => crew.id);
            const today = new Date().toISOString().split('T')[0];

            const { data: projectCrews } = await fetchByBusiness('project_crews', businessId, '*', {
                filter: {
                    crew_id: { in: crewIds },
                    start_date: { lte: today },
                    end_date: { gte: today }
                }
            });

            const projectIds = projectCrews?.map(pc => pc.project_id) || [];
            const { data: projects } = await fetchByBusiness('projects', businessId, '*', {
                filter: { id: { in: projectIds } }
            });

            const projectMap = new Map(projects?.map(project => [project.id, project]) || []);
            const projectsByCrewId = new Map<string, any[]>();

            projectCrews?.forEach(pc => {
                const crewProjects = projectsByCrewId.get(pc.crew_id) || [];
                crewProjects.push({
                    ...pc,
                    project: projectMap.get(pc.project_id)
                });
                projectsByCrewId.set(pc.crew_id, crewProjects);
            });

            result = result.map(crew => ({
                ...crew,
                current_projects: projectsByCrewId.get(crew.id) || []
            }));
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error('Error in crews GET route:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/crews - Create a new crew
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = CreateCrewSchema.parse(body);

        // Get user's business ID
        const { data: businesses } = await fetchByBusiness('businesses', '', '*', {
            filter: { auth_id: user.id }
        });

        if (!businesses || businesses.length === 0) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = businesses[0].id;

        // Create crew
        const crewId = uuidv4();
        const now = new Date().toISOString();

        const crewData: CrewInsert = {
            id: crewId,
            business_id: businessId,
            name: validatedData.name,
            specialty: validatedData.specialty || null,
            leader_id: validatedData.leader_id || null,
            status: validatedData.status || null,
            notes: validatedData.notes || null,
            created_at: now,
            created_by: user.id,
            updated_at: now,
            updated_by: user.id,
        };

        const { data: crew, error } = await insertWithBusiness('crews', crewData, businessId);

        if (error) {
            console.error('Error creating crew:', error);
            return NextResponse.json({ success: false, error: 'Failed to create crew' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: crew }, { status: 201 });

    } catch (error) {
        console.error('Error in crews POST route:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
