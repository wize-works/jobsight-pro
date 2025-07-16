import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { Notification, NotificationInsert, NotificationUpdate } from '@/types/notifications';
import { applyCreated } from '@/utils/apply-created';
import { applyUpdated } from '@/utils/apply-updated';

export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');
        const userId = searchParams.get('userId');
        const id = searchParams.get('id');
        const read = searchParams.get('read');
        const type = searchParams.get('type');
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (id) {
            query = query.eq('id', id);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (read !== null) {
            query = query.eq('read', read === 'true');
        }

        if (type) {
            query = query.eq('type', type);
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        if (offset) {
            query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || '50') - 1);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        // If requesting a single notification by ID, return single object
        if (id && data && data.length > 0) {
            return NextResponse.json({ data: data[0] });
        }

        return NextResponse.json({
            data: data || [],
            count: count || 0,
        });
    } catch (error) {
        console.error('Error in GET /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const body = await request.json();
        const { businessId, ...notification } = body;

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        if (!notification.user_id || !notification.title || !notification.type) {
            return NextResponse.json({
                error: 'User ID, title, and type are required'
            }, { status: 400 });
        }

        const newNotification: NotificationInsert = {
            business_id: businessId,
            ...notification
        };

        const createdNotification = await applyCreated<NotificationInsert>(newNotification);

        const { data, error } = await supabase
            .from('notifications')
            .insert(createdNotification)
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in POST /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const body = await request.json();
        const { id, businessId, markAllAsRead, userId, ...notification } = body;

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        if (markAllAsRead && userId) {
            // Mark all notifications as read for a user
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('notifications')
                .update({
                    read: true,
                    read_at: now
                })
                .eq('business_id', businessId)
                .eq('user_id', userId)
                .eq('read', false)
                .select();

            if (error) {
                console.error('Error marking all notifications as read:', error);
                return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 });
            }

            return NextResponse.json({
                data: data || [],
                message: 'All notifications marked as read'
            });
        }

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const updatedNotification = await applyUpdated<NotificationUpdate>(notification);

        const { data, error } = await supabase
            .from('notifications')
            .update(updatedNotification)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating notification:', error);
            return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in PUT /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const businessId = searchParams.get('businessId');

        if (!id || !businessId) {
            return NextResponse.json({ error: 'ID and Business ID are required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting notification:', error);
            return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
