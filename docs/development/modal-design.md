Modal Styling Standardization Prompt:

Please update this modal component to match the exact styling and structure of our new equipment modal. Here are the specific requirements:

1. Overall Structure:

2. Header Section:

Use bg-primary text-primary-content p-6 rounded-t-lg
Include title on left and close button on right with flex justify-between items-center
Close button: btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary
Use FontAwesome fas fa-times icon for close button
Disable close button when loading
3. Body Section:

Use p-6 overflow-y-auto max-h-[75vh] for scrollable content
Organize form fields into cards with sections
Each section card: card bg-base-100 border border-base-300
Section headers: font-semibold text-lg mb-4 flex items-center gap-2 with appropriate FontAwesome icons
Use space-y-6 for spacing between sections
4. Form Field Styling:

Grid layout: grid grid-cols-1 md:grid-cols-2 gap-4 for most sections
Form controls: form-control wrapper
Labels: label with label-text font-medium spans
Inputs: input input-bordered input-secondary
Selects: select select-bordered select-secondary
Textareas: textarea textarea-bordered textarea-secondary
Required fields marked with asterisk (*)
5. Footer Section:

Use bg-base-200 p-6 rounded-b-lg border-t border-base-300
Button container: flex justify-end gap-3
Cancel button: btn btn-outline
Primary action button: btn btn-primary gap-2
Include loading states with spinner and text changes
Disable buttons appropriately during loading
6. Section Organization: Organize content into logical cards with these patterns:

Basic Information (fas fa-info-circle text-primary)
Details (fas fa-cogs text-primary)
Financial/Additional (fas fa-dollar-sign text-primary)
Location/Media (fas fa-map-marker-alt text-primary)
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
Please apply these exact styling patterns while preserving the specific functionality and form fields relevant to your modal's purpose.