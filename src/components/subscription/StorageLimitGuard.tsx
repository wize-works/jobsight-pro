'use client';

import React, { useCallback, useState } from 'react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { formatStorageSize, calculateStorageUsagePercentage } from '@/lib/subscription-limits';

interface StorageLimitGuardProps {
    children: React.ReactNode;
    currentStorageUsedMB: number;
    fileSizeMB?: number;
    showUsageIndicator?: boolean;
}

export const StorageLimitGuard: React.FC<StorageLimitGuardProps> = ({
    children,
    currentStorageUsedMB,
    fileSizeMB = 0,
    showUsageIndicator = true,
}) => {
    const { canUploadFile, getStorageLimit, currentPlan, upgradeUrl } = useFeatureGate();

    const storageLimit = getStorageLimit();
    const usagePercentage = calculateStorageUsagePercentage(currentStorageUsedMB, currentPlan);
    const wouldExceedLimit = !canUploadFile(currentStorageUsedMB, fileSizeMB);

    // Show warning when approaching limit (80%+)
    const isApproachingLimit = usagePercentage >= 80;
    const isAtLimit = usagePercentage >= 95;

    if (wouldExceedLimit && fileSizeMB > 0) {
        return (
            <div className="alert alert-error">
                <i className="far fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Storage Limit Exceeded</h3>
                    <div className="text-xs">
                        This file ({formatStorageSize(fileSizeMB)}) would exceed your storage limit of {formatStorageSize(storageLimit)}.
                        You're currently using {formatStorageSize(currentStorageUsedMB)}.
                    </div>
                </div>
                <button
                    onClick={() => window.open(upgradeUrl, '_blank')}
                    className="btn btn-sm btn-outline"
                >
                    <i className="far fa-arrow-up mr-1"></i>
                    Upgrade Plan
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {showUsageIndicator && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Storage Usage</span>
                        <span>
                            {formatStorageSize(currentStorageUsedMB)} / {formatStorageSize(storageLimit)}
                        </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${isAtLimit ? 'bg-error' :
                                    isApproachingLimit ? 'bg-warning' :
                                        'bg-success'
                                }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                    </div>
                    {isApproachingLimit && (
                        <div className={`text-xs ${isAtLimit ? 'text-error' : 'text-warning'}`}>
                            <i className="far fa-exclamation-triangle mr-1"></i>
                            {isAtLimit ? 'Storage limit reached' : 'Approaching storage limit'}
                            <button
                                onClick={() => window.open(upgradeUrl, '_blank')}
                                className="btn btn-xs btn-ghost ml-2"
                            >
                                Upgrade
                            </button>
                        </div>
                    )}
                </div>
            )}
            {children}
        </div>
    );
};

interface FileUploadWithLimitsProps {
    onFileSelect: (file: File) => void;
    currentStorageUsedMB: number;
    accept?: string;
    multiple?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export const FileUploadWithLimits: React.FC<FileUploadWithLimitsProps> = ({
    onFileSelect,
    currentStorageUsedMB,
    accept,
    multiple = false,
    className = "",
    children,
}) => {
    const { canUploadFile, getStorageLimit } = useFeatureGate();
    const [dragOver, setDragOver] = useState(false);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileSizeMB = file.size / (1024 * 1024);

            if (!canUploadFile(currentStorageUsedMB, fileSizeMB)) {
                alert(`File "${file.name}" (${formatStorageSize(fileSizeMB)}) would exceed your storage limit of ${formatStorageSize(getStorageLimit())}.`);
                continue;
            }

            onFileSelect(file);
            if (!multiple) break;
        }

        // Reset input
        event.target.value = '';
    }, [onFileSelect, canUploadFile, currentStorageUsedMB, getStorageLimit, multiple]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOver(false);

        const files = event.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileSizeMB = file.size / (1024 * 1024);

            if (!canUploadFile(currentStorageUsedMB, fileSizeMB)) {
                alert(`File "${file.name}" (${formatStorageSize(fileSizeMB)}) would exceed your storage limit of ${formatStorageSize(getStorageLimit())}.`);
                continue;
            }

            onFileSelect(file);
            if (!multiple) break;
        }
    }, [onFileSelect, canUploadFile, currentStorageUsedMB, getStorageLimit, multiple]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOver(false);
    }, []);

    return (
        <StorageLimitGuard currentStorageUsedMB={currentStorageUsedMB}>
            <div
                className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? 'border-primary bg-primary/10' : 'border-base-300'}
          ${className}
        `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    {children || (
                        <>
                            <i className="far fa-cloud-upload text-4xl text-base-content/50 mb-4"></i>
                            <p className="text-base-content/70">
                                Drag & drop files here or <span className="text-primary">browse</span>
                            </p>
                            <p className="text-xs text-base-content/50 mt-2">
                                Storage available: {formatStorageSize(getStorageLimit() - currentStorageUsedMB)} remaining
                            </p>
                        </>
                    )}
                </label>
            </div>
        </StorageLimitGuard>
    );
};

export default StorageLimitGuard;
