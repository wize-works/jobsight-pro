# Debugging 403 Forbidden Error in Referral System

## Issue
You're getting a 403 Forbidden error when accessing `/api/sweepstake/dashboard?business_id=...`

## Root Cause
The API endpoints were checking for a `user_businesses` table that doesn't exist in your database. Your system uses a `users` table with a `business_id` column instead.

## Fixes Applied
I've updated the following API endpoints to use the correct authentication:

### 1. `/api/sweepstake/dashboard` 
**Before:**
```javascript
const { data: userBusiness, error: userBusinessError } = await supabase
    .from('user_businesses')
    .select('role')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .single();
```

**After:**
```javascript
const { data: user, error: userError } = await supabase
    .from('users')
    .select('business_id, role')
    .eq('auth_id', userId)
    .single();

if (user.business_id !== businessId) {
    return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
    );
}
```

### 2. `/api/referrals/business`
Same fix applied - now checks `users` table with `auth_id` instead of `user_businesses`.

### 3. `/api/businesses/[id]/referral-code`
Same fix applied - now checks `users` table with `auth_id` instead of `user_businesses`.

## How to Test

1. **Run the test script:**
   ```bash
   node scripts/test-referral-system.js
   ```

2. **Check browser console:**
   - Open browser dev tools
   - Navigate to your dashboard
   - Check for any remaining 403 errors

3. **Test endpoints directly:**
   - Use your browser's dev tools Network tab
   - Or use curl/Postman to test the endpoints

## Key Points

- **Authentication Method:** Uses Clerk `userId` mapped to `users.auth_id`
- **Business Association:** Users are linked to businesses via `users.business_id`
- **Role Checking:** User roles are stored in the `users.role` column
- **No RLS:** Since you use Clerk auth, we don't use Supabase RLS

## Expected Behavior After Fix

1. ✅ Dashboard loads without 403 errors
2. ✅ Users can generate referral codes (if they have admin/supervisor role)
3. ✅ Referral statistics display correctly
4. ✅ Sweepstake entries are tracked properly

## If You Still Get 403 Errors

Check these common issues:

1. **Environment Variables:**
   - `SUPABASE_URL` is set
   - `SUPABASE_SERVICE_ROLE_KEY` is set
   - Variables are available in your API routes

2. **Database Structure:**
   - `users` table has `auth_id` column
   - `users` table has `business_id` column
   - `users` table has `role` column

3. **User Data:**
   - Your test user exists in the `users` table
   - The user has a valid `business_id`
   - The user has the correct `auth_id` from Clerk

4. **Permissions:**
   - For generating referral codes, user needs 'Admin' or 'Supervisor' role
   - For viewing dashboard, user just needs to be associated with the business

Run the test script to verify all components are working correctly!
