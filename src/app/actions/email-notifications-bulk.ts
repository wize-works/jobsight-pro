"use server";

import { Resend } from "resend";
import { NotificationInsert, NotificationTypeOptions } from "@/types/notifications";
import { getUsers } from "@/app/actions/users";
import { getUserNotificationPreferences } from "@/app/actions/notification-preferences";
import { getAllNotificationTypePreferences } from "@/app/actions/notification-type-preferences";
import { GeneralNotificationEmail } from "@/components/email-templates/general-notification";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotificationData extends NotificationInsert {
    recipientEmail: string;
    recipientName: string;
    businessName?: string;
}

/**
 * Send email notification to a user based on their preferences
 */
export async function sendEmailNotification(
    businessId: string,
    notificationData: EmailNotificationData
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log("Resend API key not configured, skipping email notification");
            return { success: false, error: "Email service not configured" };
        }

        const { recipientEmail, recipientName, businessName, ...notification } = notificationData;        // Generate the email subject based on notification type and title
        const subject = notification.title || getDefaultSubject(notification.type as NotificationTypeOptions);

        // Send the email using Resend
        const emailResult = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <noreply@updates.jobsight.co>",
            to: recipientEmail,
            subject: `JobSight Pro: ${subject}`, react: GeneralNotificationEmail({
                recipientName,
                title: notification.title || "",
                message: notification.message || "",
                actionUrl: notification.link ? `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}${notification.link}` : undefined,
                notificationType: notification.type as NotificationTypeOptions,
                businessName: businessName || "Your Business",
                metadata: notification.metadata
            }),
        });

        if (emailResult.error) {
            console.error("Failed to send email notification:", emailResult.error);
            return { success: false, error: emailResult.error.message };
        }

        console.log(`Email notification sent successfully to ${recipientEmail} (ID: ${emailResult.data?.id})`);
        return { success: true };

    } catch (error) {
        console.error("Error sending email notification:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Send email notifications to multiple users for a given notification
 */
export async function sendBulkEmailNotifications(
    businessId: string,
    notification: NotificationInsert,
    excludeUserId?: string,
    businessName?: string
): Promise<{ successful: number; failed: number; total: number }> {
    try {
        // Get all users in the business
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business:", businessId);
            return { successful: 0, failed: 0, total: 0 };
        }

        let successful = 0;
        let failed = 0;

        // Send emails to all users (excluding the triggering user)
        const emailPromises = users.map(async (user) => {
            try {
                // Skip users without email or auth_id, or the triggering user
                if (!user.email || !user.auth_id || user.auth_id === excludeUserId) {
                    return;
                }

                // Check if user has email notifications enabled globally
                const globalPrefs = await getUserNotificationPreferences(businessId, user.auth_id);
                const globalSettings = globalPrefs[0];

                if (globalSettings && !globalSettings.email_enabled) {
                    console.log(`User ${user.email} has email notifications disabled globally`);
                    return;
                }

                // Check if user has email notifications enabled for this notification type
                const typePrefs = await getAllNotificationTypePreferences(businessId, user.auth_id);
                const typePref = typePrefs.find(pref => pref.notification_type === notification.type);

                if (typePref && !typePref.email_enabled) {
                    console.log(`User ${user.email} has email notifications disabled for type: ${notification.type}`);
                    return;
                }

                // Prepare notification data for email
                const emailNotificationData: EmailNotificationData = {
                    ...notification,
                    user_id: user.auth_id, // Override user_id for this recipient
                    recipientEmail: user.email,
                    recipientName: user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email,
                    businessName
                };

                // Send the email
                const result = await sendEmailNotification(businessId, emailNotificationData);

                if (result.success) {
                    successful++;
                    console.log(`Email sent successfully to ${user.email}`);
                } else {
                    failed++;
                    console.error(`Failed to send email to ${user.email}:`, result.error);
                }

            } catch (error) {
                failed++;
                console.error(`Error processing email for user ${user.email}:`, error);
            }
        });

        // Wait for all emails to be processed
        await Promise.all(emailPromises);

        console.log(`Bulk email notifications completed: ${successful} successful, ${failed} failed out of ${users.length} total users`);

        return {
            successful,
            failed,
            total: users.length
        };
    } catch (error) {
        console.error("Error sending bulk email notifications:", error);
        const users = await getUsers(businessId).catch(() => []);
        return { successful: 0, failed: users.length, total: users.length };
    }
}

/**
 * Get default email subject based on notification type
 */
function getDefaultSubject(notificationType: NotificationTypeOptions): string {
    switch (notificationType) {
        case "projectUpdates":
            return "Project Update";
        case "taskAssignments":
            return "Task Assignment";
        case "equipmentAlerts":
            return "Equipment Alert";
        case "invoiceUpdates":
            return "Invoice Update";
        case "systemAnnouncements":
            return "System Announcement";
        default:
            return "Notification";
    }
}

/**
 * Send test email notification
 */
export async function sendTestEmailNotification(
    businessId: string,
    userEmail: string,
    userName: string,
    notificationType: NotificationTypeOptions
): Promise<{ success: boolean; error?: string }> {
    const testNotification: EmailNotificationData = {
        user_id: "test",
        type: notificationType,
        title: `Test ${getDefaultSubject(notificationType)}`,
        message: `This is a test ${notificationType} notification to verify your email preferences are working correctly.`,
        link: "/dashboard/notifications",
        read: false,
        read_at: null,
        metadata: {
            test: true,
            type: notificationType,
            timestamp: new Date().toISOString()
        },
        recipientEmail: userEmail,
        recipientName: userName,
        businessName: "JobSight Pro"
    };

    return await sendEmailNotification(businessId, testNotification);
}
