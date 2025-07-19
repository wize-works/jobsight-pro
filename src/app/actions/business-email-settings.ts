export interface BusinessEmailSettings {
    paymentReminders: boolean;
    upgradePrompts: boolean;
    featureAnnouncements: boolean;
    usageAlerts: boolean;
    securityUpdates: boolean;
    monthlyReports: boolean;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    type: 'payment' | 'upgrade' | 'feature' | 'usage' | 'security' | 'report';
    requiredPlan: string;
    enabled: boolean;
    description: string;
}

export const DEFAULT_EMAIL_SETTINGS: BusinessEmailSettings = {
    paymentReminders: true,
    upgradePrompts: true,
    featureAnnouncements: true,
    usageAlerts: true,
    securityUpdates: true,
    monthlyReports: false
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        subject: 'Payment Due Reminder - JobSight Pro',
        type: 'payment',
        requiredPlan: 'all',
        enabled: true,
        description: 'Remind customers about upcoming payments'
    },
    {
        id: 'payment_failed',
        name: 'Payment Failed',
        subject: 'Payment Failed - Action Required',
        type: 'payment',
        requiredPlan: 'all',
        enabled: true,
        description: 'Notify when payment processing fails'
    },
    {
        id: 'subscription_expired',
        name: 'Subscription Expired',
        subject: 'Your JobSight Pro Subscription Has Expired',
        type: 'payment',
        requiredPlan: 'all',
        enabled: true,
        description: 'Notify when subscription has expired'
    },
    {
        id: 'upgrade_suggestion',
        name: 'Plan Upgrade Suggestion',
        subject: 'Unlock More Features with JobSight Pro',
        type: 'upgrade',
        requiredPlan: 'starter',
        enabled: true,
        description: 'Suggest plan upgrades based on usage'
    },
    {
        id: 'feature_announcement',
        name: 'New Feature Announcement',
        subject: 'New Features Available in JobSight Pro',
        type: 'feature',
        requiredPlan: 'all',
        enabled: true,
        description: 'Announce new features and updates'
    },
    {
        id: 'usage_limit_warning',
        name: 'Usage Limit Warning',
        subject: 'Approaching Plan Limits - JobSight Pro',
        type: 'usage',
        requiredPlan: 'starter',
        enabled: true,
        description: 'Warn when approaching usage limits'
    },
    {
        id: 'security_alert',
        name: 'Security Alert',
        subject: 'Important Security Update - JobSight Pro',
        type: 'security',
        requiredPlan: 'all',
        enabled: true,
        description: 'Important security notifications'
    },
    {
        id: 'monthly_usage_report',
        name: 'Monthly Usage Report',
        subject: 'Your Monthly JobSight Pro Report',
        type: 'report',
        requiredPlan: 'pro',
        enabled: false,
        description: 'Monthly summary of usage and activity'
    }
];

/**
 * Get business email settings - Enhanced with localStorage persistence
 */
export function getBusinessEmailSettings(businessId?: string): {
    success: boolean;
    settings: BusinessEmailSettings;
} {
    try {
        if (businessId) {
            // Try to load from localStorage first
            const storageKey = `business-email-settings-${businessId}`;
            const savedSettings = localStorage.getItem(storageKey);

            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Merge with defaults to ensure all properties exist
                const mergedSettings = { ...DEFAULT_EMAIL_SETTINGS, ...parsedSettings };
                return {
                    success: true,
                    settings: mergedSettings
                };
            }
        }

        // Return defaults if no saved settings or no businessId
        return {
            success: true,
            settings: DEFAULT_EMAIL_SETTINGS
        };
    } catch (error) {
        console.error("Error loading business email settings:", error);
        return {
            success: true,
            settings: DEFAULT_EMAIL_SETTINGS
        };
    }
}

/**
 * Update business email settings - Enhanced with localStorage persistence
 */
export function updateBusinessEmailSettings(
    businessId: string,
    settings: BusinessEmailSettings
): {
    success: boolean;
    error?: string;
} {
    try {
        // Save to localStorage for persistence until backend storage is available
        const storageKey = `business-email-settings-${businessId}`;
        const settingsData = {
            ...settings,
            lastUpdated: new Date().toISOString(),
            businessId
        };

        localStorage.setItem(storageKey, JSON.stringify(settingsData));

        // Also save to a business-wide settings key for easier access
        const allBusinessSettings = JSON.parse(localStorage.getItem('all-business-email-settings') || '{}');
        allBusinessSettings[businessId] = settingsData;
        localStorage.setItem('all-business-email-settings', JSON.stringify(allBusinessSettings));

        console.log(`Email settings saved for business ${businessId}:`, settings);
        return { success: true };
    } catch (error) {
        console.error("Error updating business email settings:", error);
        return {
            success: false,
            error: "Failed to update email settings"
        };
    }
}

/**
 * Get email templates - Enhanced with localStorage persistence
 */
export function getBusinessEmailTemplates(businessId?: string): {
    success: boolean;
    templates: EmailTemplate[];
} {
    try {
        if (businessId) {
            // Try to load from localStorage first
            const storageKey = `business-email-templates-${businessId}`;
            const savedTemplates = localStorage.getItem(storageKey);

            if (savedTemplates) {
                const parsedData = JSON.parse(savedTemplates);
                return {
                    success: true,
                    templates: parsedData.templates || DEFAULT_EMAIL_TEMPLATES
                };
            }
        }

        // Return defaults if no saved templates or no businessId
        return {
            success: true,
            templates: DEFAULT_EMAIL_TEMPLATES
        };
    } catch (error) {
        console.error("Error loading business email templates:", error);
        return {
            success: true,
            templates: DEFAULT_EMAIL_TEMPLATES
        };
    }
}

/**
 * Update business email template settings - Enhanced with localStorage persistence
 */
export function updateBusinessEmailTemplates(
    businessId: string,
    templates: EmailTemplate[]
): {
    success: boolean;
    error?: string;
} {
    try {
        // Save to localStorage for persistence until backend storage is available
        const storageKey = `business-email-templates-${businessId}`;
        const templatesData = {
            templates,
            lastUpdated: new Date().toISOString(),
            businessId
        };

        localStorage.setItem(storageKey, JSON.stringify(templatesData));

        console.log(`Email templates saved for business ${businessId}:`, templates.length, 'templates');
        return { success: true };
    } catch (error) {
        console.error("Error updating business email templates:", error);
        return {
            success: false,
            error: "Failed to update email templates"
        };
    }
}
