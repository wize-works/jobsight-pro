### 📄 `SCHEMA-NEXT.md`

# 📐 JobSight Schema Extensions & Future Models

This document tracks upcoming schema additions, structural improvements, and modules not included in the MVP. These are prioritized for development in Phase 2+ and may be grouped into feature packages.

---

## 🆕 Planned Modules

### 🧾 Permits & Compliance
```ts
permits {
  id
  projectId
  type: 'inspection' | 'zoning' | 'fire' | 'occupancy'
  status: 'pending' | 'approved' | 'denied'
  issuedDate?: date
  expirationDate?: date
  uploadedDocs?: string[] // media IDs
  inspectorName?: string
  notes?: string
}
```

### 📆 Scheduling & Crew Assignments
```ts
crew_schedule {
  id
  projectId
  crewId
  shiftStart: timestamp
  shiftEnd: timestamp
  assignedTasks: string[]
  notes?: string
}

crews {
  id
  name
  members: string[] // user IDs
}
```

### 🧩 Custom Fields / Forms
```ts
custom_fields {
  id
  entityType: 'project' | 'log' | 'invoice'
  label: string
  fieldType: 'text' | 'select' | 'number' | 'boolean' | 'date'
  isRequired: boolean
  options?: string[]
}

custom_field_values {
  id
  fieldId
  entityId
  value: any
}
```

### 📦 Inventory & Equipment Tracking
```ts
equipment {
  id
  name
  serialNumber?: string
  assignedProjectId?: string
  lastCheckDate: date
  maintenanceDue: date
  condition: 'good' | 'needs_repair' | 'out_of_service'
  qrCodeUrl?: string
}
```

---

## 🧠 AI-Enhanced Schema Targets

### 🔍 Vector Embedding for Logs & Media (Phase 3)
- Store log text & metadata embeddings
- Enable semantic search via pgvector or Pinecone

```ts
vector_logs {
  id
  logId
  embedding: float[]
  contentType: 'text' | 'image'
}
```

---

## 🧰 Schema Upgrade Considerations
- **Custom fields** must be tied to tenant + entity + type
- Support schema versioning via `migration_context`
- Export schema snapshots per environment (staging, prod)

---

## 📍 Suggested Folder Location
> `docs/schema/SCHEMA-NEXT.md`

Place all schema versioning, extensions, and planning inside a `docs/schema/` folder. This separates it from `API.md`, `DATA-MODEL.md`, and keeps structural evolution tracked by domain.

We can also split this into per-module schema specs as they mature.
