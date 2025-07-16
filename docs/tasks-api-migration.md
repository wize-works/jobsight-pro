# Tasks API Migration Documentation

## Overview

This document outlines the migration of the tasks action system to our consolidated API pattern. The migration includes comprehensive task management with integrated subtasks, dependencies, and notes functionality.

## Migration Components

### 1. API Endpoint
- **File**: `/src/app/api/tasks/route.ts`
- **Description**: Complete REST API endpoint for task operations
- **Features**:
  - CRUD operations for tasks
  - Subtask management
  - Task dependencies
  - Task notes
  - Business isolation
  - Authentication
  - Comprehensive error handling

### 2. Client Library
- **File**: `/src/lib/api/tasks.ts`
- **Description**: Type-safe client library for task operations
- **Components**:
  - `TasksAPI` class with all operations
  - Comprehensive utility functions
  - Type definitions for requests/responses
  - Validation helpers

### 3. React Hooks
- **File**: `/src/hooks/useTasks.ts`
- **Description**: React hooks for task state management
- **Hooks**:
  - `useTasks()` - Basic task listing
  - `useTasksWithDetails()` - Tasks with related data
  - `useTask()` - Single task management
  - `useTaskDetails()` - Task with subtasks/dependencies/notes
  - `useTasksByProject()` - Project-specific tasks
  - `useTaskSearch()` - Task search functionality
  - `useTaskMutations()` - Task CRUD operations
  - `useSubtasks()` - Subtask management
  - `useSubtaskMutations()` - Subtask CRUD operations
  - `useTaskDependencies()` - Dependency management
  - `useTaskDependencyMutations()` - Dependency CRUD operations
  - `useTaskNotes()` - Note management
  - `useTaskNoteMutations()` - Note CRUD operations
  - `useTaskManager()` - Combined task management
  - `useTaskAnalytics()` - Task analytics and insights

## Key Features

### Task Management
- **CRUD Operations**: Create, read, update, delete tasks
- **Status Management**: todo, in_progress, completed, on_hold, cancelled
- **Priority Levels**: urgent, high, medium, low
- **Due Date Tracking**: Support for task deadlines
- **Project Association**: Tasks linked to specific projects
- **Search Functionality**: Full-text search across task data

### Subtask Integration
- **Nested Tasks**: Complete subtask support within tasks
- **Progress Tracking**: Subtask completion affects parent task
- **Status Management**: Independent status for subtasks
- **Dependency Support**: Subtasks can depend on other subtasks

### Task Dependencies
- **Dependency Management**: Tasks can depend on other tasks
- **Circular Prevention**: Validation prevents circular dependencies
- **Status Tracking**: Dependency status affects task availability

### Task Notes
- **Note Management**: Comprehensive note system for tasks
- **Timestamping**: Automatic creation and update timestamps
- **User Attribution**: Notes linked to specific users
- **Rich Content**: Support for detailed note content

## API Usage Examples

### Basic Task Operations

```typescript
import { tasksAPI } from '@/lib/api/tasks';

// Create a new task
const result = await tasksAPI.createTask({
  task: {
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the project',
    status: 'todo',
    priority: 'high',
    project_id: 'project-123',
    assigned_to: 'user-456',
    end_date: new Date('2024-01-15'),
  }
});

// Get task details with subtasks
const taskDetails = await tasksAPI.getTaskDetailsById('task-123');

// Update task status
const updated = await tasksAPI.quickUpdateTask('task-123', {
  status: 'in_progress'
});
```

### Subtask Management

```typescript
// Create subtask
const subtaskResult = await tasksAPI.createSubtask({
  subtask: {
    title: 'Research requirements',
    description: 'Gather all project requirements',
    task_id: 'task-123',
    status: 'todo',
    priority: 'medium',
    order_index: 1,
  }
});

// Get all subtasks for a task
const subtasks = await tasksAPI.getTaskSubtasks('task-123');
```

### Dependencies and Notes

```typescript
// Create task dependency
const dependencyResult = await tasksAPI.createTaskDependency({
  dependency: {
    task_id: 'task-123',
    depends_on_task_id: 'task-456',
    dependency_type: 'blocks',
  }
});

// Add note to task
const noteResult = await tasksAPI.createTaskNote({
  note: {
    task_id: 'task-123',
    content: 'Updated requirements based on client feedback',
    created_by: 'user-789',
  }
});
```

## Hook Usage Examples

### Basic Task Management

```typescript
import { useTasks, useTaskMutations } from '@/hooks/useTasks';

function TaskList() {
  const { tasks, loading, error, refetch } = useTasks();
  const { createTask, updateTask, deleteTask } = useTaskMutations();
  
  const handleCreateTask = async (taskData) => {
    const result = await createTask({ task: taskData });
    if (result.success) {
      refetch();
    }
  };
  
  return (
    <div>
      {loading && <div>Loading tasks...</div>}
      {error && <div>Error: {error}</div>}
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
```

### Comprehensive Task Management

