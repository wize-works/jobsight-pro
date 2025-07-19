import { useState, useCallback } from "react";
import {
    EmailVerificationAPI,
    SendVerificationRequest,
    VerifyTokenRequest,
    SendVerificationResponse,
    VerifyTokenResponse,
    handleEmailVerificationApiError,
    EmailVerificationUtils
} from "@/lib/api/email-verification";

// Hook for sending email verification
export function useSendEmailVerification() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<SendVerificationResponse | null>(null);

    const sendVerification = async (userId: string): Promise<SendVerificationResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailVerificationAPI.sendVerification({ userId });
            setLastResult(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailVerificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setLastResult(null);
    };

    return {
        sendVerification,
        loading,
        error,
        lastResult,
        reset,
    };
}

// Hook for verifying email token
export function useVerifyEmailToken() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<VerifyTokenResponse | null>(null);

    const verifyToken = async (token: string): Promise<VerifyTokenResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailVerificationAPI.verifyToken({ token });
            setLastResult(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailVerificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setLastResult(null);
    };

    return {
        verifyToken,
        loading,
        error,
        lastResult,
        reset,
    };
}

// Comprehensive email verification hook
export function useEmailVerification() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerifyTokenResponse | null>(null);

    const sendVerification = async (userId: string): Promise<SendVerificationResponse> => {
        setLoading(true);
        setError(null);
        setVerificationSent(false);

        try {
            const response = await EmailVerificationAPI.sendVerification({ userId });
            setVerificationSent(true);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailVerificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyToken = async (token: string): Promise<VerifyTokenResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailVerificationAPI.verifyToken({ token });
            setVerificationResult(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailVerificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Validate token without API call
    const validateToken = useCallback((token: string) => {
        if (!token) return { valid: false, reason: "Token is required" };

        if (!EmailVerificationUtils.isValidToken(token)) {
            return { valid: false, reason: "Invalid token format" };
        }

        if (EmailVerificationUtils.isTokenExpired(token)) {
            return { valid: false, reason: "Token has expired" };
        }

        return { valid: true, reason: null };
    }, []);

    // Get token information
    const getTokenInfo = useCallback((token: string) => {
        if (!token) return null;

        return {
            email: EmailVerificationUtils.getEmailFromToken(token),
            userId: EmailVerificationUtils.getUserIdFromToken(token),
            expiresAt: EmailVerificationUtils.getTokenExpirationTime(token),
            isExpired: EmailVerificationUtils.isTokenExpired(token),
            isValid: EmailVerificationUtils.isValidToken(token),
        };
    }, []);

    // Format messages for UI
    const formatErrorMessage = useCallback((error: string) => {
        return EmailVerificationUtils.generateErrorMessage(error);
    }, []);

    const formatSuccessMessage = useCallback((user: VerifyTokenResponse['user']) => {
        return EmailVerificationUtils.generateSuccessMessage(user);
    }, []);

    const formatExpirationTime = useCallback((expiresAt: string) => {
        return EmailVerificationUtils.formatExpirationTime(expiresAt);
    }, []);

    const reset = () => {
        setError(null);
        setVerificationSent(false);
        setVerificationResult(null);
    };

    return {
        // Core methods
        sendVerification,
        verifyToken,

        // Validation methods
        validateToken,
        getTokenInfo,

        // Formatting methods
        formatErrorMessage,
        formatSuccessMessage,
        formatExpirationTime,

        // State
        loading,
        error,
        verificationSent,
        verificationResult,
        reset,

        // Utilities
        utils: EmailVerificationUtils,
    };
}

// Hook for email verification flow (complete process)
export function useEmailVerificationFlow() {
    const [currentStep, setCurrentStep] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'>('idle');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationData, setVerificationData] = useState<{
        sent?: SendVerificationResponse;
        verified?: VerifyTokenResponse;
    }>({});

    const startVerification = async (userId: string) => {
        setCurrentStep('sending');
        setLoading(true);
        setError(null);

        try {
            const response = await EmailVerificationAPI.sendVerification({ userId });
            setVerificationData(prev => ({ ...prev, sent: response.data }));
            setCurrentStep('sent');
        } catch (err) {
            const errorMessage = handleEmailVerificationApiError(err);
            setError(errorMessage);
            setCurrentStep('error');
        } finally {
            setLoading(false);
        }
    };

    const completeVerification = async (token: string) => {
        setCurrentStep('verifying');
        setLoading(true);
        setError(null);

        try {
            const response = await EmailVerificationAPI.verifyToken({ token });
            setVerificationData(prev => ({ ...prev, verified: response.data }));
            setCurrentStep('verified');
        } catch (err) {
            const errorMessage = handleEmailVerificationApiError(err);
            setError(errorMessage);
            setCurrentStep('error');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setCurrentStep('idle');
        setError(null);
        setVerificationData({});
    };

    const canResend = currentStep === 'sent' || currentStep === 'error';
    const isComplete = currentStep === 'verified';
    const hasError = currentStep === 'error';

    return {
        // Actions
        startVerification,
        completeVerification,
        reset,

        // State
        currentStep,
        loading,
        error,
        verificationData,

        // Computed state
        canResend,
        isComplete,
        hasError,

        // Step checks
        isIdle: currentStep === 'idle',
        isSending: currentStep === 'sending',
        isSent: currentStep === 'sent',
        isVerifying: currentStep === 'verifying',
        isVerified: currentStep === 'verified',
        isError: currentStep === 'error',
    };
}

// Hook for email verification status tracking
export function useEmailVerificationStatus() {
    const [status, setStatus] = useState<{
        attempts: number;
        lastAttempt: Date | null;
        lastSuccess: Date | null;
        consecutiveFailures: number;
    }>({
        attempts: 0,
        lastAttempt: null,
        lastSuccess: null,
        consecutiveFailures: 0,
    });

    const recordAttempt = (success: boolean) => {
        setStatus(prev => ({
            attempts: prev.attempts + 1,
            lastAttempt: new Date(),
            lastSuccess: success ? new Date() : prev.lastSuccess,
            consecutiveFailures: success ? 0 : prev.consecutiveFailures + 1,
        }));
    };

    const resetStatus = () => {
        setStatus({
            attempts: 0,
            lastAttempt: null,
            lastSuccess: null,
            consecutiveFailures: 0,
        });
    };

    const canRetry = status.consecutiveFailures < 3;
    const needsCooldown = status.consecutiveFailures >= 2;

    return {
        status,
        recordAttempt,
        resetStatus,
        canRetry,
        needsCooldown,
    };
}
