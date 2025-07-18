import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { ClientContactUpdate } from '@/types/client-contacts';

/**
 * GET /api/clients/[id]/contacts/[contactId]
 * Get a specific contact
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
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
        const { id, contactId } = await params;

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

        // Get contact
        const { data: contact, error } = await supabase
            .from('client_contacts')
            .select('*')
            .eq('id', contactId)
            .eq('client_id', id)
            .eq('business_id', businessId)
            .single();

        if (error || !contact) {
            return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: contact }, { status: 200 });

    } catch (error) {
        console.error('Error in contact GET API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/clients/[id]/contacts/[contactId]
 * Update a specific contact
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const updateData: ClientContactUpdate = body;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Await the params
        const { id, contactId } = await params;

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

        // If this is being marked as primary, unset any existing primary contacts
        if (updateData.is_primary) {
            const { error: updateError } = await supabase
                .from('client_contacts')
                .update({ is_primary: false })
                .eq('client_id', id)
                .eq('business_id', businessId)
                .eq('is_primary', true)
                .neq('id', contactId);

            if (updateError) {
                console.error('Error updating existing primary contacts:', updateError);
                // Continue anyway, the database constraint will handle it
            }
        }

        // Update contact
        const { data: contact, error } = await supabase
            .from('client_contacts')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            })
            .eq('id', contactId)
            .eq('client_id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating contact:', error);
            return NextResponse.json({ success: false, error: 'Failed to update contact' }, { status: 500 });
        }

        if (!contact) {
            return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: contact }, { status: 200 });

    } catch (error) {
        console.error('Error in contact PUT API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/clients/[id]/contacts/[contactId]
 * Delete a specific contact
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
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
        const { id, contactId } = await params;

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

        // Delete contact
        const { error } = await supabase
            .from('client_contacts')
            .delete()
            .eq('id', contactId)
            .eq('client_id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting contact:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete contact' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error('Error in contact DELETE API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
