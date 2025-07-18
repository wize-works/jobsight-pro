# API Migration Guidance - Production-Ready Implementation Standards

## Overview

This document establishes the standard implementation pattern for migrating from client-side actions to production-ready API endpoints. This approach ensures proper authentication, security, and scalability while maintaining clean separation of concerns.

## Architecture Pattern

### 1. Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                          │
│  React Components using hooks for state management         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Hook Layer                               │
│  React hooks wrapping API utilities with state management  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                Client API Layer                             │
│  Fetch utilities calling server-side API endpoints         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                Server API Layer                             │
│  Next.js API routes with authentication & business logic   │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 Critical Authentication Pattern

**⚠️ LESSONS LEARNED: Business ID Retrieval**

During the crews API migration, we discovered that the proper authentication pattern requires retrieving the business ID from the database, not from user metadata. This ensures consistency and security.

#### ✅ CORRECT Pattern:
```typescript
// Get user's business ID from database
const { data: userData, error: userError } = await supabase
    .from('users')
    .select('business_id')
    .eq('auth_id', user.id)
    .single();

if (userError || !userData?.business_id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
}

const businessId = userData.business_id;
```

#### ❌ INCORRECT Pattern (Don't Use):
```typescript
// Don't use publicMetadata - inconsistent and unreliable
const businessId = user.publicMetadata?.businessId;
```

### 1.3 Hook Method Naming Convention

**⚠️ STANDARDIZATION: Hook Method Names**

All React hooks should use consistent method naming for better developer experience and code maintainability.

#### ✅ CORRECT Hook Method Names:
```typescript
// Primary data fetching methods - ALWAYS use "fetch" prefix
const { data, loading, error, fetchData } = useYourDomain();

// Specific examples:
const { crews, loading, error, fetchCrews } = useCrews();
const { projects, loading, error, fetchProjects } = useProjects();
const { dailyLogs, loading, error, fetchDailyLogs } = useDailyLogs();

// CRUD operations
const { createItem, updateItem, deleteItem } = useYourDomain();
```

#### ❌ INCORRECT Hook Method Names (Don't Use):
```typescript
// Don't use "get" prefix in hooks - that's for API methods
const { getCrews, getProjects, getDailyLogs } = useYourDomain(); // ❌ WRONG

// Don't use inconsistent names
const { refetch, refresh, reload } = useYourDomain(); // ❌ WRONG

// Don't use mixed naming conventions
const { getItems, fetchOtherItems } = useYourDomain(); // ❌ WRONG
```

#### Hook Method Conventions:
- **Primary fetch**: `fetchItems` (e.g., `fetchCrews`, `fetchProjects`) - **REQUIRED**
- **Single item**: `getItem` (e.g., `getCrew`, `getProject`) - Exception for single items
- **Create**: `createItem` (e.g., `createCrew`, `createProject`)
- **Update**: `updateItem` (e.g., `updateCrew`, `updateProject`)
- **Delete**: `deleteItem` (e.g., `deleteCrew`, `deleteProject`)
- **Refresh**: `refreshItems` (e.g., `refreshCrews`, `refreshProjects`)

#### Why `fetch` for Primary Methods?
1. **Semantic clarity**: `fetchCrews()` clearly indicates an async operation
2. **React conventions**: Most React hooks use `fetch` for data retrieval
3. **API distinction**: API methods use `get`, hooks use `fetch`
4. **Consistency**: All primary data retrieval methods follow same pattern

### 1.4 API vs Hook Method Distinction

**⚠️ CRITICAL: API Methods vs Hook Methods**

There must be a clear distinction between API layer methods and hook layer methods.

#### API Methods (lib/api): Use `get` prefix
```typescript
// src/lib/api/crews.ts
export const crewsApi = {
  getCrews: async () => {}, // API method - uses "get"
  getCrew: async (id) => {}, // API method - uses "get"
  createCrew: async (data) => {}, // API method
  updateCrew: async (id, data) => {}, // API method
  deleteCrew: async (id) => {}, // API method
};
```

#### Hook Methods (hooks): Use `fetch` prefix for primary operations
```typescript
// src/hooks/useCrews.ts
export const useCrews = () => ({
  fetchCrews: async () => {}, // Hook method - uses "fetch"
  getCrew: async (id) => {}, // Hook method - exception for single items
  createCrew: async (data) => {}, // Hook method
  updateCrew: async (id, data) => {}, // Hook method
  deleteCrew: async (id) => {}, // Hook method
});
```

