"use server";

import { createServerClient } from "@/lib/supabase";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { UserInsert } from "@/types/users";
import { Resend } from "resend";
import { TeamInvitationEmail } from "@/components/email-examples";
import { createUser } from "./users";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUserInvitation(
    email: string,
    name: string,
    role: string,
) {
    try {
        const { business, userId } = await withBusinessServer();

        // Create the user in the database with invited status
        // Split the name into first and last name
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const newUser: UserInsert = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            role: role as "admin" | "manager" | "member",
            status: "invited",
            business_id: business.id,
            auth_id: `invited_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        const createdUser = await createUser(newUser);
        if (!createdUser) {
            throw new Error("Failed to create user invitation record");
        }

        // Generate invitation token and URL
        const invitationToken = Buffer.from(
            JSON.stringify({
                userId: createdUser.id,
                email: email,
                businessId: business.id,
                expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                ).toISOString(), // 7 days
            }),
        ).toString("base64");

        const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/onboarding?token=${invitationToken}`;
        const expirationDate = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        // Get current user's name for the inviter
        const supabase = createServerClient();
        const { data: currentUser } = await supabase
            .from("users")
            .select("first_name, last_name, email")
            .eq("auth_id", userId)
            .single();

        const inviterName = currentUser
            ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
              currentUser.email
            : "Team Admin";

        // Send the invitation email
        const emailResponse = await resend.emails.send({
            from:
                process.env.RESEND_FROM_EMAIL ||
                "JobSight Pro <noreply@updates.jobsight.co>",
            to: email,
            subject: `You're invited to join ${business.name} on JobSight Pro`,
            react: TeamInvitationEmail({
                recipientName: name,
                inviterName: inviterName,
                businessName: business.name,
                role: role,
                invitationUrl: invitationUrl,
                expirationDate: expirationDate,
            }),
        });

        if (emailResponse.error) {
            console.error("Resend error:", emailResponse.error);
            // Even if email fails, we keep the user record but update status
            await supabase
                .from("users")
                .update({ status: "email_failed" })
                .eq("id", createdUser.id);

            return {
                success: false,
                error: "Failed to send invitation email",
                user: createdUser,
            };
        }

        console.log(
            `Invitation email sent successfully to ${email}. Message ID: ${emailResponse.data?.id}`,
        );

        return {
            success: true,
            message: `Invitation sent to ${email}`,
            user: createdUser,
            messageId: emailResponse.data?.id,
        };
    } catch (error) {
        console.error("Error sending invitation:", error);
        return {
            success: false,
            error: "Failed to send invitation",
        };
    }
}

export async function revokeUserInvitation(userId: string) {
    try {
        const { business } = await withBusinessServer();
        const supabase = createServerClient();

        // Update user status to revoked
        const { error } = await supabase
            .from("users")
            .update({ status: "revoked" })
            .eq("id", userId)
            .eq("business_id", business.id)
            .eq("status", "invited");

        if (error) {
            throw error;
        }

        console.log(`Invitation ${userId} revoked for business ${business.id}`);

        return {
            success: true,
            message: "Invitation revoked",
        };
    } catch (error) {
        console.error("Error revoking invitation:", error);
        return {
            success: false,
            error: "Failed to revoke invitation",
        };
    }
}

export async function resendUserInvitation(userId: string) {
    try {
        const { business, userId: currentUserId } = await withBusinessServer();
        const supabase = createServerClient();

        // Get user details
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .eq("business_id", business.id)
            .single();

        if (userError || !user) {
            throw new Error("User not found");
        }

        if (user.status !== "invited" && user.status !== "email_failed") {
            throw new Error(
                "Cannot resend invitation to user with current status",
            );
        }

        // Generate new invitation token and URL
        const invitationToken = Buffer.from(
            JSON.stringify({
                userId: user.id,
                email: user.email,
                businessId: business.id,
                expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            }),
        ).toString("base64");

        const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/onboarding?token=${invitationToken}`;
        const expirationDate = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        // Get current user's name for the inviter
        const { data: currentUser } = await supabase
            .from("users")
            .select("first_name, last_name, email")
            .eq("auth_id", currentUserId)
            .single();

        const inviterName = currentUser
            ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
              currentUser.email
            : "Team Admin";

        // Send the invitation email
        const emailResponse = await resend.emails.send({
            from:
                process.env.RESEND_FROM_EMAIL ||
                "JobSight Pro <noreply@pro.jobsight.co>",
            to: user.email,
            subject: `Reminder: You're invited to join ${business.name} on JobSight Pro`,
            react: TeamInvitationEmail({
                recipientName: user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`.trim()
                    : user.email,
                inviterName: inviterName,
                businessName: business.name,
                role: user.role,
                invitationUrl: invitationUrl,
                expirationDate: expirationDate,
            }),
        });

        if (emailResponse.error) {
            console.error("Resend error:", emailResponse.error);
            await supabase
                .from("users")
                .update({ status: "email_failed" })
                .eq("id", user.id);

            return {
                success: false,
                error: "Failed to resend invitation email",
            };
        }

        // Update user status back to invited
        await supabase
            .from("users")
            .update({ status: "invited" })
            .eq("id", user.id);

        return {
            success: true,
            message: `Invitation resent to ${user.email}`,
            messageId: emailResponse.data?.id,
        };
    } catch (error) {
        console.error("Error resending invitation:", error);
        return {
            success: false,
            error: "Failed to resend invitation",
        };
    }
}