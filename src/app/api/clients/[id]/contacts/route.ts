import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { ClientContactInsert, ClientContactUpdate } from '@/types/client-contacts';

/**
 * GET /api/clients/[id]/contacts
 * Get all contacts for a specific client
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        const { id } = await params;

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

        // Verify client exists and belongs to business
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }

        // Get contacts
        const { data: contacts, error } = await supabase
            .from('client_contacts')
            .select('*')
            .eq('client_id', id)
            .eq('business_id', businessId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching client contacts:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch contacts' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: contacts || [] }, { status: 200 });

    } catch (error) {
        console.error('Error in client contacts GET API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/clients/[id]/contacts
 * Create a new contact for a specific client
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const contactData: ClientContactInsert = body;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
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
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
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
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }

        // If this is marked as primary, unset any existing primary contacts
        if (contactData.is_primary) {
            const { error: updateError } = await supabase
                .from('client_contacts')
                .update({ is_primary: false })
                .eq('client_id', id)
                .eq('business_id', businessId)
                .eq('is_primary', true);

            if (updateError) {
                console.error('Error updating existing primary contacts:', updateError);
                // Continue anyway, the database constraint will handle it
            }
        }

        const now = new Date().toISOString();

        // Create contact
        const { data: contact, error } = await supabase
            .from('client_contacts')
            .insert({
                ...contactData,
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
            console.error('Error creating client contact:', error);
            return NextResponse.json({ success: false, error: 'Failed to create contact' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: contact }, { status: 200 });

    } catch (error) {
        console.error('Error in client contacts POST API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
