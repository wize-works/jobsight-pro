# Project API Migration - Implementation Guide

## Overview

This guide demonstrates how to migrate from the existing project server actions to the new consolidated API pattern for project management functionality.

## Migration Summary

### What was migrated:

1. **Core Projects API** (`/api/projects`)
   - ✅ GET `/api/projects` - List all projects
   - ✅ POST `/api/projects` - Create new project
   - ✅ GET `/api/projects/[id]` - Get project by ID
   - ✅ PUT `/api/projects/[id]` - Update project
   - ✅ DELETE `/api/projects/[id]` - Delete project

2. **Project Relationships API**
   - ✅ GET `/api/projects/client/[clientId]` - Projects by client
   - ✅ GET `/api/projects/profitability` - Project profitability analytics

3. **Project Milestones API** (`/api/project-milestones`)
   - ✅ GET `/api/project-milestones` - List project milestones
   - ✅ POST `/api/project-milestones` - Create milestone
   - ✅ GET `/api/project-milestones/[id]` - Get milestone by ID
   - ✅ PUT `/api/project-milestones/[id]` - Update milestone
   - ✅ DELETE `/api/project-milestones/[id]` - Delete milestone

4. **Project Issues API** (`/api/project-issues`)
   - ✅ GET `/api/project-issues` - List project issues
   - ✅ POST `/api/project-issues` - Create issue
   - ✅ GET `/api/project-issues/[id]` - Get issue by ID
   - ✅ PUT `/api/project-issues/[id]` - Update issue
   - ✅ DELETE `/api/project-issues/[id]` - Delete issue

5. **Project Crews API** (`/api/project-crews`)
   - ✅ GET `/api/project-crews` - List project crew assignments
   - ✅ POST `/api/project-crews` - Create crew assignment
   - ✅ GET `/api/project-crews/[id]` - Get crew assignment by ID
   - ✅ PUT `/api/project-crews/[id]` - Update crew assignment
   - ✅ DELETE `/api/project-crews/[id]` - Delete crew assignment

6. **Client API Library** (`/src/lib/api/projects.ts`)
   - ✅ Type-safe API client functions
   - ✅ Error handling and response parsing
   - ✅ Utility functions for file operations

7. **React Hooks** (`/src/hooks/useProjects.ts`)
   - ✅ `useProjects()` - Load and manage projects list
   - ✅ `useProject(id)` - Load single project
   - ✅ `useProjectMutations()` - Create/update/delete operations
   - ✅ `useProjectsByClient(clientId)` - Projects by client
   - ✅ `useProjectSearch()` - Search functionality
   - ✅ `useProjectProfitability()` - Analytics and reporting
   - ✅ `useProjectsWithDetails()` - Projects with related data
   - ✅ `useProjectDetails(id)` - Full project details

## Usage Examples

### 1. Basic Project Management

#### Using React Hooks (Recommended)

```typescript
import { useProjects, useProjectMutations } from '@/hooks/useProjects';

function ProjectsList() {
    const { projects, loading, error, refetch } = useProjects({ 
        includeDetails: true 
    });
    const { createProject, updateProject, deleteProject } = useProjectMutations();

    const handleCreateProject = async (projectData) => {
        const newProject = await createProject(projectData);
        if (newProject) {
            refetch(); // Refresh the list
        }
    };

    const handleUpdateProject = async (id, updates) => {
        const updatedProject = await updateProject(id, updates);
        if (updatedProject) {
            refetch(); // Refresh the list
        }
    };

    const handleDeleteProject = async (id) => {
        const success = await deleteProject(id);
        if (success) {
            refetch(); // Refresh the list
        }
    };

    if (loading) return <div>Loading projects...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            {projects.map(project => (
                <div key={project.id}>
                    <h3>{project.name}</h3>
                    <p>Status: {project.status}</p>
                    <button onClick={() => handleUpdateProject(project.id, { status: 'completed' })}>
                        Mark Complete
                    </button>
                    <button onClick={() => handleDeleteProject(project.id)}>
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
}
```

#### Using API Client Directly

```typescript
import { 
    getProjects, 
    createProject, 
    updateProject, 
    deleteProject 
} from '@/lib/api/projects';

// Get all projects
const projects = await getProjects({ includeDetails: true });

// Create a new project
const newProject = await createProject({
    name: 'New Construction Project',
    client_id: 'client-123',
    status: 'planning',
    budget: 50000,
    start_date: '2024-01-01',
    description: 'Residential construction project'
});

// Update project
const updatedProject = await updateProject('project-456', {
    status: 'in_progress',
    progress: 25
});

// Update project progress only
const progressUpdate = await updateProjectProgress('project-456', 50);

// Delete project
const result = await deleteProject('project-456');
```

