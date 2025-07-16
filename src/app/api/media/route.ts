import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { Media, MediaInsert, MediaUpdate, MediaType } from '@/types/media';

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
        const type = searchParams.get('type');
        const equipment_id = searchParams.get('equipment_id');
        const project_id = searchParams.get('project_id');
        const client_id = searchParams.get('client_id');
        const daily_log_id = searchParams.get('daily_log_id');
        const include = searchParams.get('include');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

        let query = supabase
            .from('media')
            .select('*')
            .eq('business_id', businessId)
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        // Apply filters
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        if (type) {
            query = query.eq('type', type);
        }

        let data: Media[];
        let error: any;

        // Handle linked media queries
        if (equipment_id || project_id || client_id || daily_log_id) {
            // First get media links
            let linkQuery = supabase
                .from('media_links')
                .select('media_id')
                .eq('business_id', businessId);

            if (equipment_id) {
                linkQuery = linkQuery.eq('linked_id', equipment_id).eq('linked_type', 'equipment');
            } else if (project_id) {
                linkQuery = linkQuery.eq('linked_id', project_id).eq('linked_type', 'project');
            } else if (client_id) {
                linkQuery = linkQuery.eq('linked_id', client_id).eq('linked_type', 'client');
            } else if (daily_log_id) {
                linkQuery = linkQuery.eq('linked_id', daily_log_id).eq('linked_type', 'daily_log');
            }

            const { data: linkData, error: linkError } = await linkQuery;

            if (linkError) {
                console.error('Error fetching media links:', linkError);
                return NextResponse.json({ error: 'Failed to fetch media links' }, { status: 500 });
            }

            if (!linkData || linkData.length === 0) {
                return NextResponse.json({ data: [], count: 0 });
            }

            const mediaIds = linkData.map(link => link.media_id);
            query = query.in('id', mediaIds);
        }

        const result = await query;
        data = result.data || [];
        error = result.error;

        if (error) {
            console.error('Error fetching media:', error);
            return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
        }

        // Get total count
        const { count: totalCount } = await supabase
            .from('media')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        return NextResponse.json({
            data: data as Media[],
            count: totalCount || 0,
        });
    } catch (error) {
        console.error('Error in GET media:', error);
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

        const mediaData: MediaInsert = {
            ...body,
            business_id: businessId,
            created_by: user.id,
            updated_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('media')
            .insert(mediaData)
            .select()
            .single();

        if (error) {
            console.error('Error creating media:', error);
            return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
        }

        return NextResponse.json({
            data: data as Media,
            message: 'Media created successfully',
        });
    } catch (error) {
        console.error('Error in POST media:', error);
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
            return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        const mediaUpdate: MediaUpdate = {
            ...updateData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('media')
            .update(mediaUpdate)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating media:', error);
            return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Media not found' }, { status: 404 });
        }

        return NextResponse.json({
            data: data as Media,
            message: 'Media updated successfully',
        });
    } catch (error) {
        console.error('Error in PUT media:', error);
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
            return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ error: 'Business ID not found' }, { status: 400 });
        }

        // Delete related media links first
        const { error: linkError } = await supabase
            .from('media_links')
            .delete()
            .eq('media_id', id)
            .eq('business_id', businessId);

        if (linkError) {
            console.error('Error deleting media links:', linkError);
            return NextResponse.json({ error: 'Failed to delete media links' }, { status: 500 });
        }

        // Delete the media record
        const { error } = await supabase
            .from('media')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting media:', error);
            return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Media deleted successfully',
        });
    } catch (error) {
        console.error('Error in DELETE media:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
