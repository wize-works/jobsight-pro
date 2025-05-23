### 📄 `AI-AGENT.md`

# 🤖 JobSight AI Agent

This document outlines the design and behavior of the **AI Assistant** in JobSight, including its capabilities, workflows, and integration with both the API and the frontend/mobile app.

---

## 🧠 Purpose

The AI Agent enhances field productivity by:
- Converting voice notes into structured daily logs
- Enabling natural language querying of historical project data
- Auto-summarizing task activity and job progress
- Reducing manual entry and admin work for foremen and project managers

---

## 🏗 Architecture Overview

```mermaid
graph TD
  A[Voice Note / Query Text] --> B[AI Agent (LangChain)]
  B --> C[OpenAI (LLM)]
  B --> D[Postgres + Supabase (context)]
  C --> B
  B --> E[GraphQL API Response]
```

- **LangChain** handles prompt templates, memory, routing
- **OpenAI GPT-4/3.5** provides LLM responses
- **Supabase** provides structured context: logs, tasks, history
- **Responses** are piped back through the GraphQL API

---

## 🧾 Capabilities

| Feature                  | Input                | Output                            |
|--------------------------|----------------------|------------------------------------|
| Voice Log Transcription | Audio Blob           | Text + AI-summarized daily note    |
| Daily Log Autofill      | Freeform text        | Structured checklist + issues      |
| AI Q&A                  | Text (e.g. "What happened on Site A last Friday?") | Answer with linked records        |
| Project Summary         | Project ID           | Bullet summary of status, blockers |
| Task Pattern Detection  | Implicit via query   | “Task X is typically delayed 2 days” |

---

## ✨ Prompt Template Examples

### Voice Log → Daily Summary
```txt
You are a construction field assistant. Turn the following foreman’s voice notes into a structured daily log with:
- Summary of work completed
- Delays or issues
- Safety notes (if any)
- Materials used
```

### Query
```txt
User: What were the last 3 safety issues reported at Site A?
AI:
1. 3/10 - Ladder incident
2. 3/14 - Unreported trip hazard
3. 3/15 - Missing hard hats on crew 2
```

---

## 🔒 Security & Privacy

- Voice/audio is processed via browser or mobile, uploaded securely to Supabase
- AI requests are stateless; no user data is stored in OpenAI
- All AI responses are logged per user in `ai_logs` table
- Users may request deletion of any AI-related activity logs

---

## 📐 Rate Limits & Fair Use (MVP)

| Plan        | Voice Logs/day | AI Queries/day |
|-------------|----------------|----------------|
| Free        | 3              | 5              |
| Pro         | 20             | 50             |
| Growth+     | Unlimited      | Unlimited      |

> Future roadmap includes vector embedding + semantic search over project files & photos.

---

## 🧩 Developer Notes

- AI layer is decoupled via `lib/ai/agent.ts`
- Prompts live in `/lib/ai/prompts.ts`
- All routes use GraphQL `askAI` and `transcribeVoiceLog`
- Built with future support for tool-augmented agents (retrieval, scheduling, etc.)

---

For any hallucination or audit concerns, see [`AI-GOVERNANCE.md`] (WIP)
