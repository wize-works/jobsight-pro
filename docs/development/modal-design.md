Modal Styling Standardization Prompt:

Please update this modal component to match the exact styling and structure of our new equipment modal. Here are the specific requirements:

1. Overall Structure:
- Use a flex column layout for the modal box: `flex flex-col`
- Set appropriate height limits: `style={{ maxHeight: "90vh", height: "auto" }}`
- Modal box class: `modal-box max-w-2xl p-0 rounded-lg flex flex-col`
- **Important**: Always include `rounded-lg` to ensure corners are properly rounded and no white corners appear

2. Header Section:
- Add `flex-shrink-0` to ensure header never collapses
- Use bg-primary text-primary-content p-6 rounded-t-lg
- The `rounded-t-lg` class is critical to match the modal box's rounded top corners
- Include title on left and close button on right with flex justify-between items-center
- Close button: btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary
- Use FontAwesome far fa-times icon for close button
- Disable close button when loading

3. Body Section:
- Use dynamically calculated height: `style={{ maxHeight: "calc(90vh - 145px)" }}`
- Make content scrollable: `p-6 overflow-y-auto`
- Organize form fields into cards with sections
- Each section card: card bg-base-100 border border-base-300
- Section headers: font-semibold text-lg mb-4 flex items-center gap-2 with appropriate FontAwesome icons
- Use space-y-6 for spacing between sections
4. Form Field Styling:

Grid layout: grid grid-cols-1 md:grid-cols-2 gap-4 for most sections
Form controls: form-control wrapper
Labels: label with label-text font-medium spans
Inputs: input input-bordered input-secondary
Selects: select select-bordered select-secondary
Textareas: textarea textarea-bordered textarea-secondary
Required fields marked with asterisk (*)
5. Footer Section:
- Add `flex-shrink-0` to ensure footer is always visible
- Use bg-base-200 p-6 rounded-b-lg border-t border-base-300
- The `rounded-b-lg` class is required to match the modal box's rounded bottom corners
- Button container: flex justify-end gap-3
- Cancel button: btn btn-outline
- Primary action button: btn btn-primary gap-2
- Include loading states with spinner and text changes
- Disable buttons appropriately during loading
6. Section Organization: Organize content into logical cards with these patterns:

Basic Information (far fa-info-circle text-primary)
Details (far fa-cogs text-primary)
Financial/Additional (far fa-dollar-sign text-primary)
Location/Media (far fa-map-marker-alt text-primary)
7. Loading States:

Add loading spinner: <span className="loading loading-spinner loading-sm"></span>
Change button text during loading (e.g., "Creating...", "Updating...", "Saving...")
Disable all interactive elements when loading
8. Responsive Design:

Use responsive grid classes (md:grid-cols-2)
Ensure mobile-friendly spacing and layout
Maintain readability on all screen sizes
9. Icons and Visual Elements:

Use FontAwesome icons consistently
Apply text-primary to section icons
Maintain visual hierarchy with proper typography
Additional Notes:

Keep the same color scheme (primary, secondary, base colors)
Maintain consistent spacing using Tailwind classes
Ensure accessibility with proper labels and ARIA attributes
Follow the same error handling and toast notification patterns
Use the same form validation approach
Make sure the header and footer are always visible with only the content area scrolling
For long forms, prioritize keeping action buttons visible at all times
Pay special attention to rounded corners - missing any of the `rounded-lg`, `rounded-t-lg`, or `rounded-b-lg` classes will cause white corners to appear
Please apply these exact styling patterns while preserving the specific functionality and form fields relevant to your modal's purpose.