#### Migration Rule:
```typescript
// When migrating from actions to hooks:

// ❌ OLD ACTION PATTERN:
export async function getCrews(businessId: string) { ... }

// ✅ NEW API PATTERN:
export const crewsApi = {
  getCrews: async (params) => { ... } // API layer
};

// ✅ NEW HOOK PATTERN:
export const useCrews = () => ({
  fetchCrews: async (params) => { ... } // Hook layer
});
```

### 1.5 Response Format Standardization

**⚠️ LESSONS LEARNED: Consistent Response Format**

All API endpoints must return a consistent response format that client utilities can rely on.

#### ✅ CORRECT Response Format:
```typescript
// Success response
return NextResponse.json({ success: true, data: result });

// Error response
return NextResponse.json({ error: 'Error message' }, { status: 400 });
```

#### ❌ INCORRECT Response Format (Don't Use):
```typescript
// Don't return raw data without wrapper
return NextResponse.json(result);

// Don't use inconsistent error format
return NextResponse.json({ message: 'Error' }, { status: 400 });
```

### 2. Next.js 15 Dynamic Route Parameters

**⚠️ CRITICAL: Next.js 15 Breaking Change**

In Next.js 15, dynamic route parameters are now Promise objects and must be awaited. This affects all API routes with dynamic segments like `[id]`, `[slug]`, etc.

#### Required Pattern:
```typescript
// ✅ CORRECT - Next.js 15 Pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await the params Promise
  // ... rest of implementation
}

// ❌ INCORRECT - Next.js 14 Pattern (will cause build errors)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id; // This will fail in Next.js 15
  // ... rest of implementation
}
```

#### Multiple Parameters:
```typescript
// For routes like /api/clients/[id]/contacts/[contactId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  // ... rest of implementation
}
```

#### All HTTP Methods Must Follow This Pattern:
```typescript
// GET, POST, PUT, DELETE, PATCH - all must await params
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... rest of implementation
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... rest of implementation
}
```

### 3. File Structure Standard

```
src/
├── app/
│   └── api/                           # Server-side API endpoints
│       ├── crew-members/
│       │   └── route.ts               # GET /api/crew-members
│       ├── equipment/
│       │   └── route.ts               # GET /api/equipment
│       └── rates/
│           ├── crew-members/
│           │   └── route.ts           # POST/GET /api/rates/crew-members
│           ├── equipment/
│           │   └── route.ts           # POST/GET /api/rates/equipment
│           └── business/
│               └── route.ts           # POST/GET /api/rates/business
├── lib/
│   └── api/                           # Client-side API utilities
│       ├── business-data.ts           # Crew members & equipment API calls
│       └── rate-management.ts         # Rate management API calls
├── hooks/
│   ├── useBusinessData.ts             # Hook for crew members & equipment
│   └── useRateManagement.ts           # Hook for rate management
└── types/
    ├── crew-members.ts                # TypeScript interfaces
    └── equipment.ts                   # TypeScript interfaces
```

## Implementation Standards

### 1. Server-Side API Endpoints (`/src/app/api/`)

#### Template Structure:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { YourType } from '@/types/your-type';

