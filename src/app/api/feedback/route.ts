import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const FeedbackQuerySchema = z.object({
    include: z.string().optional(),
    message_id: z.coerce.number().optional(),
    feedback_type: z.enum(["thumbs_up", "thumbs_down"]).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const FeedbackCreateSchema = z.object({
    message_id: z.coerce.number().min(1, "Message ID is required"),
    feedback_type: z.enum(["thumbs_up", "thumbs_down"], {
        errorMap: () => ({ message: "Feedback type must be 'thumbs_up' or 'thumbs_down'" }),
    }),
});

const FeedbackUpdateSchema = z.object({
    feedback_type: z.enum(["thumbs_up", "thumbs_down"], {
        errorMap: () => ({ message: "Feedback type must be 'thumbs_up' or 'thumbs_down'" }),
    }),
});

// GET /api/feedback - Get feedback records
export async function GET(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        const params = FeedbackQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("feedback")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.message_id) {
            query = query.eq("message_id", params.message_id);
        }

        if (params.feedback_type) {
            query = query.eq("feedback_type", params.feedback_type);
        }

        if (params.start_date) {
            query = query.gte("timestamp", params.start_date);
        }

        if (params.end_date) {
            query = query.lte("timestamp", params.end_date);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("timestamp", { ascending: false });

        const { data: feedback, error } = await query;

        if (error) {
            console.error("Feedback fetch error:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch feedback" }, { status: 500 });
        }

        // Handle includes
        if (params.include && feedback) {
            const includes = params.include.split(",");

            for (const feedbackRecord of feedback) {
                // Add user details
                if (includes.includes("user")) {
                    const { data: userData } = await supabase
                        .from("users")
                        .select("first_name, last_name, email")
                        .eq("auth_id", feedbackRecord.auth_id)
                        .single();

                    (feedbackRecord as any).user = userData;
                }

                // Add message details (if you have a messages table)
                if (includes.includes("message")) {
                    const { data: messageData } = await supabase
                        .from("messages")
                        .select("*")
                        .eq("id", feedbackRecord.message_id)
                        .single();

                    (feedbackRecord as any).message = messageData;
                }

                // Add aggregated stats
                if (includes.includes("stats")) {
                    const { data: messageStats } = await supabase
                        .from("feedback")
                        .select("feedback_type")
                        .eq("message_id", feedbackRecord.message_id)
                        .eq("business_id", businessId);

                    const thumbsUp = messageStats?.filter(f => f.feedback_type === "thumbs_up").length || 0;
                    const thumbsDown = messageStats?.filter(f => f.feedback_type === "thumbs_down").length || 0;

                    (feedbackRecord as any).stats = {
                        thumbs_up_count: thumbsUp,
                        thumbs_down_count: thumbsDown,
                        total_feedback: thumbsUp + thumbsDown,
                        positive_ratio: thumbsUp + thumbsDown > 0 ? (thumbsUp / (thumbsUp + thumbsDown)) * 100 : 0
                    };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: feedback,
            count: feedback?.length || 0
        }, { status: 200 });

    } catch (error) {
        console.error("Feedback API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}

// POST /api/feedback - Create or update feedback
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
        const feedbackData = FeedbackCreateSchema.parse(body);

        // Check if feedback already exists for this message and user
        const { data: existingFeedback } = await supabase
            .from("feedback")
            .select("*")
            .eq("message_id", feedbackData.message_id)
            .eq("auth_id", user.id)
            .eq("business_id", businessId)
            .single();

        if (existingFeedback) {
            // Update existing feedback
            const { data: updatedFeedback, error: updateError } = await supabase
                .from("feedback")
                .update({
                    feedback_type: feedbackData.feedback_type,
                    timestamp: new Date().toISOString(),
                    updated_by: user.id,
                    updated_at: new Date().toISOString(),
                })
                .eq("message_id", feedbackData.message_id)
                .eq("auth_id", user.id)
                .eq("business_id", businessId)
                .select()
                .single();

            if (updateError) {
                console.error("Feedback update error:", updateError);
                return NextResponse.json({ success: false, error: "Failed to update feedback" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                data: updatedFeedback,
                message: "Feedback updated successfully"
            }, { status: 200 });
        } else {
            // Create new feedback
            const { data: newFeedback, error: createError } = await supabase
                .from("feedback")
                .insert({
                    message_id: feedbackData.message_id,
                    feedback_type: feedbackData.feedback_type,
                    auth_id: user.id,
                    business_id: businessId,
                    timestamp: new Date().toISOString(),
                    created_by: user.id,
                    updated_by: user.id,
                })
                .select()
                .single();

            if (createError) {
                console.error("Feedback creation error:", createError);
                return NextResponse.json({ success: false, error: "Failed to create feedback" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                data: newFeedback,
                message: "Feedback created successfully"
            }, { status: 201 });
        }

    } catch (error) {
        console.error("Feedback creation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process feedback" },
            { status: 500 }
        );
    }
}

// PUT /api/feedback - Update existing feedback
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
        const { id, message_id, ...updateData } = body;

        // Allow updating by either ID or message_id
        if (!id && !message_id) {
            return NextResponse.json({ success: false, error: "Either feedback ID or message ID is required" }, { status: 400 });
        }

        const feedbackData = FeedbackUpdateSchema.parse(updateData);

        let query = supabase
            .from("feedback")
            .update({
                ...feedbackData,
                timestamp: new Date().toISOString(),
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("business_id", businessId)
            .eq("auth_id", user.id);

        if (id) {
            query = query.eq("id", id);
        } else {
            query = query.eq("message_id", message_id);
        }

        const { data: feedback, error } = await query.select().single();

        if (error) {
            console.error("Feedback update error:", error);
            return NextResponse.json({ success: false, error: "Failed to update feedback" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: feedback,
            message: "Feedback updated successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Feedback update error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update feedback" },
            { status: 500 }
        );
    }
}

// DELETE /api/feedback - Delete feedback
export async function DELETE(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const messageId = searchParams.get("message_id");

        if (!id && !messageId) {
            return NextResponse.json({ success: false, error: "Either feedback ID or message ID is required" }, { status: 400 });
        }

        let query = supabase
            .from("feedback")
            .delete()
            .eq("business_id", businessId)
            .eq("auth_id", user.id);

        if (id) {
            query = query.eq("id", id);
        } else {
            query = query.eq("message_id", messageId);
        }

        const { error } = await query;

        if (error) {
            console.error("Feedback deletion error:", error);
            return NextResponse.json({ success: false, error: "Failed to delete feedback" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Feedback deleted successfully"
        }, { status: 204 });

    } catch (error) {
        console.error("Feedback deletion error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete feedback" },
            { status: 500 }
        );
    }
}

// PATCH /api/feedback - Get feedback for specific message (convenience endpoint)
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
        const { message_id } = body;

        if (!message_id) {
            return NextResponse.json({ success: false, error: "Message ID is required" }, { status: 400 });
        }

        // Get user's feedback for this message
        const { data: userFeedback } = await supabase
            .from("feedback")
            .select("*")
            .eq("message_id", message_id)
            .eq("auth_id", user.id)
            .eq("business_id", businessId)
            .single();

        // Get aggregate stats for this message
        const { data: allFeedback } = await supabase
            .from("feedback")
            .select("feedback_type")
            .eq("message_id", message_id)
            .eq("business_id", businessId);

        const thumbsUp = allFeedback?.filter(f => f.feedback_type === "thumbs_up").length || 0;
        const thumbsDown = allFeedback?.filter(f => f.feedback_type === "thumbs_down").length || 0;

        return NextResponse.json({
            success: false,
            user_feedback: userFeedback,
            stats: {
                thumbs_up_count: thumbsUp,
                thumbs_down_count: thumbsDown,
                total_feedback: thumbsUp + thumbsDown,
                positive_ratio: thumbsUp + thumbsDown > 0 ? (thumbsUp / (thumbsUp + thumbsDown)) * 100 : 0
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Feedback lookup error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get feedback" },
            { status: 500 }
        );
    }
}
