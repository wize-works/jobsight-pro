# Equipment Rate Management Integration

## Overview

This enhancement integrates rate management functionality directly into the equipment creation and editing modals, solving the same UX issue we addressed for crew members. Previously, users had to navigate to a separate `/rate-management` page to set billing rates for equipment after creating/editing equipment items.

## Problem Statement

**Before**: 
- Equipment rate management was separated from equipment management
- Users had to:
  1. Create/edit equipment in the equipment modal
  2. Navigate to `/rate-management` page
  3. Find the equipment in the list
  4. Set the billing rate separately

**After**: 
- Equipment rate management is integrated into equipment creation/editing modals
- Users can set billing rates directly while creating/editing equipment
- Seamless, integrated workflow

## Implementation Details

### Files Modified

1. **`modal-new.tsx`** - Equipment creation modal
   - Added `setEquipmentRate` import from rate management actions
   - Added `BillingRate` type import
   - Extended form data structure with:
     - `is_billable: boolean` - Toggle for billable/non-billable equipment
     - `hourly_rate: number` - Hourly billing rate
   - Enhanced `handleSubmit` to save rate data after equipment creation
   - Added "Rate Management" UI section with:
     - Billable toggle switch
     - Hourly rate input field (shown only when billable)

2. **`modal-edit.tsx`** - Equipment editing modal
   - Added `setEquipmentRate` and `getEquipmentRate` imports
   - Added `BillingRate` type import
   - Extended form data structure with rate fields
   - Added `loadExistingRates()` function to load current rates
   - Enhanced `handleSubmit` to update rate data
   - Added "Rate Management" UI section

### UI Components Added

**Rate Management Section:**
```tsx
<div className="card bg-base-100 border border-base-300">
    <div className="card-body p-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <i className="far fa-money-bill-wave text-primary"></i>
            Rate Management
        </h3>
        <div className="form-control">
            <label className="label">
                <span className="label-text font-medium">Is Billable?</span>
            </label>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="is_billable"
                    className="toggle toggle-secondary"
                    checked={formData.is_billable}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_billable: e.target.checked }))}
                    disabled={loading}
                />
            </div>
        </div>
        {formData.is_billable && (
            <div className="form-control mt-4">
                <label className="label">
                    <span className="label-text font-medium">Hourly Rate</span>
                </label>
                <input
                    type="number"
                    name="hourly_rate"
                    className="input input-bordered input-secondary w-full"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                    disabled={loading}
                />
            </div>
        )}
    </div>
</div>
```

### Backend Integration

**Equipment Creation (modal-new.tsx):**
```tsx
const newEquipment = await createEquipment(businessId, equipmentData);

if (newEquipment) {
    // Set equipment rate if billable
    if (formData.is_billable && formData.hourly_rate > 0) {
        const rateData: BillingRate = {
            hourlyRate: formData.hourly_rate,
        };
        await setEquipmentRate(newEquipment.id, rateData);
    }
    // ... success handling
}
```

**Equipment Update (modal-edit.tsx):**
```tsx
const updatedEquipment = await updateEquipment(businessId, equipment.id, equipmentData);

if (updatedEquipment) {
    // Update equipment rates
    const rateData: BillingRate = {
        hourlyRate: formData.is_billable ? formData.hourly_rate : 0,
    };
    await setEquipmentRate(equipment.id, rateData);
    // ... success handling
}
```

## User Experience Improvements

### Before Integration
1. **Create Equipment**: Users fill out equipment form → Save → Navigate to rate management
2. **Set Rates**: Find equipment in rate management list → Set billing rate → Save
3. **Edit Equipment**: Navigate to equipment → Edit → Save → Navigate to rate management if rate changes needed

### After Integration
1. **Create Equipment**: Users fill out equipment form + set billing rate → Save (everything in one step)
2. **Edit Equipment**: Navigate to equipment → Edit form shows current rate → Update equipment and rate → Save (everything in one step)

## Technical Details

### Database Schema
The equipment table already includes:
- `is_billable: boolean` - Whether equipment is billable
- `hourly_rate: decimal(10,2)` - Hourly rate for billing

### Rate Management Actions Used
- `setEquipmentRate(equipmentId: string, rate: BillingRate)` - Set/update equipment rate
- `getEquipmentRate(equipmentId: string)` - Get current equipment rate

### Form Validation
- Hourly rate input only appears when `is_billable` is true
- Rate is set to 0 when equipment is non-billable
- Minimum rate value is 0
- Step value is 0.01 for decimal precision

## Testing Scenarios

### Equipment Creation
1. **Create Non-billable Equipment**: 
   - Toggle "Is Billable" to false
   - Verify hourly rate field is hidden
   - Save and verify rate is set to 0

2. **Create Billable Equipment**:
   - Toggle "Is Billable" to true
   - Enter hourly rate (e.g., 75.00)
   - Save and verify rate is saved correctly

### Equipment Editing
1. **Load Existing Rates**:
   - Open edit modal for equipment with existing rate
   - Verify current rate is loaded and displayed

2. **Update Rates**:
   - Change hourly rate value
   - Save and verify rate is updated

3. **Toggle Billable Status**:
   - Change from billable to non-billable
   - Verify rate is set to 0

## Benefits

1. **Improved UX**: Single-screen workflow for equipment and rate management
2. **Reduced Friction**: No need to navigate between different pages
3. **Better Context**: Rate management is contextually integrated with equipment data
4. **Consistency**: Matches the pattern established for crew member rate management
5. **Efficiency**: Faster workflow for users managing equipment rates

## Future Enhancements

1. **Rate History**: Could add rate history tracking within the modal
2. **Bulk Rate Updates**: Could add bulk rate update functionality
3. **Rate Templates**: Could add rate templates for common equipment types
4. **Rate Validation**: Could add business rule validation for rate ranges

## Conclusion

This enhancement significantly improves the user experience by integrating equipment rate management directly into the equipment creation and editing workflow. Users can now manage both equipment details and billing rates in a single, cohesive interface, eliminating the need to navigate between separate pages and reducing the complexity of the equipment management process.
