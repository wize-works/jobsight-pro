import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { Client, ClientInsert, ClientUpdate, ClientWithStats } from '@/types/clients';

/**
 * GET /api/clients
 * Get all clients for the authenticated user's business
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const withStats = searchParams.get('withStats') === 'true';
        const query = searchParams.get('q'); // Search query
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

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

        // Build query
        let dbQuery = supabase
            .from('clients')
            .select('*')
            .eq('business_id', businessId);

        // Apply search filter
        if (query) {
            dbQuery = dbQuery.or(`name.ilike.%${query}%,contact_name.ilike.%${query}%,contact_email.ilike.%${query}%`);
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

        const { data: clients, error } = await dbQuery;

        if (error) {
            console.error('Error fetching clients:', error);
            return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
        }

        // If withStats is requested, get project statistics
        if (withStats && clients && clients.length > 0) {
            const clientIds = clients.map(c => c.id);

            const { data: projectStats, error: statsError } = await supabase
                .from('projects')
                .select('client_id, status, budget')
                .in('client_id', clientIds);

            if (!statsError && projectStats) {
                // Create stats map
                const statsMap = new Map();
                projectStats.forEach(project => {
                    if (!project.client_id) return;

                    const existing = statsMap.get(project.client_id) || {
                        total_projects: 0,
                        active_projects: 0,
                        total_budget: 0
                    };

                    existing.total_projects += 1;
                    if (project.status === 'active') {
                        existing.active_projects += 1;
                    }
                    if (project.budget) {
                        existing.total_budget += project.budget;
                    }

                    statsMap.set(project.client_id, existing);
                });

                // Combine clients with stats
                const clientsWithStats = clients.map(client => ({
                    ...client,
                    total_projects: statsMap.get(client.id)?.total_projects || 0,
                    active_projects: statsMap.get(client.id)?.active_projects || 0,
                    total_budget: statsMap.get(client.id)?.total_budget || 0,
                }));

                return NextResponse.json({ success: true, data: clientsWithStats });
            }
        }

        return NextResponse.json({ success: true, data: clients });

    } catch (error) {
        console.error('Error in clients GET API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const clientData: ClientInsert = body;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

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
        const now = new Date().toISOString();

        // Create client
        const { data: client, error } = await supabase
            .from('clients')
            .insert({
                ...clientData,
                business_id: businessId,
                created_at: now,
                updated_at: now,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating client:', error);
            return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: client });

    } catch (error) {
        console.error('Error in clients POST API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
