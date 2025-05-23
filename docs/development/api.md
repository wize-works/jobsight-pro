### 📄 `API.md`

# 🔌 JobSight API Reference (MVP)

This document outlines the primary API surface used by the JobSight frontend, mobile app, and integrations. We currently use a **GraphQL API** (via Fastify) with API Key Authenticated sessions.

## Boilerplate API Setup
```javascript
npx create-wize-api
```
---

## ✅ Authentication

- All requests require API Key Validation
   - Key: wize-api-key
   - Value: somekeyvalue123456

```http
Headers: {
    "wize-api-key": "somekeyvalue123456"
}
```

---

## 📦 GraphQL Overview

| Operation | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `projects`| `query`  | Fetch all projects (by org/user)  |
| `project(id)` | `query` | Get project by ID                 |
| `createProject(input)` | `mutation` | Create a new project             |
| `updateProject(id, input)` | `mutation` | Update project fields           |
| `deleteProject(id)` | `mutation` | Soft-delete a project           |

---

## 🧾 Daily Logs API

| Operation | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `dailyLogs(projectId)` | `query` | Get logs for a project          |
| `submitDailyLog(input)` | `mutation` | Submit text + media log         |
| `transcribeVoiceLog(file)` | `mutation` | AI transcription for audio blob |

---

## 📋 Task Management

| Operation | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `tasks(projectId)` | `query` | Get tasks for a project         |
| `createTask(input)` | `mutation` | Add new task                     |
| `updateTask(id, input)` | `mutation` | Change status, assignment       |
| `reorderTasks(input[])` | `mutation` | Bulk reorder within project     |

---

## 🖼 Media Uploads

| Operation | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `uploadMedia(file)` | `mutation` | Upload photo/doc to Supabase    |
| `getProjectMedia(projectId)` | `query` | List media by project          |
| `tagMedia(id, tags)` | `mutation` | Add tags to media file          |

---

## 🧠 AI Assistant

| Operation | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `askAI(query)` | `mutation` | Natural language query across logs/tasks |
| `summarizeProject(projectId)` | `query` | AI-generated summary of project |
| `listAILogs(userId)` | `query` | Retrieve past AI interactions    |

---

## 🧾 Invoicing

| Operation | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `invoices(projectId)` | `query` | Get invoices by project         |
| `createInvoice(input)` | `mutation` | Generate invoice from log data  |
| `sendInvoice(id, email)` | `mutation` | Send invoice with PDF           |

---

## ⚙️ Settings

| Operation | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `getSettings()` | `query` | Get current org settings          |
| `updateSettings(input)` | `mutation` | Set timezone, preferences, AI   |

---

## 📄 Notes

- GraphQL schema is generated via metadata to reduce duplication
- Field-level access is enforced with Clerk `userId` and `organizationId`
- Supabase RLS policies enforce row access
- File uploads use pre-signed Supabase URLs
- API supports pagination, filtering, and search where relevant

> Use the `/graphql` endpoint for all queries and mutations

Future endpoints (webhooks, REST fallback) will be detailed in `API-EXTENSIONS.md`
