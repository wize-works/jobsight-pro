# Client Actions Development Guide

This guide provides comprehensive standards and patterns for creating consistent, maintainable client actions in the JobSight Pro Next.js application.

## Overview

Client actions are the interface between your React components and the offline-first data layer. They handle authentication, authorization, caching, sync queueing, and provide consistent error handling across the application.

## Core Principles

### 1. **Offline-First Architecture**
- All client actions must work offline using IndexedDB via Dexie
- Queue operations for sync when online
- Cache-first data retrieval with server sync for fresh data

### 2. **Standardized Response Types**
- All client actions MUST return standardized response objects
- Never return raw data arrays or objects directly
- Use the response types defined in `/src/types/client-actions.ts`

### 3. **Business-Level Security**
- All operations are scoped to a specific business
- Validate user access to business resources
- Use `auth_id` (from authentication provider) consistently

### 4. **Consistent Error Handling**
- Use standardized error types and messages
- Provide meaningful error information for debugging
- Handle offline/online state gracefully

## File Structure and Naming

### File Location
```
src/app/actions/client/
├── business.ts       # Business management actions
├── users.ts          # User management actions
├── projects.ts       # Project management actions
├── equipment.ts      # Equipment management actions
├── invoices.ts       # Invoice management actions
├── daily-logs.ts     # Daily log actions
└── subscriptions.ts  # Subscription actions
```

### Function Naming Conventions
- **Get single item**: `getBusinessById`, `getUserById`, `getProjectById`
- **Get list**: `getUsers`, `getProjects`, `getEquipment`
- **Create**: `createBusiness`, `createUser`, `createProject`
- **Update**: `updateBusiness`, `updateUser`, `updateProject`
- **Delete**: `deleteBusiness`, `deleteUser`, `deleteProject`
- **Search**: `searchUsers`, `searchProjects`, `searchEquipment`
- **Filter**: `getUsersByRole`, `getProjectsByStatus`

## Required Imports

Every client action file must include these imports:

```typescript
"use client";

import { 
  ListResponse, 
  GetResponse, 
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  ClientActionErrorType,
  createListSuccessResponse,
  createListErrorResponse,
  createSuccessResponse,
  createErrorResponse
} from "@/types/client-actions";

// Entity-specific types
import { User, UserInsert, UserUpdate } from "@/types/users";

// Offline database manager
import { db } from "@/lib/offline/dexie-db";

// Auth utilities
import { initializeAuthState } from "./business";

// UUID generation
import { v4 as uuidv4 } from "uuid";
```

## Standardized Response Types

### For List Operations (getUsers, getProjects, etc.)
```typescript
export async function getUsers(businessId: string): Promise<ListResponse<User>> {
  try {
    // ... implementation
    return createListSuccessResponse(users, totalCount, hasMore);
  } catch (error) {
    return createListErrorResponse(
      "Failed to get users",
      ClientActionErrorType.UNKNOWN_ERROR
    );
  }
}
```

### For Single Item Operations (getUserById, getProjectById, etc.)
```typescript
export async function getUserById(businessId: string, userId: string): Promise<GetResponse<User>> {
  try {
    // ... implementation
    return createSuccessResponse(user);
  } catch (error) {
    return createErrorResponse(
      "User not found",
      ClientActionErrorType.NOT_FOUND
    );
  }
}
```

### For Create Operations
```typescript
export async function createUser(businessId: string, userData: UserInsert): Promise<CreateResponse<User>> {
  try {
    // ... implementation
    return createSuccessResponse(newUser);
  } catch (error) {
    return createErrorResponse(
      "Failed to create user",
      ClientActionErrorType.VALIDATION_ERROR
    );
  }
}
```

### For Update Operations
```typescript
export async function updateUser(businessId: string, userId: string, userData: UserUpdate): Promise<UpdateResponse<User>> {
  try {
    // ... implementation
    return createSuccessResponse(updatedUser);
  } catch (error) {
    return createErrorResponse(
      "Failed to update user",
      ClientActionErrorType.UNKNOWN_ERROR
    );
  }
}
```

### For Delete Operations
```typescript
export async function deleteUser(businessId: string, userId: string): Promise<DeleteResponse> {
  try {
    // ... implementation
    return createSuccessResponse();
  } catch (error) {
    return createErrorResponse(
      "Failed to delete user",
      ClientActionErrorType.UNKNOWN_ERROR
    );
  }
}
```

## Standard Error Types

Use these error types consistently:

