"use client";

import { useState, useEffect } from "react";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { FeatureGate } from "./FeatureGate";
import { toast } from "react-hot-toast";

interface BrandingSettings {
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    company_name: string;
    footer_text: string;
    hide_jobsight_branding: boolean;
}

interface BrandingManagerProps {
    businessId: string;
    currentSettings?: Partial<BrandingSettings>;
    onSettingsChange?: (settings: BrandingSettings) => void;
}

export function BrandingManager({
    businessId,
    currentSettings = {},
    onSettingsChange
}: BrandingManagerProps) {
    const { getCurrentPlan } = useSubscriptionContext();
    const currentPlan = getCurrentPlan();
    const [settings, setSettings] = useState<BrandingSettings>({
        logo_url: currentSettings.logo_url || "",
        primary_color: currentSettings.primary_color || "#F87431",
        secondary_color: currentSettings.secondary_color || "#02ACA3",
        company_name: currentSettings.company_name || "",
        footer_text: currentSettings.footer_text || "",
        hide_jobsight_branding: currentSettings.hide_jobsight_branding || false,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSettingChange = (key: keyof BrandingSettings, value: string | boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        onSettingsChange?.(newSettings);
    };

    const handleLogoUpload = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Logo file must be less than 5MB");
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Implement actual logo upload to storage
            // For now, create a local preview URL
            const previewUrl = URL.createObjectURL(file);
            handleSettingChange("logo_url", previewUrl);
            toast.success("Logo uploaded successfully");
        } catch (error) {
            toast.error("Failed to upload logo");
        } finally {
            setIsLoading(false);
        }
    };

    const previewColors = {
        primary: settings.primary_color,
        secondary: settings.secondary_color,
    };

    return (<FeatureGate
        feature="custom_branding"
        requiredPlan="pro"
        fallback={
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="far fa-palette text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">Custom Branding</h3>
                    </div>
                    <div className="alert">
                        <i className="far fa-info-circle text-info"></i>
                        <div>
                            <h4 className="font-semibold">Pro+ Feature Required</h4>
                            <p className="text-sm">Upgrade to Pro+ to customize your company's branding, including logo, colors, and white-label options.</p>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button className="btn btn-primary">
                            <i className="far fa-arrow-up"></i>
                            Upgrade to Pro+
                        </button>
                    </div>
                </div>
            </div>
        }
    >
        <div className="space-y-6">
            {/* Logo Settings */}
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="far fa-image text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">Company Logo</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">
                                <span className="label-text font-medium">Logo Preview</span>
                            </label>
                            <div className="w-32 h-32 bg-base-200 border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center">
                                {settings.logo_url ? (
                                    <img
                                        src={settings.logo_url}
                                        alt="Company Logo"
                                        className="max-w-full max-h-full object-contain rounded"
                                    />
                                ) : (
                                    <div className="text-center text-base-content/50">
                                        <i className="far fa-image text-2xl mb-2 block"></i>
                                        <span className="text-sm">No logo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text font-medium">Upload New Logo</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="file-input file-input-bordered w-full"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(file);
                                }}
                                disabled={isLoading}
                            />
                            <div className="label">
                                <span className="label-text-alt">Recommended: PNG or SVG, max 5MB</span>
                            </div>

                            {settings.logo_url && (
                                <button
                                    onClick={() => handleSettingChange("logo_url", "")}
                                    className="btn btn-outline btn-error btn-sm mt-2"
                                >
                                    <i className="far fa-trash"></i>
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Color Settings */}
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="far fa-palette text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">Brand Colors</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Primary Color</span>
                            </label>
                            <div className="join">
                                <input
                                    type="color"
                                    value={settings.primary_color}
                                    onChange={(e) => handleSettingChange("primary_color", e.target.value)}
                                    className="input join-item w-16"
                                />
                                <input
                                    type="text"
                                    value={settings.primary_color}
                                    onChange={(e) => handleSettingChange("primary_color", e.target.value)}
                                    className="input input-bordered join-item flex-1"
                                    placeholder="#F87431"
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Secondary Color</span>
                            </label>
                            <div className="join">
                                <input
                                    type="color"
                                    value={settings.secondary_color}
                                    onChange={(e) => handleSettingChange("secondary_color", e.target.value)}
                                    className="input join-item w-16"
                                />
                                <input
                                    type="text"
                                    value={settings.secondary_color}
                                    onChange={(e) => handleSettingChange("secondary_color", e.target.value)}
                                    className="input input-bordered join-item flex-1"
                                    placeholder="#02ACA3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color Preview */}
                    <div className="mt-4">
                        <label className="label">
                            <span className="label-text font-medium">Color Preview</span>
                        </label>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-16 h-16 rounded-lg border border-base-300"
                                    style={{ backgroundColor: settings.primary_color }}
                                ></div>
                                <span className="text-xs mt-1">Primary</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-16 h-16 rounded-lg border border-base-300"
                                    style={{ backgroundColor: settings.secondary_color }}
                                ></div>
                                <span className="text-xs mt-1">Secondary</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Information */}
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="far fa-building text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">Company Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Company Name</span>
                            </label>
                            <input
                                type="text"
                                value={settings.company_name}
                                onChange={(e) => handleSettingChange("company_name", e.target.value)}
                                className="input input-bordered"
                                placeholder="Your Construction Company"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Footer Text</span>
                            </label>
                            <input
                                type="text"
                                value={settings.footer_text}
                                onChange={(e) => handleSettingChange("footer_text", e.target.value)}
                                className="input input-bordered"
                                placeholder="© 2024 Your Company. All rights reserved."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* White Label Options */}
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="far fa-eye-slash text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">White Label Options</h3>
                    </div>

                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text">
                                <div>
                                    <div className="font-medium">Hide JobSight Branding</div>
                                    <div className="text-sm text-base-content/70">
                                        Remove "Powered by JobSight" from reports and client-facing documents
                                    </div>
                                </div>
                            </span>
                            <input
                                type="checkbox"
                                checked={settings.hide_jobsight_branding}
                                onChange={(e) => handleSettingChange("hide_jobsight_branding", e.target.checked)}
                                className="toggle toggle-primary"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="far fa-eye text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">Preview</h3>
                    </div>

                    <div className="mockup-browser border border-base-300">
                        <div className="mockup-browser-toolbar">
                            <div className="input">https://yourcompany.jobsight.app</div>
                        </div>
                        <div className="flex justify-center px-4 py-16 bg-base-200">
                            <div
                                className="text-center p-8 rounded-lg text-white"
                                style={{ backgroundColor: settings.primary_color }}
                            >
                                {settings.logo_url && (
                                    <img
                                        src={settings.logo_url}
                                        alt="Logo"
                                        className="h-12 mx-auto mb-4"
                                    />
                                )}
                                <h2 className="text-2xl font-bold">
                                    {settings.company_name || "Your Company Name"}
                                </h2>
                                <p className="mt-2">Professional Construction Management</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </FeatureGate>
    );
}
