import type { Database } from "./supabase";


export type UserNotificationPreference = Database["public"]["Tables"]["user_notification_preferences"]["Row"];
export type UserNotificationPreferenceInsert = Database["public"]["Tables"]["user_notification_preferences"]["Insert"];
export type UserNotificationPreferenceUpdate = Database["public"]["Tables"]["user_notification_preferences"]["Update"];

export type UserNotificationTypePreference = Database["public"]["Tables"]["user_notification_type_preferences"]["Row"];
export type UserNotificationTypePreferenceInsert = Database["public"]["Tables"]["user_notification_type_preferences"]["Insert"];
export type UserNotificationTypePreferenceUpdate = Database["public"]["Tables"]["user_notification_type_preferences"]["Update"];

export type PushSubscription = Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type PushSubscriptionInsert = Database["public"]["Tables"]["push_subscriptions"]["Insert"];
export type PushSubscriptionUpdate = Database["public"]["Tables"]["push_subscriptions"]["Update"];

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export type NotificationTypeOptions = 'projectUpdates' | 'taskAssignments' | 'equipmentAlerts' | 'invoiceUpdates' | 'systemAnnouncements';
export type NotificationChannelOptions = 'email' | 'push' | 'inApp';


export const notificationTypeOptions: Record<NotificationTypeOptions, { label: string; description: string }> = {
    projectUpdates: { label: "Project Updates", description: "Notifications about project status changes and updates." },
    taskAssignments: { label: "Task Assignments", description: "Notifications when tasks are assigned or updated." },
    equipmentAlerts: { label: "Equipment Alerts", description: "Notifications for equipment status and alerts." },
    invoiceUpdates: { label: "Invoice Updates", description: "Notifications regarding invoice status and updates." },
    systemAnnouncements: { label: "System Announcements", description: "General announcements and updates from the system." }
};
