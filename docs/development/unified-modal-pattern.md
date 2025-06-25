# Unified Detail/Edit/Create Modal Pattern

## Overview

This document outlines the pattern for creating modals that can handle viewing details, editing existing records, and creating new records all in one component. This pattern was developed based on the `TaskDetailsModal` component and follows our standardized modal design guidelines.

## Key Features

- **Triple Functionality**: View details, edit existing, and create new records
- **Conditional Rendering**: Seamlessly switches between read-only and edit modes
- **Standardized Styling**: Follows our modal design system with DaisyUI (per modal-design.md)
- **Rich Content Layout**: Support for main content area with sidebar for actions and metadata
- **Type Safety**: Full TypeScript support with proper type guards
- **Responsive Design**: Works across all screen sizes
- **Modal Design Compliance**: Implements standardized header/body/footer structure

## Reference Implementation

The `TaskDetailsModal` component serves as the reference implementation of this pattern, demonstrating:

- **Header**: Standardized primary header with title, badges, and close button
- **Body**: Rich two-column layout with main content (Progress, Basic Information, Task Details) and sidebar (Actions, Task Info, Time Tracking)
- **Footer**: Standardized footer with Cancel/Save or Edit/Delete buttons depending on mode
- **DaisyUI Integration**: Uses card-based sections with proper borders, form controls with input-secondary/select-secondary styling
- **Comprehensive Functionality**: Handles task creation, editing, and detailed viewing with timeline and progress tracking

This implementation successfully merged user-preferred rich functionality with standardized modal structure guidelines.

## Implementation Pattern

### 1. Interface Design

```typescript
interface UnifiedModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: RecordType | null; // null = create mode
    relatedData?: RelatedType[];
    onRecordUpdate: (updatedRecord: RecordType) => void;
    onRecordDelete: (recordId: string) => void;
    onRecordCreate?: (newRecord: RecordType) => void;
}
```

**Key Points:**
- `record: null` indicates creation mode
- Optional `onRecordCreate` callback for handling new record creation
- Include related data (like dropdown options) as props

### 2. State Management

```typescript
const isCreating = !record;
const isEditing = isCreating; // Always edit mode for creation
const [isUpdating, setIsUpdating] = useState(false);
const [formData, setFormData] = useState<Partial<RecordUpdate>>({});

useEffect(() => {
    if (isOpen) {
        if (record) {
            // Populate with existing data
            setFormData({ ...record });
        } else {
            // Initialize with defaults for creation
            setFormData({
                name: '',
                status: 'default_status',
                // ... other defaults
            });
        }
    }
}, [record, isOpen]);
```

### 3. Header Structure

```typescript
<div className="bg-primary text-primary-content p-6 rounded-t-lg">
    <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold">
                {isCreating ? 'Create New Record' : 'Record Details'}
            </h2>
            {record && (
                <div className="flex items-center gap-2 mt-2">
                    {/* Status badges and additional info */}
                </div>
            )}
        </div>
        <button 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
            disabled={isUpdating}
        >
            <i className="far fa-times"></i>
        </button>
    </div>
</div>
```

### 4. Body Content Organization

Organize content into logical cards with consistent patterns:

```typescript
{/* Basic Information */}
<div className="card bg-base-100 border border-base-300">
    <div className="card-body p-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <i className="far fa-info-circle text-primary"></i>
            Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form fields */}
        </div>
    </div>
</div>
```

**Section Icons:**
- Basic Information: `far fa-info-circle`
- Details/Configuration: `far fa-cogs`
- Schedule/Timeline: `far fa-calendar-alt`
- Description/Content: `far fa-file-text`
- Location: `far fa-map-marker-alt`
- Financial: `far fa-dollar-sign`
- History/Timeline: `far fa-clock`

### 5. Conditional Field Rendering

```typescript
{isEditing ? (
    <input
        type="text"
        value={formData.name || ''}
        onChange={(e) => handleInputChange('name', e.target.value)}
        className="input input-bordered input-secondary w-full"
        placeholder="Enter name"
        disabled={isUpdating}
    />
) : (
    <div className="py-2 text-lg font-medium">{record?.name}</div>
)}
```

### 6. Unified Save Handler

