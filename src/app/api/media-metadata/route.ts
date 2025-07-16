import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { MediaMetadata, MediaMetadataInsert, MediaMetadataUpdate } from '@/types/media-metadata';

export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        // Query parameters
        const search = searchParams.get('search');
        const key = searchParams.get('key');
        const value = searchParams.get('value');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

        let query = supabase
            .from('media_metadata')
            .select('*')
            .eq('business_id', businessId)
            .range(offset, offset + limit - 1)
            .order('key', { ascending: true });

        // Apply filters
        if (search) {
            query = query.or(`key.ilike.%${search}%,value.ilike.%${search}%`);
        }
        if (key) {
            query = query.eq('key', key);
        }
        if (value) {
            query = query.eq('value', value);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching media metadata:', error);
            return NextResponse.json({ error: 'Failed to fetch media metadata' }, { status: 500 });
        }

        // Get total count
        const { count: totalCount } = await supabase
            .from('media_metadata')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        return NextResponse.json({
            data: data as MediaMetadata[],
            count: totalCount || 0,
        });
    } catch (error) {
        console.error('Error in GET media metadata:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const body = await request.json();

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        const metadataData: MediaMetadataInsert = {
            ...body,
            business_id: businessId,
            created_by: user.id,
            updated_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('media_metadata')
            .insert(metadataData)
            .select()
            .single();

        if (error) {
            console.error('Error creating media metadata:', error);
            return NextResponse.json({ error: 'Failed to create media metadata' }, { status: 500 });
        }

        return NextResponse.json({
            data: data as MediaMetadata,
            message: 'Media metadata created successfully',
        });
    } catch (error) {
        console.error('Error in POST media metadata:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'Media metadata ID is required' }, { status: 400 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        const metadataUpdate: MediaMetadataUpdate = {
            ...updateData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('media_metadata')
            .update(metadataUpdate)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating media metadata:', error);
            return NextResponse.json({ error: 'Failed to update media metadata' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Media metadata not found' }, { status: 404 });
        }

        return NextResponse.json({
            data: data as MediaMetadata,
            message: 'Media metadata updated successfully',
        });
    } catch (error) {
        console.error('Error in PUT media metadata:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Media metadata ID is required' }, { status: 400 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        const { error } = await supabase
            .from('media_metadata')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting media metadata:', error);
            return NextResponse.json({ error: 'Failed to delete media metadata' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Media metadata deleted successfully',
        });
    } catch (error) {
        console.error('Error in DELETE media metadata:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