// Helper function for business validation
async function validateBusinessAccess(userId: string, businessId: string): Promise<boolean> {
  const supabase = createServerClient();
  
  if (!supabase) {
    return false;
  }
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('business_id')
    .eq('auth_id', userId)
    .single();

  if (userError || !userData) {
    return false;
  }

  return userData.business_id === businessId;
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const id = searchParams.get('id'); // Optional for getById

    if (!businessId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: businessId' 
      }, { status: 400 });
    }

    // Validate business access
    const hasAccess = await validateBusinessAccess(user.id, businessId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to business' }, { status: 403 });
    }

    const supabase = createServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Implementation logic here
    
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('Error in API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Similar structure for POST operations
}
```

#### Key Requirements:
- **Authentication**: Always use `currentUser()` from Clerk
- **Business Validation**: Validate user has access to the business
- **Error Handling**: Proper HTTP status codes and error messages
- **Type Safety**: Import and use TypeScript interfaces
- **Database Safety**: Check for null supabase client
- **Logging**: Log errors for debugging
- **Consistent Response Format**: `{ success: boolean, data?: any, error?: string }`

### 2. Client-Side API Utilities (`/src/lib/api/`)

#### Template Structure:
```typescript
import { YourType } from '@/types/your-type';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const yourDomainApi = {
  /**
   * Get all records for a business
   */
  async getAll(businessId: string): Promise<YourType[]> {
    const response = await fetch(`/api/your-domain?businessId=${businessId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch records');
    }

    const result: ApiResponse<YourType[]> = await response.json();
    return result.data;
  },

  /**
   * Get record by ID
   */
  async getById(recordId: string, businessId: string): Promise<YourType> {
    const response = await fetch(`/api/your-domain?businessId=${businessId}&id=${recordId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch record');
    }

    const result: ApiResponse<YourType> = await response.json();
    return result.data;
  },

  /**
   * Create or update record
   */
  async update(request: YourUpdateRequest): Promise<YourType> {
    const response = await fetch('/api/your-domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update record');
    }

    const result: ApiResponse<YourType> = await response.json();
    return result.data;
  },
};
```

#### Key Requirements:
- **Error Handling**: Parse API errors and throw with meaningful messages
- **Type Safety**: Use TypeScript interfaces for all inputs/outputs
- **Consistent Interface**: Standard method names (getAll, getById, update, etc.)
- **Async/Await**: Use modern async patterns
- **Fetch API**: Use native fetch for HTTP requests

### 3. React Hooks (`/src/hooks/`)

#### Template Structure:
```typescript
import { useState, useCallback } from 'react';
import { YourType } from '@/types/your-type';
import { yourDomainApi, YourUpdateRequest } from '@/lib/api/your-domain';

interface UseYourDomainResult {
  isLoading: boolean;
  error: string | null;
  getAll: (businessId: string) => Promise<YourType[]>;
  getById: (recordId: string, businessId: string) => Promise<YourType>;
  update: (request: YourUpdateRequest) => Promise<YourType>;
  clearError: () => void;
}

