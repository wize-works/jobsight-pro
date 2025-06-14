
"use server";

import { createServerClient } from "@/lib/supabase";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { Resend } from "resend";
import EmailTemplate from "@/components/email-template";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailVerification(userId: string) {
    try {
        const { business } = await ensureBusinessOrRedirect();
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

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

        if (user.email_verified) {
            return {
                success: false,
                error: "Email is already verified",
            };
        }

        // Generate verification token
        const verificationToken = Buffer.from(
            JSON.stringify({
                userId: user.id,
                email: user.email,
                businessId: business.id,
                expiresAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                ).toISOString(),
            })
        ).toString("base64");

        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/verify-email?token=${verificationToken}`;        // Send verification email
        const emailResponse = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <noreply@updates.jobsight.co>",
            to: user.email,
            subject: "Verify Your Email Address",
            react: EmailTemplate({
                type: "notification",
                title: "Verify Your Email Address",
                recipientName: user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`.trim()
                    : user.email,
                businessName: business.name ?? undefined,
                content: "Welcome to JobSight Pro! Please verify your email address to secure your account and enable all features. Click the button below to verify your email address.",
                primaryAction: {
                    text: "Verify Email",
                    url: verificationUrl,
                },
                additionalData: {
                    businessName: business.name,
                    expirationTime: "24 hours",
                },
                footerContent: "This verification link will expire in 24 hours for security reasons.",
            }),
        });

        if (emailResponse.error) {
            console.error("Email verification error:", emailResponse.error);
            return {
                success: false,
                error: "Failed to send verification email",
            };
        }

        return {
            success: true,
            message: "Verification email sent successfully",
            messageId: emailResponse.data?.id,
        };
    } catch (error) {
        console.error("Error sending email verification:", error);
        return {
            success: false,
            error: "Failed to send verification email",
        };
    }
}

export async function verifyEmailToken(token: string) {
    try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString());

        // Check if token is expired
        if (new Date(decoded.expiresAt) < new Date()) {
            return {
                success: false,
                error: "Verification token has expired",
            };
        }

        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Failed to initialize Supabase client");
        }

        // Verify and update user
        const { data: user, error } = await supabase
            .from("users")
            .update({
                email_verified: true,
                status: "active"
            })
            .eq("id", decoded.userId)
            .eq("email", decoded.email)
            .eq("business_id", decoded.businessId)
            .select()
            .single();

        if (error || !user) {
            return {
                success: false,
                error: "Invalid verification token",
            };
        }

        return {
            success: true,
            message: "Email verified successfully",
            user,
        };
    } catch (error) {
        console.error("Error verifying email:", error);
        return {
            success: false,
            error: "Invalid verification token",
        };
    }
}
