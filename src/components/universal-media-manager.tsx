"use client";

import React, { useState } from "react";
import { Media, MediaType } from "@/types/media";
import UniversalMediaUploader, { UniversalMediaUploaderProps, MEDIA_CONFIGS } from "./universal-media-uploader";
import UniversalMediaLinker, { UniversalMediaLinkerProps } from "./universal-media-linker";
import { toast } from "@/hooks/use-toast";

export type MediaManagementMode = "upload" | "link" | "both";

export interface UniversalMediaManagerProps {
    // Core functionality
    mode: MediaManagementMode;
    entityType: keyof typeof MEDIA_CONFIGS | "custom";

    // Upload props (when mode includes upload)
    onUpload?: (file: File, metadata: { name: string; description: string; type: MediaType }) => Promise<boolean>;

    // Link props (when mode includes link)
    availableMedia?: Media[];
    linkedMedia?: Media[];
    onLink?: (mediaIds: string[]) => Promise<{ success: boolean; error?: string }>;
    onUnlink?: (mediaIds: string[]) => Promise<{ success: boolean; error?: string }>;

    // Configuration overrides
    uploadConfig?: Partial<UniversalMediaUploaderProps>;
    linkConfig?: Partial<UniversalMediaLinkerProps>;

    // UI Configuration
    title?: string;
    description?: string;
    compact?: boolean;
    disabled?: boolean;

    // Events
    onComplete?: (results?: any) => void;
}

const UniversalMediaManager: React.FC<UniversalMediaManagerProps> = ({
    mode,
    entityType,
    onUpload,
    availableMedia = [],
    linkedMedia = [],
    onLink,
    onUnlink,
    uploadConfig = {},
    linkConfig = {},
    title,
    description,
    compact = false,
    disabled = false,
    onComplete,
}) => {
    const [activeTab, setActiveTab] = useState<"upload" | "link">(
        mode === "upload" ? "upload" : mode === "link" ? "link" : "upload"
    );

    // Get base configuration for entity type
    const baseConfig = entityType === "custom" ? {} : MEDIA_CONFIGS[entityType];    // Merge configurations
    const finalUploadConfig: UniversalMediaUploaderProps = {
        onUpload: onUpload!,
        ...baseConfig,
        ...uploadConfig,
        title: title || (baseConfig as any)?.title || "Upload Media",
        description: description || (baseConfig as any)?.description || "Upload files",
        compact,
        disabled,
        onComplete: (results) => {
            if (results.success.length > 0) {
                toast.success({
                    title: "Upload successful",
                    description: `${results.success.length} file(s) uploaded successfully`,
                });
            }
            if (onComplete) onComplete(results);
        },
    };

    const finalLinkConfig: UniversalMediaLinkerProps = {
        availableMedia,
        linkedMedia,
        onLink: onLink!,
        onUnlink,
        ...linkConfig,
        title: title || "Link Media Files",
        description: description || "Select existing files to link",
        compact,
        disabled,
        onSelectionChange: (selectedIds) => {
            // Handle selection change if needed
        },
    };

    if (mode === "upload") {
        return (
            <div className="space-y-6">
                <UniversalMediaUploader {...finalUploadConfig} />
            </div>
        );
    }

    if (mode === "link") {
        return (
            <div className="space-y-6">
                <UniversalMediaLinker {...finalLinkConfig} />
            </div>
        );
    }

    // Both mode - show tabs
    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="tabs tabs-boxed">
                <button
                    className={`tab ${activeTab === "upload" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("upload")}
                    disabled={disabled}
                >
                    <i className="far fa-upload mr-2"></i>
                    Upload New
                </button>
                <button
                    className={`tab ${activeTab === "link" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("link")}
                    disabled={disabled}
                >
                    <i className="far fa-link mr-2"></i>
                    Link Existing
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
                {activeTab === "upload" && (
                    <UniversalMediaUploader {...finalUploadConfig} />
                )}
                {activeTab === "link" && (
                    <UniversalMediaLinker {...finalLinkConfig} />
                )}
            </div>
        </div>
    );
};

export default UniversalMediaManager;
