### 📄 `PRODUCT-REQUIREMENTS.md`

# 📋 JobSight Product Requirements Document (PRD)

This document defines the requirements for the initial version of **JobSight**, outlining user goals, features, functional specs, and acceptance criteria. It supports alignment between product, design, and engineering.

---

## 🧭 Overview

**Product Name:** JobSight   
**Target Users:** Small to mid-sized construction firms and field service contractors (5–200 employees)  
**Primary Persona:** Foreman, project manager, or company owner with limited technical experience

---

## 🎯 Product Goals

1. Replace disorganized jobsite tracking tools (paper, spreadsheets)
2. Provide field teams with an easy-to-use responsive platform
3. Use AI to reduce manual entry and generate structured logs
4. Enable faster coordination, reporting, and invoicing

---

## 👤 User Stories

### ✅ As a Field Foreman:
- I want to submit a daily log from my phone
- I want to speak into the app and get a written summary
- I want to upload jobsite photos with tags

### ✅ As a Project Manager:
- I want to assign tasks and track progress
- I want to see project activity across teams
- I want to ask questions and get AI-based answers

### ✅ As a Company Owner:
- I want to invoice based on actual logged work
- I want visibility into crew activity and job timelines
- I want to give access to office staff but not field users

---

## 🛠 Features (MVP Scope)

| Feature              | Type         | Notes                         |
|----------------------|--------------|-------------------------------|
| User Auth            | Core         | Clerk.dev integration         |
| Projects CRUD        | Core         | Scoped to tenant/org          |
| Task Management      | Core         | Assignable, due dates, status |
| Daily Logs           | Core         | Structured form + free text   |
| Media Upload         | Core         | Images, PDFs, auto timestamp  |
| AI Voice Log         | Differentiator | LangChain + OpenAI          |
| AI Query Assistant   | Differentiator | Ask about logs/tasks        |
| Invoicing Module     | Core         | PDF + email output            |
| Offline Mode (PWA)   | Critical     | IndexedDB + sync layer        |
| RBAC                 | Security     | Admin, Manager, Worker        |
| Client Payment       | Finance      | Stripe Integration            |

---

## 📐 Technical Requirements

- **Frontend:** Next.js 15 App Router, TailwindCSS v3, Shadcn UI
- **Backend:** Node.js (Express), GraphQL API, API Key Auth
- **DB:** MongoDB Atlas (RLS)
- **Storage:** Need to explore options (AWS S3, Supabase)
- **Voice AI:** OpenAI Whisper + LangChain for summarization
- **PDF Generation:** PDFKit or similar library
- **Payment:** Stripe for invoicing and payment processing
- **Auth:** Clerk.dev with RBAC
- **AI:** LangChain + OpenAI (logs, queries)
- **Infra:** AKS + GitHub Actions
- **Mobile:** PWA, offline-ready


---

## ✅ Acceptance Criteria

| Requirement                             | Criteria                                     |
|-----------------------------------------|----------------------------------------------|
| Users can sign up/login via Clerk       | ✅ Working magic link flow                    |
| Users can create + manage projects      | ✅ Project list, filter, archive              |
| Tasks are assignable + updateable       | ✅ Inline edits, reorder, due reminders       |
| Daily logs can be submitted offline     | ✅ Stored locally and syncs on reconnect      |
| AI can transcribe voice logs            | ✅ Voice-to-text + summary appears            |
| Users can send a PDF invoice            | ✅ PDF preview and email delivery confirmed   |
| Permissions are enforced by role        | ✅ Workers can't edit org-wide settings       |

---

## 🧪 Metrics for Success

- >75% of users submit logs via web app within first week
- <30 second sync time for daily log + media
- >10 AI queries/user/month by active teams
- MVP adoption: 10+ orgs, 100+ users within 60 days of launch

---

> This PRD will evolve as real-world feedback from field teams rolls in. It should serve as a live spec for MVP alignment across engineering, design, and business.
