# Enhanced Data Loading Functions Documentation

This document describes the enhanced data loading functions that use the `fetchByBusinessWithQuery` query builder for comprehensive, relational, and aggregated data access.

## Overview

The enhanced data loading functions provide:
- **Relational Data**: Join related tables in a single query
- **Aggregated Analytics**: Calculate counts, sums, averages, and other metrics
- **Performance Optimization**: Reduce multiple database round trips
- **Rich Context**: Provide comprehensive data for AI and complex UI components

## Enhanced Functions by Model

### Projects

#### `getProjectDetailsByID(businessId: string, id: string)`
**Purpose**: Load comprehensive project data with all related information
**Returns**: Project with client, crew assignments, tasks, issues, milestones, and analytics
**Usage**: Project detail pages, AI context

```typescript
const project = await getProjectDetailsByID(businessId, projectId);
// Includes:
// - project.client (joined client data)
// - project.active_tasks (count)
// - project.completed_tasks (count)
// - project.open_issues (count)
// - project.total_hours_logged (sum)
// - project.avg_daily_hours (average)
```

### Clients

#### `getClientsWithStats(businessId: string)`
**Purpose**: Load all clients with project and financial analytics
**Returns**: Clients with project counts, budget totals, and invoice data
**Usage**: Client listings, business analytics

#### `getClientDetailsByID(businessId: string, id: string)`
**Purpose**: Load comprehensive client data with all projects and analytics
**Returns**: Client with all projects, financial summaries, and performance metrics
**Usage**: Client detail pages, relationship analysis

### Crews

#### `getCrewDetailsByID(businessId: string, id: string)`
**Purpose**: Load comprehensive crew data with assignments and productivity
**Returns**: Crew with members, assignments, daily logs, and performance analytics
**Usage**: Crew detail pages, resource planning

### Daily Logs

#### `getDailyLogDetailsByID(businessId: string, id: string)`
**Purpose**: Load comprehensive daily log with all related data
**Returns**: Daily log with project, crew, materials, equipment, and labor details
**Usage**: Daily log detail views, comprehensive reporting

#### `getDailyLogsWithStats(businessId: string, filters?)`
**Purpose**: Load daily logs with analytics and filtering
**Parameters**: 
- `dateFrom`, `dateTo`: Date range filtering
- `projectId`, `crewId`: Entity filtering
**Returns**: Daily logs with cost analytics and resource usage
**Usage**: Dashboard analytics, filtered reporting

#### `getDailyLogAnalytics(businessId: string, projectId?: string)`
**Purpose**: Get comprehensive daily log analytics
**Returns**: Aggregated metrics for hours, costs, and productivity
**Usage**: Business intelligence, performance dashboards

### Tasks

#### `getTaskDetailsByID(businessId: string, id: string)`
**Purpose**: Load comprehensive task data with all related information
**Returns**: Task with project, assignee, comments, dependencies, and time logs
**Usage**: Task detail pages, project planning

#### `getTasksWithStats(businessId: string)`
**Purpose**: Load all tasks with project and assignee information
**Returns**: Tasks with relational data and activity metrics
**Usage**: Task dashboards, workload analysis

### Equipment

#### `getEquipmentDetailsByID(businessId: string, id: string)`
**Purpose**: Load comprehensive equipment data with all related information
**Returns**: Equipment with assignments, maintenance, usage, and analytics
**Usage**: Equipment detail pages, maintenance planning

#### `getEquipmentsWithStats(businessId: string)`
**Purpose**: Load all equipment with utilization and maintenance analytics
**Returns**: Equipment with usage metrics, costs, and performance data
**Usage**: Equipment dashboards, utilization analysis

#### `getEquipmentUtilizationAnalytics(businessId: string, equipmentId?: string)`
**Purpose**: Get detailed equipment utilization analytics
**Returns**: Comprehensive utilization metrics and cost analysis
**Usage**: Equipment ROI analysis, maintenance scheduling

## AI Context Loading

### `getAIContextData(businessId: string)`
**Purpose**: Load comprehensive business context for AI processing
**Returns**: Rich, relational data across all business entities with analytics
**Features**:
- **Smart Filtering**: Recent logs (30 days), active tasks, operational equipment
- **Rich Analytics**: Progress metrics, productivity data, cost tracking
- **Relationship Mapping**: Cross-referenced data between entities
- **Metadata**: Context timestamps, data coverage, error tracking

**Usage in AI**:
```typescript
const contextData = await getAIContextData(businessId);
// Provides AI with:
// - Project progress and task completion rates
// - Client relationships and financial data
// - Crew productivity and workload distribution
// - Recent work activity and patterns
// - Equipment utilization and maintenance status
// - Comprehensive business intelligence
```

## Performance Considerations

### Query Optimization
- Use specific field selection to reduce data transfer
- Leverage aggregates instead of client-side calculations
- Apply filters at the database level
- Use appropriate indexes on joined columns

### Caching Strategy
- Consider caching frequently accessed analytics
- Invalidate cache on related data updates
- Use incremental updates for large datasets

### Error Handling
All enhanced functions include:
- Comprehensive error logging
- Graceful fallbacks to empty datasets
- Error metadata for debugging

## Migration from Simple Loading

### Before (Multiple Queries)
```typescript
const project = await getProjectById(businessId, id);
const client = await getClientById(businessId, project.client_id);
const tasks = await getTasksByProject(businessId, id);
const issues = await getIssuesByProject(businessId, id);
// Multiple round trips, no aggregates
```

### After (Single Query)
```typescript
const project = await getProjectDetailsByID(businessId, id);
// Single query with all related data and analytics
// project.client, project.active_tasks, project.open_issues all included
```

## Best Practices

### When to Use Enhanced Functions
- **Detail Pages**: Always use for comprehensive entity views
- **Analytics Dashboards**: Use for rich metrics and insights
- **AI Context**: Use for intelligent system features
- **Reporting**: Use for data that spans multiple entities

### When to Use Simple Functions
- **Lists/Tables**: Use simple functions for basic listings
- **Form Loading**: Use simple functions for form population
- **Quick Checks**: Use simple functions for existence checks

### Field Selection
- Include only necessary fields in `select` arrays
- Use aliases for joined data to avoid naming conflicts
- Consider UI requirements when selecting fields

### Aggregate Design
- Calculate metrics at the database level when possible
- Use appropriate aggregate functions (count, sum, avg, max, min)
- Apply filters to aggregates for conditional calculations

## Extension Patterns

### Adding New Enhanced Functions
1. **Identify Relationships**: Map out related tables and useful joins
2. **Define Aggregates**: Determine useful metrics and calculations
3. **Design Filters**: Consider common filtering requirements
4. **Implement Function**: Use `fetchByBusinessWithQuery` with appropriate config
5. **Add Tests**: Ensure proper error handling and data validation
6. **Update Documentation**: Document usage and return structure

### Custom Analytics
```typescript
export const getCustomAnalytics = async (businessId: string, options: AnalyticsOptions) => {
    const { data, error } = await fetchByBusinessWithQuery(businessId, {
        from: options.baseTable,
        select: options.fields,
        joins: options.relationships,
        aggregates: options.metrics,
        where: options.filters,
        orderBy: options.sorting
    });
    
    return processAnalyticsData(data, options);
};
```

This enhanced data loading approach provides the foundation for sophisticated, data-driven applications while maintaining performance and code maintainability.