### 2. Project Search and Filtering

```typescript
import { useProjectSearch, useProjectsByClient } from '@/hooks/useProjects';

function ProjectSearch() {
    const { results, loading, search, clearResults } = useProjectSearch();

    const handleSearch = (query) => {
        if (query.trim()) {
            search(query);
        } else {
            clearResults();
        }
    };

    return (
        <div>
            <input 
                type="text" 
                placeholder="Search projects..."
                onChange={(e) => handleSearch(e.target.value)}
            />
            {loading && <div>Searching...</div>}
            <div>
                {results.map(project => (
                    <div key={project.id}>{project.name}</div>
                ))}
            </div>
        </div>
    );
}

function ClientProjects({ clientId }) {
    const { projects, loading, error } = useProjectsByClient(clientId);

    if (loading) return <div>Loading client projects...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h3>Projects for Client</h3>
            {projects.map(project => (
                <div key={project.id}>
                    <h4>{project.name}</h4>
                    <p>Budget: ${project.budget}</p>
                    <p>Status: {project.status}</p>
                </div>
            ))}
        </div>
    );
}
```

### 3. Project Analytics and Profitability

```typescript
import { useProjectProfitability } from '@/hooks/useProjects';

function ProjectAnalytics() {
    const { data, loading, error } = useProjectProfitability({
        status: 'active',
        riskLevel: 'high'
    });

    if (loading) return <div>Loading analytics...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h3>Project Profitability Summary</h3>
            <div>
                <p>Total Projects: {data.summary.totalProjects}</p>
                <p>Total Budget: ${data.summary.totalBudget}</p>
                <p>Total Profit: ${data.summary.totalProfit}</p>
                <p>Average Margin: {data.summary.averageMargin.toFixed(2)}%</p>
                <p>At Risk Projects: {data.summary.atRiskProjects}</p>
            </div>
            
            <h4>Project Details</h4>
            {data.projects.map(project => (
                <div key={project.id}>
                    <h5>{project.name}</h5>
                    <p>Profit Margin: {project.profitMargin.toFixed(2)}%</p>
                    <p>Risk Level: {project.riskLevel}</p>
                    <p>Budget Utilization: {project.budgetUtilization.toFixed(2)}%</p>
                </div>
            ))}
        </div>
    );
}
```

### 4. Project Details with Related Data

```typescript
import { useProjectDetails } from '@/hooks/useProjects';

function ProjectDetailsPage({ projectId }) {
    const { projectDetails, loading, error } = useProjectDetails(projectId);

    if (loading) return <div>Loading project details...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>{projectDetails.project.name}</h2>
            <p>Status: {projectDetails.project.status}</p>
            <p>Progress: {projectDetails.project.progress}%</p>
            
            <h3>Statistics</h3>
            <div>
                <p>Total Tasks: {projectDetails.stats.totalTasks}</p>
                <p>Completed Tasks: {projectDetails.stats.completedTasks}</p>
                <p>Total Milestones: {projectDetails.stats.totalMilestones}</p>
                <p>Open Issues: {projectDetails.stats.openIssues}</p>
            </div>

            <h3>Milestones</h3>
            {projectDetails.milestones.map(milestone => (
                <div key={milestone.id}>
                    <h4>{milestone.name}</h4>
                    <p>Due: {milestone.due_date}</p>
                    <p>Status: {milestone.status}</p>
                </div>
            ))}

            <h3>Issues</h3>
            {projectDetails.issues.map(issue => (
                <div key={issue.id}>
                    <h4>{issue.title}</h4>
                    <p>Priority: {issue.priority}</p>
                    <p>Status: {issue.status}</p>
                </div>
            ))}
        </div>
    );
}
```

### 5. Project Milestones Management

