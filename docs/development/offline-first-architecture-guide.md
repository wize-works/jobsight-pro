# Offline-First Architecture Guide

## Overview

This document describes JobSight Pro's offline-first architecture implementation, which ensures the application works fully offline and syncs changes when connectivity is restored. This approach prevents crashes when users lose internet connection and provides a seamless experience regardless of network conditions.

## Background & Problem

### Original Issue
- Server actions caused application crashes when offline
- No graceful degradation when network connectivity was lost
- Users couldn't continue working during network outages
- Data loss risk when operations failed due to connectivity issues

### Solution Approach
Replace all server-side actions with a client-side action layer that:
- Works entirely offline using IndexedDB for local storage
- Provides optimistic updates for immediate UI feedback
- Queues operations for background sync when online
- Handles conflict resolution and error recovery

## Architecture Overview

### Core Components

1. **Client Action Factory** (`src/lib/actions/client-action-factory.ts`)
   - Universal factory for creating offline-first CRUD operations
   - Handles IndexedDB storage, sync queuing, and error handling
   - Provides consistent API across all entity types

2. **Entity-Specific Client Actions** (`src/lib/actions/*-client.ts`)
   - Individual modules for each data entity (projects, clients, crews, etc.)
   - Use Supabase types directly from schema
   - Implement business logic and entity-specific operations

3. **Offline Storage Layer** (`src/lib/offline/storage.ts`)
   - IndexedDB utilities and helpers
   - Local database schema management
   - Data persistence and retrieval

4. **Network Status Management** (`src/hooks/use-network-status.ts`)
   - Real-time network connectivity monitoring
   - Triggers sync operations when online
   - Provides UI feedback for connectivity status

## Core Architectural Principles

### Business-Scoped Data Isolation 🔒
**Critical Security & Performance Principle**: All offline data is scoped to the user's current business only.

#### Why This Matters:
- **Security**: Prevents cross-tenant data leakage in multi-tenant architecture
- **Performance**: Dramatically reduces sync payload and IndexedDB size
- **Compliance**: Ensures data isolation for regulatory requirements
- **Mobile Optimization**: Essential for field workers with limited bandwidth

#### Implementation Pattern:
```typescript
// ✅ CORRECT: Business-scoped operations
export const getProjects = async (businessId: string): Promise<Project[]> => {
  // Only sync/cache projects for this specific business
  const result = await selectProjects({}, businessId);
  return (result.data || []).filter(p => p.business_id === businessId);
};

// ❌ INCORRECT: Cross-business data access
export const getAllProjects = async (): Promise<Project[]> => {
  // NEVER do this - security vulnerability
};
```

#### Data Scope by Entity:
- **Projects**: Only current business projects
- **Clients**: Only current business clients  
- **Users**: Only current business team members
- **Invoices**: Only current business invoices
- **Daily Logs**: Only current business logs
- **Equipment**: Only current business equipment
- **Tasks**: Only current business tasks
- **Media**: Only current business files

#### IndexedDB Structure:
```
business_123/
├── projects/
├── clients/
├── users/
├── invoices/
└── ...

business_456/
├── projects/ (completely isolated)
├── clients/
└── ...
```

## Implementation Pattern

### Type System
All client actions use Supabase-generated types directly:

```typescript
import type { Database } from "@/types/supabase";

// Extract entity types from Supabase schema
type Entity = Database['public']['Tables']['entity_name']['Row'];
type EntityInsert = Database['public']['Tables']['entity_name']['Insert'];
type EntityUpdate = Database['public']['Tables']['entity_name']['Update'];
```

### Client Action Structure
Each entity follows this standardized pattern:

```typescript
/**
 * Client-Side [Entity] Actions
 * 
 * Replaces src/app/actions/[entity].ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import { 
  createInsertAction, 
  createUpdateAction, 
  createDeleteAction, 
  createSelectAction 
} from "@/lib/actions/client-action-factory";

// Type definitions
type Entity = Database['public']['Tables']['entity_name']['Row'];
type EntityInsert = Database['public']['Tables']['entity_name']['Insert'];
type EntityUpdate = Database['public']['Tables']['entity_name']['Update'];

// Create action instances
const insertEntity = createInsertAction('entity_name', 'high');
const updateEntity = createUpdateAction('entity_name', 'high');
const deleteEntity = createDeleteAction('entity_name', 'high');
const selectEntities = createSelectAction('entity_name');

// Implement CRUD operations
export const getEntities = async (businessId: string): Promise<Entity[]> => {
  // Implementation with error handling
};

export const createEntity = async (
  data: EntityInsert, 
  businessId: string, 
  userId?: string
): Promise<{ data?: Entity; error?: string }> => {
  // Implementation with optimistic updates
};

// ... other operations
```

