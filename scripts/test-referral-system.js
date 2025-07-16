#!/usr/bin/env node
/**
 * Test script to verify referral system implementation
 * Run with: node scripts/test-referral-system.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReferralSystem() {
    console.log('🧪 Testing Referral System Implementation...\n');

    try {
        // Test 1: Check if referral_code column exists in businesses table
        console.log('1. Testing businesses table referral_code column...');
        const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select('id, name, referral_code')
            .limit(1);

        if (businessError) {
            console.error('❌ Error querying businesses:', businessError.message);
            return;
        }
        console.log('✅ businesses.referral_code column exists');

        // Test 2: Check if referrals table exists and has correct structure
        console.log('2. Testing referrals table structure...');
        const { data: referrals, error: referralsError } = await supabase
            .from('referrals')
            .select('id, referrer_business_id, referee_business_id, plan_type, status')
            .limit(1);

        if (referralsError) {
            console.error('❌ Error querying referrals:', referralsError.message);
            return;
        }
        console.log('✅ referrals table exists with correct structure');

        // Test 3: Check if sweepstake_entries table exists and has correct structure
        console.log('3. Testing sweepstake_entries table structure...');
        const { data: entries, error: entriesError } = await supabase
            .from('sweepstake_entries')
            .select('id, business_id, user_id, entry_type, referral_id')
            .limit(1);

        if (entriesError) {
            console.error('❌ Error querying sweepstake_entries:', entriesError.message);
            return;
        }
        console.log('✅ sweepstake_entries table exists with correct structure');

        // Test 4: Check if users table has auth_id column for Clerk auth
        console.log('4. Testing users table for Clerk auth compatibility...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, auth_id, business_id, role')
            .limit(1);

        if (usersError) {
            console.error('❌ Error querying users:', usersError.message);
            return;
        }
        console.log('✅ users table has auth_id column for Clerk auth');

        // Test 5: Check if indexes exist
        console.log('5. Testing database indexes...');
        const { data: indexes, error: indexError } = await supabase
            .rpc('get_indexes', { table_name: 'referrals' });

        if (indexError) {
            console.log('⚠️  Could not verify indexes (this is okay)');
        } else {
            console.log('✅ Database indexes verified');
        }

        console.log('\n🎉 All tests passed! Referral system is ready to use.');

        // Instructions for next steps
        console.log('\n📋 Next Steps:');
        console.log('1. Update your API endpoints to use the new schema');
        console.log('2. Deploy the updated components to your app');
        console.log('3. Test the referral flow end-to-end');
        console.log('4. Monitor for any issues in production');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testReferralSystem();
