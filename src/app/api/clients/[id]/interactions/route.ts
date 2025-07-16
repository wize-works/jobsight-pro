import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { ClientInteractionInsert, ClientInteractionUpdate } from '@/types/client-interactions';

/**
 * GET /api/clients/[id]/interactions
 * Get all interactions for a specific client
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');
        const type = searchParams.get('type');

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

        // Verify client exists and belongs to business
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Build query
        let query = supabase
            .from('client_interactions')
            .select('*')
            .eq('client_id', id)
            .eq('business_id', businessId);

        // Apply type filter
        if (type) {
            query = query.eq('type', type);
        }

        // Apply pagination
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        if (offset) {
            query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || '50') - 1);
        }

        // Order by created_at descending
        query = query.order('created_at', { ascending: false });

        const { data: interactions, error } = await query;

        if (error) {
            console.error('Error fetching client interactions:', error);
            return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: interactions || [] });

    } catch (error) {
        console.error('Error in client interactions GET API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/clients/[id]/interactions
 * Create a new interaction for a specific client
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const body = await request.json();
        const interactionData: ClientInteractionInsert = body;

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

        // Verify client exists and belongs to business
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const now = new Date().toISOString();

        // Create interaction
        const { data: interaction, error } = await supabase
            .from('client_interactions')
            .insert({
                ...interactionData,
                client_id: id,
                business_id: businessId,
                created_at: now,
                updated_at: now,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating client interaction:', error);
            return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: interaction });

    } catch (error) {
        console.error('Error in client interactions POST API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
