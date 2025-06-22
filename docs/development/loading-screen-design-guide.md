# Loading Screen Design Guide

This document provides comprehensive guidance for implementing consistent, effective skeleton loading screens throughout the JobSight Pro application.

## Overview

Skeleton loading screens provide visual feedback during data loading, creating a smooth user experience by showing content placeholders that mirror the actual UI structure. This approach reduces perceived loading time and maintains visual consistency.

## Design Principles

### 1. Structural Mimicry
- **Match Layout**: Skeleton components should mirror the exact structure of the loaded content
- **Preserve Spacing**: Maintain identical margins, padding, and gaps
- **Component Hierarchy**: Use the same grid layouts, card structures, and content arrangements

### 2. Visual Consistency
- **DaisyUI Classes**: Use DaisyUI utility classes for consistent styling
- **Animation**: Apply subtle pulse animations using `animate-pulse`
- **Color Scheme**: Use neutral grays that work in both light and dark themes

### 3. Performance
- **Lightweight**: Keep skeleton components simple and fast to render
- **Local Loading**: Each page/component should have its own `loading.tsx` file
- **No External Dependencies**: Avoid heavy libraries for skeleton implementations

## Implementation Standards

### File Structure
```
src/app/dashboard/[feature]/
├── page.tsx                 # Main feature page
├── loading.tsx             # Feature list skeleton
├── [id]/
│   ├── page.tsx           # Detail page
│   └── loading.tsx        # Detail skeleton
└── components/
    └── [feature-components].tsx
```

### Naming Conventions
- **List Pages**: `[Feature]Loading` (e.g., `ProjectsLoading`, `ClientsLoading`)
- **Detail Pages**: `[Feature]DetailLoading` (e.g., `ProjectDetailLoading`, `ClientDetailLoading`)
- **Export**: Always use default export for loading components

### Component Structure Template
```typescript
export default function [Feature]Loading() {
    return (
        <div className="p-6 space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            
            {/* Content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}
```

## Component Patterns

### 1. List/Grid Layouts
For pages displaying multiple items (projects, clients, etc.):

```typescript
// Basic grid skeleton
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm border">
            <div className="card-body">
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-4"></div>
                <div className="flex justify-between">
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
            </div>
        </div>
    ))}
</div>
```

### 2. Detail Layouts
For detail pages with sidebar and main content:

```typescript
// Sidebar + main content layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Sidebar skeleton */}
    <div className="lg:col-span-1">
        <div className="card bg-base-100 shadow-sm border">
            <div className="card-body space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
        </div>
    </div>
    
    {/* Main content skeleton */}
    <div className="lg:col-span-2 space-y-6">
        {/* Content cards */}
    </div>
</div>
```

### 3. Table Layouts
For data tables and lists:

```typescript
// Table skeleton
<div className="overflow-x-auto">
    <table className="table table-zebra w-full">
        <thead>
            <tr>
                {[...Array(5)].map((_, i) => (
                    <th key={i}>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {[...Array(8)].map((_, i) => (
                <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                        <td key={j}>
                            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
</div>
```

## DaisyUI Class Standards

### Container Classes
- `card`: For card-based layouts
- `card-body`: For card content with proper padding
- `bg-base-100`: For card backgrounds
- `shadow-sm`: For subtle shadows
- `border`: For card borders

### Layout Classes
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`: Responsive grids
- `space-y-4`, `space-y-6`: Vertical spacing
- `gap-4`, `gap-6`: Grid gaps
- `p-4`, `p-6`: Padding
- `flex justify-between items-center`: Header layouts

### Skeleton Element Classes
- `bg-gray-200`: Base skeleton color (works with dark mode)
- `animate-pulse`: Subtle animation
- `rounded`: Basic border radius
- `h-4`, `h-6`, `h-8`: Height utilities
- `w-1/2`, `w-3/4`, `w-full`: Width utilities

## Responsive Design

### Breakpoint Strategy
- **Mobile**: Single column layouts, simplified content
- **Tablet**: Two-column grids, expanded cards
- **Desktop**: Three+ column grids, full feature display

### Example Responsive Grid
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
    {/* Responsive skeleton cards */}
</div>
```

## Animation Guidelines

### Pulse Animation
- Use `animate-pulse` for all skeleton elements
- Avoid custom animations to maintain consistency
- Apply to individual elements, not containers

### Timing Considerations
- Keep animations subtle and non-distracting
- Ensure animations don't cause performance issues
- Consider reduced motion preferences

## Accessibility

### Screen Reader Support
- Use proper semantic HTML elements
- Include `aria-label` for loading states
- Provide loading announcements

```typescript
<div 
    role="status" 
    aria-label="Loading content"
    className="sr-only"
>
    Loading...
</div>
```

### Motion Sensitivity
- Respect `prefers-reduced-motion` settings
- Provide non-animated alternatives when needed

## Integration Patterns

### With Loading States
```typescript
// In page components
if (loading) {
    return <FeatureLoading />;
}

// With suspense boundaries
<Suspense fallback={<FeatureLoading />}>
    <FeatureComponent />
</Suspense>
```

### Error Handling
- Distinguish between loading and error states
- Provide appropriate fallbacks for failed loads
- Maintain skeleton structure even in error states

## Quality Checklist

### Before Implementation
- [ ] Analyzed the target component's structure
- [ ] Identified key visual elements to skeleton
- [ ] Planned responsive behavior
- [ ] Considered loading time expectations

### During Implementation
- [ ] Used appropriate DaisyUI classes
- [ ] Maintained consistent spacing and layout
- [ ] Applied proper animation
- [ ] Tested across breakpoints

### After Implementation
- [ ] Verified visual match with loaded content
- [ ] Tested with actual loading delays
- [ ] Confirmed accessibility compliance
- [ ] Validated performance impact

## Common Patterns by Feature

### Dashboard Overview
- **Stats Cards**: 2x2 or 3x1 grids with metric placeholders
- **Charts**: Rectangle placeholders with appropriate aspect ratios
- **Recent Activity**: List items with avatar, text, and timestamp placeholders

### Project Features
- **Project Cards**: Title, description, progress bar, status badge
- **Timeline Views**: Date markers with content blocks
- **Gantt Charts**: Horizontal bars with varying widths

### Resource Management
- **Personnel Lists**: Avatar, name, role, status indicators
- **Equipment Grids**: Image placeholder, title, specs, availability
- **Inventory Tables**: SKU, description, quantity, status columns

## Error Prevention

### Common Mistakes
- **Layout Mismatch**: Skeleton doesn't match loaded content layout
- **Inconsistent Sizing**: Heights and widths don't align with real content
- **Over-Animation**: Too many or too fast animations
- **Poor Performance**: Heavy skeleton components that load slowly

### Testing Strategy
- **Visual Comparison**: Side-by-side skeleton vs. loaded content
- **Network Throttling**: Test with slow connections
- **Responsive Testing**: Verify across all breakpoints
- **Accessibility Testing**: Screen reader and keyboard navigation

## Future Considerations

### Advanced Features
- **Progressive Loading**: Show skeleton elements as data arrives
- **Smart Skeletons**: Adapt based on expected content size
- **Theme Integration**: Automatic dark/light mode adaptation

### Performance Optimization
- **Component Sharing**: Reusable skeleton components across features
- **Lazy Loading**: Skeleton-to-content transitions
- **Memory Efficiency**: Lightweight implementations

This guide ensures consistent, effective loading experiences across the entire JobSight Pro application while maintaining performance and accessibility standards.