```typescript
import { useState } from 'react';
import { 
    getProjectMilestones, 
    createProjectMilestone, 
    updateProjectMilestone, 
    deleteProjectMilestone 
} from '@/lib/api/project-milestones';

function ProjectMilestones({ projectId }) {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadMilestones = async () => {
        setLoading(true);
        try {
            // Get milestones for specific project
            const response = await fetch(`/api/project-milestones?projectId=${projectId}`);
            const data = await response.json();
            setMilestones(data);
        } catch (error) {
            console.error('Error loading milestones:', error);
        } finally {
            setLoading(false);
        }
    };

    const createMilestone = async (milestoneData) => {
        try {
            const response = await fetch('/api/project-milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...milestoneData,
                    project_id: projectId
                })
            });
            const newMilestone = await response.json();
            setMilestones([...milestones, newMilestone]);
        } catch (error) {
            console.error('Error creating milestone:', error);
        }
    };

    const updateMilestone = async (id, updates) => {
        try {
            const response = await fetch(`/api/project-milestones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const updatedMilestone = await response.json();
            setMilestones(milestones.map(m => m.id === id ? updatedMilestone : m));
        } catch (error) {
            console.error('Error updating milestone:', error);
        }
    };

    const deleteMilestone = async (id) => {
        try {
            await fetch(`/api/project-milestones/${id}`, {
                method: 'DELETE'
            });
            setMilestones(milestones.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting milestone:', error);
        }
    };

    return (
        <div>
            <h3>Project Milestones</h3>
            {loading ? (
                <div>Loading milestones...</div>
            ) : (
                <div>
                    {milestones.map(milestone => (
                        <div key={milestone.id}>
                            <h4>{milestone.name}</h4>
                            <p>Due: {milestone.due_date}</p>
                            <p>Status: {milestone.status}</p>
                            <button onClick={() => updateMilestone(milestone.id, { status: 'completed' })}>
                                Mark Complete
                            </button>
                            <button onClick={() => deleteMilestone(milestone.id)}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

## Migration Checklist

### For Existing Components:

1. **Replace Direct Action Imports**
   ```typescript
   // ❌ Old way
   import { getProjects, createProject } from '@/app/actions/projects';

   // ✅ New way
   import { useProjects, useProjectMutations } from '@/hooks/useProjects';
   ```

2. **Update Component Logic**
   ```typescript
   // ❌ Old way
   const [projects, setProjects] = useState([]);
   const [loading, setLoading] = useState(false);
   
   useEffect(() => {
       setLoading(true);
       getProjects(businessId).then(setProjects).finally(() => setLoading(false));
   }, [businessId]);

   // ✅ New way
   const { projects, loading, error } = useProjects();
   ```

3. **Update Mutation Handling**
   ```typescript
   // ❌ Old way
   const handleCreate = async (data) => {
       const project = await createProject(businessId, data);
       if (project) {
           setProjects([...projects, project]);
       }
   };

   // ✅ New way
   const { createProject } = useProjectMutations();
   const { refetch } = useProjects();
   
   const handleCreate = async (data) => {
       const project = await createProject(data);
       if (project) {
           refetch(); // Automatically refreshes the list
       }
   };
   ```

4. **Add Error Handling**
   ```typescript
   // ✅ New way includes automatic error handling
   const { projects, loading, error } = useProjects();
   
   if (error) {
       return <div>Error: {error}</div>;
   }
   ```

### Benefits of Migration:

1. **Centralized Authentication**: All API calls automatically include proper authentication
2. **Type Safety**: Full TypeScript support throughout the API chain
3. **Error Handling**: Consistent error handling across all endpoints
4. **Caching**: Built-in state management and caching in React hooks
5. **Reusability**: Hooks can be reused across multiple components
6. **Performance**: Optimized queries and mutations
7. **Scalability**: Easy to extend with new features
8. **Testing**: Easier to mock and test API interactions

## API Endpoints Reference

### Projects API (`/api/projects`)
- `GET /api/projects` - List projects (supports `?includeDetails=true&search=query`)
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project (supports `?includeDetails=true`)
- `PUT /api/projects/[id]` - Update project (supports `?progressOnly=true`)
- `DELETE /api/projects/[id]` - Delete project

### Project Relationships
- `GET /api/projects/client/[clientId]` - Get projects by client
- `GET /api/projects/profitability` - Get profitability analytics (supports filtering)

### Project Milestones (`/api/project-milestones`)
- `GET /api/project-milestones` - List milestones (supports `?projectId=id&search=query`)
- `POST /api/project-milestones` - Create milestone
- `GET /api/project-milestones/[id]` - Get milestone
- `PUT /api/project-milestones/[id]` - Update milestone
- `DELETE /api/project-milestones/[id]` - Delete milestone

### Project Issues (`/api/project-issues`)
- `GET /api/project-issues` - List issues (supports `?projectId=id&search=query&includeDetails=true`)
- `POST /api/project-issues` - Create issue
- `GET /api/project-issues/[id]` - Get issue
- `PUT /api/project-issues/[id]` - Update issue
- `DELETE /api/project-issues/[id]` - Delete issue

### Project Crews (`/api/project-crews`)
- `GET /api/project-crews` - List crew assignments (supports `?projectId=id&search=query`)
- `POST /api/project-crews` - Create crew assignment
- `GET /api/project-crews/[id]` - Get crew assignment
- `PUT /api/project-crews/[id]` - Update crew assignment
- `DELETE /api/project-crews/[id]` - Delete crew assignment

This migration provides a solid foundation for project management functionality with proper separation of concerns, type safety, and excellent developer experience.
