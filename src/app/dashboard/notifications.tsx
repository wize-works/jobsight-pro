
"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useBusiness } from "@/lib/business-context";
import { useUnreadNotifications, useNotificationMutations } from "@/hooks/use-notifications";
import type { Notification } from "@/types/notifications";
import { toast } from "@/hooks/use-toast";
import { useNotificationRefresh } from "@/hooks/use-notifications-refresh";

export const Notifications = () => {
    const { user } = useUser();
    const { businessId, loading: businessLoading, error: businessError } = useBusiness();
    const [isOpen, setIsOpen] = useState(false);

    // Use our consolidated hooks
    const {
        notifications,
        loading,
        error,
        refetch: loadNotifications
    } = useUnreadNotifications(businessId || '', user?.id || '');

    const { markAsRead, markAllAsRead, loading: mutationLoading } = useNotificationMutations();

    // Auto-refresh notifications every 30 seconds
    useNotificationRefresh({
        onRefresh: loadNotifications,
        enabled: !!user?.id && !!businessId
    });

    const handleMarkAsRead = useCallback(async (notificationId: string) => {
        if (!businessId) return;

        try {
            await markAsRead(notificationId, businessId);
            // Refresh notifications to update the list
            loadNotifications();
        } catch (error) {
            console.error("Error marking notification as read:", error);
            toast.error("Failed to mark notification as read");
        }
    }, [businessId, markAsRead, loadNotifications]);

    const handleMarkAllAsRead = useCallback(async () => {
        if (!user?.id || !businessId || !notifications || notifications.length === 0) return;

        try {
            await markAllAsRead(businessId, user.id);
            // Refresh notifications to update the list
            loadNotifications();
            setIsOpen(false);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            toast.error("Failed to mark all notifications as read");
        }
    }, [user?.id, businessId, notifications?.length, markAllAsRead, loadNotifications]);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'projectUpdates':
                return 'fas fa-project-diagram';
            case 'taskAssignments':
                return 'fas fa-tasks';
            case 'equipmentAlerts':
                return 'fas fa-exclamation-triangle';
            case 'invoiceUpdates':
                return 'fas fa-file-invoice-dollar';
            case 'systemAnnouncements':
                return 'fas fa-bullhorn';
            default:
                return 'fas fa-bell';
        }
    };

    if (!user?.id || !businessId) {
        return (
            <div className="btn btn-circle btn-disabled" title={businessError || "Loading business context..."}>
                <i className="far fa-bell opacity-50"></i>
                {businessLoading && <span className="loading loading-xs"></span>}
            </div>
        );
    }

    return (
        <div className="dropdown dropdown-end">
            <div className="indicator">
                <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-circle relative indicator"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <i className="far fa-bell"></i>
                </div>
                {(notifications?.length || 0) > 0 && (
                    <span className="indicator-item indicator-bottom badge badge-info badge-sm rounded-full">
                        {(notifications?.length || 0) > 99 ? '99+' : (notifications?.length || 0)}
                    </span>
                )}
            </div>
            {isOpen && (
                <div
                    tabIndex={0}
                    className="mt-3 z-[1] card card-compact w-80 dropdown-content bg-base-100 shadow-xl"
                >
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-lg">
                                {loading ? "Loading..." : `${notifications?.length || 0} Notifications`}
                            </span>
                            {(notifications?.length || 0) > 0 && (
                                <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={handleMarkAllAsRead}
                                    disabled={mutationLoading}
                                >
                                    {mutationLoading ? "Marking..." : "Mark all read"}
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-4">
                                <div className="loading loading-spinner loading-sm"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-error">
                                <i className="fas fa-exclamation-triangle fa-2x mb-2"></i>
                                <p>Error loading notifications</p>
                                <button
                                    className="btn btn-sm btn-ghost mt-2"
                                    onClick={loadNotifications}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : !notifications || notifications.length === 0 ? (
                            <div className="text-center py-8 text-base-content/60">
                                <i className="fas fa-bell-slash fa-2x mb-2"></i>
                                <p>No new notifications</p>
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto overflow-x-hidden">
                                {(notifications || []).slice(0, 10).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="py-3 border-b border-base-300 last:border-b-0 hover:bg-base-200 rounded px-2 -mx-2 cursor-pointer"
                                        onClick={() => {
                                            handleMarkAsRead(notification.id);
                                            if (notification.link) {
                                                window.location.href = notification.link;
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <i className={`${getNotificationIcon(notification.type)} text-primary`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm line-clamp-1">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-base-content/70 line-clamp-2 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-base-content/50 mt-1">
                                                    {formatTimeAgo(notification.created_at || '')}
                                                </p>
                                            </div>
                                            <button
                                                className="btn btn-xs btn-circle btn-ghost opacity-50 hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(notification.id);
                                                }}
                                                disabled={mutationLoading}
                                            >
                                                {mutationLoading ? (
                                                    <div className="loading loading-xs"></div>
                                                ) : (
                                                    <i className="fas fa-times"></i>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(notifications?.length || 0) > 10 && (
                                    <div className="text-center py-2 text-xs text-base-content/60">
                                        And {(notifications?.length || 0) - 10} more...
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="card-actions mt-4">
                            <Link
                                href="/dashboard/notifications"
                                className="btn btn-primary btn-block btn-sm"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
