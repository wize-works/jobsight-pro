export interface EmailResult {
    success: boolean;
    message?: string;
    error?: string;
}

export async function sendPasswordResetEmailClient(email: string): Promise<EmailResult> {
    try {
        const response = await fetch('/api/auth/password-reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
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
        console.error('Error sending password reset email:', error);
        return {
            success: false,
            error: "Failed to send password reset email"
        };
    }
}

export async function sendEmailVerificationClient(userId: string): Promise<EmailResult> {
    try {
        const response = await fetch('/api/email-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
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
        console.error('Error sending email verification:', error);
        return {
            success: false,
            error: "Failed to send verification email"
        };
    }
}

export async function sendProjectUpdateNotificationClient(
    projectId: string,
    updateType: "milestone_completed" | "status_change" | "task_assigned" | "deadline_approaching",
    updateDetails: string,
    updatedBy: string
): Promise<EmailResult> {
    try {
        const response = await fetch('/api/email-notifications/project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId,
                updateType,
                updateDetails,
                updatedBy
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
        console.error('Error sending project notification:', error);
        return {
            success: false,
            error: "Failed to send project notifications"
        };
    }
}

export async function sendEquipmentAlertClient(
    equipmentId: string,
    alertType: "maintenance_due" | "inspection_required" | "malfunction" | "assignment_change",
    description: string,
    priority: "low" | "medium" | "high" = "medium"
): Promise<EmailResult> {
    try {
        const response = await fetch('/api/email-notifications/equipment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                equipmentId,
                alertType,
                description,
                priority
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
        console.error('Error sending equipment alert:', error);
        return {
            success: false,
            error: "Failed to send equipment alert"
        };
    }
}
