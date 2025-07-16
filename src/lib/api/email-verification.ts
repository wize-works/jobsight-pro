// Email Verification API Client

// Types
export interface SendVerificationRequest {
    userId: string;
}

export interface VerifyTokenRequest {
    token: string;
}

export interface SendVerificationResponse {
    sent: boolean;
    messageId?: string;
    expiresAt: string;
}

export interface VerifyTokenResponse {
    verified: boolean;
    user: {
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        status: string;
        email_verified: boolean;
    };
}

export interface EmailVerificationApiError {
    error: string;
    message?: string;
}

// Email Verification API
export class EmailVerificationAPI {
    private static baseUrl = "/api/email-verification";

    // Send email verification
    static async sendVerification(data: SendVerificationRequest): Promise<{
        data: SendVerificationResponse;
        message: string;
    }> {
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error: EmailVerificationApiError = await response.json();
            throw new Error(error.error || "Failed to send verification email");
        }

        return response.json();
    }

    // Verify email token
    static async verifyToken(data: VerifyTokenRequest): Promise<{
        data: VerifyTokenResponse;
        message: string;
    }> {
        const response = await fetch(this.baseUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error: EmailVerificationApiError = await response.json();
            throw new Error(error.error || "Failed to verify email token");
        }

        return response.json();
    }
}

// Helper function to handle API errors
export function handleEmailVerificationApiError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "An unknown error occurred";
}

// Utility functions
export const EmailVerificationUtils = {
    // Validate verification token format
    isValidToken(token: string): boolean {
        try {
            const decoded = JSON.parse(Buffer.from(token, "base64").toString());
            return decoded.userId && decoded.email && decoded.businessId && decoded.expiresAt;
        } catch {
            return false;
        }
    },

    // Check if token is expired
    isTokenExpired(token: string): boolean {
        try {
            const decoded = JSON.parse(Buffer.from(token, "base64").toString());
            return new Date(decoded.expiresAt) < new Date();
        } catch {
            return true;
        }
    },

    // Extract email from token
    getEmailFromToken(token: string): string | null {
        try {
            const decoded = JSON.parse(Buffer.from(token, "base64").toString());
            return decoded.email || null;
        } catch {
            return null;
        }
    },

    // Extract user ID from token
    getUserIdFromToken(token: string): string | null {
        try {
            const decoded = JSON.parse(Buffer.from(token, "base64").toString());
            return decoded.userId || null;
        } catch {
            return null;
        }
    },

    // Calculate token expiration time
    getTokenExpirationTime(token: string): Date | null {
        try {
            const decoded = JSON.parse(Buffer.from(token, "base64").toString());
            return new Date(decoded.expiresAt);
        } catch {
            return null;
        }
    },

    // Format expiration time for display
    formatExpirationTime(expiresAt: string): string {
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        const diffMs = expirationDate.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} and ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        } else {
            return "less than a minute";
        }
    },

    // Create verification request
    createVerificationRequest(userId: string): SendVerificationRequest {
        return { userId };
    },

    // Create token verification request
    createTokenVerificationRequest(token: string): VerifyTokenRequest {
        return { token };
    },

    // Format user display name
    formatUserDisplayName(user: VerifyTokenResponse['user']): string {
        if (user.first_name) {
            return `${user.first_name} ${user.last_name || ""}`.trim();
        }
        return user.email;
    },

    // Generate verification success message
    generateSuccessMessage(user: VerifyTokenResponse['user']): string {
        const displayName = this.formatUserDisplayName(user);
        return `Email verification successful! Welcome to JobSight Pro, ${displayName}.`;
    },

    // Generate verification error message
    generateErrorMessage(error: string): string {
        switch (error) {
            case "Email is already verified":
                return "Your email address has already been verified. You can proceed to use your account.";
            case "Verification token has expired":
                return "This verification link has expired. Please request a new verification email.";
            case "Invalid verification token":
                return "This verification link is invalid. Please request a new verification email.";
            default:
                return "An error occurred during email verification. Please try again or contact support.";
        }
    },
};