export const useYourDomain = (): UseYourDomainResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAll = useCallback(async (businessId: string): Promise<YourType[]> => {
    return handleApiCall(() => yourDomainApi.getAll(businessId));
  }, [handleApiCall]);

  const getById = useCallback(async (recordId: string, businessId: string): Promise<YourType> => {
    return handleApiCall(() => yourDomainApi.getById(recordId, businessId));
  }, [handleApiCall]);

  const update = useCallback(async (request: YourUpdateRequest): Promise<YourType> => {
    return handleApiCall(() => yourDomainApi.update(request));
  }, [handleApiCall]);

  return {
    isLoading,
    error,
    getAll,
    getById,
    update,
    clearError,
  };
};
```

#### Key Requirements:
- **Loading States**: Track loading state for UI feedback
- **Error Handling**: Centralized error handling and state management
- **Memoization**: Use useCallback for performance optimization
- **Consistent Interface**: Standard method signatures
- **Error Recovery**: Provide clearError functionality

## Migration Process

### Step 1: Identify Current Actions
1. **Client Actions**: Files in `/src/app/actions/client/`
2. **Server Actions**: Files in `/src/app/actions/` (server-side)
3. **Component Usage**: Search for imports and usage

### Step 2: Create API Endpoints
1. **Create Route Files**: `/src/app/api/[domain]/route.ts`
2. **Implement Authentication**: Clerk server-side auth
3. **Add Business Validation**: Ensure user access to business
4. **Add Error Handling**: Proper HTTP status codes
5. **Test Endpoints**: Verify authentication and responses

### Step 3: Create Client Utilities
1. **Create API File**: `/src/lib/api/[domain].ts`
2. **Implement Methods**: getAll, getById, update, etc.
3. **Add Error Handling**: Parse API errors
4. **Type Safety**: Use TypeScript interfaces

### Step 4: Create React Hook
1. **Create Hook File**: `/src/hooks/use[Domain].ts`
2. **Wrap API Calls**: Add loading states and error handling
3. **Optimize Performance**: Use useCallback and memoization

### Step 5: Update Components
1. **Replace Imports**: Switch from actions to hooks
2. **Update Usage**: Use new hook interface
3. **Handle Loading States**: Show loading indicators
4. **Handle Errors**: Display error messages to users

### Step 6: Test and Validate
1. **Authentication Testing**: Verify user access controls
2. **Business Isolation**: Test cross-business access prevention
3. **Error Scenarios**: Test network failures and edge cases
4. **Performance**: Verify no unnecessary re-renders

## Security Considerations

### Authentication
- **Always** use Clerk's `currentUser()` in API routes
- **Never** trust client-side user data
- **Validate** business access on every API call

### Business Isolation
- **Filter** all database queries by business_id
- **Validate** user belongs to the business
- **Prevent** cross-business data access

### Error Handling
- **Don't** expose sensitive information in error messages
- **Log** errors server-side for debugging
- **Return** generic error messages to client

## Performance Optimization

### Caching Strategy
- **Consider** React Query or SWR for client-side caching
- **Implement** stale-while-revalidate patterns
- **Use** proper cache headers in API responses

### Database Optimization
- **Add** proper indexes on business_id columns
- **Use** select() to limit returned fields
- **Implement** pagination for large datasets

### Bundle Size
- **Import** only necessary functions
- **Use** tree-shaking friendly exports
- **Minimize** client-side API utility size

## Testing Strategy

### Unit Tests
- **Test** API endpoints with authentication mocks
- **Test** client utilities with fetch mocks
- **Test** hooks with React Testing Library

### Integration Tests
- **Test** full authentication flow
- **Test** business isolation
- **Test** error handling scenarios

### E2E Tests
- **Test** complete user workflows
- **Test** cross-browser compatibility
- **Test** mobile responsiveness

## Examples of Successful Migrations

### 1. Rate Management System
- **From**: `/src/app/actions/client/rate-management.ts`
- **To**: 
  - `/src/app/api/rates/crew-members/route.ts`
  - `/src/app/api/rates/equipment/route.ts`
  - `/src/app/api/rates/business/route.ts`
  - `/src/lib/api/rate-management.ts`
  - `/src/hooks/useRateManagement.ts`

### 2. Business Data System
- **From**: `/src/app/actions/crew-members.ts`, `/src/app/actions/equipments.ts`
- **To**:
  - `/src/app/api/crew-members/route.ts`
  - `/src/app/api/equipment/route.ts`
  - `/src/lib/api/business-data.ts`
  - `/src/hooks/useBusinessData.ts`

### 3. Project Management System
- **From**: `/src/app/actions/projects.ts`
- **To**:
  - `/src/app/api/projects/route.ts`
  - `/src/app/api/projects/[id]/route.ts`
  - `/src/app/api/projects/client/[clientId]/route.ts`
  - `/src/app/api/projects/profitability/route.ts`
  - `/src/app/api/project-milestones/route.ts`
  - `/src/app/api/project-milestones/[id]/route.ts`
  - `/src/app/api/project-issues/route.ts`
  - `/src/app/api/project-issues/[id]/route.ts`
  - `/src/app/api/project-crews/route.ts`
  - `/src/app/api/project-crews/[id]/route.ts`
  - `/src/lib/api/projects.ts`
  - `/src/hooks/useProjects.ts`

### 4. Push Subscriptions System
- **From**: `/src/app/actions/push-subscriptions.ts`
- **To**:
  - `/src/app/api/push-subscriptions/route.ts`
  - `/src/app/api/push-subscriptions/[id]/route.ts`
  - `/src/app/api/push-subscriptions/endpoint/route.ts`
  - `/src/app/api/push-subscriptions/[id]/last-used/route.ts`
  - `/src/lib/api/push-subscriptions.ts`
  - `/src/hooks/usePushSubscriptions.ts`

### 5. PDF Generation System
- **From**: Server actions for PDF generation
- **To**:
  - `/src/app/api/pdf-generation/route.ts`
  - `/src/lib/api/pdf-generation.ts`
  - `/src/hooks/usePdfGeneration.ts`

## Migration Checklist

### Pre-Migration
- [ ] Identify all current action files
- [ ] Map component usage
- [ ] Define API endpoints needed
- [ ] Plan data flow architecture
- [ ] **⚠️ Next.js 15**: Review all dynamic routes for params Promise requirement

### During Migration
- [ ] Create API endpoints with authentication
- [ ] **⚠️ Next.js 15**: Ensure all dynamic routes await params Promise
- [ ] Implement business validation
- [ ] Add comprehensive error handling
- [ ] Create client-side utilities (API methods use `get` prefix)
- [ ] Build React hooks (Hook methods use `fetch` prefix for primary operations)
- [ ] **⚠️ Hook Naming**: Ensure hooks use `fetchItems` not `getItems` for primary methods
- [ ] Update component usage
- [ ] Test authentication flows
- [ ] Validate business isolation
- [ ] **⚠️ Next.js 15**: Test build after each dynamic route creation

### Post-Migration
- [ ] Remove old action files
- [ ] Update all imports
- [ ] **⚠️ Next.js 15**: Run full build to check for params Promise errors
- [ ] Run full test suite
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation updates

## Common Pitfalls to Avoid

1. **Skipping Authentication**: Always implement proper auth in API routes
2. **Missing Business Validation**: Users should only access their business data
3. **Poor Error Handling**: Provide meaningful error messages
4. **Client-Side Logic**: Keep business logic on the server
5. **Inconsistent Interfaces**: Use standard method names and signatures
6. **Missing Type Safety**: Use TypeScript throughout the stack
7. **Performance Issues**: Implement proper loading states and caching
8. **Security Gaps**: Validate all inputs and sanitize outputs
9. **⚠️ Next.js 15 Params Error**: NOT awaiting params in dynamic routes will cause build failures
10. **⚠️ Hook Naming Error**: Using `getItems` instead of `fetchItems` in hooks causes confusion

### Critical Next.js 15 Pitfall: Dynamic Route Parameters

**THE MOST COMMON ERROR** in Next.js 15 migration is forgetting to await dynamic route parameters.

#### ❌ This Will Cause Build Failures:
```typescript
// This pattern causes TypeScript compilation errors in Next.js 15
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id; // ❌ FAILS - params is now a Promise
  // ... rest of implementation
}
```

#### ✅ Correct Pattern:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ WORKS - await the Promise
  // ... rest of implementation
}
```

