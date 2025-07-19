import { useState, useEffect, useCallback } from 'react';

export interface BusinessEmailSettings {
    paymentReminders: boolean;
    upgradePrompts: boolean;
    featureAnnouncements: boolean;
    usageAlerts: boolean;
    securityUpdates: boolean;
    monthlyReports: boolean;
}

export interface BusinessEmailTemplate {
    id: string;
    name: string;
    subject: string;
    type: 'payment' | 'upgrade' | 'feature' | 'usage' | 'security' | 'report';
    requiredPlan: string;
    enabled: boolean;
    description: string;
}

const DEFAULT_EMAIL_SETTINGS: BusinessEmailSettings = {
    paymentReminders: true,
    upgradePrompts: true,
    featureAnnouncements: true,
    usageAlerts: true,
    securityUpdates: true,
    monthlyReports: false
};

const DEFAULT_EMAIL_TEMPLATES: BusinessEmailTemplate[] = [
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
        description: 'Notify customers when payments fail'
    },
    {
        id: 'upgrade_prompt',
        name: 'Upgrade Suggestion',
        subject: 'Unlock More Features with JobSight Pro+',
        type: 'upgrade',
        requiredPlan: 'all',
        enabled: true,
        description: 'Suggest upgrades based on usage patterns'
    },
    {
        id: 'feature_announcement',
        name: 'New Feature Announcement',
        subject: 'New Features Available in JobSight Pro',
        type: 'feature',
        requiredPlan: 'all',
        enabled: true,
        description: 'Announce new features to subscribers'
    },
    {
        id: 'storage_warning',
        name: 'Storage Limit Warning',
        subject: 'Storage Limit Approaching - JobSight Pro',
        type: 'usage',
        requiredPlan: 'all',
        enabled: true,
        description: 'Warn when approaching storage limits'
    },
    {
        id: 'user_limit_warning',
        name: 'User Limit Warning',
        subject: 'User Limit Reached - JobSight Pro',
        type: 'usage',
        requiredPlan: 'all',
        enabled: true,
        description: 'Notify when user limits are reached'
    },
    {
        id: 'security_update',
        name: 'Security Update',
        subject: 'Important Security Update - JobSight Pro',
        type: 'security',
        requiredPlan: 'all',
        enabled: true,
        description: 'Critical security notifications'
    },
    {
        id: 'monthly_report',
        name: 'Monthly Usage Report',
        subject: 'Your Monthly JobSight Pro Report',
        type: 'report',
        requiredPlan: 'pro',
        enabled: false,
        description: 'Monthly usage and analytics report (Pro+ only)'
    }
];

/**
 * Hook for managing business email settings
 */