## Migration Process

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] Client action factory implementation (`src/lib/actions/client-action-factory.ts`)
- [x] Core entity migrations completed:
  - [x] Projects (`src/lib/actions/projects-client.ts`)
  - [x] Daily Logs (`src/lib/actions/daily-logs-client.ts`)
  - [x] Clients (`src/lib/actions/clients-client.ts`)
  - [x] Crews (`src/lib/actions/crews-client.ts`)
  - [x] Equipment (`src/lib/actions/equipment-client.ts`)
  - [x] Tasks (`src/lib/actions/tasks-client.ts`)
  - [x] Invoices (`src/lib/actions/invoices-client.ts`)
  - [x] Notifications (`src/lib/actions/notifications-client.ts`)
  - [x] Users (`src/lib/actions/users-client.ts`)
  - [x] Businesses (`src/lib/actions/businesses-client.ts`)
  - [x] Media (`src/lib/actions/media-client.ts`)
  - [x] Invoice Items (`src/lib/actions/invoice-items-client.ts`)
  - [x] Project Crews (`src/lib/actions/project-crews-client.ts`)
  - [x] Project Milestones (`src/lib/actions/project-milestones-client.ts`)
  - [x] Subtasks (`src/lib/actions/subtasks-client.ts`)
  - [x] Client Contacts (`src/lib/actions/client-contacts-client.ts`)
  - [x] Crew Members (`src/lib/actions/crew-members-client.ts`)
  - [x] Crew Member Assignments (`src/lib/actions/crew-member-assignments-client.ts`)
  - [x] Task Notes (`src/lib/actions/task-notes-client.ts`)
  - [x] Task Dependencies (`src/lib/actions/task-dependencies-client.ts`)
  - [x] Daily Log Equipment (`src/lib/actions/daily-log-equipment-client.ts`)
  - [x] Daily Log Materials (`src/lib/actions/daily-log-materials-client.ts`)
  - [x] Equipment Assignments (`src/lib/actions/equipment-assignments-client.ts`)
  - [x] Project Issues (`src/lib/actions/projects-issues-client.ts`)
  - [x] Equipment Maintenance (`src/lib/actions/equipment-maintenance-client.ts`)
  - [x] Media Tags (`src/lib/actions/media-tags-client.ts`)
  - [x] Media Metadata (`src/lib/actions/media-metadata-client.ts`)
  - [x] Notification Preferences (`src/lib/actions/notification-preferences-client.ts`)
  - [x] Documents (`src/lib/actions/documents-client.ts`)
  - [x] Equipment Specifications (`src/lib/actions/equipment-specifications-client.ts`)
  - [x] Equipment Usage (`src/lib/actions/equipment-usage-client.ts`)
  - [x] Daily Log Images (`src/lib/actions/daily-log-images-client.ts`)
  - [x] AI Logs (`src/lib/actions/ai-logs-client.ts`)
  - [x] Client Interactions (`src/lib/actions/client-interactions-client.ts`)
  - [x] Business Subscriptions (`src/lib/actions/business-subscriptions-client.ts`)
  - [x] Project Profitability (`src/lib/actions/project-profitability-client.ts`)
  - [x] Dashboard Analytics (`src/lib/actions/dashboard-client.ts`)
  - [x] Authentication (`src/lib/actions/auth-client.ts`)
  - [x] User Avatar (`src/lib/actions/user-avatar-client.ts`)
  - [x] User Invitations (`src/lib/actions/user-invitations-client.ts`)
  - [x] Email Notifications (`src/lib/actions/email-notifications-client.ts`)
  - [x] Email Notifications Bulk (`src/lib/actions/email-notifications-bulk-client.ts`)
  - [x] Push Subscriptions (`src/lib/actions/push-subscriptions-client.ts`)
  - [x] AI Features (`src/lib/actions/ai-client.ts`)
  - [x] Push Notifications (`src/lib/actions/push-notifications-client.ts`)
  - [x] Notification Triggers (`src/lib/actions/notification-triggers-client.ts`)
  - [x] Subscriptions (`src/lib/actions/subscriptions-client.ts`)
  - [x] Business State (`src/lib/actions/business-state-client.ts`)
  - [x] PDF Generation (`src/lib/actions/pdf-generation-client.ts`)
- [x] Type system standardization using Supabase schema
- [x] Error handling and offline storage integration
- [x] Business-scoped data isolation implementation

**Status: 53+ client actions complete, 0 server actions remaining (100% complete)**

### Phase 2: Component Integration 🔄 IN PROGRESS (92% COMPLETE)
**Recently Completed Components:**
- [x] Email system hook (`src/hooks/use-email-system.ts`)
- [x] Notifications hook (`src/hooks/use-notifications.ts`)  
- [x] AI context utility (`src/lib/ai/context.ts`)
- [x] Invoice printable page (`src/app/printables/invoices/[id]/page.tsx`)
- [x] Equipment printable page (`src/app/printables/equipment/[id]/page.tsx`)
- [x] Map component (`src/app/dashboard/map/components/map.tsx`)
- [x] Project crews tab (`src/app/dashboard/projects/components/tab-crews.tsx`)

