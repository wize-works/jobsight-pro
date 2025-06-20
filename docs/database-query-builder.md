# Database Query Builder Guide

This guide explains how to use the new `fetchByBusinessWithQuery` function for complex relational queries in your action files.

## Overview

The `fetchByBusinessWithQuery` function provides a developer-friendly way to perform complex database queries with joins, aggregations, and filtering across multiple tables while maintaining business-level security isolation.

## When to Use

Use `fetchByBusinessWithQuery` when you need:
- Data from multiple related tables in a single query
- Aggregated counts, sums, averages, etc. from related tables
- Complex filtering across multiple tables
- Better performance than multiple separate queries

Continue using the standard `fetchByBusiness` for simple single-table queries.

## Basic Usage

### Import the Function

```typescript
import { fetchByBusinessWithQuery } from "@/lib/db";
```

### Simple Query with Aggregates

```typescript
const result = await fetchByBusinessWithQuery(businessId, {
  from: "clients",
  select: ["id", "name", "email"],
  aggregates: [
    { function: "count", table: "projects", alias: "project_count", where: { client_id: clientId } },
    { function: "sum", table: "projects", column: "budget", alias: "total_budget", where: { client_id: clientId } }
  ],
  where: { id: clientId }
});
```

### Query with Joins

```typescript
const result = await fetchByBusinessWithQuery(businessId, {
  from: "projects",
  select: ["id", "name", "status", "budget"],
  joins: [
    {
      table: "clients",
      select: ["name", "email"],
      alias: "client"
    },
    {
      table: "project_tasks",
      select: ["id", "title", "status"],
      alias: "tasks"
    }
  ],
  where: { status: "active" },
  orderBy: { column: "created_at", ascending: false }
});
```

## Configuration Options

### QueryBuilderConfig

| Property | Type | Description |
|----------|------|-------------|
| `from` | `string` | Main table to query from (required) |
| `select` | `string[]` | Fields to select from main table (defaults to `["*"]`) |
| `joins` | `JoinConfig[]` | Related tables to include |
| `aggregates` | `AggregateConfig[]` | Aggregation functions to compute |
| `where` | `Record<string, any>` | Filter conditions for main table |
| `orderBy` | `OrderByConfig` | Sorting configuration |
| `limit` | `number` | Maximum records to return |
| `page` | `number` | Page number for pagination |

### JoinConfig

| Property | Type | Description |
|----------|------|-------------|
| `table` | `string` | Table to join (required) |
| `select` | `string[]` | Fields to include from joined table |
| `alias` | `string` | Alias for the joined data in results |
| `where` | `Record<string, any>` | Additional filters for joined table |

### AggregateConfig

| Property | Type | Description |
|----------|------|-------------|
| `function` | `'count' \| 'sum' \| 'avg' \| 'max' \| 'min'` | Aggregation function (required) |
| `table` | `string` | Table to aggregate from (required) |
| `column` | `string` | Column to aggregate (not needed for count) |
| `alias` | `string` | Name for the result field (required) |
| `where` | `Record<string, any>` | Filter conditions for the aggregate |

## Filtering Options

The `where` clause supports the same powerful filtering as `fetchByBusiness`:

```typescript
where: {
  status: "active",                    // Simple equality
  budget: { gt: 1000 },               // Greater than
  name: { ilike: "%construction%" },   // Case-insensitive like
  client_id: { in: [id1, id2, id3] }, // In array
  archived_at: { neq: null },         // Not equal (including null checks)
  created_at: { gte: "2024-01-01" }   // Greater than or equal
}
```

## Real-World Examples

### Example 1: Client Dashboard Data

Replace multiple queries with a single optimized query:

**Before (Multiple Queries):**
```typescript
const [clients, projects, contacts, invoices] = await Promise.all([
  fetchByBusiness("clients", businessId, "*"),
  fetchByBusiness("projects", businessId, "*", { filter: { client_id: { in: clientIds } } }),
  fetchByBusiness("client_contacts", businessId, "*", { filter: { client_id: { in: clientIds } } }),
  fetchByBusiness("invoices", businessId, "*", { filter: { client_id: { in: clientIds } } })
]);
```

**After (Single Query):**
```typescript
const { data: clientsWithStats } = await fetchByBusinessWithQuery(businessId, {
  from: "clients",
  select: ["*"],
  joins: [
    {
      table: "projects",
      select: ["id", "status", "budget"],
      alias: "projects"
    }
  ],
  aggregates: [
    { function: "count", table: "projects", alias: "total_projects" },
    { function: "count", table: "projects", alias: "active_projects", where: { status: "active" } },
    { function: "sum", table: "projects", column: "budget", alias: "total_budget" },
    { function: "count", table: "client_contacts", alias: "contact_count" },
    { function: "count", table: "invoices", alias: "invoice_count" }
  ],
  orderBy: { column: "name", ascending: true }
});
```

### Example 2: Project Summary with Related Data