```typescript
const handleSave = async () => {
    try {
        setIsUpdating(true);
        
        if (isCreating) {
            // Validation
            if (!formData.name?.trim()) {
                toast.error("Please fill in required fields");
                return;
            }
            
            const newRecord = await createRecord(businessId, formData);
            if (newRecord && onRecordCreate) {
                onRecordCreate(newRecord);
            }
            onClose();
            toast.success("Record created successfully!");
        } else {
            const updatedRecord = await updateRecord(businessId, record!.id, formData);
            onRecordUpdate(updatedRecord);
            toast.success("Record updated successfully!");
        }
    } catch (error) {
        toast.error(isCreating ? "Failed to create record" : "Failed to update record");
    } finally {
        setIsUpdating(false);
    }
};
```

### 7. Footer Actions

```typescript
<div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
    <div className="flex justify-end gap-3">
        <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isUpdating}
        >
            Cancel
        </button>
        
        {record && !isEditing && (
            <button
                onClick={handleDelete}
                className="btn btn-error gap-2"
                disabled={isUpdating}
            >
                <i className="far fa-trash"></i>
                Delete
            </button>
        )}
        
        <button
            onClick={handleSave}
            className="btn btn-primary gap-2"
            disabled={isUpdating || !formData.name?.trim()}
        >
            {isUpdating ? (
                <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {isCreating ? 'Creating...' : 'Updating...'}
                </>
            ) : (
                <>
                    <i className={isCreating ? "far fa-plus" : "far fa-save"}></i>
                    {isCreating ? 'Create Record' : 'Update Record'}
                </>
            )}
        </button>
    </div>
</div>
```

## Usage Examples

### Opening for Creation
```typescript
<button onClick={() => setTaskModalOpen(true)}>
    <i className="far fa-plus mr-2"></i>
    New Task
</button>

<TaskDetailsModal
    isOpen={taskModalOpen}
    onClose={() => setTaskModalOpen(false)}
    task={null} // null = create mode
    projects={projects}
    crews={crews}
    onTaskCreate={(newTask) => {
        setTasks(prev => [...prev, newTask]);
        setTaskModalOpen(false);
    }}
    onTaskUpdate={() => {}}
    onTaskDelete={() => {}}
/>
```

### Opening for Editing
```typescript
<button onClick={() => {
    setSelectedTask(task);
    setTaskModalOpen(true);
}}>
    <i className="far fa-edit mr-2"></i>
    Edit
</button>

<TaskDetailsModal
    isOpen={taskModalOpen}
    onClose={() => {
        setTaskModalOpen(false);
        setSelectedTask(null);
    }}
    task={selectedTask}
    crews={crews}
    onTaskUpdate={(updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }}
    onTaskDelete={(taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setTaskModalOpen(false);
        setSelectedTask(null);
    }}
    onTaskCreate={() => {}}
/>
```

## Benefits

1. **DRY Principle**: Single component handles all CRUD operations
2. **Consistent UX**: Users get familiar with one modal pattern
3. **Reduced Bundle Size**: Less duplicate code across components
4. **Easier Maintenance**: Changes apply to all modes simultaneously
5. **Type Safety**: Shared interfaces ensure consistency

## Best Practices

### Form Validation
- Always validate required fields before submission
- Show clear error messages for validation failures
- Disable submit button when form is invalid

### Loading States
- Show loading spinners during async operations
- Disable all interactive elements during updates
- Provide clear feedback for success/error states

### Accessibility
- Use proper ARIA labels for all form elements
- Ensure keyboard navigation works correctly
- Provide clear focus indicators

### Performance
- Initialize form data in useEffect to avoid unnecessary renders
- Use proper dependency arrays to prevent effect loops
- Consider debouncing for expensive operations

### Error Handling
- Always wrap async operations in try/catch blocks
- Provide user-friendly error messages
- Log detailed errors to console for debugging

## Component Structure Checklist

- [ ] Proper TypeScript interfaces with optional creation props
- [ ] State management for creation vs. edit modes
- [ ] Unified save handler for create/update operations
- [ ] Conditional rendering for read-only vs. edit fields
- [ ] Standardized modal structure (header/body/footer)
- [ ] Loading states and proper disabled states
- [ ] Error handling and user feedback
- [ ] Responsive design with proper grid layouts
- [ ] Accessibility features (labels, ARIA attributes)
- [ ] Consistent styling with DaisyUI classes

## Migration from Separate Modals

When converting from separate create/edit modals:

1. Combine interfaces, making record prop nullable
2. Add creation logic to existing update handler
3. Update conditional rendering throughout component
4. Merge default values for creation mode
5. Update parent component usage patterns
6. Test all three modes thoroughly

This pattern significantly improves code maintainability while providing a superior user experience through consistent modal interactions.
