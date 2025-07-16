import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { UserNotificationPreference, UserNotificationPreferenceInsert, UserNotificationPreferenceUpdate } from '@/types/notifications';
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

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        let query = supabase
            .from('user_notification_preferences')
            .select('*')
            .eq('business_id', businessId);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching notification preferences:', error);
            return NextResponse.json({ error: 'Failed to fetch notification preferences' }, { status: 500 });
        }

        return NextResponse.json({
            data: data || [],
            count: count || 0,
        });
    } catch (error) {
        console.error('Error in GET /api/notification-preferences:', error);
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
        const { businessId, userId, ...preferences } = body;

        if (!businessId || !userId) {
            return NextResponse.json({ error: 'Business ID and User ID are required' }, { status: 400 });
        }

        // Check if preferences already exist
        const { data: existingPrefs } = await supabase
            .from('user_notification_preferences')
            .select('*')
            .eq('business_id', businessId)
            .eq('user_id', userId);

        if (existingPrefs && existingPrefs.length > 0) {
            // Update existing preferences
            const updatedPrefs = await applyUpdated<UserNotificationPreferenceUpdate>(preferences);

            const { data, error } = await supabase
                .from('user_notification_preferences')
                .update(updatedPrefs)
                .eq('id', existingPrefs[0].id)
                .eq('business_id', businessId)
                .select()
                .single();

            if (error) {
                console.error('Error updating notification preferences:', error);
                return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 });
            }

            return NextResponse.json({ data });
        } else {
            // Create new preferences
            const newPrefs: UserNotificationPreferenceInsert = {
                business_id: businessId,
                user_id: userId,
                ...preferences
            };

            const createdPrefs = await applyCreated<UserNotificationPreferenceInsert>(newPrefs);

            const { data, error } = await supabase
                .from('user_notification_preferences')
                .insert(createdPrefs)
                .select()
                .single();

            if (error) {
                console.error('Error creating notification preferences:', error);
                return NextResponse.json({ error: 'Failed to create notification preferences' }, { status: 500 });
            }

            return NextResponse.json({ data });
        }
    } catch (error) {
        console.error('Error in POST /api/notification-preferences:', error);
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

        const updatedPrefs = await applyUpdated<UserNotificationPreferenceUpdate>(preferences);

        const { data, error } = await supabase
            .from('user_notification_preferences')
            .update(updatedPrefs)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating notification preferences:', error);
            return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in PUT /api/notification-preferences:', error);
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
            .from('user_notification_preferences')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting notification preferences:', error);
            return NextResponse.json({ error: 'Failed to delete notification preferences' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Notification preferences deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/notification-preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
