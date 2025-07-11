# Database Schema Fixes for AI Context

## Issues Found

Based on the debug logs, the AI context was failing to fetch project data due to multiple database schema mismatches:

### 1. Projects Query Error
**Problem:** `Could not find a relationship between 'projects' and 'client'`
**Fix:** Changed join alias from `'client'` to `'clients'` to match the actual table name

### 2. Client Query Error  
**Problem:** `column clients.phone does not exist`
**Fix:** Removed `'phone'` from the client select statement

### 3. Crew Query Error
**Problem:** `column crews.type does not exist`
**Fix:** Removed `'type'` from the crew select statement

### 4. Equipment Query Error
**Problem:** `Unsupported operator: nin`
**Fix:** Changed `{ nin: ["retired", "Retired"] }` to `{ neq: "retired" }`

### 5. Task Query Issues
**Problem:** Complex status arrays with case variations
**Fix:** Simplified to basic status arrays without case variations

## Changes Made

```typescript
// 1. Fixed project join alias
joins: [
    {
        table: "clients",
        select: ["id", "name", "type", "industry"],
        alias: "clients"  // Changed from "client"
    }
],

// 2. Removed non-existent phone column
select: ["id", "name", "type", "industry", "contact_email", "address"], // Removed "phone"

// 3. Removed non-existent type column from crews
select: ["id", "name", "size", "status", "location"], // Removed "type"

// 4. Replaced unsupported nin operator
where: { status: { neq: "retired" } }, // Changed from { nin: ["retired", "Retired"] }

// 5. Simplified status queries
where: { status: { in: ["pending", "in_progress", "blocked"] } }, // Removed case variations
```

## Updated Client Reference

Fixed the client reference in project summary:
```typescript
// Before
const client = p.client?.name || 'Unknown Client';

// After  
const client = p.clients?.name || 'Unknown Client';
```

## Expected Results

After these fixes, the AI context should:
1. ✅ Successfully fetch project data from the database
2. ✅ Properly join client information with projects
3. ✅ Return crew and equipment data without errors
4. ✅ Recognize active projects in the AI responses

The main issue was that **no projects were being fetched** due to the database query failures, which is why the AI kept saying "no active projects" even though projects exist in the database.

## Testing

Run the AI query again and check for:
- `projects: X` (should be > 0 instead of 0)
- No database query errors in the logs
- AI should now see and report on active projects
