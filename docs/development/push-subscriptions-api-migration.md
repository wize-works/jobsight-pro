# Push Subscriptions API Migration

## Overview
This document describes the migration of push subscription functionality from server actions to our consolidated API pattern.

## Migration Summary

### Previous Implementation
- **Server Actions**: `src/app/actions/push-subscriptions.ts`
- **Push Actions**: `src/lib/push/actions.ts`
- **Push Manager Component**: `src/components/push-manager.tsx`

### New Implementation
- **API Endpoints**: `/api/push-subscriptions/*`
- **Client Library**: `src/lib/api/push-subscriptions.ts`
- **React Hooks**: `src/hooks/usePushSubscriptions.ts`

## API Endpoints

### 1. Main Push Subscriptions Endpoint
- **GET** `/api/push-subscriptions?userId={userId}` - Get user's push subscriptions
- **POST** `/api/push-subscriptions` - Create new push subscription (with deduplication)

### 2. Individual Push Subscription
- **GET** `/api/push-subscriptions/{id}` - Get specific push subscription
- **PUT** `/api/push-subscriptions/{id}` - Update push subscription
- **DELETE** `/api/push-subscriptions/{id}` - Delete push subscription

### 3. Endpoint-Based Management
- **DELETE** `/api/push-subscriptions/endpoint?userId={userId}&endpoint={endpoint}` - Delete by endpoint

### 4. Last Used Timestamp
- **PUT** `/api/push-subscriptions/{id}/last-used` - Update last used timestamp

## Key Features

### 1. Endpoint-Based Deduplication
The API automatically handles duplicate subscriptions by endpoint:
- When creating a subscription, it checks if one already exists for the same user and endpoint
- If found, it updates the existing subscription instead of creating a duplicate

### 2. Business Isolation
All endpoints use `withBusinessServer()` to ensure proper business context and authentication.

### 3. Type Safety
Full TypeScript support with proper type definitions for all operations.

## Client Library Usage

```typescript
import { pushSubscriptionsAPI } from '@/lib/api/push-subscriptions';

// Get user's subscriptions
const subscriptions = await pushSubscriptionsAPI.getUserSubscriptions(userId);

// Create new subscription
const newSubscription = await pushSubscriptionsAPI.createSubscription({
    user_id: userId,
    endpoint: 'https://example.com/endpoint',
    p256dh: 'base64-encoded-key',
    auth: 'base64-encoded-auth',
    user_agent: navigator.userAgent,
    last_used_at: new Date().toISOString(),
    created_by: userId,
    updated_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
});

// Delete by endpoint
await pushSubscriptionsAPI.deleteByEndpoint(userId, endpoint);
```

## React Hooks Usage

```typescript
import { usePushSubscriptions, usePushSubscriptionManager } from '@/hooks/usePushSubscriptions';

// Get user's push subscriptions
const { subscriptions, loading, error, refetch } = usePushSubscriptions(userId);

// Full push subscription management with browser integration
const {
    isSupported,
    isSubscribed,
    isRegistering,
    subscriptions,
    subscribe,
    unsubscribe,
    updateLastUsed,
    refetch,
} = usePushSubscriptionManager(userId);
```

## Database Schema

The push_subscriptions table schema:

```sql
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(user_id, endpoint)
);
```

## Migration Steps

1. **API Endpoints Created**: All necessary endpoints for push subscription management
2. **Client Library**: Type-safe API client with helper functions
3. **React Hooks**: Comprehensive hooks for UI integration
4. **Browser Integration**: Enhanced hook for browser push subscription management

## Notable Changes

### 1. Removed is_active Field
The original push actions referenced an `is_active` field that wasn't in the database schema. This has been removed in favor of using the existing subscription management approach.

### 2. Enhanced Error Handling
All API endpoints and hooks include proper error handling and validation.

### 3. Unified Pattern
Follows the same migration pattern used for projects, PDF generation, and other features.

### 4. Browser Integration
The `usePushSubscriptionManager` hook provides seamless integration with browser push subscription APIs, including proper type separation between browser PushSubscription and database PushSubscription types.

## Testing

After migration, test the following scenarios:

1. **Subscription Creation**: Users can subscribe to push notifications
2. **Deduplication**: Multiple subscription attempts for the same endpoint update existing subscription
3. **Endpoint Management**: Subscriptions can be deleted by endpoint
4. **Last Used Updates**: Timestamps are properly updated when subscriptions are used
5. **Business Isolation**: Users can only access their business's push subscriptions

## Files Modified/Created

### Created:
- `src/app/api/push-subscriptions/route.ts`
- `src/app/api/push-subscriptions/[id]/route.ts`
- `src/app/api/push-subscriptions/endpoint/route.ts`
- `src/app/api/push-subscriptions/[id]/last-used/route.ts`
- `src/lib/api/push-subscriptions.ts`
- `src/hooks/usePushSubscriptions.ts`
- `docs/development/push-subscriptions-api-migration.md`

### To Be Updated:
- Components using push subscription functionality should be updated to use the new hooks
- Server actions can be deprecated once all usage is migrated

This migration provides a solid foundation for push subscription management following our established API patterns.
