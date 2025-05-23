Okay, let's break down the explicit components, pages, and structure for building the JobSight MVP using Next.js 15 App Router, Shadcn UI, TailwindCSS, and Clerk, based on your PRD and previous descriptions.

---

## 📁 Proposed Directory Structure (`/app` focus)

```
/app
├── (authenticated)                 # Group for routes requiring login
│   ├── layout.tsx                  # Main app shell (Sidebar/Header) for logged-in users
│   ├── dashboard                   # Optional: If you want a dedicated dashboard page
│   │   └── page.tsx
│   ├── projects
│   │   ├── layout.tsx              # Optional: Layout specific to projects section
│   │   ├── page.tsx                # Project List view
│   │   ├── [projectId]             # Dynamic route for a single project
│   │   │   ├── layout.tsx          # Layout for a single project view (e.g., project header)
│   │   │   ├── page.tsx            # Default view (e.g., Project Info/Overview)
│   │   │   ├── tasks               # Optional: Sub-page for tasks if complex
│   │   │   │   └── page.tsx
│   │   │   ├── logs                # Sub-page for logs
│   │   │   │   ├── page.tsx        # Log list view for the project
│   │   │   │   └── new             # Page for creating a new log
│   │   │   │       └── page.tsx
│   │   │   └── invoicing           # Sub-page for invoicing
│   │   │       └── page.tsx
│   │   └── new                     # Optional: Dedicated page for creating projects
│   │       └── page.tsx            # Or use a Dialog/Modal from the list page
│   ├── settings
│   │   ├── page.tsx                # Main settings page
│   │   └── organization            # Clerk's org management or custom
│   │       └── page.tsx
│   └── ai-query                    # Optional: Dedicated page for AI Assistant
│       └── page.tsx
├── (authentication)                # Group for auth pages
│   ├── layout.tsx                  # Simple layout for auth pages (e.g., centered)
│   ├── sign-in/[[...sign-in]]      # Clerk's sign-in route handler
│   │   └── page.tsx
│   ├── sign-up/[[...sign-up]]      # Clerk's sign-up route handler
│   │   └── page.tsx
│   └── user-profile/[[...user-profile]] # Clerk's user profile route handler
│       └── page.tsx
├── layout.tsx                      # Root layout (ClerkProvider, ThemeProvider, etc.)
├── page.tsx                        # Landing page or redirect logic
├── manifest.json                   # PWA Manifest
├── globals.css                     # Global styles (Tailwind base, etc.)
└── ... (other root files like icons)

/components
├── ui                              # Shadcn UI components (button, input, card etc.)
├── core                            # Core application components
│   ├── AppShell.tsx                # Combines Sidebar/Header logic
│   ├── SidebarNav.tsx
│   ├── Header.tsx
│   ├── ThemeToggle.tsx
│   └── OfflineIndicator.tsx
├── features                        # Components specific to features
│   ├── projects
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── CreateProjectForm.tsx   # Could be Dialog content
│   │   └── ProjectDetails.tsx
│   ├── tasks
│   │   ├── TaskItem.tsx
│   │   ├── TaskList.tsx
│   │   └── CreateTaskForm.tsx      # Could be Dialog content
│   ├── logs
│   │   ├── DailyLogForm.tsx
│   │   ├── LogItem.tsx
│   │   ├── LogList.tsx
│   │   ├── VoiceInputButton.tsx
│   │   └── MediaUploader.tsx
│   ├── invoicing
│   │   ├── InvoiceGenerator.tsx
│   │   └── InvoicePreview.tsx
│   └── ai
│       └── AIQueryInterface.tsx
└── providers                       # Client-side provider components
    └── ThemeProvider.tsx           # Example: using next-themes

/lib                                # Utility functions, constants, hooks
├── api.ts                          # Functions for backend API calls (GraphQL/REST)
├── hooks                           # Custom hooks (e.g., useOfflineSync, usePermissions)
├── utils.ts                        # General utility functions (date formatting, etc.)
└── db                              # Placeholder for potential offline DB interactions (IndexedDB wrapper)

/styles                             # Custom CSS if needed beyond Tailwind/globals

/public                             # Static assets (images, icons)
```

---

## 📄 Core Layout & Providers (`/app/layout.tsx`)

