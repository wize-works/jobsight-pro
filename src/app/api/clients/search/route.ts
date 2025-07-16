import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/clients/search
 * Search clients, contacts, and interactions
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const includeContacts = searchParams.get('includeContacts') === 'true';
        const includeInteractions = searchParams.get('includeInteractions') === 'true';
        const limit = searchParams.get('limit') || '20';

        if (!query) {
            return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
        }

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

        // Search clients
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .eq('business_id', businessId)
            .or(`name.ilike.%${query}%,contact_name.ilike.%${query}%,contact_email.ilike.%${query}%`)
            .order('name', { ascending: true })
            .limit(parseInt(limit));

        if (clientsError) {
            console.error('Error searching clients:', clientsError);
            return NextResponse.json({ error: 'Failed to search clients' }, { status: 500 });
        }

        const result: any = {
            clients: clients || [],
        };

        // Search contacts if requested
        if (includeContacts) {
            const { data: contacts, error: contactsError } = await supabase
                .from('client_contacts')
                .select('*')
                .eq('business_id', businessId)
                .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
                .order('name', { ascending: true })
                .limit(parseInt(limit));

            if (!contactsError) {
                result.contacts = contacts || [];
            }
        }

        // Search interactions if requested
        if (includeInteractions) {
            const { data: interactions, error: interactionsError } = await supabase
                .from('client_interactions')
                .select('*')
                .eq('business_id', businessId)
                .or(`summary.ilike.%${query}%,follow_up_task.ilike.%${query}%,staff.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (!interactionsError) {
                result.interactions = interactions || [];
            }
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error('Error in clients search API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