```typescript
enum ClientActionErrorType {
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

## Required Utility Functions

Every client action file should include these utility functions:

### 1. Online Status Check
```typescript
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}
```

### 2. Get Current User ID
```typescript
async function getCurrentUserId(): Promise<string | null> {
  // First priority: Use initialized Clerk user state
  if (authStateInitialized && currentClerkUser?.id) {
    return currentClerkUser.id;
  }

  // Second priority: Get from cached auth_id
  if (typeof window !== 'undefined') {
    const cachedAuthId = window.localStorage.getItem('cached_auth_id');
    if (cachedAuthId) {
      return cachedAuthId;
    }
  }

  console.warn('No authenticated user found. Ensure initializeAuthState() is called.');
  return null;
}
```

### 3. Business Access Validation
```typescript
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
  try {
    // Check user-business mapping
    const userBusinessId = await db.userBusinessMappings.get(userAuthId);
    if (userBusinessId?.businessId === businessId) {
      return true;
    }

    // Check business ownership
    const business = await db.businesses.get(businessId);
    if (business && business.owner_id === userAuthId) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error validating user business access:", error);
    return false;
  }
}
```

## Offline Manager Pattern

Each entity should have an offline manager class:

```typescript
export class EntityOfflineManager {
  // Basic CRUD operations
  static async addEntity(entity: Entity): Promise<void> {
    await db.entities.put(entity);
  }

  static async getEntityById(entityId: string): Promise<Entity | undefined> {
    return await db.entities.get(entityId);
  }

  static async getEntitiesForBusiness(businessId: string): Promise<Entity[]> {
    return await db.entities.where('business_id').equals(businessId).toArray();
  }

  static async updateEntity(entityId: string, data: Partial<Entity>): Promise<void> {
    await db.entities.update(entityId, data);
  }

  static async deleteEntity(entityId: string): Promise<void> {
    await db.entities.delete(entityId);
  }

