"use client";

import React, { useState, useEffect } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';

interface EmailNotificationSettings {
    paymentReminders: boolean;
    upgradePrompts: boolean;
    featureAnnouncements: boolean;
    usageAlerts: boolean;
    securityUpdates: boolean;
    monthlyReports: boolean;
}

interface NotificationTemplate {
    id: string;
    name: string;
    subject: string;
    type: 'payment' | 'upgrade' | 'feature' | 'usage' | 'security' | 'report';
    requiredPlan: BusinessSubscriptionPlan | 'all';
    enabled: boolean;
    description: string;
}

interface SubscriptionEmailManagerProps {
    businessId: string;
    className?: string;
}

export const SubscriptionEmailManager: React.FC<SubscriptionEmailManagerProps> = ({
    businessId,
    className = ''
}) => {
    const { getCurrentPlan } = useSubscriptionContext();
    const [settings, setSettings] = useState<EmailNotificationSettings>({
        paymentReminders: true,
        upgradePrompts: true,
        featureAnnouncements: true,
        usageAlerts: true,
        securityUpdates: true,
        monthlyReports: false
    });
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const currentPlan = getCurrentPlan();

    useEffect(() => {
        loadEmailSettings();
        loadEmailTemplates();
    }, [businessId]);

    const loadEmailSettings = async () => {
        try {
            // TODO: Load actual settings from backend
            // For now, using default settings
            setLoading(false);
        } catch (error) {
            console.error('Error loading email settings:', error);
            setLoading(false);
        }
    };

    const loadEmailTemplates = async () => {
        try {
            // TODO: Load actual templates from backend
            const mockTemplates: NotificationTemplate[] = [
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

            setTemplates(mockTemplates);
        } catch (error) {
            console.error('Error loading email templates:', error);
        }
    };

    const handleSettingChange = (setting: keyof EmailNotificationSettings, value: boolean) => {
        setSettings(prev => ({ ...prev, [setting]: value }));
    };

    const handleTemplateToggle = (templateId: string) => {
        setTemplates(prev => prev.map(template =>
            template.id === templateId
                ? { ...template, enabled: !template.enabled }
                : template
        ));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            // TODO: Save settings to backend
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            console.log('Email settings saved:', { settings, templates });
        } catch (error) {
            console.error('Error saving email settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const canUseTemplate = (template: NotificationTemplate): boolean => {
        if (template.requiredPlan === 'all') return true;
        if (!currentPlan) return false;

        const planHierarchy = {
            personal: 0,
            starter: 1,
            pro: 2,
            business: 3,
            enterprise: 4
        };

        const currentPlanLevel = planHierarchy[currentPlan.id as BusinessSubscriptionPlan] || 0;
        const requiredLevel = planHierarchy[template.requiredPlan] || 0;

        return currentPlanLevel >= requiredLevel;
    };

    const getTemplatesByType = (type: NotificationTemplate['type']) => {
        return templates.filter(template => template.type === type);
    };

    if (loading) {
        return (
            <div className={`card bg-base-100 shadow-lg ${className}`}>
                <div className="card-body">
                    <div className="flex justify-center items-center h-32">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* General Settings */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="card-title">Email Notification Settings</h3>
                            <p className="text-sm text-base-content/70">
                                Manage your subscription-related email preferences
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={saveSettings}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="far fa-save mr-2"></i>
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">
                                    <div>
                                        <div className="font-medium">Payment Reminders</div>
                                        <div className="text-sm text-base-content/70">
                                            Receive reminders about upcoming payments
                                        </div>
                                    </div>
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={settings.paymentReminders}
                                    onChange={(e) => handleSettingChange('paymentReminders', e.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">
                                    <div>
                                        <div className="font-medium">Upgrade Prompts</div>
                                        <div className="text-sm text-base-content/70">
                                            Get notified about plan upgrade opportunities
                                        </div>
                                    </div>
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={settings.upgradePrompts}
                                    onChange={(e) => handleSettingChange('upgradePrompts', e.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">
                                    <div>
                                        <div className="font-medium">Feature Announcements</div>
                                        <div className="text-sm text-base-content/70">
                                            Stay updated on new features and improvements
                                        </div>
                                    </div>
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={settings.featureAnnouncements}
                                    onChange={(e) => handleSettingChange('featureAnnouncements', e.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">
                                    <div>
                                        <div className="font-medium">Usage Alerts</div>
                                        <div className="text-sm text-base-content/70">
                                            Get alerts when approaching plan limits
                                        </div>
                                    </div>
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={settings.usageAlerts}
                                    onChange={(e) => handleSettingChange('usageAlerts', e.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">
                                    <div>
                                        <div className="font-medium">Security Updates</div>
                                        <div className="text-sm text-base-content/70">
                                            Important security notifications (recommended)
                                        </div>
                                    </div>
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={settings.securityUpdates}
                                    onChange={(e) => handleSettingChange('securityUpdates', e.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">
                                    <div>
                                        <div className="font-medium">Monthly Reports</div>
                                        <div className="text-sm text-base-content/70">
                                            Detailed usage and analytics reports
                                        </div>
                                    </div>
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={settings.monthlyReports}
                                    onChange={(e) => handleSettingChange('monthlyReports', e.target.checked)}
                                    disabled={!canUseTemplate({ requiredPlan: 'pro' } as NotificationTemplate)}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Templates */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="card-title mb-6">Email Templates</h3>

                    <div className="space-y-8">
                        {/* Payment Notifications */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <i className="far fa-credit-card text-primary"></i>
                                Payment Notifications
                            </h4>
                            <div className="space-y-3">
                                {getTemplatesByType('payment').map(template => (
                                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium">{template.name}</div>
                                            <div className="text-sm text-base-content/70">{template.description}</div>
                                            <div className="text-xs text-base-content/50 mt-1">
                                                Subject: {template.subject}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {template.requiredPlan !== 'all' && (
                                                <div className="badge badge-primary badge-sm">
                                                    {template.requiredPlan}+ only
                                                </div>
                                            )}
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-sm"
                                                checked={template.enabled && canUseTemplate(template)}
                                                onChange={() => handleTemplateToggle(template.id)}
                                                disabled={!canUseTemplate(template)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Usage Notifications */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <i className="far fa-chart-bar text-secondary"></i>
                                Usage Notifications
                            </h4>
                            <div className="space-y-3">
                                {getTemplatesByType('usage').map(template => (
                                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium">{template.name}</div>
                                            <div className="text-sm text-base-content/70">{template.description}</div>
                                            <div className="text-xs text-base-content/50 mt-1">
                                                Subject: {template.subject}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {template.requiredPlan !== 'all' && (
                                                <div className="badge badge-primary badge-sm">
                                                    {template.requiredPlan}+ only
                                                </div>
                                            )}
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-sm"
                                                checked={template.enabled && canUseTemplate(template)}
                                                onChange={() => handleTemplateToggle(template.id)}
                                                disabled={!canUseTemplate(template)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Other Notifications */}
                        {['upgrade', 'feature', 'security', 'report'].map(type => (
                            <div key={type}>
                                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <i className={`far ${type === 'upgrade' ? 'fa-arrow-up text-warning' :
                                            type === 'feature' ? 'fa-star text-info' :
                                                type === 'security' ? 'fa-shield-alt text-error' :
                                                    'fa-file-alt text-success'
                                        }`}></i>
                                    {type.charAt(0).toUpperCase() + type.slice(1)} Notifications
                                </h4>
                                <div className="space-y-3">
                                    {getTemplatesByType(type as NotificationTemplate['type']).map(template => (
                                        <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium">{template.name}</div>
                                                <div className="text-sm text-base-content/70">{template.description}</div>
                                                <div className="text-xs text-base-content/50 mt-1">
                                                    Subject: {template.subject}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {template.requiredPlan !== 'all' && (
                                                    <div className="badge badge-primary badge-sm">
                                                        {template.requiredPlan}+ only
                                                    </div>
                                                )}
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-sm"
                                                    checked={template.enabled && canUseTemplate(template)}
                                                    onChange={() => handleTemplateToggle(template.id)}
                                                    disabled={!canUseTemplate(template)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
