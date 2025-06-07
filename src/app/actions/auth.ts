
"use server";

import { createServerClient } from "@/lib/supabase";
import { Resend } from "resend";
import { PasswordResetEmail } from "@/components/email-examples";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string) {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("email", email)
            .eq("status", "active")
            .single();

        if (userError || !user) {
            // Don't reveal if user exists or not for security
            return {
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
            };
        }

        // Generate reset token
        const resetToken = Buffer.from(
            JSON.stringify({
                userId: user.id,
                email: email,
                expiresAt: new Date(
                    Date.now() + 60 * 60 * 1000 // 1 hour
                ).toISOString(),
            })
        ).toString("base64");

        const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/reset-password?token=${resetToken}`;

        // Send password reset email
        const emailResponse = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <noreply@updates.jobsight.co>",
            to: email,
            subject: "Reset Your JobSight Pro Password",
            react: PasswordResetEmail({
                recipientName: user.first_name 
                    ? `${user.first_name} ${user.last_name || ""}`.trim()
                    : user.email,
                resetUrl: resetUrl,
                expirationTime: "1 hour"
            }),
        });

        if (emailResponse.error) {
            console.error("Password reset email error:", emailResponse.error);
            return {
                success: false,
                error: "Failed to send password reset email",
            };
        }

        return {
            success: true,
            message: "If an account with that email exists, a password reset link has been sent.",
            messageId: emailResponse.data?.id,
        };
    } catch (error) {
        console.error("Error sending password reset email:", error);
        return {
            success: false,
            error: "Failed to send password reset email",
        };
    }
}

export async function verifyResetToken(token: string) {
    try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString());
        
        // Check if token is expired
        if (new Date(decoded.expiresAt) < new Date()) {
            return {
                success: false,
                error: "Reset token has expired",
            };
        }

        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

        // Verify user still exists and is active
        const { data: user, error } = await supabase
            .from("users")
            .select("id, email, status")
            .eq("id", decoded.userId)
            .eq("email", decoded.email)
            .eq("status", "active")
            .single();

        if (error || !user) {
            return {
                success: false,
                error: "Invalid reset token",
            };
        }

        return {
            success: true,
            userId: user.id,
            email: user.email,
        };
    } catch (error) {
        console.error("Error verifying reset token:", error);
        return {
            success: false,
            error: "Invalid reset token",
        };
    }
}