```typescript
export const getProjectSummary = async (businessId: string, projectId: string) => {
  const { data, error } = await fetchByBusinessWithQuery(businessId, {
    from: "projects",
    select: ["*"],
    joins: [
      {
        table: "clients",
        select: ["name", "email", "phone"],
        alias: "client"
      },
      {
        table: "project_tasks",
        select: ["id", "title", "status", "priority"],
        alias: "tasks"
      },
      {
        table: "project_documents",
        select: ["id", "name", "file_url", "uploaded_at"],
        alias: "documents"
      }
    ],
    aggregates: [
      { function: "count", table: "project_tasks", alias: "total_tasks" },
      { function: "count", table: "project_tasks", alias: "completed_tasks", where: { status: "completed" } },
      { function: "sum", table: "project_expenses", column: "amount", alias: "total_expenses" },
      { function: "count", table: "project_documents", alias: "document_count" }
    ],
    where: { id: projectId }
  });

  if (error || !data?.length) {
    throw new Error("Project not found");
  }

  return data[0];
};
```

### Example 3: Dashboard Analytics

```typescript
export const getDashboardStats = async (businessId: string) => {
  const { data } = await fetchByBusinessWithQuery(businessId, {
    from: "projects",
    select: ["status"],
    aggregates: [
      { function: "count", table: "projects", alias: "total_projects" },
      { function: "count", table: "projects", alias: "active_projects", where: { status: "active" } },
      { function: "count", table: "projects", alias: "completed_projects", where: { status: "completed" } },
      { function: "sum", table: "projects", column: "budget", alias: "total_budget" },
      { function: "count", table: "clients", alias: "total_clients" },
      { function: "count", table: "clients", alias: "active_clients", where: { status: "active" } },
      { function: "count", table: "tasks", alias: "total_tasks" },
      { function: "count", table: "tasks", alias: "overdue_tasks", where: { 
        status: { neq: "completed" },
        due_date: { lt: new Date().toISOString() }
      }}
    ],
    limit: 1
  });

  return data?.[0] || {};
};
```

## Performance Considerations

### Benefits
- **Fewer Database Round Trips**: Single query instead of multiple
- **Better Database Optimization**: Database can optimize the entire query
- **Reduced Network Overhead**: Less data transfer
- **Improved Caching**: Single result set to cache

### Limitations
- **Complex Aggregates**: Some aggregations are computed client-side due to Supabase limitations
- **Memory Usage**: Large result sets with joins may use more memory
- **Query Complexity**: Very complex queries may be harder to debug

## Migration Strategy

When migrating existing functions:

1. **Identify Multiple Query Patterns**: Look for `Promise.all()` with multiple `fetchByBusiness` calls
2. **Analyze Data Relationships**: Understand which tables are related and how
3. **Start Simple**: Begin with just aggregates, then add joins if needed
4. **Test Thoroughly**: Ensure the new query returns the same data structure
5. **Measure Performance**: Verify the performance improvement

## Error Handling

The function returns the same error structure as `fetchByBusiness`:

```typescript
const { data, error } = await fetchByBusinessWithQuery(businessId, config);

if (error) {
  console.error("Query failed:", error);
  return []; // or appropriate fallback
}

if (!data?.length) {
  return []; // handle empty results
}

return data;
```

## Security

The function maintains the same business-level security as `fetchByBusiness`:
- All queries are automatically filtered by `business_id`
- No cross-business data access is possible
- All joined tables must also have `business_id` columns

## Best Practices

1. **Use Specific Selects**: Only select the fields you need
2. **Add Appropriate Filters**: Use `where` clauses to limit data
3. **Consider Pagination**: Use `limit` and `page` for large datasets
4. **Name Aggregates Clearly**: Use descriptive `alias` names
5. **Test with Real Data**: Ensure queries work with your actual data volumes
6. **Document Complex Queries**: Add comments explaining the business logic

## Common Patterns

### Getting Counts for Archive/Delete Confirmation
```typescript
const { data } = await fetchByBusinessWithQuery(businessId, {
  from: "clients",
  select: ["id"],
  aggregates: [
    { function: "count", table: "projects", alias: "project_count", where: { client_id: clientId } },
    { function: "count", table: "invoices", alias: "invoice_count", where: { client_id: clientId } }
  ],
  where: { id: clientId }
});
```

### Dashboard Statistics
```typescript
const { data } = await fetchByBusinessWithQuery(businessId, {
  from: "projects",
  aggregates: [
    { function: "count", table: "projects", alias: "total_projects" },
    { function: "count", table: "projects", alias: "active_projects", where: { status: "active" } },
    { function: "sum", table: "projects", column: "budget", alias: "total_budget" }
  ],
  limit: 1
});
```

### List with Related Data
```typescript
const { data } = await fetchByBusinessWithQuery(businessId, {
  from: "projects",
  select: ["*"],
  joins: [
    { table: "clients", select: ["name"], alias: "client" },
    { table: "project_tasks", select: ["id", "status"], alias: "tasks" }
  ],
  orderBy: { column: "created_at", ascending: false }
});
```
