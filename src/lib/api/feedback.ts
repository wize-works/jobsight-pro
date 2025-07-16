// Feedback API client types and functions
export interface Feedback {
    id: string;
    business_id: string;
    message_id: number;
    feedback_type: 'thumbs_up' | 'thumbs_down';
    auth_id: string;
    timestamp: string;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;

    // Optional includes
    user?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    message?: any;
    stats?: FeedbackStats;
}

export interface FeedbackStats {
    thumbs_up_count: number;
    thumbs_down_count: number;
    total_feedback: number;
    positive_ratio: number;
}

// Query parameters
export interface FeedbackQuery {
    include?: string;
    message_id?: number;
    feedback_type?: 'thumbs_up' | 'thumbs_down';
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}

// Create/Update types
export interface CreateFeedbackData {
    message_id: number;
    feedback_type: 'thumbs_up' | 'thumbs_down';
}

export interface UpdateFeedbackData {
    feedback_type: 'thumbs_up' | 'thumbs_down';
}

// API response types
export interface FeedbackResponse {
    data: Feedback[];
    count: number;
}

export interface FeedbackSingleResponse {
    data: Feedback;
    message: string;
}

export interface FeedbackLookupResponse {
    user_feedback: Feedback | null;
    stats: FeedbackStats;
}

// Feedback API functions
export const feedbackApi = {
    // Get feedback records
    async getFeedback(params?: FeedbackQuery): Promise<FeedbackResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`/api/feedback?${searchParams}`);
        if (!response.ok) {
            throw new Error('Failed to fetch feedback');
        }
        return response.json();
    },

    // Submit feedback (create or update)
    async submitFeedback(data: CreateFeedbackData): Promise<FeedbackSingleResponse> {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to submit feedback');
        }
        return response.json();
    },

    // Update feedback by ID
    async updateFeedback(id: string, data: UpdateFeedbackData): Promise<FeedbackSingleResponse> {
        const response = await fetch('/api/feedback', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update feedback');
        }
        return response.json();
    },

    // Update feedback by message ID
    async updateFeedbackByMessage(messageId: number, data: UpdateFeedbackData): Promise<FeedbackSingleResponse> {
        const response = await fetch('/api/feedback', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_id: messageId, ...data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update feedback');
        }
        return response.json();
    },

    // Delete feedback by ID
    async deleteFeedback(id: string): Promise<{ message: string }> {
        const response = await fetch(`/api/feedback?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete feedback');
        }
        return response.json();
    },

    // Delete feedback by message ID
    async deleteFeedbackByMessage(messageId: number): Promise<{ message: string }> {
        const response = await fetch(`/api/feedback?message_id=${messageId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete feedback');
        }
        return response.json();
    },

    // Get feedback for specific message (includes user feedback and stats)
    async getFeedbackForMessage(messageId: number): Promise<FeedbackLookupResponse> {
        const response = await fetch('/api/feedback', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_id: messageId }),
        });

        if (!response.ok) {
            throw new Error('Failed to get feedback for message');
        }
        return response.json();
    },

    // Get user's feedback for a specific message
    async getUserFeedbackForMessage(messageId: number): Promise<Feedback | null> {
        const response = await feedbackApi.getFeedbackForMessage(messageId);
        return response.user_feedback;
    },

    // Get feedback stats for a specific message
    async getFeedbackStats(messageId: number): Promise<FeedbackStats> {
        const response = await feedbackApi.getFeedbackForMessage(messageId);
        return response.stats;
    },
};

// Utility functions
export const feedbackUtils = {
    // Check if feedback is positive
    isPositiveFeedback: (feedback: Feedback): boolean => {
        return feedback.feedback_type === 'thumbs_up';
    },

    // Check if feedback is negative
    isNegativeFeedback: (feedback: Feedback): boolean => {
        return feedback.feedback_type === 'thumbs_down';
    },

    // Calculate positive ratio
    calculatePositiveRatio: (thumbsUp: number, thumbsDown: number): number => {
        const total = thumbsUp + thumbsDown;
        return total > 0 ? (thumbsUp / total) * 100 : 0;
    },

    // Format feedback stats
    formatFeedbackStats: (stats: FeedbackStats): string => {
        const { thumbs_up_count, thumbs_down_count, total_feedback, positive_ratio } = stats;

        if (total_feedback === 0) {
            return 'No feedback yet';
        }

        return `${thumbs_up_count} 👍 ${thumbs_down_count} 👎 (${positive_ratio.toFixed(1)}% positive)`;
    },

    // Get feedback icon
    getFeedbackIcon: (feedbackType: 'thumbs_up' | 'thumbs_down'): string => {
        return feedbackType === 'thumbs_up' ? '👍' : '👎';
    },

    // Get feedback color class (for styling)
    getFeedbackColor: (feedbackType: 'thumbs_up' | 'thumbs_down'): string => {
        return feedbackType === 'thumbs_up' ? 'text-green-600' : 'text-red-600';
    },

    // Toggle feedback type
    toggleFeedbackType: (currentType: 'thumbs_up' | 'thumbs_down'): 'thumbs_up' | 'thumbs_down' => {
        return currentType === 'thumbs_up' ? 'thumbs_down' : 'thumbs_up';
    },

    // Group feedback by type
    groupByType: (feedback: Feedback[]): { thumbs_up: Feedback[]; thumbs_down: Feedback[] } => {
        return {
            thumbs_up: feedback.filter(f => f.feedback_type === 'thumbs_up'),
            thumbs_down: feedback.filter(f => f.feedback_type === 'thumbs_down'),
        };
    },

    // Get feedback summary
    getFeedbackSummary: (feedback: Feedback[]): FeedbackStats => {
        const grouped = feedbackUtils.groupByType(feedback);
        const thumbsUp = grouped.thumbs_up.length;
        const thumbsDown = grouped.thumbs_down.length;
        const total = thumbsUp + thumbsDown;

        return {
            thumbs_up_count: thumbsUp,
            thumbs_down_count: thumbsDown,
            total_feedback: total,
            positive_ratio: feedbackUtils.calculatePositiveRatio(thumbsUp, thumbsDown),
        };
    },

    // Filter feedback by date range
    filterByDateRange: (feedback: Feedback[], startDate: string, endDate: string): Feedback[] => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return feedback.filter(f => {
            const feedbackDate = new Date(f.timestamp);
            return feedbackDate >= start && feedbackDate <= end;
        });
    },

    // Sort feedback by timestamp
    sortByTimestamp: (feedback: Feedback[], ascending: boolean = false): Feedback[] => {
        return [...feedback].sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });
    },

    // Get recent feedback
    getRecentFeedback: (feedback: Feedback[], hours: number = 24): Feedback[] => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hours);

        return feedback.filter(f => new Date(f.timestamp) >= cutoff);
    },

    // Format timestamp
    formatTimestamp: (timestamp: string): string => {
        return new Date(timestamp).toLocaleString();
    },

    // Get relative time
    getRelativeTime: (timestamp: string): string => {
        const now = new Date();
        const feedbackTime = new Date(timestamp);
        const diffMs = now.getTime() - feedbackTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;

        return feedbackTime.toLocaleDateString();
    },
};
