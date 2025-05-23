### 📄 `AI-GOVERNANCE.md`

# 🛡️ JobSight AI Governance & Risk Framework

This document outlines how JobSight manages ethical AI usage, user transparency, data privacy, and trust in AI-assisted features.

---

## 🎯 Objectives

- Ensure AI behavior aligns with user expectations and field realities
- Prevent misuse or over-reliance on hallucinated outputs
- Offer full visibility and auditability of AI interactions
- Comply with evolving AI/LLM regulatory expectations

---

## 🔍 Key AI Use Cases

| Feature                      | Risk Level | Controls                        |
|-----------------------------|------------|----------------------------------|
| Voice-to-text transcriptions| Low        | User-initiated + audit log       |
| AI project summaries        | Medium     | Timestamped source references    |
| AI Q&A over logs/tasks      | Medium     | Rate limits + traceable results  |
| Predictive task delays      | High       | Flagged as “suggestions only”    |

---

## 🔐 Privacy & Data Handling

| Policy Area           | Practice |
|-----------------------|----------|
| **Audio uploads**     | Encrypted in Supabase storage (non-public bucket) |
| **Text input/output** | Not stored with OpenAI or any 3rd party LLM        |
| **AI logs**           | Stored in `ai_logs` per user/session               |
| **User control**      | Users may view, export, or delete their AI logs    |

---

## ✅ AI Interaction Logging

Every AI interaction is:
- Associated with `userId` and `projectId` (if relevant)
- Stored with timestamp, input, response, and mode
- Exposed via the `listAILogs` GraphQL query

Use this to support transparency, audits, and training.

---

## 📣 Disclaimers in UX

- All AI results are labeled with:
  > ⚠️ AI-generated output. Please verify before acting.

- Predictive suggestions (e.g. “Task X is likely to delay”) are wrapped with a user acknowledgment UI.

---

## ⚙️ Fallbacks & User Safety

- Users can toggle AI assistant on/off in Settings
- AI is assistive only — not used for task assignments, compliance submissions, or automated decisions
- No critical workflows rely solely on AI

---

## 🛠 Developer Guidelines

| Rule | Requirement |
|------|-------------|
| ✅   | All AI prompts must be visible in source or version-controlled |
| ✅   | Do not use user PII in prompt context                         |
| ✅   | Every AI action must write to `ai_logs`                       |
| ❌   | Don’t auto-invoke AI without user request                    |

---

## 📆 Review & Updates

- AI governance reviewed quarterly
- Incident response policies in place for hallucination-related errors
- Open to industry feedback + contractor advisory input

---

For concerns or ideas, contact ai-governance@jobsight.co
