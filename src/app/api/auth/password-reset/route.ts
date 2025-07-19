import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { Resend } from "resend";
import { PasswordResetEmail } from "@/components/email-examples";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const PasswordResetSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = PasswordResetSchema.parse(body);

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
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
            return NextResponse.json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
            }, { status: 200 });
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
            from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <reset@updates.jobsight.co>",
            to: email,
            subject: "Reset Your JobSight Pro Password",
            react: PasswordResetEmail({
                recipientName: `${user.first_name || "User"} ${user.last_name || ""}`.trim(),
                resetUrl: resetUrl,
            }),
        });

        if (emailResponse.error) {
            console.error("Failed to send password reset email:", emailResponse.error);
            return NextResponse.json({
                success: false,
                error: "Failed to send password reset email"
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "If an account with that email exists, a password reset link has been sent.",
        }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: error.errors[0]?.message || "Invalid request data"
            }, { status: 400 });
        }

        console.error("Password reset API error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to process password reset request"
        }, { status: 500 });
    }
}
