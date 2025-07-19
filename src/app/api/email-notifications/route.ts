import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";
import { Resend } from "resend";
import { NotificationInsert, NotificationTypeOptions } from "@/types/notifications";
import { getBusinessUsers, getUserNotificationPreferencesServer, getAllNotificationTypePreferencesServer } from "@/lib/notifications/server";
import { GeneralNotificationEmail } from "@/components/email-templates/general-notification";

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schemas
const BulkEmailSchema = z.object({
    notification: z.object({
        type: z.string(),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        user_id: z.string().optional(),
        read: z.boolean().default(false),
        read_at: z.string().nullable().default(null),
    }),
    excludeUserId: z.string().optional(),
    businessName: z.string().optional(),
});

const SingleEmailSchema = z.object({
    recipientEmail: z.string().email(),
    recipientName: z.string(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    link: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    businessName: z.string().optional(),
});

const TestEmailSchema = z.object({
    userEmail: z.string().email(),
    userName: z.string(),
    notificationType: z.string(),
});

// Helper function to get default subject
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

// Helper function to send individual email
async function sendIndividualEmail(
    businessId: string,
    notificationData: {
        recipientEmail: string;
        recipientName: string;
        type: string;
        title: string;
        message: string;
        link?: string;
        metadata?: Record<string, any>;
        businessName?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log("Resend API key not configured, skipping email notification");
            return { success: false, error: "Email service not configured" };
        }

        const { recipientEmail, recipientName, businessName, type, title, message, link, metadata } = notificationData;

        // Generate the email subject
        const subject = title || getDefaultSubject(type as NotificationTypeOptions);

        // Send the email using Resend
        const emailResult = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <notify@updates.jobsight.co>",
            to: recipientEmail,
            subject: `JobSight Pro: ${subject}`,
            react: GeneralNotificationEmail({
                recipientName,
                title: title || "",
                message: message || "",
                actionUrl: link ? `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}${link}` : undefined,
                notificationType: type as NotificationTypeOptions,
                businessName: businessName || "Your Business",
                metadata
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

// POST /api/email-notifications - Send bulk email notifications
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const { notification, excludeUserId, businessName } = BulkEmailSchema.parse(body);

        // Get all users in the business
        const users = await getBusinessUsers(businessId);

        if (users.length === 0) {
            return NextResponse.json({
                success: true,
                data: { successful: 0, failed: 0, total: 0 },
                message: "No users found for business"
            }, { status: 200 });
        }

        let successful = 0;
        let failed = 0;

        // Send emails to all users (excluding the triggering user)
        const emailPromises = users.map(async (user: any) => {
            try {
                // Skip users without email or auth_id, or the triggering user
                if (!user.email || !user.auth_id || user.auth_id === excludeUserId) {
                    return;
                }

                // Check if user has email notifications enabled globally
                const globalPrefs = await getUserNotificationPreferencesServer(businessId, user.auth_id);
                const globalSettings = globalPrefs[0];

                if (globalSettings && !globalSettings.email_enabled) {
                    console.log(`User ${user.email} has email notifications disabled globally`);
                    return;
                }

                // Check if user has email notifications enabled for this notification type
                const typePrefs = await getAllNotificationTypePreferencesServer(businessId, user.auth_id);
                const typePref = typePrefs.find((pref: any) => pref.notification_type === notification.type);

                if (typePref && !typePref.email_enabled) {
                    console.log(`User ${user.email} has email notifications disabled for type: ${notification.type}`);
                    return;
                }

                // Send the email
                const result = await sendIndividualEmail(businessId, {
                    recipientEmail: user.email,
                    recipientName: user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    link: notification.link,
                    metadata: notification.metadata,
                    businessName
                });

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

        return NextResponse.json({
            success: true,
            data: {
                successful,
                failed,
                total: users.length
            },
            message: `Bulk email notifications completed: ${successful} successful, ${failed} failed`
        }, { status: 200 });

    } catch (error) {
        console.error("Email notifications error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send email notifications" },
            { status: 500 }
        );
    }
}

// PUT /api/email-notifications - Send single email notification
export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const emailData = SingleEmailSchema.parse(body);

        const result = await sendIndividualEmail(businessId, emailData);

        if (result.success) {
            return NextResponse.json({
                success: true,
                data: { sent: true },
                message: "Email notification sent successfully"
            }, { status: 200 });
        } else {
            return NextResponse.json(
                { success: false, error: result.error || "Failed to send email notification" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Single email notification error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send email notification" },
            { status: 500 }
        );
    }
}

// PATCH /api/email-notifications - Send test email notification
export async function PATCH(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const { userEmail, userName, notificationType } = TestEmailSchema.parse(body);

        const result = await sendIndividualEmail(businessId, {
            recipientEmail: userEmail,
            recipientName: userName,
            type: notificationType,
            title: `Test ${getDefaultSubject(notificationType as NotificationTypeOptions)}`,
            message: `This is a test ${notificationType} notification to verify your email preferences are working correctly.`,
            link: "/dashboard/notifications",
            metadata: {
                test: true,
                type: notificationType,
                timestamp: new Date().toISOString()
            },
            businessName: "JobSight Pro"
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                data: { sent: true },
                message: "Test email notification sent successfully"
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error || "Failed to send test email notification" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Test email notification error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send test email notification" },
            { status: 500 }
        );
    }
}