export function useBusinessEmailSettings(businessId?: string) {
    const [settings, setSettings] = useState<BusinessEmailSettings>(DEFAULT_EMAIL_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (businessId) {
                // Load from localStorage
                const storageKey = `business-email-settings-${businessId}`;
                const savedSettings = localStorage.getItem(storageKey);

                if (savedSettings) {
                    const parsedSettings = JSON.parse(savedSettings);
                    // Merge with defaults to ensure all properties exist
                    const mergedSettings = { ...DEFAULT_EMAIL_SETTINGS, ...parsedSettings };
                    setSettings(mergedSettings);
                } else {
                    setSettings(DEFAULT_EMAIL_SETTINGS);
                }
            } else {
                setSettings(DEFAULT_EMAIL_SETTINGS);
            }
        } catch (err) {
            console.error('Error loading business email settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to load email settings');
            setSettings(DEFAULT_EMAIL_SETTINGS);
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    const updateSettings = useCallback(async (newSettings: BusinessEmailSettings) => {
        try {
            setError(null);

            // Update state immediately
            setSettings(newSettings);

            if (businessId) {
                // Save to localStorage
                const storageKey = `business-email-settings-${businessId}`;
                const settingsData = {
                    ...newSettings,
                    lastUpdated: new Date().toISOString(),
                    businessId
                };

                localStorage.setItem(storageKey, JSON.stringify(settingsData));

                // Also save to a business-wide settings key for easier access
                const allBusinessSettings = JSON.parse(localStorage.getItem('all-business-email-settings') || '{}');
                allBusinessSettings[businessId] = settingsData;
                localStorage.setItem('all-business-email-settings', JSON.stringify(allBusinessSettings));
            }

            return { success: true };
        } catch (err) {
            console.error('Error updating business email settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to update email settings');
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update email settings' };
        }
    }, [businessId]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        settings,
        loading,
        error,
        updateSettings,
        refetch: loadSettings,
    };
}

/**
 * Hook for managing business email templates
 */
export function useBusinessEmailTemplates(businessId?: string) {
    const [templates, setTemplates] = useState<BusinessEmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (businessId) {
                // Load from localStorage
                const storageKey = `business-email-templates-${businessId}`;
                const savedTemplates = localStorage.getItem(storageKey);

                if (savedTemplates) {
                    const parsedData = JSON.parse(savedTemplates);
                    setTemplates(parsedData.templates || DEFAULT_EMAIL_TEMPLATES);
                } else {
                    setTemplates(DEFAULT_EMAIL_TEMPLATES);
                }
            } else {
                setTemplates(DEFAULT_EMAIL_TEMPLATES);
            }
        } catch (err) {
            console.error('Error loading business email templates:', err);
            setError(err instanceof Error ? err.message : 'Failed to load email templates');
            setTemplates(DEFAULT_EMAIL_TEMPLATES);
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    const updateTemplates = useCallback(async (newTemplates: BusinessEmailTemplate[]) => {
        try {
            setError(null);

            // Update state immediately
            setTemplates(newTemplates);

            if (businessId) {
                // Save to localStorage
                const storageKey = `business-email-templates-${businessId}`;
                const templatesData = {
                    templates: newTemplates,
                    lastUpdated: new Date().toISOString(),
                    businessId
                };

                localStorage.setItem(storageKey, JSON.stringify(templatesData));
            }

            return { success: true };
        } catch (err) {
            console.error('Error updating business email templates:', err);
            setError(err instanceof Error ? err.message : 'Failed to update email templates');
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update email templates' };
        }
    }, [businessId]);

    const updateTemplate = useCallback(async (templateId: string, updates: Partial<BusinessEmailTemplate>) => {
        try {
            setError(null);

            const updatedTemplates = templates.map(template =>
                template.id === templateId
                    ? { ...template, ...updates }
                    : template
            );

            setTemplates(updatedTemplates);

            if (businessId) {
                // Save to localStorage
                const storageKey = `business-email-templates-${businessId}`;
                const templatesData = {
                    templates: updatedTemplates,
                    lastUpdated: new Date().toISOString(),
                    businessId
                };

                localStorage.setItem(storageKey, JSON.stringify(templatesData));
            }

            return { success: true };
        } catch (err) {
            console.error('Error updating business email template:', err);
            setError(err instanceof Error ? err.message : 'Failed to update email template');
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update email template' };
        }
    }, [templates, businessId]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    return {
        templates,
        loading,
        error,
        updateTemplates,
        updateTemplate,
        refetch: loadTemplates,
    };
}

/**
 * Combined hook for business email settings and templates
 */
export function useBusinessEmailManagement(businessId?: string) {
    const settingsHook = useBusinessEmailSettings(businessId);
    const templatesHook = useBusinessEmailTemplates(businessId);

    const saveAll = useCallback(async (settings: BusinessEmailSettings, templates: BusinessEmailTemplate[]) => {
        const [settingsResult, templatesResult] = await Promise.all([
            settingsHook.updateSettings(settings),
            templatesHook.updateTemplates(templates)
        ]);

        return {
            success: settingsResult.success && templatesResult.success,
            error: settingsResult.error || templatesResult.error
        };
    }, [settingsHook, templatesHook]);

    return {
        settings: settingsHook.settings,
        templates: templatesHook.templates,
        loading: settingsHook.loading || templatesHook.loading,
        error: settingsHook.error || templatesHook.error,
        updateSettings: settingsHook.updateSettings,
        updateTemplates: templatesHook.updateTemplates,
        updateTemplate: templatesHook.updateTemplate,
        saveAll,
        refetch: () => {
            settingsHook.refetch();
            templatesHook.refetch();
        },
    };
}