**Remaining Migration Tasks:**
- [ ] Complete specialized file upload functionality (BrandingManager, media uploads)
- [ ] Implement missing specialized functions (getInvoiceWitDetailsById, location setters)
- [ ] Complete complex relationship functions (getCrewsByProjectId, getAvailableCrews)
- [ ] Final component integration testing
- [ ] Complete offline sync testing

### Phase 3: Advanced Features 📋
- [ ] Media and file handling for offline mode
- [ ] Invoice generation and PDF handling
- [ ] AI features offline compatibility
- [ ] Notification system updates
- [ ] Real-time collaboration features

### Phase 4: Optimization & Polish 📋
- [ ] Conflict resolution implementation
- [ ] Background sync optimization
- [ ] Selective sync capabilities
- [ ] Performance monitoring and analytics
- [ ] UI indicators for offline mode and sync status

## Migrating a Server Action to Client Action

### Step 1: Create Client Action File
1. Create new file: `src/lib/actions/[entity]-client.ts`
2. Import Supabase types and client action factory
3. Define entity types from Supabase schema
4. Create action instances using factory

### Step 2: Implement CRUD Operations
1. **Read Operations**: Use `selectAction` with local IndexedDB fallback
2. **Create Operations**: Use `insertAction` with optimistic updates
3. **Update Operations**: Use `updateAction` with conflict handling
4. **Delete Operations**: Use `deleteAction` with soft delete support

### Step 3: Handle Related Data
For entities with relationships, use a simplified approach for offline-first architecture:

**Phase 1 - Simplified Placeholders:**
```typescript
// TODO: Implement related data caching and joining
return entities.map(entity => ({
  ...entity,
  related_field_name: "Loading..." // Placeholder
}));
```

**Phase 2 - Separate API Calls (Recommended):**
```typescript
export const getProjectDetailsByID = async (businessId: string, projectId: string) => {
  // Get main entity
  const project = await getProjectById(businessId, projectId);
  if (!project) return null;

  // Get related data separately (better for offline caching)
  const [milestones, tasks, client] = await Promise.all([
    getProjectMilestonesByProjectId(businessId, projectId),
    getTasksByProjectId(businessId, projectId),
    project.client_id ? getClientById(businessId, project.client_id) : null
  ]);

  return {
    project,
    milestones: milestones || [],
    tasks: tasks || [],
    client,
    // Calculate stats from cached data
    stats: {
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter(t => t.status === 'completed').length || 0
    }
  };
};
```

**Why This Approach:**
- **Better Offline Performance**: Individual entities can be cached and synced independently
- **Simpler Data Management**: Each entity type has its own cache and sync logic
- **More Resilient**: If one entity fails to sync, others still work
- **Easier Testing**: Each data fetch can be tested independently

### Step 4: Update Component Imports
Replace server action imports in components:
```typescript
// Old server action import
import { getProjects } from "@/app/actions/projects";

// New client action import
import { getProjects } from "@/lib/actions/projects-client";
```

### Step 5: Test Offline Functionality
1. Verify operations work when offline
2. Test sync behavior when connectivity returns
3. Validate error handling and recovery

## Best Practices

### Error Handling
- Always wrap operations in try-catch blocks
- Provide meaningful error messages
- Log errors for debugging while maintaining user experience
- Return consistent error response format

### Optimistic Updates
- Apply changes to local state immediately
- Queue operations for background sync
- Handle rollback scenarios for failed syncs
- Provide visual feedback for pending operations

### Data Consistency
- Use UUIDs for client-generated IDs
- Implement conflict resolution strategies
- Handle timestamp-based updates appropriately
- Maintain referential integrity in offline mode

### Performance
- Batch operations when possible
- Implement pagination for large datasets
- Use efficient IndexedDB queries
- Minimize memory usage for large data sets

## Testing Strategy

### Unit Tests
- Test individual client action functions
- Mock IndexedDB operations
- Verify error handling paths
- Test optimistic update scenarios

### Integration Tests
- Test offline/online transitions
- Verify sync behavior
- Test conflict resolution
- Validate data consistency

### End-to-End Tests
- Test complete user workflows offline
- Verify UI behavior during network changes
- Test data persistence across app restarts
- Validate cross-device sync scenarios

## Monitoring & Debugging

### Development Tools
- Browser DevTools for IndexedDB inspection
- Network throttling for offline testing
- Console logging for sync operations
- Performance profiling for optimization

### Production Monitoring
- Sync success/failure rates
- Offline operation frequency
- Conflict resolution statistics
- Performance metrics for offline operations

