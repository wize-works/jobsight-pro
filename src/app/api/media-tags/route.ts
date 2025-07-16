import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { MediaTag, MediaTagInsert, MediaTagUpdate } from '@/types/media-tags';

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
        const tag = searchParams.get('tag');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

        let query = supabase
            .from('media_tags')
            .select('*')
            .eq('business_id', businessId)
            .range(offset, offset + limit - 1)
            .order('tag', { ascending: true });

        // Apply filters
        if (search) {
            query = query.ilike('tag', `%${search}%`);
        }
        if (tag) {
            query = query.eq('tag', tag);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching media tags:', error);
            return NextResponse.json({ error: 'Failed to fetch media tags' }, { status: 500 });
        }

        // Get total count
        const { count: totalCount } = await supabase
            .from('media_tags')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        return NextResponse.json({
            data: data as MediaTag[],
            count: totalCount || 0,
        });
    } catch (error) {
        console.error('Error in GET media tags:', error);
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

        const tagData: MediaTagInsert = {
            ...body,
            business_id: businessId,
            created_by: user.id,
            updated_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('media_tags')
            .insert(tagData)
            .select()
            .single();

        if (error) {
            console.error('Error creating media tag:', error);
            return NextResponse.json({ error: 'Failed to create media tag' }, { status: 500 });
        }

        return NextResponse.json({
            data: data as MediaTag,
            message: 'Media tag created successfully',
        });
    } catch (error) {
        console.error('Error in POST media tag:', error);
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
            return NextResponse.json({ error: 'Media tag ID is required' }, { status: 400 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        const tagUpdate: MediaTagUpdate = {
            ...updateData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('media_tags')
            .update(tagUpdate)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating media tag:', error);
            return NextResponse.json({ error: 'Failed to update media tag' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Media tag not found' }, { status: 404 });
        }

        return NextResponse.json({
            data: data as MediaTag,
            message: 'Media tag updated successfully',
        });
    } catch (error) {
        console.error('Error in PUT media tag:', error);
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
            return NextResponse.json({ error: 'Media tag ID is required' }, { status: 400 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        const { error } = await supabase
            .from('media_tags')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting media tag:', error);
            return NextResponse.json({ error: 'Failed to delete media tag' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Media tag deleted successfully',
        });
    } catch (error) {
        console.error('Error in DELETE media tag:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
