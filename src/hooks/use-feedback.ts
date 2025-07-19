import { useState, useEffect } from 'react';
import { feedbackApi } from '@/lib/api/feedback';
import type {
    Feedback,
    FeedbackStats,
    FeedbackQuery,
    CreateFeedbackData,
    UpdateFeedbackData,
    FeedbackLookupResponse,
} from '@/lib/api/feedback';

// Generic hook state interfaces
interface UseFeedbackState {
    data: Feedback[];
    loading: boolean;
    error: string | null;
    count: number;
}

interface UseFeedbackMutationState {
    loading: boolean;
    error: string | null;
}

// Main feedback hooks
export function useFeedback(params?: FeedbackQuery) {
    const [state, setState] = useState<UseFeedbackState>({
        data: [],
        loading: true,
        error: null,
        count: 0,
    });

    const fetchFeedback = async (queryParams?: FeedbackQuery) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const response = await feedbackApi.getFeedback(queryParams || params);
            setState({
                data: response.data,
                loading: false,
                error: null,
                count: response.count,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch feedback',
            }));
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    return {
        ...state,
        refetch: fetchFeedback,
    };
}

// Feedback mutation hook
export function useFeedbackMutation() {
    const [state, setState] = useState<UseFeedbackMutationState>({
        loading: false,
        error: null,
    });

    const submitFeedback = async (data: CreateFeedbackData) => {
        setState({ loading: true, error: null });
        try {
            const response = await feedbackApi.submitFeedback(data);
            setState({ loading: false, error: null });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
            setState({ loading: false, error: errorMessage });
            throw error;
        }
    };

    const updateFeedback = async (id: string, data: UpdateFeedbackData) => {
        setState({ loading: true, error: null });
        try {
            const response = await feedbackApi.updateFeedback(id, data);
            setState({ loading: false, error: null });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update feedback';
            setState({ loading: false, error: errorMessage });
            throw error;
        }
    };

    const updateFeedbackByMessage = async (messageId: number, data: UpdateFeedbackData) => {
        setState({ loading: true, error: null });
        try {
            const response = await feedbackApi.updateFeedbackByMessage(messageId, data);
            setState({ loading: false, error: null });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update feedback';
            setState({ loading: false, error: errorMessage });
            throw error;
        }
    };

    const deleteFeedback = async (id: string) => {
        setState({ loading: true, error: null });
        try {
            const response = await feedbackApi.deleteFeedback(id);
            setState({ loading: false, error: null });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete feedback';
            setState({ loading: false, error: errorMessage });
            throw error;
        }
    };

    const deleteFeedbackByMessage = async (messageId: number) => {
        setState({ loading: true, error: null });
        try {
            const response = await feedbackApi.deleteFeedbackByMessage(messageId);
            setState({ loading: false, error: null });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete feedback';
            setState({ loading: false, error: errorMessage });
            throw error;
        }
    };

    return {
        ...state,
        submitFeedback,
        updateFeedback,
        updateFeedbackByMessage,
        deleteFeedback,
        deleteFeedbackByMessage,
    };
}

// Hook for message-specific feedback
export function useMessageFeedback(messageId: number) {
    const [state, setState] = useState<{
        userFeedback: Feedback | null;
        stats: FeedbackStats;
        loading: boolean;
        error: string | null;
    }>({
        userFeedback: null,
        stats: {
            thumbs_up_count: 0,
            thumbs_down_count: 0,
            total_feedback: 0,
            positive_ratio: 0,
        },
        loading: true,
        error: null,
    });

    const fetchMessageFeedback = async (msgId?: number) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const response = await feedbackApi.getFeedbackForMessage(msgId || messageId);
            setState({
                userFeedback: response.user_feedback,
                stats: response.stats,
                loading: false,
                error: null,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch message feedback',
            }));
        }
    };

    useEffect(() => {
        if (messageId) {
            fetchMessageFeedback();
        }
    }, [messageId]);

    return {
        ...state,
        refetch: fetchMessageFeedback,
    };
}

