# Product Requirements Document (PRD)

**Product Name:** JobSight  
**Tagline:** "Your Entire Jobsite, One App"  
**Platform:** Web Application  
**Version:** v1.0  
**Prepared By:** Brandon Korous  
**Date:** 2025-05-06

---

## 🧩 Purpose
JobSight is a modern field service and construction project management platform built to help teams track projects, tasks, equipment, crews, and daily logs in one centralized interface. It emphasizes real-time visibility, mobile-first design, and ease of use for both field and office users.

---

## 🖥️ Tech Stack

- **Frontend Framework:** Next.js
- **Design System:** TailwindCSS, DaisyUI (DaisyUI should be the default for all components)
- **Icons:** FontAwesome
- **Charts:** ChartJS
- **Authentication:** Kinde
NOTE: DaisyUI should be the default for all components, including buttons, inputs, and modals. All components should be built using DaisyUI classes and styles. The design system should be consistent across the application, with a focus on usability and accessibility.  Do not use Radix UI or any other component library.
---

## 🎨 Branding & Visual Guidelines

Light Theme:
```css
{
    name: 'light';
    default: true;
    prefersdark: false;
    color-scheme: light;
    --color-primary: #F87431;
    --color-primary-content: #FAFAF9;

    --color-secondary: #02ACA3;
    --color-secondary-content: #FAFAF9;

    --color-accent: #5C95FF;
    --color-accent-content: #080607;

    --color-neutral: #080607;
    --color-neutral-content: #FAFAF9;

    --color-base-100: #FAFAF9;
    --color-base-200: #F0EFEC;
    --color-base-300: #CCC9C0;
    --color-base-content: #080607;

    --color-info: #983486;
    --color-info-content: #FAFAF9;

    --color-success: #34A432;
    --color-success-content: #FAFAF9;

    --color-warning: #F5B400;
    --color-warning-content: #FAFAF9;

    --color-error: #D1152B;
    --color-error-content: #FAFAF9;
    --radius-selector: 0.5rem;
    --radius-field: 0.25rem;
    --radius-box: 0.25rem;
    --size-selector: 0.25rem;
    --size-field: 0.25rem;
    --border: 1px;
    --depth: 1;
    --noise: 0;
}
```

Dark Theme:

```css
{
    name: "dark";
    default: false;
    prefersdark: false;
    color-scheme: dark;
    --color-primary: #F87431;
    --color-primary-content: #FAFAF9;

    --color-secondary: #02ADA5;
    --color-secondary-content: #FAFAF9;

    --color-accent: #5C95FF;
    --color-accent-content: #080607;

    --color-neutral: #080607;
    --color-neutral-content: #FAFAF9;

    --color-base-100: #2D2D2A;
    --color-base-200: #232321;
    --color-base-300: #191917;
    --color-base-content: #FAFAF9;

    --color-info: #983486;
    --color-info-content: #FAFAF9;

    --color-success: #34A432;
    --color-success-content: #FAFAF9;

    --color-warning: #F5B400;
    --color-warning-content: #FAFAF9;

    --color-error: #D1152B;
    --color-error-content: #FAFAF9;
    --radius-selector: 0.5rem;
    --radius-field: 0.25rem;
    --radius-box: 0.25rem;
    --size-selector: 0.25rem;
    --size-field: 0.25rem;
    --border: 1px;
    --depth: 1;
    --noise: 0;
}
```

---

## 🧑‍💼 Core Features

- **Business:** Allows the user to invite other users to their business based on the subscription type allowance
- **Crew Management:** Manage crews, assignments, schedules
- **Equipment Managment & Tracking:** Assign equipment, log inspections
- **Media Library:** Upload and associate media with items
- **Dashboard & Reporting:** Visuals using ChartJS

- **Client Management:** Create/manage clients and contacts
- **Projects & Tasks:** Create/manage projects, tasks, statuses
- **Daily Logs:** Submit logs with media, notes, weather info
- **Invoicing:** Privide itemized invocing to clients through email (with link to pay through Stripe)

---

## 🔐 Authentication & Authorization

- Kinde with email/password, Gmail, Apple, Facebook
- Role-based access: Admin, Supervisor, Field Worker, Client (for client access to invoices)
- Multi-tenant support via Kinde organizations

---

---

## ⚙️ Non-Functional Requirements

- **Responsive Design:** Desktop, tablet, mobile (mobile bottom navigation)
- **Performance:** <200ms API response time
- **Accessibility:** WCAG AA via DaisyUI
- **Security:** API key, Kinde, HTTPS only
- **Scalability:** Serverless ready (e.g. Vercel/Azure)

---

Steps:

1: We need to start with the basic
2: Integrate Kinde 
3: Create the userflow for two paths:
    a: new organization/business registering 
        - this requires them to pick tier 1, tier 2, or tier 3 subscriptions (enrolled through stripe)
    b: an invited member joining an existing organization/business
4: Build out features in this order:
    i: Organization/business
    ii: Crew Management
    iii: Equipment Management
    iv: Media Library
    v: Client Management
    vi: Projects
    vii: Tasks
    viii: Daily Logs
    ix: Invoicing
    x: Dashboard & Reporting
    xi: AI Integration
