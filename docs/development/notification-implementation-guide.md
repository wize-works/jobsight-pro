# Notification Implementation Guide

This guide provides a comprehensive overview of how to implement notifications for new business events in the JobSight Pro Next.js application. The notification system ensures all relevant business users are informed of important events while providing rich context and actionable links.

## Overview

The notification system consists of several key components:
- **Notification Context**: Provides real-time notification state management
- **Notification Actions**: Server-side functions for creating and managing notifications
- **Notification Types**: Predefined categories for different event types
- **Notification UI**: Dashboard component for displaying notifications to users

## Key Files and Components

### Core Files
- `src/app/dashboard/notifications.tsx` - UI component for displaying notifications
- `src/lib/business-context.tsx` - Business context provider
- `src/app/actions/notifications.ts` - Server actions for notification management
- `src/types/notifications.ts` - TypeScript types for notifications
- `src/app/actions/users.ts` - User management functions

### Action Files with Notifications
- `src/app/actions/projects.ts` - Project notifications (create, update, delete)
- `src/app/actions/daily-logs.ts` - Daily log notifications (create, update, delete)
- `src/app/actions/tasks.ts` - Task notifications (create, update, delete, assign, complete)

## Notification Types

The system supports the following notification types (defined in `src/types/notifications.ts`):

```typescript
type NotificationType = 
  | "general"
  | "projectUpdates"
  | "taskAssignments"
  | "dailyLogUpdates"
  | "invoiceUpdates"
  | "systemAlerts"
  | "documentShared"
  | "paymentReminder"
  | "reportGenerated";
```

## Implementation Pattern

### 1. Import Required Dependencies

```typescript
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { NotificationInsert } from "@/types/notifications";
```

### 2. Create a Notification Trigger Function

Create a dedicated function for handling notifications for your entity:

```typescript
async function triggerEntityNotification(
    businessId: string,
    entityId: string,
    entityName: string,
    eventType: string,
    additionalContext?: any,
    triggeredBy?: string
) {
    try {
        // Get all users in the business
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business to notify");
            return;
        }

        // Define notification content based on event type
        let title = "";
        let message = "";

        switch (eventType) {
            case "created":
                title = "New Entity Created";
                message = `A new entity "${entityName}" has been created.`;
                break;
            case "updated":
                title = "Entity Updated";
                message = `Entity "${entityName}" has been updated.`;
                break;
            case "deleted":
                title = "Entity Deleted";
                message = `Entity "${entityName}" has been deleted.`;
                break;
            default:
                title = "Entity Modified";
                message = `Entity "${entityName}" has been modified.`;
        }

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "appropriateType", // Choose from available types
                title,
                message,
                link: `/dashboard/entities/${entityId}`,
                read: false,
                read_at: null,
                metadata: {
                    entityId,
                    entityName,
                    eventType,
                    triggeredBy,
                    // Include any additional context
                    ...additionalContext
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating entity notification:", error);
    }
}
```

### 3. Integrate Notifications into CRUD Actions

#### Create Action

```typescript
export const createEntity = async (businessId: string, entity: EntityInsert): Promise<Entity | null> => {
    try {
        entity = await applyCreated<EntityInsert>(entity);
        const { data, error } = await insertWithBusiness("entities", entity, businessId);

        if (error) {
            console.error("Error creating entity:", error);
            return null;
        }

        if (data) {
            // Get the current user session to identify who created the entity
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Get additional context if needed (e.g., project name)
            // const { data: contextData } = await fetchByBusiness("related_table", businessId, ["name"], {
            //     filter: { id: data.related_id },
            // });

            // Trigger notification
            await triggerEntityNotification(
                businessId,
                data.id,
                data.name || "Unnamed Entity",
                "created",
                { /* additional context */ },
                user?.id
            );
        }

        return data as unknown as Entity;
    } catch (err) {
        console.error("Error in createEntity:", err);
        return null;
    }
};
```

#### Update Action

```typescript
export const updateEntity = async (businessId: string, id: string, entity: EntityUpdate): Promise<Entity> => {
    try {
        // Get the existing entity to compare changes (if needed)
        const { data: existingEntityData } = await fetchByBusiness("entities", businessId, "*", {
            filter: { id },
        });
        const existingEntity = existingEntityData?.[0] as Entity | undefined;

        entity = await applyUpdated<EntityUpdate>(entity);
        const { data, error } = await updateWithBusinessCheck("entities", id, entity, businessId);

        if (error) {
            console.error("Error updating entity:", error);
            throw error;
        }

        if (data) {
            // Get the current user session to identify who updated the entity
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Determine specific event type based on changes (if needed)
            let eventType = "updated";
            // Example: if (existingEntity?.status !== data.status) eventType = "statusChanged";

            // Trigger notification
            await triggerEntityNotification(
                businessId,
                data.id,
                data.name || "Unnamed Entity",
                eventType,
                { /* additional context */ },
                user?.id
            );
        }

        return data as unknown as Entity;
    } catch (err) {
        console.error("Error in updateEntity:", err);
        throw err;
    }
};
```

#### Delete Action

```typescript
export const deleteEntity = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the entity data before deletion for notification
        const { data: entityData } = await fetchByBusiness("entities", businessId, "*", {
            filter: { id },
        });
        const entity = entityData?.[0] as Entity | undefined;

        const { error } = await deleteWithBusinessCheck("entities", id, businessId);

        if (error) {
            console.error("Error deleting entity:", error);
            return false;
        }

        if (entity) {
            // Get the current user session to identify who deleted the entity
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // Trigger notification
            await triggerEntityNotification(
                businessId,
                entity.id,
                entity.name || "Unnamed Entity",
                "deleted",
                { /* additional context */ },
                user?.id
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteEntity:", err);
        return false;
    }
};
```

