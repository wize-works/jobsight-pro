import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import {
    UserNotificationTypePreference,
    UserNotificationTypePreferenceInsert,
    UserNotificationTypePreferenceUpdate,
    NotificationTypeOptions,
    notificationTypeOptions
} from '@/types/notifications';
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
        const notificationType = searchParams.get('notificationType');
        const channel = searchParams.get('channel'); // email, push, in_app

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        let query = supabase
            .from('user_notification_type_preferences')
            .select('*')
            .eq('business_id', businessId)
            .order('notification_type', { ascending: true });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (notificationType) {
            query = query.eq('notification_type', notificationType);
        }

        if (channel) {
            const channelField = `${channel}_enabled`;
            query = query.eq(channelField, true);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching notification type preferences:', error);
            return NextResponse.json({ error: 'Failed to fetch notification type preferences' }, { status: 500 });
        }

        return NextResponse.json({
            data: data || [],
            count: count || 0,
        });
    } catch (error) {
        console.error('Error in GET /api/notification-type-preferences:', error);
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
        const { businessId, userId, notificationType, ...preferences } = body;

        if (!businessId || !userId || !notificationType) {
            return NextResponse.json({ error: 'Business ID, User ID, and Notification Type are required' }, { status: 400 });
        }

        // Validate notification type
        if (!Object.keys(notificationTypeOptions).includes(notificationType)) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Check if preferences already exist for this type
        const { data: existingPrefs } = await supabase
            .from('user_notification_type_preferences')
            .select('*')
            .eq('business_id', businessId)
            .eq('user_id', userId)
            .eq('notification_type', notificationType);

        if (existingPrefs && existingPrefs.length > 0) {
            // Update existing preferences
            const updatedPrefs = await applyUpdated<UserNotificationTypePreferenceUpdate>(preferences);

            const { data, error } = await supabase
                .from('user_notification_type_preferences')
                .update(updatedPrefs)
                .eq('id', existingPrefs[0].id)
                .eq('business_id', businessId)
                .select()
                .single();

            if (error) {
                console.error('Error updating notification type preferences:', error);
                return NextResponse.json({ error: 'Failed to update notification type preferences' }, { status: 500 });
            }

            return NextResponse.json({ data });
        } else {
            // Create new preferences
            const newPrefs: UserNotificationTypePreferenceInsert = {
                business_id: businessId,
                user_id: userId,
                notification_type: notificationType as NotificationTypeOptions,
                ...preferences
            };

            const createdPrefs = await applyCreated<UserNotificationTypePreferenceInsert>(newPrefs);

            const { data, error } = await supabase
                .from('user_notification_type_preferences')
                .insert(createdPrefs)
                .select()
                .single();

            if (error) {
                console.error('Error creating notification type preferences:', error);
                return NextResponse.json({ error: 'Failed to create notification type preferences' }, { status: 500 });
            }

            return NextResponse.json({ data });
        }
    } catch (error) {
        console.error('Error in POST /api/notification-type-preferences:', error);
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
        const { id, businessId, ...preferences } = body;

        if (!id || !businessId) {
            return NextResponse.json({ error: 'ID and Business ID are required' }, { status: 400 });
        }

        const updatedPrefs = await applyUpdated<UserNotificationTypePreferenceUpdate>(preferences);

        const { data, error } = await supabase
            .from('user_notification_type_preferences')
            .update(updatedPrefs)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating notification type preferences:', error);
            return NextResponse.json({ error: 'Failed to update notification type preferences' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in PUT /api/notification-type-preferences:', error);
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
        const userId = searchParams.get('userId');
        const notificationType = searchParams.get('notificationType');

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        if (id) {
            // Delete by ID
            const { error } = await supabase
                .from('user_notification_type_preferences')
                .delete()
                .eq('id', id)
                .eq('business_id', businessId);

            if (error) {
                console.error('Error deleting notification type preferences:', error);
                return NextResponse.json({ error: 'Failed to delete notification type preferences' }, { status: 500 });
            }
        } else if (userId && notificationType) {
            // Delete by user ID and notification type
            const { error } = await supabase
                .from('user_notification_type_preferences')
                .delete()
                .eq('business_id', businessId)
                .eq('user_id', userId)
                .eq('notification_type', notificationType);

            if (error) {
                console.error('Error deleting notification type preferences:', error);
                return NextResponse.json({ error: 'Failed to delete notification type preferences' }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: 'Either ID or User ID and Notification Type are required' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Notification type preferences deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/notification-type-preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