  // Sync queue management
  static async addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    entityId: string,
    businessId: string,
    userId?: string
  ): Promise<void> {
    const syncItem = {
      id: uuidv4(),
      table,
      operation,
      data,
      entityId,
      businessId,
      userId,
      timestamp: Date.now(),
      retryCount: 0,
      synced: false
    };
    await db.syncQueue.add(syncItem);
  }

  // Sync metadata management
  static async updateSyncMetadata(entityId: string, table: string, businessId?: string): Promise<void> {
    const key = businessId ? `${table}_${businessId}` : `${table}_${entityId}`;
    await db.syncMetadata.put({
      key,
      lastSync: Date.now(),
      table,
      entityId: businessId || entityId
    });
  }

  static async hasFreshData(entityId: string, table: string, maxAgeMinutes: number = 5): Promise<boolean> {
    const key = `${table}_${entityId}`;
    const metadata = await db.syncMetadata.get(key);
    if (!metadata) return false;
    
    const maxAge = maxAgeMinutes * 60 * 1000;
    return (Date.now() - metadata.lastSync) < maxAge;
  }
}
```

## Standard Action Implementation Pattern

### 1. GET List Actions
```typescript
export async function getEntities(businessId: string): Promise<ListResponse<Entity>> {
  try {
    // 1. Authentication check
    const currentUserAuthId = await getCurrentUserId();
    if (!currentUserAuthId) {
      return createListErrorResponse(
        "Authentication required",
        ClientActionErrorType.AUTHENTICATION_REQUIRED
      );
    }

    // 2. Business access validation
    const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
    if (!hasAccess) {
      return createListErrorResponse(
        "Access denied to this business",
        ClientActionErrorType.ACCESS_DENIED
      );
    }

    // 3. Try local cache first
    const cachedEntities = await EntityOfflineManager.getEntitiesForBusiness(businessId);

    // 4. Check if data is fresh
    const hasFreshData = await EntityOfflineManager.hasFreshData(businessId, 'entities');

    if (cachedEntities.length > 0 && (hasFreshData || !isOnline())) {
      return createListSuccessResponse(cachedEntities);
    }

    // 5. Fetch from server if online
    if (isOnline()) {
      try {
        const response = await fetch(`/api/entities/business/${businessId}`);
        if (response.ok) {
          const entities = await response.json();
          if (entities && Array.isArray(entities)) {
            // Store in local cache
            for (const entity of entities) {
              await EntityOfflineManager.addEntity(entity);
            }
            // Update sync metadata
            await EntityOfflineManager.updateSyncMetadata(businessId, 'entities', businessId);
            return createListSuccessResponse(entities);
          }
        }
      } catch (error) {
        console.error("Failed to fetch entities from server:", error);
      }
    }

    // 6. Return cached data even if stale
    return createListSuccessResponse(cachedEntities);
  } catch (error) {
    console.error("Error in getEntities:", error);
    return createListErrorResponse(
      error instanceof Error ? error.message : "Failed to get entities",
      ClientActionErrorType.UNKNOWN_ERROR
    );
  }
}
```

### 2. CREATE Actions
```typescript
export async function createEntity(
  businessId: string,
  entityData: EntityInsert
): Promise<CreateResponse<Entity>> {
  try {
    // 1. Authentication check
    const currentUserAuthId = await getCurrentUserId();
    if (!currentUserAuthId) {
      return createErrorResponse(
        "Authentication required",
        ClientActionErrorType.AUTHENTICATION_REQUIRED
      );
    }

    // 2. Business access validation
    const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
    if (!hasAccess) {
      return createErrorResponse(
        "Access denied to this business",
        ClientActionErrorType.ACCESS_DENIED
      );
    }

    // 3. Create entity object
    const entityId = uuidv4();
    const now = new Date().toISOString();

    const newEntity = {
      id: entityId,
      business_id: businessId,
      ...entityData,
      created_at: now,
      updated_at: now,
      created_by: currentUserAuthId,
      updated_by: currentUserAuthId,
    } as Entity;

    // 4. Store locally (optimistic update)
    await EntityOfflineManager.addEntity(newEntity);

    // 5. Queue for server sync
    await EntityOfflineManager.addToSyncQueue(
      'entities',
      'insert',
      newEntity,
      entityId,
      businessId,
      currentUserAuthId
    );

    // 6. Try immediate sync if online
    if (isOnline()) {
      console.log('Online - entity creation queued for sync');
    }

    return createSuccessResponse(newEntity);
  } catch (error) {
    console.error("Error in createEntity:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to create entity",
      ClientActionErrorType.UNKNOWN_ERROR
    );
  }
}
```

### 3. UPDATE Actions
```typescript
export async function updateEntity(
  businessId: string,
  entityId: string,
  entityData: EntityUpdate
): Promise<UpdateResponse<Entity>> {
  try {
    // 1. Authentication check
    const currentUserAuthId = await getCurrentUserId();
    if (!currentUserAuthId) {
      return createErrorResponse(
        "Authentication required",
        ClientActionErrorType.AUTHENTICATION_REQUIRED
      );
    }

    // 2. Business access validation
    const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
    if (!hasAccess) {
      return createErrorResponse(
        "Access denied to this business",
        ClientActionErrorType.ACCESS_DENIED
      );
    }

    // 3. Check if entity exists
    const existingEntity = await EntityOfflineManager.getEntityById(entityId);
    if (!existingEntity || existingEntity.business_id !== businessId) {
      return createErrorResponse(
        "Entity not found",
        ClientActionErrorType.NOT_FOUND
      );
    }

    // 4. Prepare update data
    const now = new Date().toISOString();
    const updateData = {
      ...entityData,
      updated_at: now,
      updated_by: currentUserAuthId,
    };

    // 5. Update locally (optimistic update)
    await EntityOfflineManager.updateEntity(entityId, updateData);

    // 6. Queue for server sync
    await EntityOfflineManager.addToSyncQueue(
      'entities',
      'update',
      { id: entityId, ...updateData },
      entityId,
      businessId,
      currentUserAuthId
    );

    // 7. Get updated entity to return
    const updatedEntity = await EntityOfflineManager.getEntityById(entityId);

    return createSuccessResponse(updatedEntity);
  } catch (error) {
    console.error("Error in updateEntity:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to update entity",
      ClientActionErrorType.UNKNOWN_ERROR
    );
  }
}
```

### 4. DELETE Actions
```typescript
export async function deleteEntity(
  businessId: string,
  entityId: string
): Promise<DeleteResponse> {
  try {
    // 1. Authentication check
    const currentUserAuthId = await getCurrentUserId();
    if (!currentUserAuthId) {
      return createErrorResponse(
        "Authentication required",
        ClientActionErrorType.AUTHENTICATION_REQUIRED
      );
    }

    // 2. Business access validation
    const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
    if (!hasAccess) {
      return createErrorResponse(
        "Access denied to this business",
        ClientActionErrorType.ACCESS_DENIED
      );
    }

    // 3. Check if entity exists
    const existingEntity = await EntityOfflineManager.getEntityById(entityId);
    if (!existingEntity || existingEntity.business_id !== businessId) {
      return createErrorResponse(
        "Entity not found",
        ClientActionErrorType.NOT_FOUND
      );
    }

    // 4. Delete locally (optimistic update)
    await EntityOfflineManager.deleteEntity(entityId);

    // 5. Queue for server sync
    await EntityOfflineManager.addToSyncQueue(
      'entities',
      'delete',
      { id: entityId },
      entityId,
      businessId,
      currentUserAuthId
    );

    return createSuccessResponse();
  } catch (error) {
    console.error("Error in deleteEntity:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to delete entity",
      ClientActionErrorType.UNKNOWN_ERROR
    );
  }
}
```

## Authentication Handling

### User ID Convention
- Always use `auth_id` from the authentication provider (Clerk, Auth0, etc.)
- Never use internal database user IDs in client actions
- This ensures optimal performance and security

### Authentication State Management
```typescript
// At the top of each file, declare global auth state
declare let currentClerkUser: { id: string } | null;
declare let authStateInitialized: boolean;
```

## Documentation Requirements

### Function Documentation
Every action function must include JSDoc comments:

```typescript
/**
 * Get all users for a business - Cache-first implementation with authorization
 * @param businessId - The business ID to get users for
 * @returns Promise<ListResponse<User>> - Standardized response with users array
 * 
 * @example
 * const result = await getUsers(businessId);
 * if (result.success) {
 *   console.log('Users:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export async function getUsers(businessId: string): Promise<ListResponse<User>> {
  // Implementation
}
```

### File Header Documentation
```typescript
"use client";

/**
 * Users Client Actions - Offline-First Implementation
 * 
 * This file contains all client-side actions for user management operations.
 * All functions follow the offline-first pattern with cache-first data retrieval,
 * optimistic updates, and sync queue management.
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 * 
 * @author JobSight Pro Team
 * @version 1.0.0
 */
