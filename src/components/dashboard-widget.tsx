"use client";

import type { ReactNode } from 'react';

interface DashboardWidgetProps {
    children: ReactNode;
    title?: string;
    icon?: string;
    priority?: 'critical' | 'important' | 'informational';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    error?: string | null;
    className?: string;
    onClick?: () => void;
}

/**
 * Enhanced dashboard widget container with micro-interactions and priority styling
 */
export function DashboardWidget({
    children,
    title,
    icon,
    priority = 'informational',
    size = 'md',
    loading = false,
    error = null,
    className = '',
    onClick
}: DashboardWidgetProps) {
    const priorityStyles = {
        critical: 'border-l-4 border-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/20',
        important: 'border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/20',
        informational: 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20'
    };

    const sizeClasses = {
        sm: 'col-span-1',
        md: 'col-span-1 lg:col-span-2',
        lg: 'col-span-2 lg:col-span-3',
        xl: 'col-span-full'
    };

    const iconStyles = {
        critical: 'text-red-600',
        important: 'text-yellow-600',
        informational: 'text-blue-600'
    };

    return (
        <div
            className={`
                card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300
                transform hover:-translate-y-1 animate-fade-in
                ${priorityStyles[priority]}
                ${sizeClasses[size]}
                ${onClick ? 'cursor-pointer hover:bg-base-200/50 active:transform active:scale-95' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            <div className="card-body">
                {/* Widget Header */}
                {title && (
                    <div className="flex items-center gap-2 mb-4">
                        {icon && (
                            <i className={`${icon} ${iconStyles[priority]} animate-scale-in`} />
                        )}
                        <h3 className="card-title text-lg font-semibold">
                            {title}
                        </h3>
                        {priority === 'critical' && (
                            <span className="badge badge-error badge-sm animate-pulse">
                                Urgent
                            </span>
                        )}
                    </div>
                )}

                {/* Widget Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="loading loading-spinner loading-lg animate-spin"></div>
                        <span className="ml-2 text-sm animate-fade-in">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="alert alert-error animate-shake">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h4 className="font-bold">Error</h4>
                            <div className="text-xs">{error}</div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in-delayed">
                        {children}
                    </div>
                )}
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-base-300/10 rounded-lg animate-pulse" />
            )}
        </div>
    );
}

/**
 * Quick action button with micro-interactions
 */
interface QuickActionButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'accent' | 'outline';
    disabled?: boolean;
    loading?: boolean;
}

export function QuickActionButton({
    icon,
    label,
    onClick,
    variant = 'outline',
    disabled = false,
    loading = false
}: QuickActionButtonProps) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        accent: 'btn-accent',
        outline: 'btn-outline'
    };

    return (
        <button
            className={`
                btn btn-sm ${variants[variant]} 
                ${disabled ? 'btn-disabled' : 'hover:scale-105 active:scale-95'} 
                transition-transform duration-150 ease-in-out
                animate-bounce-in
            `}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? (
                <div className="loading loading-xs animate-spin" />
            ) : (
                <i className={`${icon} mr-1 animate-scale-in`} />
            )}
            {label}
        </button>
    );
}

/**
 * Animated badge with pulse effect for notifications
 */
interface AnimatedBadgeProps {
    count: number;
    variant?: 'info' | 'warning' | 'error' | 'success';
    pulse?: boolean;
}

export function AnimatedBadge({ count, variant = 'info', pulse = false }: AnimatedBadgeProps) {
    if (count === 0) return null;

    const variants = {
        info: 'badge-info',
        warning: 'badge-warning',
        error: 'badge-error',
        success: 'badge-success'
    };

    return (
        <span
            className={`
                badge ${variants[variant]} badge-sm 
                animate-scale-in
                ${pulse ? 'animate-pulse' : ''}
            `}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}
