"use client";

import React, { useState } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';
import {
    useBusinessEmailManagement,
    type BusinessEmailSettings,
    type BusinessEmailTemplate
} from '@/hooks/useBusinessEmailSettings';

interface SubscriptionEmailManagerProps {
    businessId: string;
    className?: string;
}

export const SubscriptionEmailManager: React.FC<SubscriptionEmailManagerProps> = ({
    businessId,
    className = ''
}) => {
    const { getCurrentPlan } = useSubscriptionContext();
    const [saving, setSaving] = useState(false);

    // Use the hook for email settings and templates
    const {
        settings,
        templates,
        loading,
        error,
        updateSettings,
        updateTemplate,
        saveAll
    } = useBusinessEmailManagement(businessId);

    const currentPlan = getCurrentPlan();

    const handleSettingChange = (setting: keyof BusinessEmailSettings, value: boolean) => {
        const newSettings = { ...settings, [setting]: value };
        updateSettings(newSettings);
    };

    const handleTemplateToggle = async (templateId: string, enabled: boolean) => {
        await updateTemplate(templateId, { enabled });
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const result = await saveAll(settings, templates);

            if (!result.success) {
                console.error('Failed to save settings:', result.error);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const canUseTemplate = (template: BusinessEmailTemplate): boolean => {
        if (template.requiredPlan === 'all') return true;

        const planHierarchy: Record<string, number> = {
            personal: 1,
            starter: 2,
            pro: 3,
            business: 4,
            enterprise: 5
        };

        const currentLevel = planHierarchy[currentPlan?.toString() || 'personal'] || 0;
        const requiredLevel = planHierarchy[template.requiredPlan] || 0;

        return currentLevel >= requiredLevel;
    };

    const getTemplatesByType = (type: BusinessEmailTemplate['type']) => {
        return templates.filter(template => template.type === type);
    };

    if (loading) {
        return (
            <div className={`card bg-base-100 shadow-lg ${className}`}>
                <div className="card-body">
                    <div className="flex justify-center items-center h-32">
                        <span className="loading loading-spinner loading-lg"></span>
                        <span className="ml-2">Loading email settings...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`alert alert-error ${className}`}>
                <div>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Failed to load email settings: {error}</span>
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
                            <h3 className="card-title flex items-center gap-2">
                                <i className="far fa-envelope"></i>
                                Email Notification Settings
                            </h3>
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
                                        <div className="font-medium flex items-center gap-2">
                                            <i className="far fa-credit-card"></i>
                                            Payment Reminders
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            Notifications about upcoming payments and billing issues
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
                                        <div className="font-medium flex items-center gap-2">
                                            <i className="far fa-arrow-up"></i>
                                            Upgrade Prompts
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            Suggestions to upgrade your plan based on usage
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
                                        <div className="font-medium flex items-center gap-2">
                                            <i className="far fa-bullhorn"></i>
                                            Feature Announcements
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            Updates about new features and improvements
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
                                        <div className="font-medium flex items-center gap-2">
                                            <i className="far fa-exclamation-triangle"></i>
                                            Usage Alerts
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            Warnings when approaching plan limits
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
                                        <div className="font-medium flex items-center gap-2">
                                            <i className="far fa-shield"></i>
                                            Security Updates
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            Critical security and maintenance notifications
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
                                        <div className="font-medium flex items-center gap-2">
                                            <i className="far fa-file-alt"></i>
                                            Monthly Reports
                                            {!canUseTemplate({ requiredPlan: 'pro' } as BusinessEmailTemplate) && (
                                                <span className="badge badge-primary badge-sm ml-2">Pro+</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            Monthly usage and performance reports (Pro+ only)
                                        </div>
                                    </div>
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={settings.monthlyReports}
                                    onChange={(e) => handleSettingChange('monthlyReports', e.target.checked)}
                                    disabled={!canUseTemplate({ requiredPlan: 'pro' } as BusinessEmailTemplate)}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Templates */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="card-title mb-6 flex items-center gap-2">
                        <i className="far fa-file-alt"></i>
                        Email Templates
                    </h3>
                    <p className="text-sm text-base-content/70 mb-6">
                        Manage individual email templates and their status
                    </p>

                    <div className="space-y-8">
                        {/* Payment Notifications */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <i className="far fa-credit-card text-primary"></i>
                                Payment Notifications
                            </h4>
                            <div className="space-y-3">
                                {getTemplatesByType('payment').map(template => {
                                    const canUseThisTemplate = canUseTemplate(template);
                                    return (
                                        <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    {template.name}
                                                    {template.requiredPlan !== 'all' && (
                                                        <span className={`badge badge-sm ${canUseThisTemplate ? 'badge-primary' : 'badge-secondary'}`}>
                                                            {template.requiredPlan}+
                                                        </span>
                                                    )}
                                                    {template.enabled ? (
                                                        <span className="badge badge-success badge-sm">
                                                            <i className="far fa-check mr-1"></i>
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-ghost badge-sm">
                                                            <i className="far fa-times mr-1"></i>
                                                            Disabled
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-base-content/70 mt-1">{template.description}</div>
                                                <div className="text-xs text-base-content/50 mt-1">
                                                    Subject: {template.subject}
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-sm"
                                                checked={template.enabled}
                                                onChange={(e) => handleTemplateToggle(template.id, e.target.checked)}
                                                disabled={!canUseThisTemplate}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Other template types */}
                        {[
                            { type: 'upgrade', icon: 'fa-arrow-up', label: 'Upgrade', color: 'text-warning' },
                            { type: 'feature', icon: 'fa-star', label: 'Feature', color: 'text-info' },
                            { type: 'usage', icon: 'fa-chart-bar', label: 'Usage', color: 'text-secondary' },
                            { type: 'security', icon: 'fa-shield-alt', label: 'Security', color: 'text-error' },
                            { type: 'report', icon: 'fa-file-alt', label: 'Report', color: 'text-success' }
                        ].map(({ type, icon, label, color }) => {
                            const typeTemplates = getTemplatesByType(type as BusinessEmailTemplate['type']);

                            if (typeTemplates.length === 0) return null;

                            return (
                                <div key={type}>
                                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <i className={`far ${icon} ${color}`}></i>
                                        {label} Notifications
                                    </h4>
                                    <div className="space-y-3">
                                        {typeTemplates.map(template => {
                                            const canUseThisTemplate = canUseTemplate(template);
                                            return (
                                                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex-1">
                                                        <div className="font-medium flex items-center gap-2">
                                                            {template.name}
                                                            {template.requiredPlan !== 'all' && (
                                                                <span className={`badge badge-sm ${canUseThisTemplate ? 'badge-primary' : 'badge-secondary'}`}>
                                                                    {template.requiredPlan}+
                                                                </span>
                                                            )}
                                                            {template.enabled ? (
                                                                <span className="badge badge-success badge-sm">
                                                                    <i className="far fa-check mr-1"></i>
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-ghost badge-sm">
                                                                    <i className="far fa-times mr-1"></i>
                                                                    Disabled
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-base-content/70 mt-1">{template.description}</div>
                                                        <div className="text-xs text-base-content/50 mt-1">
                                                            Subject: {template.subject}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="toggle toggle-sm"
                                                        checked={template.enabled}
                                                        onChange={(e) => handleTemplateToggle(template.id, e.target.checked)}
                                                        disabled={!canUseThisTemplate}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Current Plan Info */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body pt-6">
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <span className="badge badge-outline">Current Plan: {currentPlan?.toString() || 'Personal'}</span>
                        <span>•</span>
                        <span>Some features require higher tier plans</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