#### Build Error You'll See:
```
Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]
```

**This affects ALL dynamic routes**: `[id]`, `[slug]`, `[...path]`, etc.
**This affects ALL HTTP methods**: GET, POST, PUT, DELETE, PATCH
**This will prevent your application from building** until fixed

## Next Steps

This migration pattern should be applied to all remaining action files in the codebase:

### High Priority
- [ ] Project management actions
- [ ] Client management actions
- [ ] Time tracking actions
- [ ] Invoice generation actions

### Medium Priority
- [ ] User management actions
- [ ] Notification actions
- [ ] Report generation actions

### Low Priority
- [ ] Settings actions
- [ ] Backup/restore actions
- [ ] Analytics actions

## Next.js 15 Migration Quick Reference

### Search and Replace Pattern for Existing Routes

When updating existing API routes for Next.js 15, use these patterns:

#### Single Parameter Routes:
```typescript
// Search for this pattern:
{ params }: { params: { id: string } }

// Replace with:
{ params }: { params: Promise<{ id: string }> }

// Then add after auth check:
const { id } = await params;
```

#### Multiple Parameter Routes:
```typescript
// Search for this pattern:
{ params }: { params: { id: string; contactId: string } }

// Replace with:
{ params }: { params: Promise<{ id: string; contactId: string }> }

// Then add after auth check:
const { id, contactId } = await params;
```

### Quick Fix Commands

#### Find all API routes that need updating:
```bash
# Find all route files with dynamic parameters
find src/app/api -name "route.ts" -path "*/[*]/*" | xargs grep -l "params:"

# Find specific parameter patterns that need updating
grep -r "params: { " src/app/api/ --include="*.ts"
```

#### Test Build After Changes:
```bash
npm run build
```

### Common Routes That Need Updates:
- `/api/clients/[id]/route.ts`
- `/api/clients/[id]/contacts/route.ts`
- `/api/clients/[id]/contacts/[contactId]/route.ts`
- `/api/clients/[id]/interactions/route.ts`
- `/api/clients/[id]/interactions/[interactionId]/route.ts`
- `/api/crews/[id]/route.ts`
- `/api/crews/[id]/members/route.ts`
- `/api/crews/[id]/members/[memberId]/route.ts`
- `/api/crews/[id]/assignments/route.ts`
- `/api/crews/[id]/assignments/[assignmentId]/route.ts`
- `/api/daily-logs/[id]/route.ts`
- `/api/daily-logs/[id]/materials/route.ts`
- `/api/daily-logs/[id]/materials/[materialId]/route.ts`
- `/api/daily-logs/[id]/equipment/route.ts`
- `/api/daily-logs/[id]/equipment/[equipmentId]/route.ts`

### Verification Steps:
1. **Build Test**: Run `npm run build` after each route update
2. **Type Check**: Ensure no TypeScript errors
3. **Runtime Test**: Test API endpoints manually
4. **Integration Test**: Verify UI components still work

Following this standard ensures a consistent, secure, and maintainable API architecture that supports both current web functionality and future mobile applications, while being fully compatible with Next.js 15's new parameter handling requirements.