## Related Documentation

- [Development Roadmap](../development-roadmap.md) - Overall project progress
- [Database Schema](../schema/) - Database structure and relationships
- [Offline Storage Implementation](./offline-storage-guide.md) - IndexedDB details
- [Sync Strategy](./sync-strategy.md) - Background sync implementation

## Maintenance

### Regular Tasks
- Monitor sync queue performance
- Update entity schemas when database changes
- Review and optimize IndexedDB usage
- Update conflict resolution strategies

### Schema Changes
When Supabase schema changes:
1. Regenerate types: `npm run generate-types`
2. Update affected client actions
3. Test migration compatibility
4. Update related documentation

## Conclusion

This offline-first architecture provides a robust foundation for JobSight Pro's field operations, ensuring users can work uninterrupted regardless of network conditions. The systematic migration approach ensures all functionality remains available offline while maintaining data consistency and sync reliability.

---

**Last Updated**: June 26, 2025  
**Status**: Phase 1 Complete, Phase 2 In Progress  
**Next Review**: Weekly during active migration

## Project Detail Page Refactoring Guide

### Current Challenge
The project detail page (`src/app/dashboard/projects/[id]/page.tsx`) requires complex multi-table data that was originally fetched using `fetchByBusinessWithQuery` with joins and aggregations. This approach doesn't work well with our offline-first client action architecture.

### Refactoring Strategy

#### Phase 1: Basic Functionality ✅ COMPLETE
- [x] Create simplified `getProjectDetailsByID` function with placeholders
- [x] Ensure page loads without crashing
- [x] Maintain existing UI structure

#### Phase 2: Incremental Data Integration 🔄 IN PROGRESS
Implement data fetching for each related entity separately:

```typescript
// Example implementation approach:
const fetchProjectDetails = async (businessId: string, projectId: string) => {
  // 1. Get main project data
  const project = await getProjectById(businessId, projectId);
  
  // 2. Get related data in parallel (all offline-capable)
  const [milestones, tasks, crews, issues] = await Promise.all([
    getProjectMilestonesByProjectId(businessId, projectId),
    getTasksByProjectId(businessId, projectId), 
    getCrewsByProjectId(businessId, projectId),
    getProjectIssuesByProjectId(businessId, projectId)
  ]);
  
  // 3. Get client data if needed
  const client = project?.client_id 
    ? await getClientById(businessId, project.client_id)
    : null;
    
  // 4. Calculate stats from cached data
  const stats = {
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
    // ... other stats
  };
  
  return { project, milestones, tasks, crews, issues, client, stats };
};
```

#### Phase 3: Performance Optimization 📋 PLANNED
- [ ] Implement selective loading (load tabs on demand)
- [ ] Add loading states for individual sections
- [ ] Implement background refresh for stale data
- [ ] Add optimistic updates for all operations

### Benefits of This Approach
1. **Offline Resilience**: Each data type can be cached and work independently
2. **Better Performance**: Only load data that's actually needed
3. **Easier Maintenance**: Each client action is simple and focused
4. **Progressive Enhancement**: Can load basic data first, then enhance with details

### Implementation Priority
1. **High Priority**: Project basic info, milestones, tasks
2. **Medium Priority**: Client info, crew assignments
3. **Low Priority**: Advanced analytics, historical data

## Push Notifications: No Database Table Required

**Important**: Push notifications do NOT require a persistent database table. Here's why:

### Why No `push_notifications` Table?

1. **Ephemeral Nature**: Push notifications are sent once and consumed immediately
2. **No Persistence Needed**: Unlike emails or database records, they don't need long-term storage
3. **Offline-First Approach**: We queue notifications in IndexedDB when offline, then send when online
4. **Simpler Architecture**: Less database complexity and storage overhead

### Current Implementation

```typescript
// Uses only push_subscriptions table for:
// - User subscription endpoints and keys
// - Business association
// - Usage tracking

// Queues notifications in IndexedDB when offline:
interface QueuedNotification {
  id: string;
  business_id: string;
  user_id?: string;
  title: string;
  body: string;
  // ... other notification data
  retry_count: number;
  max_retries: number;
}
```

### Benefits

- **Reduced Database Load**: No unnecessary notification records
- **Better Performance**: Direct sending without database round-trips
- **Offline Support**: IndexedDB queue handles offline scenarios
- **Auto-retry**: Built-in retry logic for failed sends
- **Clean Architecture**: Separation of concerns between subscriptions and notifications

### Usage

```typescript
// Send immediately or queue if offline
await sendPushNotification({
  business_id,
  user_ids: ['user1', 'user2'],
  title: 'New Project Update',
  body: 'Your project has been updated'
});

// Process queued notifications when back online
await processQueuedNotifications(business_id);
```

This approach is more efficient and aligns with modern push notification best practices.