```typescript
import { useTaskManager } from '@/hooks/useTasks';

function TaskManager({ taskId }) {
  const {
    task,
    subtasks,
    dependencies,
    notes,
    loading,
    error,
    createSubtask,
    updateTask,
    createNote,
    refreshData,
  } = useTaskManager(taskId);
  
  const handleAddSubtask = async (subtaskData) => {
    const result = await createSubtask({ subtask: subtaskData });
    if (result.success) {
      refreshData();
    }
  };
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {task && (
        <div>
          <h1>{task.title}</h1>
          <p>{task.description}</p>
          
          <h3>Subtasks ({subtasks.length})</h3>
          {subtasks.map(subtask => (
            <SubtaskItem key={subtask.id} subtask={subtask} />
          ))}
          
          <h3>Dependencies ({dependencies.length})</h3>
          {dependencies.map(dep => (
            <DependencyItem key={dep.id} dependency={dep} />
          ))}
          
          <h3>Notes ({notes.length})</h3>
          {notes.map(note => (
            <NoteItem key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Task Analytics

```typescript
import { useTasks, useTaskAnalytics } from '@/hooks/useTasks';

function TaskDashboard() {
  const { tasks } = useTasks();
  const analytics = useTaskAnalytics(tasks);
  
  return (
    <div>
      <h2>Task Analytics</h2>
      <div>
        <p>Total Tasks: {analytics.totalTasks}</p>
        <p>Completed: {analytics.completedTasks}</p>
        <p>In Progress: {analytics.inProgressTasks}</p>
        <p>Overdue: {analytics.overdueCount}</p>
        <p>Due Soon: {analytics.dueSoonCount}</p>
      </div>
      
      <h3>Priority Breakdown</h3>
      <div>
        <p>Urgent: {analytics.priorityBreakdown.urgent}</p>
        <p>High: {analytics.priorityBreakdown.high}</p>
        <p>Medium: {analytics.priorityBreakdown.medium}</p>
        <p>Low: {analytics.priorityBreakdown.low}</p>
      </div>
    </div>
  );
}
```

## Database Schema

### Tasks Table
- `id` (UUID, Primary Key)
- `title` (Text, Required)
- `description` (Text)
- `status` (Enum: todo, in_progress, completed, on_hold, cancelled)
- `priority` (Enum: urgent, high, medium, low)
- `project_id` (UUID, Foreign Key)
- `assigned_to` (UUID, Foreign Key)
- `created_by` (UUID, Foreign Key)
- `business_id` (UUID, Foreign Key)
- `start_date` (Date)
- `end_date` (Date)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Subtasks Table
- `id` (UUID, Primary Key)
- `task_id` (UUID, Foreign Key)
- `title` (Text, Required)
- `description` (Text)
- `status` (Enum: todo, in_progress, completed, cancelled)
- `priority` (Enum: urgent, high, medium, low)
- `assigned_to` (UUID, Foreign Key)
- `order_index` (Integer)
- `estimated_hours` (Decimal)
- `actual_hours` (Decimal)
- `due_date` (Date)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Task Dependencies Table
- `id` (UUID, Primary Key)
- `task_id` (UUID, Foreign Key)
- `depends_on_task_id` (UUID, Foreign Key)
- `dependency_type` (Enum: blocks, requires, relates_to)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Task Notes Table
- `id` (UUID, Primary Key)
- `task_id` (UUID, Foreign Key)
- `content` (Text, Required)
- `created_by` (UUID, Foreign Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Security Features

### Authentication
- All endpoints require valid Clerk authentication
- User session validation on every request
- Business isolation enforced

### Authorization
- Users can only access tasks within their business
- Create operations require proper business context
- Update/delete operations validate ownership

### Data Validation
- Comprehensive input validation
- Type safety throughout the stack
- Error handling with detailed messages

## Error Handling

### API Level
- Consistent error response format
- Detailed error messages
- Proper HTTP status codes
- Validation error details

### Client Level
- Automatic error handling in hooks
- Loading states for all operations
- Error propagation to UI components
- Retry mechanisms where appropriate

## Performance Considerations

### Database Optimization
- Indexed queries for performance
- Efficient joins for related data
- Pagination support for large datasets
- Optimized queries for analytics

### Caching
- Client-side caching of frequently accessed data
- Proper cache invalidation on updates
- Background refresh capabilities

### Loading States
- Granular loading states for different operations
- Optimistic updates where appropriate
- Proper error boundaries

## Migration Benefits

### Improved Subtask Support
- Previously unused subtask functionality now fully integrated
- Proper subtask-task relationships
- Status propagation between tasks and subtasks

### Enhanced Task Management
- Comprehensive dependency system
- Rich note-taking capabilities
- Better search and filtering
- Improved analytics

### Better Developer Experience
- Type-safe operations throughout
- Comprehensive hook library
- Consistent API patterns
- Detailed error handling

### Scalability
- Proper business isolation
- Efficient database queries
- Modular architecture
- Easy testing and maintenance

## Future Enhancements

### Planned Features
- Real-time task updates
- Task templates
- Bulk operations
- Advanced reporting
- Integration with calendar systems
- Task automation rules

### Technical Improvements
- GraphQL support
- Offline capability
- Enhanced caching
- Performance monitoring
- Advanced analytics

This migration provides a solid foundation for comprehensive task management while maintaining the established API patterns and ensuring proper integration with the existing system architecture.
