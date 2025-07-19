import { SubmitFeedbackParams } from './server';

export async function submitFeedbackClient(
    params: Omit<SubmitFeedbackParams, 'authId'>
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_id: params.messageId,
                feedback_type: params.feedbackType
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `HTTP error! status: ${response.status}`
            };
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return {
            success: false,
            error: "Failed to submit feedback"
        };
    }
}

export async function getFeedbackForMessageClient(
    messageId: number
): Promise<{ feedbackType?: 'thumbs_up' | 'thumbs_down'; error?: string }> {
    try {
        const params = new URLSearchParams({
            message_id: messageId.toString()
        });

        const response = await fetch(`/api/feedback?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.error || `HTTP error! status: ${response.status}`
            };
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return {
            error: "Failed to fetch feedback"
        };
    }
}
