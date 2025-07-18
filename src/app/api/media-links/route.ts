import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { MediaLinkInsert } from '@/types/media_links';

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ success: false, error: 'Business ID not found' }, { status: 400 });
        }

        const { media_id, linked_id, linked_type } = await request.json();

        if (!media_id || !linked_id || !linked_type) {
            return NextResponse.json({
                error: 'Missing required fields: media_id, linked_id, linked_type'
            }, { status: 400 });
        }

        const mediaLinkData: MediaLinkInsert = {
            id: crypto.randomUUID(),
            business_id: businessId,
            media_id,
            linked_id,
            linked_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user.id,
            updated_by: user.id,
        };

        const { data, error } = await supabase
            .from('media_links')
            .insert(mediaLinkData)
            .select()
            .single();

        if (error) {
            console.error('Error creating media link:', error);
            return NextResponse.json({ success: false, error: 'Failed to create media link' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Media link created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error in media-links API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get business_id from user metadata
        const businessId = user.publicMetadata?.businessId as string;
        if (!businessId) {
            return NextResponse.json({ success: false, error: 'Business ID not found' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const media_id = searchParams.get('media_id');
        const linked_id = searchParams.get('linked_id');
        const linked_type = searchParams.get('linked_type');

        if (!media_id || !linked_id || !linked_type) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters: media_id, linked_id, linked_type'
            }, { status: 400 });
        }

        const { error } = await supabase
            .from('media_links')
            .delete()
            .eq('business_id', businessId)
            .eq('media_id', media_id)
            .eq('linked_id', linked_id)
            .eq('linked_type', linked_type);

        if (error) {
            console.error('Error deleting media link:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete media link' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Media link deleted successfully'
        }, { status: 204 });

    } catch (error) {
        console.error('Error in media-links DELETE API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
