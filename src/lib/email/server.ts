import { createServerClient } from "@/lib/supabase";
import { Resend } from "resend";
import { ProjectUpdateEmail, EquipmentAlertEmail } from "@/components/email-examples";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailResult {
    success: boolean;
    message?: string;
    error?: string;
}

export async function sendProjectUpdateNotificationServer(
    businessId: string,
    projectId: string,
    updateType: 'status_change' | 'task_assigned' | 'milestone_completed' | 'deadline_approaching',
    updateDetails: string,
    updatedBy: string
): Promise<EmailResult> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

        // Get project details
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("business_id", businessId)
            .single();

        if (projectError || !project) {
            throw new Error("Project not found");
        }

        // Get project team members to notify
        const { data: projectUsers, error: usersError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, notification_preferences")
            .eq("business_id", businessId)
            .eq("status", "active")
            .neq("role", "member"); // Only notify managers and admins

        if (usersError || !projectUsers) {
            throw new Error("Failed to get users to notify");
        }

        const projectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/dashboard/projects/${projectId}`;

        // Get business name
        const { data: business } = await supabase
            .from("businesses")
            .select("name")
            .eq("id", businessId)
            .single();

        const businessName = business?.name || "Your Business";

        // Send email to each user
        const emailPromises = projectUsers.map(async (user) => {
            // Check notification preferences if available
            const notificationPrefs = user.notification_preferences as any;
            if (notificationPrefs && notificationPrefs.projectUpdates === false) {
                return null; // Skip this user
            }

            try {
                const result = await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <notify@updates.jobsight.co>",
                    to: user.email,
                    subject: `Project Update: ${project.name}`,
                    react: ProjectUpdateEmail({
                        recipientName: `${user.first_name || "User"} ${user.last_name || ""}`.trim(),
                        projectName: project.name,
                        updateType: updateType,
                        updateDetails: updateDetails,
                        updatedBy: updatedBy,
                        projectUrl: projectUrl,
                    }),
                });

                return result;
            } catch (emailError) {
                console.error(`Failed to send email to ${user.email}:`, emailError);
                return null;
            }
        });

        const results = await Promise.allSettled(emailPromises);
        const successCount = results.filter(result =>
            result.status === 'fulfilled' && result.value !== null
        ).length;

        return {
            success: true,
            message: `Project notifications sent to ${successCount} users`,
        };
    } catch (error) {
        console.error("Error sending project update notification:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send project notifications",
        };
    }
}

export async function sendEquipmentAlertServer(
    businessId: string,
    equipmentId: string,
    alertType: "maintenance_due" | "inspection_required" | "malfunction" | "assignment_change",
    description: string,
    priority: "low" | "medium" | "high" = "medium"
): Promise<EmailResult> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

        // Get equipment details
        const { data: equipment, error: equipmentError } = await supabase
            .from("equipment")
            .select("*")
            .eq("id", equipmentId)
            .eq("business_id", businessId)
            .single();

        if (equipmentError || !equipment) {
            throw new Error("Equipment not found");
        }

        // Get users to notify (equipment managers and admins)
        const { data: usersToNotify, error: usersError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, notification_preferences")
            .eq("business_id", businessId)
            .eq("status", "active")
            .in("role", ["admin", "manager"]);

        if (usersError || !usersToNotify) {
            throw new Error("Failed to get users to notify");
        }

        const equipmentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/dashboard/equipment/${equipmentId}`;

        // Get business name
        const { data: business } = await supabase
            .from("businesses")
            .select("name")
            .eq("id", businessId)
            .single();

        const businessName = business?.name || "Your Business";

        // Send email to each user
        const emailPromises = usersToNotify.map(async (user) => {
            // Check notification preferences if available
            const notificationPrefs = user.notification_preferences as any;
            if (notificationPrefs && notificationPrefs.equipmentAlerts === false) {
                return null; // Skip this user
            }

            try {
                const result = await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <notify@updates.jobsight.co>",
                    to: user.email,
                    subject: `Equipment Alert: ${equipment.name}`,
                    react: EquipmentAlertEmail({
                        recipientName: `${user.first_name || "User"} ${user.last_name || ""}`.trim(),
                        equipmentName: equipment.name,
                        alertType: alertType,
                        description: description,
                        priority: priority,
                        equipmentUrl: equipmentUrl,
                    }),
                });

                return result;
            } catch (emailError) {
                console.error(`Failed to send email to ${user.email}:`, emailError);
                return null;
            }
        });

        const results = await Promise.allSettled(emailPromises);
        const successCount = results.filter(result =>
            result.status === 'fulfilled' && result.value !== null
        ).length;

        return {
            success: true,
            message: `Equipment alerts sent to ${successCount} users`,
        };
    } catch (error) {
        console.error("Error sending equipment alert:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send equipment alert",
        };
    }
}