// Hook for submitting feedback to a message
export function useMessageFeedbackSubmission(messageId: number) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitFeedback = async (feedbackType: 'thumbs_up' | 'thumbs_down') => {
        setLoading(true);
        setError(null);

        try {
            const response = await feedbackApi.submitFeedback({
                message_id: messageId,
                feedback_type: feedbackType,
            });
            setLoading(false);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const toggleFeedback = async (currentType?: 'thumbs_up' | 'thumbs_down') => {
        const newType = currentType === 'thumbs_up' ? 'thumbs_down' : 'thumbs_up';
        return await submitFeedback(newType);
    };

    return {
        submitFeedback,
        toggleFeedback,
        loading,
        error,
    };
}

// Hook for feedback analytics
export function useFeedbackAnalytics(params?: FeedbackQuery) {
    const { data: feedback, loading, error, refetch } = useFeedback({
        ...params,
        include: 'user,stats',
    });

    const [analytics, setAnalytics] = useState<{
        totalFeedback: number;
        positiveRatio: number;
        negativeRatio: number;
        thumbsUpCount: number;
        thumbsDownCount: number;
        recentFeedback: Feedback[];
        topMessages: Array<{ message_id: number; feedback_count: number; positive_ratio: number }>;
    }>({
        totalFeedback: 0,
        positiveRatio: 0,
        negativeRatio: 0,
        thumbsUpCount: 0,
        thumbsDownCount: 0,
        recentFeedback: [],
        topMessages: [],
    });

    useEffect(() => {
        if (feedback.length > 0) {
            const thumbsUp = feedback.filter(f => f.feedback_type === 'thumbs_up').length;
            const thumbsDown = feedback.filter(f => f.feedback_type === 'thumbs_down').length;
            const total = thumbsUp + thumbsDown;

            // Get recent feedback (last 24 hours)
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            const recentFeedback = feedback.filter(f =>
                new Date(f.timestamp) >= twentyFourHoursAgo
            );

            // Group by message and calculate stats
            const messageGroups = feedback.reduce((acc, f) => {
                if (!acc[f.message_id]) {
                    acc[f.message_id] = [];
                }
                acc[f.message_id].push(f);
                return acc;
            }, {} as Record<number, Feedback[]>);

            const topMessages = Object.entries(messageGroups)
                .map(([messageId, feedbacks]) => {
                    const messageThumbsUp = feedbacks.filter(f => f.feedback_type === 'thumbs_up').length;
                    const messageThumbsDown = feedbacks.filter(f => f.feedback_type === 'thumbs_down').length;
                    const messageTotal = messageThumbsUp + messageThumbsDown;

                    return {
                        message_id: parseInt(messageId),
                        feedback_count: messageTotal,
                        positive_ratio: messageTotal > 0 ? (messageThumbsUp / messageTotal) * 100 : 0,
                    };
                })
                .sort((a, b) => b.feedback_count - a.feedback_count)
                .slice(0, 10);

            setAnalytics({
                totalFeedback: total,
                positiveRatio: total > 0 ? (thumbsUp / total) * 100 : 0,
                negativeRatio: total > 0 ? (thumbsDown / total) * 100 : 0,
                thumbsUpCount: thumbsUp,
                thumbsDownCount: thumbsDown,
                recentFeedback,
                topMessages,
            });
        }
    }, [feedback]);

    return {
        feedback,
        analytics,
        loading,
        error,
        refetch,
    };
}

// Hook for feedback search
export function useFeedbackSearch(searchQuery: string) {
    const [searchResults, setSearchResults] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Search by message ID or date range
            const isMessageId = /^\d+$/.test(query);
            const isDateRange = /^\d{4}-\d{2}-\d{2}/.test(query);

            let params: FeedbackQuery = { limit: 20 };

            if (isMessageId) {
                params.message_id = parseInt(query);
            } else if (isDateRange) {
                params.start_date = query;
            }

            const response = await feedbackApi.getFeedback(params);
            setSearchResults(response.data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Search failed');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch(searchQuery);
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return {
        searchResults,
        loading,
        error,
        performSearch,
    };
}

// Hook for feedback filtering
export function useFeedbackFilters() {
    const [filters, setFilters] = useState<{
        feedback_type?: 'thumbs_up' | 'thumbs_down';
        start_date?: string;
        end_date?: string;
    }>({});

    const { data: feedback, loading, error, refetch } = useFeedback({
        ...filters,
        include: 'user,stats',
    });

    const updateFilters = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const clearFilters = () => {
        setFilters({});
    };

    return {
        feedback,
        loading,
        error,
        filters,
        updateFilters,
        clearFilters,
        refetch,
    };
}

// Hook for bulk feedback operations
export function useBulkFeedback() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const bulkDelete = async (feedbackIds: string[]) => {
        setLoading(true);
        setError(null);

        try {
            const deletePromises = feedbackIds.map(id => feedbackApi.deleteFeedback(id));
            await Promise.all(deletePromises);
            setLoading(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete feedback';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    const bulkUpdate = async (updates: Array<{ id: string; data: UpdateFeedbackData }>) => {
        setLoading(true);
        setError(null);

        try {
            const updatePromises = updates.map(({ id, data }) =>
                feedbackApi.updateFeedback(id, data)
            );
            await Promise.all(updatePromises);
            setLoading(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update feedback';
            setError(errorMessage);
            setLoading(false);
            throw error;
        }
    };

    return {
        bulkDelete,
        bulkUpdate,
        loading,
        error,
    };
}