## Best Practices

### 1. Notification Content
- **Title**: Keep titles concise and descriptive (e.g., "New Project Created", "Task Completed")
- **Message**: Provide context including entity name and relevant details
- **Link**: Always provide a direct link to the relevant entity or dashboard page

### 2. User Filtering
- Always exclude the user who triggered the action (`triggeredBy`)
- Only send notifications to users with valid `auth_id`
- Consider role-based filtering if needed

### 3. Metadata
Include relevant metadata for:
- Entity identification (`entityId`, `entityName`)
- Event tracking (`eventType`, `triggeredBy`)
- Context information (project name, dates, assignments, etc.)

### 4. Error Handling
- Wrap notification logic in try-catch blocks
- Log errors for debugging
- Don't let notification failures break the main action

### 5. Performance
- Use `Promise.all()` to create notifications concurrently
- Filter out invalid users before creating notification promises
- Keep notification logic asynchronous and non-blocking

## Real-World Examples

### Project Notifications
```typescript
// From src/app/actions/projects.ts
await triggerProjectNotification(
    businessId,
    data.id,
    data.name || "Unnamed Project",
    "created",
    user?.id
);
```

### Daily Log Notifications
```typescript
// From src/app/actions/daily-logs.ts
await triggerDailyLogNotification(
    businessId,
    data.id,
    projectName,
    data.log_date,
    "created",
    user?.id
);
```

### Task Notifications
```typescript
// From src/app/actions/tasks.ts
await triggerTaskNotification(
    businessId,
    data.id,
    data.name || "Unnamed Task",
    projectName,
    eventType, // "created", "assigned", "completed"
    data.assigned_to || undefined,
    user?.id
);
```

### Project Milestone Notifications
```typescript
// From src/app/actions/project-milestones.ts
await triggerMilestoneNotification(
    businessId,
    data.id,
    data.name || "Unnamed Milestone",
    projectName,
    "created", // "created", "updated", "completed", "overdue", "deleted"
    data.due_date || undefined,
    data.status || undefined,
    user?.id
);
```

### Project Crew Notifications
```typescript
// From src/app/actions/project-crews.ts
await triggerProjectCrewNotification(
    businessId,
    data.id,
    crewName,
    projectName,
    "assigned", // "assigned", "updated", "removed", "completed"
    undefined, // role
    data.start_date || undefined,
    data.end_date || undefined,
    user?.id
);
```

### Project Issue Notifications
```typescript
// From src/app/actions/projects-issues.ts
await triggerProjectIssueNotification(
    businessId,
    data.id,
    data.title,
    projectName,
    "reported", // "reported", "updated", "assigned", "resolved", "closed", "deleted"
    data.priority,
    data.status,
    data.assigned_to,
    user?.id
);
```

## Testing Notifications

### Manual Testing
1. Perform CRUD operations on entities
2. Check the notifications dashboard
3. Verify all relevant users receive notifications
4. Ensure the triggering user doesn't receive their own notifications

### Edge Cases to Test
- Operations with missing entity names
- Operations by users without proper authentication
- Businesses with no users
- Network failures during notification creation

## Notification Types by Use Case

| Entity Type | Recommended Type | Events |
|-------------|------------------|--------|
| Projects | `projectUpdates` | Create, Update, Delete |
| Project Milestones | `projectUpdates` | Create, Update, Complete, Overdue, Delete |
| Project Crews | `projectUpdates` | Assign, Update, Remove, Complete |
| Project Issues | `projectUpdates` | Report, Update, Assign, Resolve, Close, Delete |
| Tasks | `taskAssignments` | Create, Update, Delete, Assign, Complete |
| Daily Logs | `dailyLogUpdates` | Create, Update, Delete |
| Equipment | `equipmentAlerts` | Create, Update, Delete, Status Change, Location Change |
| Equipment Maintenance | `equipmentAlerts` | Schedule, Update, Complete, Delete |
| Equipment Assignments | `equipmentAlerts` | Assign, Update, Return, Delete |
| Invoices | `invoiceUpdates` | Create, Update, Delete, Status Changes |
| Documents | `documentShared` | Share, Upload |
| Reports | `reportGenerated` | Generate, Complete |
| Payments | `paymentReminder` | Due, Overdue, Received |
| System | `systemAlerts` | Maintenance, Updates, Issues |

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check if the business context is properly set up
   - Verify user authentication and business membership
   - Ensure notification creation doesn't have errors

2. **Duplicate notifications**
   - Check if notification triggers are called multiple times
   - Verify user filtering logic

3. **Missing context in notifications**
   - Ensure metadata includes all necessary information
   - Verify related entity data is fetched correctly

4. **Performance issues**
   - Check if notifications are created concurrently
   - Monitor database query performance
   - Consider batching for high-volume events

### Debugging
- Add temporary console.log statements to track notification flow
- Check browser network tab for notification API calls
- Verify database entries in the notifications table
- Test with different user roles and permissions

## Future Enhancements

### Planned Features
- Email notification delivery
- Push notification support
- Notification preferences and filtering
- Bulk notification management
- Notification analytics and reporting

### Extension Points
- Custom notification templates
- Conditional notification rules
- Integration with external notification services
- Real-time notification updates via WebSockets

---

This guide should serve as the definitive reference for implementing notifications in new features. Always follow the established patterns and update this documentation when adding new notification types or capabilities.
