import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";
import { Resend } from "resend";
import EmailTemplate from "@/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schemas
const SendVerificationSchema = z.object({
    userId: z.string(),
});

const VerifyTokenSchema = z.object({
    token: z.string(),
});

// POST /api/email-verification - Send email verification
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const { userId } = SendVerificationSchema.parse(body);

        // Get business details
        const { data: business, error: businessError } = await supabase
            .from("businesses")
            .select("id, name")
            .eq("id", businessId)
            .single();

        if (businessError || !business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Get user details
        const { data: userToVerify, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .eq("business_id", businessId)
            .single();

        if (userError || !userToVerify) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (userToVerify.email_verified) {
            return NextResponse.json(
                { error: "Email is already verified" },
                { status: 400 }
            );
        }

        // Generate verification token
        const verificationToken = Buffer.from(
            JSON.stringify({
                userId: userToVerify.id,
                email: userToVerify.email,
                businessId: businessId,
                expiresAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                ).toISOString(),
            })
        ).toString("base64");

        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/verify-email?token=${verificationToken}`;

        // Send verification email
        const emailResponse = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "JobSight Pro <verify@updates.jobsight.co>",
            to: userToVerify.email,
            subject: "Verify Your Email Address",
            react: EmailTemplate({
                type: "notification",
                title: "Verify Your Email Address",
                recipientName: userToVerify.first_name
                    ? `${userToVerify.first_name} ${userToVerify.last_name || ""}`.trim()
                    : userToVerify.email,
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
            return NextResponse.json(
                { error: "Failed to send verification email" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: {
                sent: true,
                messageId: emailResponse.data?.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            message: "Verification email sent successfully"
        });

    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.json(
            { error: "Failed to send verification email" },
            { status: 500 }
        );
    }
}

// PUT /api/email-verification - Verify email token
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = VerifyTokenSchema.parse(body);

        let decoded;
        try {
            decoded = JSON.parse(Buffer.from(token, "base64").toString());
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid verification token" },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date(decoded.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Verification token has expired" },
                { status: 400 }
            );
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Verify and update user
        const { data: verifiedUser, error } = await supabase
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

        if (error || !verifiedUser) {
            return NextResponse.json(
                { error: "Invalid verification token" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            data: {
                verified: true,
                user: {
                    id: verifiedUser.id,
                    email: verifiedUser.email,
                    first_name: verifiedUser.first_name,
                    last_name: verifiedUser.last_name,
                    status: verifiedUser.status,
                    email_verified: verifiedUser.email_verified,
                }
            },
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.json(
            { error: "Invalid verification token" },
            { status: 500 }
        );
    }
}
