import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/users
 * Get all users for the current business
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

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

        // Handle different actions
        if (action === 'get_by_id') {
            const id = searchParams.get('id');
            if (!id) {
                return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
            }

            const { data: targetUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .eq('business_id', businessId)
                .single();

            if (error) {
                return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, data: targetUser }, { status: 200 });
        }

        if (action === 'get_by_auth_id') {
            const authId = searchParams.get('auth_id');
            if (!authId) {
                return NextResponse.json({ success: false, error: 'Auth ID is required' }, { status: 400 });
            }

            const { data: targetUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', authId)
                .eq('business_id', businessId)
                .single();

            if (error) {
                return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, data: targetUser }, { status: 200 });
        }

        if (action === 'search') {
            const query = searchParams.get('query');
            if (!query) {
                return NextResponse.json({ success: false, error: 'Search query is required' }, { status: 400 });
            }

            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('business_id', businessId)
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error searching users:', error);
                return NextResponse.json({ success: false, error: 'Failed to search users' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                data: users || [],
                pagination: {
                    count: users?.length || 0,
                    total: users?.length || 0,
                    limit: null,
                    offset: 0,
                    hasMore: false
                }
            }, { status: 200 });
        }

        // Default: Get all users with filtering
        let query = supabase
            .from('users')
            .select('*')
            .eq('business_id', businessId);

        // Apply filters
        if (role) {
            query = query.eq('role', role);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // Apply pagination
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        if (offset) {
            query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || '50') - 1);
        }

        // Order by created_at descending
        query = query.order('created_at', { ascending: false });

        const { data: users, error } = await query;

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
        }

        // Get total count for pagination
        const { count: totalCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        return NextResponse.json({
            success: true,
            data: users || [],
            pagination: {
                count: users?.length || 0,
                total: totalCount || 0,
                limit: limit ? parseInt(limit) : null,
                offset: offset ? parseInt(offset) : 0,
                hasMore: offset && limit ? (parseInt(offset) + parseInt(limit)) < (totalCount || 0) : false
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error in users GET API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/users
 * Create a new user or handle user actions
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, ...data } = body;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id, role')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Handle avatar upload
        if (action === 'upload_avatar') {
            // This is a placeholder - actual file upload would be handled separately
            return NextResponse.json({ success: true, data: { avatar_url: 'https://example.com/avatar.jpg' } });
        }

        // Handle user invitations
        if (action === 'send_invitation') {
            const { email, name, role } = data;
            if (!email || !name || !role) {
                return NextResponse.json({ success: false, error: 'Email, name, and role are required' }, { status: 400 });
            }

            // This is a placeholder - actual email sending would be implemented
            const invitation = {
                id: `inv_${Date.now()}`,
                email,
                name,
                role,
                status: 'sent',
                business_id: businessId,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            };

            return NextResponse.json({ success: true, data: invitation }, { status: 201 });
        }

        if (action === 'resend_invitation') {
            const { userId } = data;
            if (!userId) {
                return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
            }

            // This is a placeholder - actual resend logic would be implemented
            return NextResponse.json({ success: true, message: 'Invitation resent' });
        }

        if (action === 'revoke_invitation') {
            const { userId } = data;
            if (!userId) {
                return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
            }

            // This is a placeholder - actual revoke logic would be implemented
            return NextResponse.json({ success: true, message: 'Invitation revoked' });
        }

        // Default: Create a new user
        const { user: newUserData } = data;
        if (!newUserData) {
            return NextResponse.json({ success: false, error: 'User data is required' }, { status: 400 });
        }

        const now = new Date().toISOString();

        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                ...newUserData,
                business_id: businessId,
                created_at: now,
                updated_at: now,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: newUser }, { status: 201 });

    } catch (error) {
        console.error('Error in users POST API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/users
 * Update an existing user
 */
export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, userId, authId, user: updateData, updates } = body;

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id, role')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = userData.business_id;

        // Handle update by auth ID
        if (action === 'update_by_auth_id') {
            if (!authId || !updateData) {
                return NextResponse.json({ success: false, error: 'Auth ID and user data are required' }, { status: 400 });
            }

            const { data: updatedUser, error } = await supabase
                .from('users')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                })
                .eq('auth_id', authId)
                .eq('business_id', businessId)
                .select()
                .single();

            if (error) {
                console.error('Error updating user by auth ID:', error);
                return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
        }

        // Handle admin update
        if (action === 'admin_update') {
            if (!userId || !updates) {
                return NextResponse.json({ success: false, error: 'User ID and updates are required' }, { status: 400 });
            }

            // Check if user is admin
            if (userData.role !== 'admin') {
                return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
            }

            const { data: updatedUser, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                })
                .eq('id', userId)
                .eq('business_id', businessId)
                .select()
                .single();

            if (error) {
                console.error('Error updating user as admin:', error);
                return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
        }

        // Default: Update user by ID
        if (!userId || !updateData) {
            return NextResponse.json({ success: false, error: 'User ID and user data are required' }, { status: 400 });
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            })
            .eq('id', userId)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });

    } catch (error) {
        console.error('Error in users PUT API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/users
 * Delete a user
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

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

        // Prevent self-deletion
        const { data: targetUser, error: targetError } = await supabase
            .from('users')
            .select('auth_id')
            .eq('id', userId)
            .eq('business_id', businessId)
            .single();

        if (targetError) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (targetUser.auth_id === user.id) {
            return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error deleting user:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 204 });

    } catch (error) {
        console.error('Error in users DELETE API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
