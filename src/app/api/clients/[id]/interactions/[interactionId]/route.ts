import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { ClientInteractionUpdate } from '@/types/client-interactions';

/**
 * GET /api/clients/[id]/interactions/[interactionId]
 * Get a specific interaction
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; interactionId: string }> }) {
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
        const { id, interactionId } = await params;

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

        // Get interaction
        const { data: interaction, error } = await supabase
            .from('client_interactions')
            .select('*')
            .eq('id', interactionId)
            .eq('client_id', id)
            .eq('business_id', businessId)
            .single();

        if (error || !interaction) {
            return NextResponse.json({ success: false, error: 'Interaction not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: interaction });

    } catch (error) {
        console.error('Error in interaction GET API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/clients/[id]/interactions/[interactionId]
 * Update a specific interaction
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; interactionId: string }> }) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const updateData: ClientInteractionUpdate = body;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Await the params
        const { id, interactionId } = await params;

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

        // Update interaction
        const { data: interaction, error } = await supabase
            .from('client_interactions')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            })
            .eq('id', interactionId)
            .eq('client_id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating interaction:', error);
            return NextResponse.json({ success: false, error: 'Failed to update interaction' }, { status: 500 });
        }

        if (!interaction) {
            return NextResponse.json({ success: false, error: 'Interaction not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: interaction }, { status: 200 });

    } catch (error) {
        console.error('Error in interaction PUT API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/clients/[id]/interactions/[interactionId]
 * Delete a specific interaction
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; interactionId: string }> }) {
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
        const { id, interactionId } = await params;

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

        // Delete interaction
        const { error } = await supabase
            .from('client_interactions')
            .delete()
            .eq('id', interactionId)
            .eq('client_id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting interaction:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete interaction' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error('Error in interaction DELETE API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
