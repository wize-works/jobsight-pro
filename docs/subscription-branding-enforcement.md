# Subscription-Tiered Branding Enforcement

## Overview

This document outlines the implementation of subscription-tiered branding for JobSight Pro, ensuring that custom branding features (logos, business information, white-label) are only available for Pro and higher subscription plans.

## Implementation Details

### Feature Gating
- **Custom branding** is available for Pro, Business, and Enterprise plans only
- Personal and Starter plans display default JobSight branding in all outputs

### Affected Components

#### 1. Invoice Generation (`src/app/actions/invoices.ts`)
- **Function**: `getInvoiceWitDetailsById()`
- **Enforcement**: Checks subscription level before including custom business information
- **Fallback**: Uses default JobSight branding for lower-tier plans

#### 2. Client Report Generation (`src/app/actions/generate-html.ts`)
- **Function**: `generateClientHTML()`
- **Enforcement**: Subscription-aware business info in PDF reports
- **Fallback**: JobSight Pro branding for Personal/Starter plans

#### 3. Daily Log Report Generation (`src/app/actions/generate-html.ts`)
- **Function**: `generateDailyLogHTML()`
- **Enforcement**: Custom branding only for Pro+ plans
- **Fallback**: Default JobSight branding

#### 4. Email Templates (`src/components/email-template.tsx`)
- **Already Implemented**: Always shows JobSight logo with "Sent on behalf of" indication
- **Consistent**: Maintains professional JobSight branding across all plans

### Subscription Logic

```typescript
// Check subscription level for branding privileges
const { data: subscriptionData } = await fetchByBusiness("business_subscriptions", businessId, "*", {
    filter: { business_id: businessId },
    orderBy: { column: "created_at", ascending: false },
    limit: 1,
});

const currentSubscription = subscriptionData?.[0];
const currentPlan = currentSubscription?.plan_id || 'personal';
const currentPlanLevel = PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0;
const hasCustomBranding = currentPlanLevel >= PLAN_HIERARCHY.pro;
```

### Plan-Based Branding Rules

| Plan | Custom Logo | Custom Business Info | White-Label |
|------|-------------|---------------------|-------------|
| Personal | ❌ | ❌ | ❌ |
| Starter | ❌ | ❌ | ❌ |
| Pro | ✅ | ✅ | ✅ |
| Business | ✅ | ✅ | ✅ |
| Enterprise | ✅ | ✅ | ✅ |

### Branding Fallbacks

When custom branding is not allowed:
- **Business Name**: "JobSight Pro"
- **Email**: "support@jobsight.co"
- **Website**: "https://jobsight.co"
- **Logo**: Default JobSight logo (`/logo-full.png`)
- **Address/Phone/Tax ID**: Empty/null values

## Database Schema

**No database changes required** - the existing schema already supports:
- `businesses.logo_url` for custom logos
- `business_subscriptions` table for plan management
- All necessary business information fields

## Testing Scenarios

### Pro+ Plan Invoice
- Should display custom business logo
- Should show custom business name and contact info
- Should include custom business address

### Personal/Starter Plan Invoice  
- Should display JobSight logo
- Should show "JobSight Pro" as business name
- Should use JobSight contact information
- Should not show custom business address

## File Changes Made

1. **`src/app/actions/invoices.ts`**
   - Added import for `PLAN_HIERARCHY`
   - Modified `getInvoiceWitDetailsById()` to check subscription before applying branding

2. **`src/app/actions/generate-html.ts`**
   - Added imports for `fetchByBusiness` and `PLAN_HIERARCHY`
   - Updated `generateClientHTML()` for subscription-aware branding
   - Updated `generateDailyLogHTML()` for subscription-aware branding

3. **Removed unused files**
   - `src/app/actions/admin-subscriptions.ts` (cleanup from previous work)

## Integration Points

### Existing Feature Gates
- BrandingManager component already restricts UI access to Pro+ plans
- Dashboard subscription tab shows branding availability
- Feature gate hook (`useFeatureGate`) includes `custom_branding` feature

### Email System
- Email templates maintain consistent JobSight branding
- Invoices sent via email automatically respect subscription tiers
- PDF attachments generated with subscription-aware branding

## Compliance & White-Label

- Pro+ customers can fully white-label their invoices and reports
- Personal/Starter plans maintain JobSight branding for consistency
- All email communications clearly indicate JobSight as the platform provider

## Future Considerations

1. **Additional Outputs**: Any new PDF or printable reports should follow this pattern
2. **Mobile Apps**: Future mobile app branding should respect these same rules
3. **API Responses**: External API consumers should receive subscription-appropriate branding
4. **Audit Trail**: Consider logging branding enforcement for compliance tracking

## Summary

The subscription-tiered branding enforcement is now fully implemented across all major output formats (invoices, reports, emails) without requiring any database schema changes. The system automatically detects subscription levels and applies appropriate branding, ensuring that premium branding features are properly monetized while maintaining a professional appearance for all users.
