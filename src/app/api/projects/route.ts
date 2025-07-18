import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schemas
const ProjectQuerySchema = z.object({
    include: z.string().optional(),
    client_id: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const ProjectCreateSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    client_id: z.string().optional(),
    status: z.string().optional().default("active"),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    budget: z.coerce.number().optional(),
    location: z.string().optional(),
    priority: z.string().optional().default("medium"),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
});

const ProjectUpdateSchema = ProjectCreateSchema.partial();

/**
 * GET /api/projects
 * Get all projects for the authenticated user's business
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const { searchParams } = new URL(request.url);
        const params = ProjectQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from('projects')
            .select('*')
            .eq('business_id', businessId);

        // Apply filters
        if (params.client_id) {
            query = query.eq('client_id', params.client_id);
        }

        if (params.status) {
            query = query.eq('status', params.status);
        }

        if (params.search) {
            query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
        }

        if (params.start_date) {
            query = query.gte('start_date', params.start_date);
        }

        if (params.end_date) {
            query = query.lte('end_date', params.end_date);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order('created_at', { ascending: false });

        const { data: projects, error } = await query;

        if (error) {
            console.error('Projects fetch error:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
        }

        // Handle includes
        if (params.include && projects) {
            const includes = params.include.split(',');

            for (const project of projects) {
                // Add client details
                if (includes.includes('client') && project.client_id) {
                    const { data: client } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('id', project.client_id)
                        .single();

                    (project as any).client = client;
                }

                // Add project crews
                if (includes.includes('crews')) {
                    const { data: crews } = await supabase
                        .from('project_crews')
                        .select(`
                            *,
                            crews:crew_id (
                                id,
                                name,
                                members:crew_members (
                                    id,
                                    user_id,
                                    users:user_id (
                                        id,
                                        first_name,
                                        last_name
                                    )
                                )
                            )
                        `)
                        .eq('project_id', project.id);

                    (project as any).crews = crews || [];
                }

                // Add project milestones
                if (includes.includes('milestones')) {
                    const { data: milestones } = await supabase
                        .from('project_milestones')
                        .select('*')
                        .eq('project_id', project.id)
                        .order('due_date', { ascending: true });

                    (project as any).milestones = milestones || [];
                }

                // Add project issues
                if (includes.includes('issues')) {
                    const { data: issues } = await supabase
                        .from('project_issues')
                        .select('*')
                        .eq('project_id', project.id)
                        .order('created_at', { ascending: false });

                    (project as any).issues = issues || [];
                }

                // Add detailed information
                if (includes.includes('details')) {
                    // Get client
                    let client = null;
                    if (project.client_id) {
                        const { data: clientData } = await supabase
                            .from('clients')
                            .select('*')
                            .eq('id', project.client_id)
                            .single();
                        client = clientData;
                    }

                    // Get crews
                    const { data: crews } = await supabase
                        .from('project_crews')
                        .select(`
                            *,
                            crews:crew_id (
                                id,
                                name,
                                members:crew_members (
                                    id,
                                    user_id,
                                    users:user_id (
                                        id,
                                        first_name,
                                        last_name
                                    )
                                )
                            )
                        `)
                        .eq('project_id', project.id);

                    // Get milestones
                    const { data: milestones } = await supabase
                        .from('project_milestones')
                        .select('*')
                        .eq('project_id', project.id)
                        .order('due_date', { ascending: true });

                    // Get issues
                    const { data: issues } = await supabase
                        .from('project_issues')
                        .select('*')
                        .eq('project_id', project.id)
                        .order('created_at', { ascending: false });

                    (project as any).client = client;
                    (project as any).crews = crews || [];
                    (project as any).milestones = milestones || [];
                    (project as any).issues = issues || [];
                }
            }
        }

        // Get total count for pagination if limit is specified
        let totalCount = null;
        if (params.limit || params.offset) {
            const { count } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', businessId);
            totalCount = count;
        }

        return NextResponse.json({
            success: true,
            data: projects,
            pagination: {
                count: projects?.length || 0,
                total: totalCount,
                limit: params.limit || null,
                offset: params.offset || 0,
                hasMore: params.limit ? (projects?.length || 0) >= params.limit : false
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/projects:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
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
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const projectData = ProjectCreateSchema.parse(body);

        // Validate client exists and belongs to business if provided
        if (projectData.client_id) {
            const { data: client } = await supabase
                .from('clients')
                .select('id')
                .eq('id', projectData.client_id)
                .eq('business_id', businessId)
                .single();

            if (!client) {
                return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
            }
        }

        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                ...projectData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Project creation error:', error);
            return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: project,
            message: 'Project created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/projects:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/projects
 * Update an existing project
 */
export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
        }

        const projectData = ProjectUpdateSchema.parse(updateData);

        // Validate project exists and belongs to business
        const { data: existingProject } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (!existingProject) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        const { data: project, error } = await supabase
            .from('projects')
            .update({
                ...projectData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Project update error:', error);
            return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: project,
            message: 'Project updated successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Error in PUT /api/projects:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/projects
 * Delete a project
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
        }

        // Validate project exists and belongs to business
        const { data: existingProject } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (!existingProject) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Project deletion error:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Project deleted successfully'
        }, { status: 204 });

    } catch (error) {
        console.error('Error in DELETE /api/projects:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
