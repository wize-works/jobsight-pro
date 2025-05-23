### 📄 `FIELD-APP.md`

# 📱 JobSight Field App Guide

The JobSight Field App is a mobile-first Progressive Web App (PWA) designed for foremen, crew leads, inspectors, and field technicians to stay productive — even offline.

This guide explains how to install, use, and sync the app effectively on iOS, Android, and rugged devices.

---

## 📲 How to Install

### Android
1. Open Chrome and visit [https://jobsight.co](https://jobsight.co)
2. Tap the **Install App** prompt, or go to browser menu → "Add to Home Screen"
3. You’ll now see a JobSight icon on your device

### iOS (Safari)
1. Visit [https://jobsight.co](https://jobsight.co)
2. Tap the **Share icon** → “Add to Home Screen”
3. Launch the app from your home screen

> ✅ The app works offline and syncs when reconnected to the internet

---

## 🛠 Core Features in the Field App

| Feature             | Description                                |
|---------------------|--------------------------------------------|
| **Daily Logs**      | Submit voice notes, photos, safety issues  |
| **Task View**       | See assigned tasks, due dates, notes       |
| **AI Assistant**    | Ask questions about past logs or schedules |
| **Media Upload**    | Capture site photos & documents            |
| **Offline Mode**    | Create logs/tasks even without signal      |
| **Crew Check-ins**  | (Coming Soon)                              |

---

## 📋 Submit a Daily Log (Offline or Online)

1. Open a project and tap **Daily Log**
2. Enter:
   - Notes
   - Issues or delays
   - Photos or documents (auto timestamped)
3. Or use the **🎙 Voice Note** feature
4. Tap **Save Log** — it will sync automatically when online

> 🧠 AI will summarize voice logs and pre-fill checklist items

---

## ✅ Task Management

- Tap on a task card to:
  - Mark as done
  - Add a field note
  - Upload a related image
- Sort tasks by due date or crew assignment
- Use color codes for priority (e.g., red = critical)

---

## 📡 Sync Behavior

- When offline:
  - Logs, tasks, and media are stored in `IndexedDB`
  - You’ll see a yellow "Pending Sync" indicator

- When reconnected:
  - App pushes pending logs to API in batches
  - Conflict resolution: most recent change wins (user is prompted)

> 🔄 Background sync runs every 30 seconds when connected

---

## 🔐 Security & Access

- All users must log in via Clerk (OAuth or magic link)
- Device sessions expire after 14 days of inactivity
- Users can’t view data from other companies (RLS enforced)

---

## 🧰 Field App Best Practices

- Keep your browser/app up to date
- Use airplane mode to test offline log behavior
- Encourage crews to sync at lunch & end of shift
- Use the **Install App** prompt to reduce login friction

---

## 🆘 Support

For field-specific help:
- Use the **? icon** in the app footer
- Contact: [support@jobsight.co](mailto:support@jobsight.co)
- Help Center: [help.jobsight.co](https://help.jobsight.co)

> Built for the field. Ready when you are. 👷‍♀️
