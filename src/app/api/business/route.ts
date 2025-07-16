import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { CreateBusinessParams } from '@/types/business';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/business?userId=xxx
 * Get business information for a user
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const businessId = searchParams.get('businessId');

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // If businessId is provided, get business by ID
        if (businessId) {
            const { data: business, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', businessId)
                .single();

            if (error) {
                console.error('Error fetching business by ID:', error);
                return NextResponse.json({ error: 'Business not found' }, { status: 404 });
            }

            // Verify user has access to this business
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('business_id')
                .eq('auth_id', user.id)
                .single();

            if (userError || userData?.business_id !== businessId) {
                return NextResponse.json({ error: 'Access denied to business' }, { status: 403 });
            }

            return NextResponse.json({ success: true, data: business });
        }

        // Get user's business
        const targetUserId = userId || user.id;

        // First get the user to find their business_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', targetUserId)
            .single();

        if (userError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid user credentials'
            }, { status: 401 });
        }

        if (!userData?.business_id) {
            return NextResponse.json({ success: true, data: null }); // User doesn't have a business yet
        }

        // Get the business details
        const { data: businessData, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', userData.business_id)
            .single();

        if (businessError) {
            console.error('Error fetching business:', businessError);
            return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: businessData });

    } catch (error) {
        console.error('Error in business GET API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/business
 * Create a new business
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const params: CreateBusinessParams = {
            userId: user.id,
            ...body
        };

        const {
            userId,
            businessName,
            businessType,
            phoneNumber,
            website,
            address,
            city,
            state,
            zipCode,
            country,
            email
        } = params;

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Create a new business
        const businessId = uuidv4();
        const now = new Date().toISOString();

        // Insert the business
        const { error: businessError } = await supabase.from('businesses').insert({
            id: businessId,
            name: businessName,
            business_type: businessType || 'General Contractor',
            address: address || null,
            city: city || null,
            state: state || null,
            zip: zipCode || null,
            country: country || null,
            phone: phoneNumber || null,
            email: email || null,
            website: website || null,
            owner_id: userId,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        });

        if (businessError) {
            console.error('Error creating business:', businessError);
            return NextResponse.json({
                error: `Failed to create business: ${businessError.message}`
            }, { status: 500 });
        }

        // Handle user record
        const { data: existingUser, error: getUserError } = await supabase
            .from('users')
            .select('id, business_id')
            .eq('auth_id', userId)
            .single();

        if (getUserError && getUserError.code === 'PGRST116') {
            // User doesn't exist, create new user
            const { error: createUserError } = await supabase
                .from('users')
                .insert({
                    auth_id: userId,
                    business_id: businessId,
                    email: email || null,
                    created_at: now,
                    updated_at: now,
                    created_by: userId,
                    updated_by: userId,
                });

            if (createUserError) {
                console.error('Error creating user:', createUserError);
                return NextResponse.json({
                    error: 'Failed to create user record'
                }, { status: 500 });
            }
        } else if (getUserError) {
            console.error('Error checking existing user:', getUserError);
            return NextResponse.json({
                error: 'Failed to check user record'
            }, { status: 500 });
        } else {
            // User exists, check if they already have a business
            if (existingUser.business_id) {
                return NextResponse.json({
                    error: 'User already has a business associated'
                }, { status: 400 });
            }

            // Update user with business ID
            const { error: userError } = await supabase
                .from('users')
                .update({ business_id: businessId, updated_at: now })
                .eq('auth_id', userId);

            if (userError) {
                console.error('Error updating user with business ID:', userError);
                return NextResponse.json({
                    error: 'Failed to update user record'
                }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, data: { businessId } });

    } catch (error) {
        console.error('Error in business POST API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/business
 * Update an existing business
 */
export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessId, ...updateData } = body;

        if (!businessId) {
            return NextResponse.json({
                error: 'Business ID is required'
            }, { status: 400 });
        }

        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Verify user has access to this business
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', user.id)
            .single();

        if (userError || userData?.business_id !== businessId) {
            return NextResponse.json({ error: 'Access denied to business' }, { status: 403 });
        }

        const now = new Date().toISOString();

        // Map the data to the correct column names
        const businessData = {
            name: updateData.businessName,
            business_type: updateData.businessType,
            phone: updateData.phoneNumber,
            website: updateData.website,
            address: updateData.address,
            city: updateData.city,
            state: updateData.state,
            zip: updateData.zipCode,
            country: updateData.country,
            email: updateData.email,
            updated_at: now,
            updated_by: user.id,
            setup_completed: updateData.setupCompleted || false,
        };

        // Remove undefined values
        Object.keys(businessData).forEach(key => {
            if (businessData[key as keyof typeof businessData] === undefined) {
                delete businessData[key as keyof typeof businessData];
            }
        });

        const { error } = await supabase
            .from('businesses')
            .update(businessData)
            .eq('id', businessId);

        if (error) {
            console.error('Error updating business:', error);
            return NextResponse.json({
                error: `Failed to update business: ${error.message}`
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in business PUT API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
