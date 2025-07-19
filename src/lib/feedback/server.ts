import { insertWithBusiness } from "@/lib/db";
import { createServerClient } from "@/lib/supabase";

export interface SubmitFeedbackParams {
    messageId: number;
    feedbackType: 'thumbs_up' | 'thumbs_down';
    authId: string;
}

export async function submitFeedbackServer(
    businessId: string,
    params: SubmitFeedbackParams
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate input
        if (!businessId || !params.messageId || !params.feedbackType || !params.authId) {
            return {
                success: false,
                error: "Missing required parameters"
            };
        }

        // Validate feedback type
        if (!['thumbs_up', 'thumbs_down'].includes(params.feedbackType)) {
            return {
                success: false,
                error: "Invalid feedback type"
            };
        }

        const supabase = createServerClient();
        if (!supabase) {
            return {
                success: false,
                error: "Database connection failed"
            };
        }

        // Check if feedback already exists for this message and user
        const { data: existingFeedback } = await supabase
            .from('feedback')
            .select('id')
            .eq('message_id', params.messageId)
            .eq('auth_id', params.authId)
            .single();

        if (existingFeedback) {
            // Update existing feedback
            const { error: updateError } = await supabase
                .from('feedback')
                .update({
                    feedback_type: params.feedbackType,
                    timestamp: new Date().toISOString()
                })
                .eq('message_id', params.messageId)
                .eq('auth_id', params.authId);

            if (updateError) {
                console.error('Error updating feedback:', updateError);
                return {
                    success: false,
                    error: "Failed to update feedback"
                };
            }
        } else {
            // Create new feedback
            const feedbackData = {
                message_id: params.messageId,
                feedback_type: params.feedbackType,
                auth_id: params.authId,
                timestamp: new Date().toISOString()
            };

            const result = await insertWithBusiness('feedback', feedbackData, businessId);

            if (!result) {
                return {
                    success: false,
                    error: "Failed to save feedback"
                };
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return {
            success: false,
            error: "An unexpected error occurred"
        };
    }
}

export async function getFeedbackForMessageServer(
    messageId: number,
    authId: string
): Promise<{ feedbackType?: 'thumbs_up' | 'thumbs_down'; error?: string }> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            return { error: "Database connection failed" };
        }

        const { data, error } = await supabase
            .from('feedback')
            .select('feedback_type')
            .eq('message_id', messageId)
            .eq('auth_id', authId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching feedback:', error);
            return { error: "Failed to fetch feedback" };
        }

        return {
            feedbackType: data?.feedback_type as 'thumbs_up' | 'thumbs_down' | undefined
        };
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return { error: "An unexpected error occurred" };
    }
}
