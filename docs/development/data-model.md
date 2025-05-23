### 📄 `DATA-MODEL.md`

# 🗃️ JobSight Data Model

This document describes the current data model for JobSight, optimized for Postgres (via Supabase) with Row-Level Security (RLS) enabled.

Each record is **tenant-scoped** via `organizationId` (multi-tenant by default) and includes base audit fields.

---

## 📦 Shared Fields (All Tables)

```ts
id: string // UUID (primary key)
createdAt: timestamp
updatedAt: timestamp
createdBy: string // Clerk user ID
updatedBy: string // Clerk user ID
```

---

## 🏗 Projects

```ts
projects {
  id
  name: string
  description?: string
  status: 'active' | 'archived'
  startDate: date
  endDate?: date
  location?: string
  tags?: string[]
}
```

---

## 📋 Tasks

```ts
tasks {
  id
  projectId: string (FK)
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'blocked' | 'done'
  assignedTo?: string[] // Clerk user IDs
  dueDate?: date
  isCritical: boolean
  orderIndex: number
}
```

---

## 🧾 Daily Logs

```ts
daily_logs {
  id
  projectId: string (FK)
  date: date
  submittedBy: string // Clerk user ID
  notes?: string
  aiTranscription?: string
  weather?: string
  safetyIncidents?: string[]
}
```

---

## 🖼 Media

```ts
media {
  id
  projectId: string (FK)
  uploadedBy: string
  type: 'photo' | 'document'
  url: string
  caption?: string
  tags?: string[]
  logId?: string (FK to daily_logs)
}
```

---

## 👥 Users (via Clerk)

Managed by Clerk. Local table can store:

```ts
users {
  id // Clerk user ID
  organizationId
  role: 'admin' | 'manager' | 'worker'
  displayName
  email
  avatarUrl?: string
  isActive: boolean
}
```

---

## 🧾 Invoices

```ts
invoices {
  id
  projectId: string (FK)
  createdBy: string
  status: 'draft' | 'sent' | 'paid'
  lineItems: {
    label: string
    quantity: number
    unitCost: number
    total: number
  }[]
  sentTo?: string // external email
  pdfUrl?: string
}
```

---

## ⚙️ Settings / Preferences (Per Tenant)

```ts
settings {
  id
  organizationId: string
  timezone: string
  defaultProjectTemplateId?: string
  aiAssistantEnabled: boolean
  notificationPreferences: {
    email: boolean
    sms: boolean
  }
}
```

---

## 🧠 AI Logs (Auditable)

```ts
ai_logs {
  id
  userId
  projectId?
  inputText
  responseText
  mode: 'voice' | 'query' | 'summary'
  createdAt
}
```

---

> RLS policies should scope all reads/writes by `organizationId` and `createdBy`, where applicable.

Additional schema updates (e.g., permit tracking, scheduling, audit trails) will be defined in `SCHEMA-NEXT.md`.
