
"use server";

import { createServerClient } from "@/lib/supabase";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { Resend } from "resend";
import { ProjectUpdateEmail, EquipmentAlertEmail } from "@/components/email-examples";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendProjectUpdateNotification(
    projectId: string,
    updateType: 'status_change' | 'new_task' | 'task_assigned' | 'milestone_completed' | 'issue_reported' | 'deadline_approaching' | 'project_completed',
    updateDetails: string,
    updatedBy: string
) {
    try {
        const { business } = await ensureBusinessOrRedirect();
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

        // Get project details
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("business_id", business.id)
            .single();

        if (projectError || !project) {
            throw new Error("Project not found");
        }

        // Get project team members to notify
        const { data: projectUsers, error: usersError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, notification_preferences")
            .eq("business_id", business.id)
            .eq("status", "active")
            .neq("role", "member"); // Only notify managers and admins

        if (usersError || !projectUsers) {
            throw new Error("Failed to get users to notify");
        }

        const projectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/dashboard/projects/${projectId}`;

        // Send emails to all relevant users
        const emailPromises = projectUsers.map(async (user) => {
            // Check if user wants project notifications (you'd implement notification preferences)
            if (user.notification_preferences && !user.notification_preferences.project_updates) {
                return null;
            }

            const recipientName = user.first_name
                ? `${user.first_name} ${user.last_name || ""}`.trim()
                : user.email;

            return resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <noreply@updates.jobsight.co>",
                to: user.email,
                subject: `Project Update: ${project.name}`,
                react: ProjectUpdateEmail({
                    recipientName,
                    projectName: project.name,
                    updateType,
                    updateDetails,
                    projectUrl,
                    updatedBy,
                }),
            });
        });

        const results = await Promise.allSettled(emailPromises.filter(Boolean));
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;

        return {
            success: true,
            message: `Project update notifications sent to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`,
            stats: { successful, failed, total: projectUsers.length },
        };
    } catch (error) {
        console.error("Error sending project update notifications:", error);
        return {
            success: false,
            error: "Failed to send project update notifications",
        };
    }
}

export async function sendEquipmentAlert(
    equipmentId: string,
    alertType: 'maintenance_due' | 'inspection_required' | 'issue_reported' | 'assigned' | 'assignment_change' | 'malfunction',
    description: string,
    priority: "low" | "medium" | "high" = "medium"
) {
    try {
        const { business } = await ensureBusinessOrRedirect();
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

        // Get equipment details
        const { data: equipment, error: equipmentError } = await supabase
            .from("equipment")
            .select("*")
            .eq("id", equipmentId)
            .eq("business_id", business.id)
            .single();

        if (equipmentError || !equipment) {
            throw new Error("Equipment not found");
        }

        // Get users to notify (equipment managers, admins)
        const { data: users, error: usersError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("business_id", business.id)
            .eq("status", "active")
            .in("role", ["admin", "manager"]);

        if (usersError || !users) {
            throw new Error("Failed to get users to notify");
        }

        const equipmentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/dashboard/equipment/${equipmentId}`;

        // Send equipment alert emails
        const emailPromises = users.map(async (user) => {
            const recipientName = user.first_name
                ? `${user.first_name} ${user.last_name || ""}`.trim()
                : user.email;

            return resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <noreply@updates.jobsight.co>",
                to: user.email,
                subject: `Equipment Alert: ${equipment.name} - ${alertType.replace('_', ' ')}`,
                react: EquipmentAlertEmail({
                    recipientName,
                    equipmentName: equipment.name,
                    alertType,
                    description,
                    equipmentUrl,
                    priority,
                }),
            });
        });

        const results = await Promise.allSettled(emailPromises);
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;

        return {
            success: true,
            message: `Equipment alert sent to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`,
            stats: { successful, failed, total: users.length },
        };
    } catch (error) {
        console.error("Error sending equipment alert:", error);
        return {
            success: false,
            error: "Failed to send equipment alert",
        };
    }
}
