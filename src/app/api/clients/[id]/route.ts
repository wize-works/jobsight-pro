import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { ClientUpdate } from '@/types/clients';

/**
 * GET /api/clients/[id]
 * Get a specific client with optional embedded contacts and interactions
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeContacts = searchParams.get('includeContacts') === 'true';
        const includeInteractions = searchParams.get('includeInteractions') === 'true';
        const includeProjects = searchParams.get('includeProjects') === 'true';
        const includeStats = searchParams.get('includeStats') === 'true';

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Await the params
        const { id } = await params;

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Get client
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const result: any = { client };

        // Get contacts if requested
        if (includeContacts) {
            const { data: contacts, error: contactsError } = await supabase
                .from('client_contacts')
                .select('*')
                .eq('client_id', id)
                .eq('business_id', businessId)
                .order('name', { ascending: true });

            if (!contactsError) {
                result.contacts = contacts || [];
            }
        }

        // Get interactions if requested
        if (includeInteractions) {
            const { data: interactions, error: interactionsError } = await supabase
                .from('client_interactions')
                .select('*')
                .eq('client_id', id)
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (!interactionsError) {
                result.interactions = interactions || [];
            }
        }

        // Get projects if requested
        if (includeProjects) {
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .eq('client_id', id)
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (!projectsError) {
                result.projects = projects || [];
            }
        }

        // Get stats if requested
        if (includeStats) {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            const [projectsResult, contactsResult, interactionsResult, recentInteractionsResult] = await Promise.all([
                supabase
                    .from('projects')
                    .select('id, status, budget', { count: 'exact' })
                    .eq('client_id', id)
                    .eq('business_id', businessId),

                supabase
                    .from('client_contacts')
                    .select('id', { count: 'exact' })
                    .eq('client_id', id)
                    .eq('business_id', businessId),

                supabase
                    .from('client_interactions')
                    .select('id', { count: 'exact' })
                    .eq('client_id', id)
                    .eq('business_id', businessId),

                supabase
                    .from('client_interactions')
                    .select('id', { count: 'exact' })
                    .eq('client_id', id)
                    .eq('business_id', businessId)
                    .gte('created_at', thirtyDaysAgo)
            ]);

            const projects = projectsResult.data || [];
            const activeProjects = projects.filter(p => p.status === 'active').length;
            const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

            result.stats = {
                totalProjects: projectsResult.count || 0,
                activeProjects,
                totalBudget,
                totalContacts: contactsResult.count || 0,
                totalInteractions: interactionsResult.count || 0,
                recentInteractions: recentInteractionsResult.count || 0,
            };
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error('Error in client GET API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/clients/[id]
 * Update a specific client
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const updateData: ClientUpdate = body;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Await the params
        const { id } = await params;

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Update client
        const { data: client, error } = await supabase
            .from('clients')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            })
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating client:', error);
            return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
        }

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: client });

    } catch (error) {
        console.error('Error in client PUT API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/clients/[id]
 * Delete a specific client (or archive it)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const archive = searchParams.get('archive') === 'true';

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Await the params
        const { id } = await params;

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        if (archive) {
            // Archive client instead of deleting
            const { data: client, error } = await supabase
                .from('clients')
                .update({
                    status: 'archived',
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                })
                .eq('id', id)
                .eq('business_id', businessId)
                .select()
                .single();

            if (error) {
                console.error('Error archiving client:', error);
                return NextResponse.json({ error: 'Failed to archive client' }, { status: 500 });
            }

            if (!client) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, data: client });
        } else {
            // Hard delete (check for related data first)
            const { data: relatedData, error: relatedError } = await supabase
                .from('projects')
                .select('id', { count: 'exact' })
                .eq('client_id', id)
                .eq('business_id', businessId);

            if (relatedError) {
                console.error('Error checking related data:', relatedError);
                return NextResponse.json({ error: 'Failed to check related data' }, { status: 500 });
            }

            if ((relatedData?.length || 0) > 0) {
                return NextResponse.json({
                    error: 'Cannot delete client with related projects. Archive instead.'
                }, { status: 400 });
            }

            // Delete client
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id)
                .eq('business_id', businessId);

            if (error) {
                console.error('Error deleting client:', error);
                return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

    } catch (error) {
        console.error('Error in client DELETE API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
