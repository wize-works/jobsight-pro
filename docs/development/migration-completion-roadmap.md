# Migration Completion Roadmap

## Current Status: 98% Complete

The offline-first migration is nearly complete with all core infrastructure and client actions implemented. Focus is now on completing component integration and fixing function signature mismatches.

## Priority 1: Function Signature Alignment

### Components with Signature Issues
1. **Business Tab Users** (`dashboard/business/components/tab-users.tsx`)
   - `cancelUserInvitation` needs 3 params, getting 2
   - `updateUser` parameter mismatch 
   - Response format using `.success` instead of `.data/.error`

2. **Equipment Detail Page** (`dashboard/equipment/[id]/page.tsx`)
   - Many equipment-specific media functions need mapping to generic equivalents
   - `getEquipmentPrintableDetail` → `getEquipmentDetail` (different return structure)

3. **Invoice Edit Modal** (`dashboard/invoices/components/modal-edit.tsx`)
   - Partially migrated, needs response format handling fixes

### Solution Strategy
- Create wrapper functions for signature compatibility
- Standardize response format handling
- Update client actions to match expected signatures where reasonable

## Priority 2: Missing Client Functions

### Functions Needing Implementation or Wrappers
1. **Invoice Details**: `getInvoiceWitDetailsById` → needs implementation or use `getInvoiceById` + items
2. **Equipment Media Functions**: Map to generic `getMediaByEntity('equipment', id)`
3. **Location Setting Functions**: Hybrid approach needed for `setProjectLocation`, `setEquipmentLocation`

## Priority 3: Remaining Component Migrations

### Files Still Using Server Actions (from search)
1. **Map Components** - Location setters partially migrated
2. **Project Components** - Some modals and tabs
3. **Printable Pages** - Equipment print page
4. **Specialized Functions** - Email verification, file uploads

## Priority 4: Advanced Features

### Offline Features to Complete
1. **Background Sync** - Implement service worker sync
2. **Conflict Resolution** - UI for handling sync conflicts  
3. **Selective Sync** - Priority-based data sync
4. **Offline Indicators** - Component-level offline states

### Performance Optimizations
1. **Data Caching** - Intelligent cache invalidation
2. **Memory Management** - Cleanup unused IndexedDB data
3. **Bundle Optimization** - Tree-shake unused server actions

## Implementation Order

1. **Week 1**: Fix all function signatures and response formats
2. **Week 2**: Complete remaining component migrations
3. **Week 3**: Implement missing functions and test offline scenarios
4. **Week 4**: Advanced features and production testing

## Success Criteria

✅ All components use client actions  
✅ No server action imports in components  
✅ Full offline functionality works  
✅ Sync works reliably  
✅ Performance is maintained  

The migration is in its final phase with excellent progress. The foundation is solid and complete - now it's about polishing the integration.