```

## Testing Guidelines

### Unit Tests
Create tests for each action function:

```typescript
describe('getUsers', () => {
  it('should return users for valid business ID', async () => {
    const result = await getUsers('valid-business-id');
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should return error for invalid business ID', async () => {
    const result = await getUsers('invalid-business-id');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests
Test the complete offline-first flow:

```typescript
describe('User CRUD Operations', () => {
  it('should create, read, update, and delete users offline', async () => {
    // Test create
    const createResult = await createUser(businessId, userData);
    expect(createResult.success).toBe(true);

    // Test read
    const readResult = await getUsers(businessId);
    expect(readResult.success).toBe(true);

    // Test update
    const updateResult = await updateUser(businessId, userId, updateData);
    expect(updateResult.success).toBe(true);

    // Test delete
    const deleteResult = await deleteUser(businessId, userId);
    expect(deleteResult.success).toBe(true);
  });
});
```

## Performance Considerations

### Caching Strategy
- Cache data for 5 minutes by default
- Use stale data when offline
- Implement progressive enhancement for online state

### Batch Operations
- Use batch operations for multiple entities when possible
- Implement bulk sync operations for efficiency

### Memory Management
- Clean up old cached data periodically
- Implement data size limits for IndexedDB

## Security Best Practices

### Data Validation
- Validate all input data before processing
- Sanitize user inputs to prevent injection attacks
- Implement proper type checking

### Access Control
- Always validate business access before operations
- Implement role-based permissions where needed
- Log security-related events

### Error Handling
- Never expose sensitive information in error messages
- Log detailed errors for debugging but return generic errors to clients
- Implement proper error boundaries

## Migration Guidelines

When updating existing client actions:

1. **Backup existing functionality**: Ensure current behavior is preserved
2. **Update return types**: Change to standardized response objects
3. **Update consumers**: Modify all calling components to handle new response format
4. **Add proper error handling**: Implement comprehensive error handling
5. **Test thoroughly**: Verify offline and online functionality
6. **Document changes**: Update documentation and add migration notes

## Common Pitfalls to Avoid

1. **Returning raw data**: Always use standardized response objects
2. **Inconsistent error handling**: Use standardized error types
3. **Ignoring offline state**: Always handle offline scenarios
4. **Missing validation**: Always validate business access
5. **Poor error messages**: Provide meaningful error information
6. **Forgetting sync queue**: Always queue operations for sync
7. **Inconsistent auth handling**: Always use auth_id, not internal user IDs

## Checklist for New Client Actions

- [ ] File follows naming conventions
- [ ] Required imports are included
- [ ] Utility functions are implemented
- [ ] Offline manager class is created
- [ ] All functions use standardized response types
- [ ] Authentication validation is implemented
- [ ] Business access validation is implemented
- [ ] Cache-first pattern is followed
- [ ] Sync queue operations are added
- [ ] Error handling uses standardized types
- [ ] JSDoc documentation is complete
- [ ] Unit tests are written
- [ ] Integration tests are written
- [ ] Performance considerations are addressed
- [ ] Security validations are implemented

---

This guide ensures consistent, maintainable, and secure client actions across the entire application. Follow these patterns religiously to maintain code quality and developer productivity.