*   **Component:** `RootLayout` (`/app/layout.tsx`)
*   **Type:** Server Component (can contain Client Components)
*   **Responsibilities:**
    *   Basic HTML structure (`<html>`, `<body>`).
    *   Load `Outfit` font (e.g., via `@next/font/google`).
    *   Import `/app/globals.css`.
    *   Wrap children with `<ClerkProvider>`.
    *   Wrap children with `<ThemeProvider>` (e.g., from `next-themes`, configured with Tailwind).
    *   Wrap children with GraphQL Client Provider (if using Apollo/urql).
    *   Include Toaster component (`<Toaster />` from `react-hot-toast` or Shadcn's `Toast`).
    *   Link to `manifest.json` in `<head>`.
    *   Set base metadata (title, description).

---

## 🔐 Authentication Pages (`/app/(authentication)/*`)

*   **Layout:** `/app/(authentication)/layout.tsx` - Simple centered layout (e.g., `flex items-center justify-center min-h-screen`).
*   **Pages:** `/app/(authentication)/sign-in/[[...sign-in]]/page.tsx`, `/sign-up/.../page.tsx`
    *   **Type:** Client Component (likely just wrapping Clerk's component).
    *   **Content:** Render the corresponding Clerk component (`<SignIn />`, `<SignUp />`). Use `routing="path"` and `path` props according to Clerk docs for App Router.

---

##  authenticated)/*`)

### 1. Authenticated Layout (`/app/(authenticated)/layout.tsx`)

*   **Component:** `AuthenticatedLayout`
*   **Type:** Server Component (can contain Client Components)
*   **Responsibilities:**
    *   Fetch basic user/organization data (e.g., using Clerk's `auth()` helper).
    *   Render the main application shell: `<AppShell>`.
    *   Pass user role and necessary data down to `<AppShell>`.
    *   Include `<OfflineIndicator />`.
    *   Render `{children}` within the main content area of the shell.

### 2. App Shell (`/components/core/AppShell.tsx`)

*   **Component:** `AppShell`
*   **Type:** Client Component (needs interaction for mobile nav, theme toggle)
*   **Props:** `userRole`, `children`.
*   **Responsibilities:**
    *   Responsive layout (Sidebar + Header on desktop, Bottom Nav/Hamburger + Header on mobile).
    *   Render `<Header>` component.
    *   Render `<SidebarNav>` (conditionally based on screen size/role).
    *   Render Bottom Navigation (conditionally based on screen size).
    *   Render the main content area (`<main>{children}</main>`).

### 3. Header (`/components/core/Header.tsx`)

*   **Component:** `Header`
*   **Type:** Client Component
*   **Content:**
    *   Mobile: Hamburger menu button (opens/closes Sidebar/Drawer), Logo/App Name.
    *   Desktop: Logo/App Name.
    *   Common: `<ThemeToggle />`, Clerk's `<UserButton />`. May include Org switcher later.

### 4. Sidebar Navigation (`/components/core/SidebarNav.tsx`)

*   **Component:** `SidebarNav`
*   **Type:** Client Component (or Server if links are static per role fetched in layout)
*   **Props:** `userRole`.
*   **Content:**
    *   Links to main sections (`/projects`, `/settings`, `/ai-query` etc.).
    *   Uses Shadcn `Button` with `variant="ghost"` or custom NavLink component.
    *   Conditionally renders links based on `userRole` (e.g., Settings/Org management only for Admin/Manager).
    *   Highlights the active link based on the current route (`usePathname`).

### 5. Project List Page (`/app/(authenticated)/projects/page.tsx`)

*   **Component:** `ProjectsPage`
*   **Type:** Server Component (ideal for fetching data)
*   **Responsibilities:**
    *   Fetch list of projects (apply filters server-side if possible). Use `auth()` to get org ID for filtering.
    *   Render page title ("Projects").
    *   Render filter controls (`<Select>` for status - potentially a Client Component if complex interaction needed).
    *   Render `<ProjectList>` component, passing the fetched projects.
    *   Render a "Create Project" button (using `<Dialog>` wrapping `<CreateProjectForm>`).
*   **Loading:** `/app/(authenticated)/projects/loading.tsx` - Render skeleton loaders for the project cards.

### 6. Project List Component (`/components/features/projects/ProjectList.tsx`)

*   **Component:** `ProjectList`
*   **Type:** Server or Client Component (depends if filtering happens client-side)
*   **Props:** `projects: Project[]`.
*   **Responsibilities:**
    *   Map over `projects` array.
    *   Render a `<ProjectCard>` for each project.
    *   Arrange cards in a responsive grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).

### 7. Project Card Component (`/components/features/projects/ProjectCard.tsx`)

*   **Component:** `ProjectCard`
*   **Type:** Server Component (if just displaying data)
*   **Props:** `project: Project`.
*   **Content:** Use Shadcn `Card`.
    *   `CardHeader`: `CardTitle` (Project Name), `CardDescription` (Client Name/Dates).
    *   `CardContent`: Key info (Status Badge).
    *   `CardFooter`: Link/Button (`<Link href={`/projects/${project._id}`}>View</Link>`) styled as a button.

### 8. Create Project Form (`/components/features/projects/CreateProjectForm.tsx`)

*   **Component:** `CreateProjectForm`
*   **Type:** Client Component (handles form state and submission)
*   **Content:**
    *   Uses Shadcn `Form` component (`react-hook-form` + `zod` recommended).
    *   Fields: `Input` for Name, Client, Address; `DatePicker` for Start/End Dates.
    *   Submission handler: Calls API function (`lib/api.ts`) to create the project. Handles loading/error states. Shows Toasts for feedback. Closes Dialog on success. Refreshes project list (e.g., using `router.refresh()`).

### 9. Project Detail Page (`/app/(authenticated)/projects/[projectId]/page.tsx` and sub-pages)

*   **Layout:** `/app/(authenticated)/projects/[projectId]/layout.tsx` - Fetches project details (`params.projectId`), displays Project Title in a header, potentially includes tabs or navigation specific to the project view.
*   **Pages:**
    *   `page.tsx` (Overview): Displays `ProjectDetails` component.
    *   `tasks/page.tsx`: Fetches tasks for the project, renders `<TaskList>`. Includes "Add Task" Dialog.
    *   `logs/page.tsx`: Fetches logs for the project, renders `<LogList>`. Includes "Add Log" button linking to `logs/new`.
    *   `logs/new/page.tsx`: Renders the `<DailyLogForm>` component.
    *   `invoicing/page.tsx`: Renders the `<InvoiceGenerator>` component.
*   **Loading:** Corresponding `loading.tsx` files for each section, showing skeletons for tasks, logs etc.

### 10. Task List Component (`/components/features/tasks/TaskList.tsx`)

*   **Component:** `TaskList`
*   **Type:** Client Component (likely needs client-side updates for status changes)
*   **Props:** `tasks: Task[]`, `projectId`, `userRole`.
*   **Responsibilities:**
    *   Filter/Sort controls (optional).
    *   Map over `tasks`. Render `<TaskItem>` for each.
    *   Handles task status updates via API calls within `<TaskItem>`.

### 11. Task Item Component (`/components/features/tasks/TaskItem.tsx`)

*   **Component:** `TaskItem`
*   **Type:** Client Component
*   **Props:** `task: Task`, `userRole`.
*   **Content:**
    *   Use `Card` or simple `div` with flex layout.
    *   `Checkbox` or `Select` dropdown for status updates (triggers API call onChange). Disable if user doesn't have permission.
    *   Task Title, Assignee (`Avatar`), Due Date, Critical Icon (`<AlertTriangle>` if critical).
    *   Edit/Delete buttons (conditionally rendered based on role, might open a Dialog with `<CreateTaskForm>` pre-filled).

### 12. Daily Log Form Component (`/components/features/logs/DailyLogForm.tsx`)

*   **Component:** `DailyLogForm`
*   **Type:** Client Component (heavy interaction, state, offline logic)
*   **Props:** `projectId`.
*   **Content:**
    *   Shadcn `Form` (`react-hook-form`/`zod`).
    *   Inputs for structured fields (Weather `Select`, Temp `Input type="number"`, Crew Size `Input type="number"`).
    *   `Textarea` for Notes.
    *   `<VoiceInputButton>` component nearby Notes.
    *   "Summarize Notes" `Button` (calls AI API).
    *   `<MediaUploader>` component.
    *   Submit `Button`.
*   **Logic:**
    *   Handles form state.
    *   Calls voice transcription API.
    *   Calls summarization API.
    *   **Offline:** Uses `useOfflineSync` hook (from `/lib/hooks`) to wrap the form submission. If offline, saves data (form state + media refs) to IndexedDB via the hook. If online, submits directly via API.

### 13. Voice Input Button (`/components/features/logs/VoiceInputButton.tsx`)

*   **Component:** `VoiceInputButton`
*   **Type:** Client Component
*   **Props:** `onTranscriptionComplete: (text: string) => void`.
*   **Content:** Microphone `Button` icon.
*   **Logic:** Uses browser MediaRecorder API to capture audio. Sends audio blob to backend API endpoint for transcription (Whisper). Calls `onTranscriptionComplete` with the result. Handles recording state UI (e.g., pulsating icon).

### 14. Media Uploader (`/components/features/logs/MediaUploader.tsx`)

*   **Component:** `MediaUploader`
*   **Type:** Client Component
*   **Props:** `onFilesChange: (files: File[]) => void`.
*   **Content:** "Attach Media" `Button`. Hidden file `Input`. Area to display thumbnails of selected/uploaded files with remove buttons.
*   **Logic:** Handles file selection (camera/gallery via input capture attributes). Updates parent form state via `onFilesChange`. **Offline:** When form submits offline, the actual file blobs might need temporary storage (IndexedDB supports blobs) or references to be uploaded later by the sync mechanism.

### 15. Invoice Generator (`/components/features/invoicing/InvoiceGenerator.tsx`)

*   **Component:** `InvoiceGenerator`
*   **Type:** Client Component
*   **Props:** `projectId`.
*   **Content:**
    *   Fetch and display list of Daily Logs for the project (potentially with checkboxes or date range selectors).
    *   `Input` for manual total amount (MVP).
    *   `Button` "Generate PDF" (calls backend API, triggers download or displays preview).
    *   `Button` "Email Invoice" (opens Dialog with email input, calls backend API).
    *   `<InvoicePreview>` component (optional inline preview).

### 16. AI Query Interface (`/components/features/ai/AIQueryInterface.tsx`)

*   **Component:** `AIQueryInterface`
*   **Type:** Client Component
*   **Content:**
    *   Chat-like display area for conversation history.
    *   `Input` field for typing queries.
    *   Submit `Button`.
*   **Logic:** Maintains chat state. Sends query to backend AI endpoint via API call. Displays response. Handles loading/error states.

### 17. Offline Indicator (`/components/core/OfflineIndicator.tsx`)

*   **Component:** `OfflineIndicator`
*   **Type:** Client Component
*   **Logic:** Uses `useState` and `useEffect` to listen to `window.online` and `window.offline` events. Checks status of a hypothetical sync queue (e.g., from `useOfflineSync` hook context).
*   **Content:** Displays a small badge/icon/text (e.g., "Offline", "Syncing...", "Synced") usually in the header or footer.

---

## ✨ Key Implementation Considerations:

*   **State Management:** Use `useState` and `useReducer` for local component state. Consider Zustand or Jotai for minimal global state if needed (e.g., sync queue status). Avoid complex Redux unless necessary.
*   **Data Fetching:** Leverage Server Components for initial data loads. Use `fetch` or a lightweight GraphQL client (like `graphql-request` or `urql`) within Server/Client components or dedicated API functions in `/lib/api.ts`. Use `router.refresh()` to refetch server component data after mutations.
*   **Forms:** Strongly recommend `react-hook-form` + `zod` integrated with Shadcn's `Form` component for validation and state management.
*   **Offline:** This is complex. You'll need a robust way to:
    *   Detect offline status.
    *   Store pending mutations (log creation, media upload refs, status updates) in IndexedDB.
    *   Queue and trigger uploads when back online.
    *   Handle potential sync errors/conflicts (MVP: last write wins or error notification). Create a custom hook (`useOfflineSync`) or service in `/lib` to manage this.
*   **RBAC:** Implement checks *both* on the client (hiding UI elements using role from Clerk's `useAuth` or `auth()`) and critically on the **backend API** (verifying every request against user's org and role).
*   **Styling:** Configure `tailwind.config.js` with the colors, fonts, and spacing from `brand-kit.md`. Apply utility classes directly.
*   **PWA:** Configure `manifest.json`. Consider using `@ducanh2912/next-pwa` or manually setting up a service worker for caching strategies (cache-first for app shell/static assets, network-first for dynamic data).

This detailed breakdown should provide a solid blueprint for building out the JobSight MVP frontend. Remember to build incrementally and test each piece, especially the offline functionality.