# API Routes Migration Plan: Remove Server Actions

## Overview
We identified 14 API routes that are incorrectly using server actions instead of direct database calls or proper API patterns. This document outlines the migration plan.

## ✅ Completed
- `src/app/api/ai/daily-logs/route.ts` - Migrated to use `serverInsertWithBusiness`

## 🔄 Remaining Routes to Fix

### High Priority (AI/Core Features)
1. **`src/app/api/email-notifications/route.ts`**
   - Uses: `getUsers`, `getUserNotificationPreferences`, `getAllNotificationTypePreferences`
   - Solution: Use `serverFetchByBusiness` for users, create notification API functions

2. **`src/app/api/stripe/route.ts`** 
   - Uses: `getSubscriptionPlans`
   - Solution: Use direct Stripe API calls or move logic to `lib/stripe`

### Medium Priority (PDF/Media)
3. **`src/app/api/media/upload-url/route.ts`**
   - Uses: `generateUploadUrl`
   - Solution: Move upload logic to `lib/media` utility

4. **`src/app/api/send-invoice/route.ts`**
   - Uses: `generateInvoicePdf`
   - Solution: Use `lib/pdf-generation` directly

5. **`src/app/api/pdf-generation/route.ts`**
   - Uses: `generatePdfWithGotenberg`, `generateClientHTML`, `generateInvoiceHTML`, `generateDailyLogHTML`
   - Solution: Move all PDF logic to `lib/pdf` utilities

6. **`src/app/api/generate-pdf-storage-gotenberg/route.ts`**
   - Uses: `uploadPdfBuffer`, `linkExistingMediaToClient`
   - Solution: Use `lib/media` and `serverInsertWithBusiness`

### Low Priority (Data/Business Logic)
7. **`src/app/api/projects/client/[clientId]/route.ts`**
   - Uses: `getProjectsByClientId`
   - Solution: Use `serverFetchByBusiness` with proper joins

8. **`src/app/api/projects/profitability/route.ts`**
   - Uses: `getProjectProfitabilityData`
   - Solution: Use `fetchByBusinessWithQuery` for complex aggregations

9. **`src/app/api/business/check/route.ts`**
   - Uses: `getUserBusiness`
   - Solution: Use direct Supabase query with user auth_id

## 🏗️ Migration Strategy

### Phase 1: Create Utility Functions (if needed)
Create server-side utility functions in `lib/` for complex operations:

- `lib/notifications/server.ts` - Notification operations
- `lib/pdf/server.ts` - PDF generation operations  
- `lib/media/server.ts` - Media upload operations

### Phase 2: Replace Server Actions
For each route:
1. **Remove server action imports**
2. **Add appropriate lib imports** (`serverFetchByBusiness`, `serverInsertWithBusiness`, etc.)
3. **Replace action calls** with direct database operations
4. **Handle errors appropriately** (server actions have different error handling)
5. **Test thoroughly** (different response patterns)

### Phase 3: Testing
- Test each endpoint individually
- Verify error handling works correctly
- Check that business validation still works
- Ensure proper response formats

## 📋 Benefits After Migration

1. **Better Performance** - No unnecessary server action overhead
2. **Clearer Architecture** - API routes use proper server-side patterns
3. **Better Error Handling** - Direct database error handling
4. **Easier Testing** - No mixing of client/server patterns
5. **Better Caching** - Proper Next.js caching behavior

## 🚀 Next Steps

1. **Prioritize by usage** - Start with most frequently used endpoints
2. **Create lib utilities first** - Build proper server-side functions
3. **Migrate incrementally** - One route at a time to avoid breaking changes
4. **Update documentation** - Document the new patterns for team

## 📝 Example Pattern

### Before (❌ Wrong)
```typescript
import { createDailyLog } from "@/app/actions/daily-logs";

export async function POST(request: NextRequest) {
  const result = await createDailyLog(businessId, data);
  return NextResponse.json({ success: true, data: result });
}
```

### After (✅ Correct)
```typescript
import { serverInsertWithBusiness } from "@/lib/db";

export async function POST(request: NextRequest) {
  const result = await serverInsertWithBusiness("daily_logs", data, businessId, userId);
  if (result.error) {
    return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
}
```
